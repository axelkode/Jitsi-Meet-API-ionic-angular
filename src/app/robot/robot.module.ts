import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RobotPage } from './robot.page';
import { IonicModule } from '@ionic/angular';
import { JitsiCallComponent } from '../jitsi/jitsi-call/jitsi-call.component';

@NgModule({
  imports: [
    IonicModule,
    JitsiCallComponent,
    RobotPage,
    RouterModule.forChild([{ path: '', component: RobotPage }])
  ]
})
export class RobotPageModule {}