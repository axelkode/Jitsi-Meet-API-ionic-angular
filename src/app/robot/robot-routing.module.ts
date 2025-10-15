import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RobotPage } from './robot.page';

const routes: Routes = [
  {
    path: '',
    component: RobotPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RobotPageRoutingModule {}
