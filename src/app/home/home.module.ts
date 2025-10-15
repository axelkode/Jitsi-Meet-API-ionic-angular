import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    IonicModule,
    HomePage,
    RouterModule.forChild([{ path: '', component: HomePage }])
  ]
})
export class HomePageModule {}