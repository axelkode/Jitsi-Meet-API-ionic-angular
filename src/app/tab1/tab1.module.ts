import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { Tab1PageRoutingModule } from './tab1-routing.module';
import { Tab1Page } from './tab1.page';

// 👇 IMPORTA el componente standalone (ajusta la ruta si es distinta)
import { JitsiCallComponent } from '../jitsi/jitsi-call/jitsi-call.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Tab1PageRoutingModule,
    // 👇 Aquí VA en imports por ser standalone
    JitsiCallComponent
  ],
  declarations: [
    Tab1Page
    // ❌ NO declares JitsiCallComponent aquí
  ]
})
export class Tab1PageModule {}
