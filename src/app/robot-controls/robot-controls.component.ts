import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular'; // <-- Importa IonicModule

@Component({
  selector: 'app-robot-controls',
  templateUrl: './robot-controls.component.html',
  styleUrls: ['./robot-controls.component.scss'],
  standalone: true,
  imports: [IonicModule] // <-- Agrega IonicModule aquí
})
export class RobotControlsComponent {
  apiUrl = 'https://www.triskeledu.cl/MisterRoboto/apirest/set_command/1';

  constructor(private http: HttpClient) {}

  sendCommand(command: string) {
    this.http.post(this.apiUrl, { command }).subscribe({
      next: () => console.log('Comando enviado:', command),
      error: err => console.error('Error enviando comando:', err)
    });
  }
}