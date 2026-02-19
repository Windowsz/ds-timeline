import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsTimelineComponent } from './ds-timeline.component';
import { DsTimelineService } from './ds-timeline.service';

@NgModule({
  imports: [CommonModule],
  declarations: [DsTimelineComponent],
  providers: [DsTimelineService],
  exports: [DsTimelineComponent]
})
export class DsTimelineModule {}
