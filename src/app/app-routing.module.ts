import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomePageModule) },
  { path: 'tab1', loadChildren: () => import('./tab1/tab1.module').then(m => m.Tab1PageModule) },
  { path: 'robot', loadChildren: () => import('./robot/robot.module').then(m => m.RobotPageModule) }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
