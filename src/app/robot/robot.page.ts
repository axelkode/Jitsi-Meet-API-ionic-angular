import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { JitsiCallComponent } from '../jitsi/jitsi-call/jitsi-call.component';

@Component({
  selector: 'app-robot',
  templateUrl: './robot.page.html',
  styleUrls: ['./robot.page.scss'],
  standalone: true,
  imports: [IonicModule, JitsiCallComponent]
})
export class RobotPage {}