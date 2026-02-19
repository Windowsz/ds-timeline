import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxTimelineCalendarComponent } from './ngx-timeline-calendar.component';
import { NgxTimelineCalendarService } from './ngx-timeline-calendar.service';

@NgModule({
  imports: [CommonModule],
  declarations: [NgxTimelineCalendarComponent],
  providers: [NgxTimelineCalendarService],
  exports: [NgxTimelineCalendarComponent]
})
export class NgxTimelineCalendarModule {}
