import { Component, Input, ElementRef, ViewChild, OnDestroy, AfterViewInit, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { io, Socket } from 'socket.io-client';

interface WebRTCUser {
  id: string;
  name: string;
  socketId: string;
}

@Component({
  selector: 'app-webrtc-call',
  templateUrl: './webrtc-call.component.html',
  styleUrls: ['./webrtc-call.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WebRTCCallComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideosContainer', { static: true }) remoteVideosContainer!: ElementRef<HTMLDivElement>;
  
  @Input() roomId = 'avatar-gamer-room';
  @Input() userName = 'Usuario';
  @Input() signalingServerUrl = 'http://localhost:3000';

  private socket!: Socket;
  private localStream: MediaStream | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private userId = this.generateUserId();
  public isConnected = false;
  public isVideoEnabled = true;
  public isAudioEnabled = true;

  // STUN servers gratuitos
  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  async ngOnInit() {
    await this.initializeSignaling();
  }

  async ngAfterViewInit() {
    await this.initializeMedia();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private async initializeSignaling() {
    this.socket = io(this.signalingServerUrl);

    this.socket.on('connect', () => {
      console.log('Conectado al servidor de signaling');
      this.joinRoom();
    });

    this.socket.on('room-users', (users: WebRTCUser[]) => {
      console.log('Usuarios en la sala:', users);
      this.handleRoomUsers(users);
    });

    this.socket.on('user-joined', (user: WebRTCUser) => {
      console.log('Usuario se unió:', user);
      this.handleUserJoined(user);
    });

    this.socket.on('user-left', (user: WebRTCUser) => {
      console.log('Usuario se fue:', user);
      this.handleUserLeft(user);
    });

    this.socket.on('offer', async (data: any) => {
      console.log('Recibida oferta de:', data.fromUserName);
      await this.handleOffer(data);
    });

    this.socket.on('answer', async (data: any) => {
      console.log('Recibida respuesta de:', data.fromUserName);
      await this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', async (data: any) => {
      console.log('Recibido ICE candidate de:', data.fromUserId);
      await this.handleIceCandidate(data);
    });
  }

  private async initializeMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
        this.localVideo.nativeElement.muted = true; // Evitar eco
      }

      console.log('Medios locales inicializados');
    } catch (error) {
      console.error('Error accediendo a medios:', error);
      this.showError('No se pudo acceder a la cámara/micrófono');
    }
  }

  private joinRoom() {
    this.socket.emit('join-room', {
      roomId: this.roomId,
      userId: this.userId,
      userName: this.userName
    });
    this.isConnected = true;
  }

  private handleRoomUsers(users: WebRTCUser[]) {
    users.forEach(user => {
      if (user.id !== this.userId) {
        this.createPeerConnection(user.id, user.name, false);
      }
    });
  }

  private handleUserJoined(user: WebRTCUser) {
    if (user.id !== this.userId) {
      this.createPeerConnection(user.id, user.name, true);
    }
  }

  private handleUserLeft(user: WebRTCUser) {
    this.removePeer(user.id);
  }

  private async createPeerConnection(remoteUserId: string, remoteUserName: string, isInitiator: boolean) {
    const peerConnection = new RTCPeerConnection(this.iceServers);

    // Agregar stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Manejar stream remoto
    peerConnection.ontrack = (event) => {
      console.log('Stream remoto recibido de:', remoteUserName);
      this.addRemoteVideo(remoteUserId, remoteUserName, event.streams[0]);
    };

    // Manejar ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    // Manejar cambios de conexión
    peerConnection.onconnectionstatechange = () => {
      console.log(`Conexión con ${remoteUserName}:`, peerConnection.connectionState);
    };

    this.peers.set(remoteUserId, peerConnection);

    if (isInitiator) {
      await this.createOffer(remoteUserId);
    }
  }

  private async createOffer(remoteUserId: string) {
    const peerConnection = this.peers.get(remoteUserId);
    if (!peerConnection) return;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      this.socket.emit('offer', {
        targetUserId: remoteUserId,
        offer: offer
      });
    } catch (error) {
      console.error('Error creando oferta:', error);
    }
  }

  private async handleOffer(data: any) {
    const { fromUserId, fromUserName, offer } = data;
    
    if (!this.peers.has(fromUserId)) {
      await this.createPeerConnection(fromUserId, fromUserName, false);
    }

    const peerConnection = this.peers.get(fromUserId);
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket.emit('answer', {
        targetUserId: fromUserId,
        answer: answer
      });
    } catch (error) {
      console.error('Error manejando oferta:', error);
    }
  }

  private async handleAnswer(data: any) {
    const { fromUserId, answer } = data;
    const peerConnection = this.peers.get(fromUserId);
    
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error manejando respuesta:', error);
      }
    }
  }

  private async handleIceCandidate(data: any) {
    const { fromUserId, candidate } = data;
    const peerConnection = this.peers.get(fromUserId);
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error agregando ICE candidate:', error);
      }
    }
  }

  private addRemoteVideo(userId: string, userName: string, stream: MediaStream) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'remote-video-container';
    videoContainer.id = `remote-${userId}`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.className = 'remote-video';

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = userName;

    videoContainer.appendChild(video);
    videoContainer.appendChild(label);

    this.remoteVideosContainer.nativeElement.appendChild(videoContainer);
  }

  private removePeer(userId: string) {
    const peerConnection = this.peers.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peers.delete(userId);
    }

    const videoContainer = document.getElementById(`remote-${userId}`);
    if (videoContainer) {
      videoContainer.remove();
    }
  }

  // Métodos públicos para controlar la videollamada
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.isVideoEnabled = !this.isVideoEnabled;
        videoTrack.enabled = this.isVideoEnabled;
      }
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        this.isAudioEnabled = !this.isAudioEnabled;
        audioTrack.enabled = this.isAudioEnabled;
      }
    }
  }

  endCall() {
    this.cleanup();
  }

  private cleanup() {
    // Cerrar todas las conexiones peer
    this.peers.forEach(peer => peer.close());
    this.peers.clear();

    // Detener stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Desconectar socket
    if (this.socket) {
      this.socket.disconnect();
    }

    // Limpiar videos remotos
    if (this.remoteVideosContainer) {
      this.remoteVideosContainer.nativeElement.innerHTML = '';
    }

    this.isConnected = false;
  }

  private showError(message: string) {
    console.error(message);
    // Aquí puedes agregar lógica para mostrar errores en la UI
  }
}
