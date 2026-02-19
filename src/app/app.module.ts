import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxTimelineCalendarModule } from '../../projects/ngx-timeline-calendar/src/public-api';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CommonModule, FormsModule, NgxTimelineCalendarModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
