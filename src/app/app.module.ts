import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';

import { DsTimelineModule } from '../../projects/ds-timeline/src/public-api';
import { AppComponent } from './app.component';
import { CompareComponent } from './compare.component';

@NgModule({
  declarations: [AppComponent, CompareComponent],
  imports: [BrowserModule, CommonModule, FormsModule, DsTimelineModule, FullCalendarModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
