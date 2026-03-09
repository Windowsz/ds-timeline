import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';

import {
  CalendarEvent, CalendarResource, CalendarView,
  EventClickArg, EventChangeArg, SelectArg, DatesSetArg, DateClickArg, ResourceClickArg
} from '../../projects/ds-timeline/src/public-api';
import { TEST_EVENTS, TEST_RESOURCES, OPTION_MAP, OptionMapping } from './shared-test-data';

type TabMode = 'ds' | 'fc' | 'both';

@Component({
  selector: 'app-compare',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="cmp">

      <!-- ===== PAGE HEADER ===== -->
      <div class="cmp-header">
        <div class="cmp-title">
          <span class="cmp-title-icon">&#9878;</span>
          <div>
            <div class="cmp-title-main">FullCalendar Compatibility Comparison</div>
            <div class="cmp-title-sub">
              Same {{ sharedEvents.length }} events &bull; {{ sharedResources.length }} top-level resources &bull; identical options passed to both calendars
            </div>
          </div>
        </div>

        <!-- View mode switcher -->
        <div class="cmp-tabs">
          <button type="button" [class.active]="tab === 'ds'"   (click)="tab = 'ds'">&#128197; ds-timeline</button>
          <button type="button" [class.active]="tab === 'fc'"   (click)="tab = 'fc'">&#128218; FullCalendar</button>
          <button type="button" [class.active]="tab === 'both'" (click)="tab = 'both'">&#9889; Side by Side</button>
        </div>
      </div>

      <!-- ===== CALENDARS ===== -->
      <div class="cmp-cal-row" [class.side-by-side]="tab === 'both'">

        <!-- ds-timeline -->
        <div class="cmp-cal-wrap" [class.hidden]="tab === 'fc'">
          <div class="cmp-cal-label ds-label">&#128197; ds-timeline</div>
          <ds-timeline
            [events]="sharedEvents"
            [resources]="sharedResources"
            [initialView]="dsInitialView"
            [theme]="'light'"
            [editable]="true"
            [selectable]="true"
            [slotMinWidth]="60"
            [resourceAreaWidth]="220"
            [resourceAreaHeaderContent]="'Teams & Rooms'"
            [showNowIndicator]="true"
            [showEventTooltip]="true"
            [tooltipDelay]="250"
            [eventOverlap]="'multiple'"
            [allowResourceDrag]="true"
            (eventClick)="onDsEventClick($event)"
            (eventChange)="onDsEventChange($event)"
            (select)="onDsSelect($event)"
            (datesSet)="onDsDatesSet($event)"
            (dateClick)="onDsDateClick($event)"
            (resourceClick)="onDsResourceClick($event)">
          </ds-timeline>
        </div>

        <!-- FullCalendar -->
        <div class="cmp-cal-wrap" [class.hidden]="tab === 'ds'">
          <div class="cmp-cal-label fc-label">&#128218; FullCalendar 6 (resource-timeline)</div>
          <full-calendar [options]="fcOptions"></full-calendar>
        </div>

      </div>

      <!-- ===== OPTION COMPATIBILITY TABLE ===== -->
      <div class="cmp-section">
        <div class="cmp-section-title">
          &#128203; API Compatibility
          <span class="legend">
            <span class="badge full">Full</span> identical
            <span class="badge partial">Partial</span> minor difference
          </span>
        </div>
        <div class="cmp-table-wrap">
          <table class="cmp-table">
            <thead>
              <tr>
                <th>FullCalendar Option / Callback</th>
                <th>ds-timeline @Input / @Output</th>
                <th>Notes</th>
                <th>Compat</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of optionMap">
                <td><code>{{ row.fcOption }}</code></td>
                <td><code>{{ row.dsInput }}</code></td>
                <td class="notes">{{ row.notes }}</td>
                <td><span class="badge" [class]="row.compatible">{{ row.compatible }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== EVENT LOG ===== -->
      <div class="cmp-section">
        <div class="cmp-section-title">&#128203; Interaction Log
          <button type="button" class="clear-btn" (click)="log = []">Clear</button>
        </div>
        <div class="cmp-log-empty" *ngIf="log.length === 0">
          Interact with either calendar — drag, resize, select, click events…
        </div>
        <div class="cmp-log-row" *ngFor="let entry of log.slice().reverse()">
          <span class="log-source" [class]="entry.source === 'ds' ? 'log-ds' : 'log-fc'">
            {{ entry.source === 'ds' ? 'ds-timeline' : 'FullCalendar' }}
          </span>
          <span class="log-badge badge-{{ entry.type }}">{{ entry.type }}</span>
          <span class="log-msg">{{ entry.message }}</span>
          <span class="log-time">{{ entry.time }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .cmp { background: #f0f2f5; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }

    /* HEADER */
    .cmp-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .cmp-title { display: flex; align-items: center; gap: 12px; }
    .cmp-title-icon { font-size: 28px; }
    .cmp-title-main { font-size: 16px; font-weight: 700; color: #1a202c; }
    .cmp-title-sub { font-size: 11px; color: #718096; margin-top: 2px; }

    .cmp-tabs { display: flex; gap: 0; }
    .cmp-tabs button { border: 1px solid #e2e8f0; background: #f7fafc; color: #4a5568; padding: 7px 16px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.12s; }
    .cmp-tabs button:first-child { border-radius: 7px 0 0 7px; }
    .cmp-tabs button:last-child  { border-radius: 0 7px 7px 0; border-left-color: transparent; }
    .cmp-tabs button:nth-child(2) { border-left-color: transparent; }
    .cmp-tabs button.active { background: #3d91ff; color: #fff; border-color: #3d91ff; z-index: 1; }

    /* CALENDARS */
    .cmp-cal-row { display: flex; gap: 16px; padding: 16px 24px 0; min-height: 500px; }
    .cmp-cal-row.side-by-side .cmp-cal-wrap { flex: 1; min-width: 0; }
    .cmp-cal-row:not(.side-by-side) .cmp-cal-wrap { flex: 1; }
    .cmp-cal-wrap.hidden { display: none; }

    .cmp-cal-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; padding: 4px 10px; border-radius: 5px; margin-bottom: 8px; display: inline-block; }
    .ds-label { background: #ebf4ff; color: #1d4ed8; }
    .fc-label { background: #f0fdf4; color: #166534; }

    ds-timeline { display: block; height: 480px; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    full-calendar { display: block; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

    /* SECTION */
    .cmp-section { margin: 16px 24px; background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }
    .cmp-section-title { padding: 12px 16px; font-size: 13px; font-weight: 700; color: #2d3748; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
    .legend { display: flex; align-items: center; gap: 6px; font-weight: 400; font-size: 11px; color: #718096; margin-left: auto; }
    .clear-btn { margin-left: auto; background: none; border: 1px solid #e2e8f0; border-radius: 5px; padding: 3px 10px; font-size: 11px; cursor: pointer; color: #718096; }

    /* TABLE */
    .cmp-table-wrap { overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .cmp-table th { background: #f7fafc; color: #4a5568; font-weight: 700; text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .cmp-table td { padding: 7px 12px; border-bottom: 1px solid #f0f4f8; vertical-align: top; }
    .cmp-table tr:last-child td { border-bottom: none; }
    .cmp-table tr:hover td { background: #f7fafc; }
    .cmp-table code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; color: #0f172a; }
    .notes { color: #64748b; max-width: 360px; }

    /* BADGES */
    .badge { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .badge.full    { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }

    /* LOG */
    .cmp-log-empty { padding: 14px 16px; color: #a0aec0; font-size: 12px; }
    .cmp-log-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid #f0f4f8; font-size: 12px; }
    .cmp-log-row:last-child { border-bottom: none; }
    .log-source { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; min-width: 90px; text-align: center; }
    .log-ds { background: #ebf4ff; color: #1d4ed8; }
    .log-fc { background: #f0fdf4; color: #166534; }
    .log-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; min-width: 80px; text-align: center; }
    .badge-eventClick  { background: #dbeafe; color: #1d4ed8; }
    .badge-eventChange { background: #fef3c7; color: #92400e; }
    .badge-select      { background: #d1fae5; color: #065f46; }
    .badge-datesSet    { background: #f3f4f6; color: #374151; }
    .badge-dateClick   { background: #ede9fe; color: #5b21b6; }
    .badge-resourceClick { background: #fce7f3; color: #9d174d; }
    .log-msg { flex: 1; color: #2d3748; }
    .log-time { color: #a0aec0; font-size: 10px; font-family: monospace; white-space: nowrap; }
  `]
})
export class CompareComponent implements OnInit {

  tab: TabMode = 'both';

  sharedEvents: CalendarEvent[]     = TEST_EVENTS;
  sharedResources: CalendarResource[] = TEST_RESOURCES;
  optionMap: OptionMapping[]        = OPTION_MAP;

  dsInitialView: CalendarView = 'resourceTimelineWeek';

  log: { source: 'ds' | 'fc'; type: string; message: string; time: string }[] = [];

  // ---- FullCalendar options (mirrors the ds-timeline inputs above) ----
  fcOptions: CalendarOptions = {
    plugins: [resourceTimelinePlugin, interactionPlugin],
    initialView: 'resourceTimelineWeek',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
    },
    // Same data objects — no conversion needed
    resources: this.sharedResources as any,
    events:    this.sharedEvents    as any,
    // Same option names
    editable:                  true,
    selectable:                true,
    slotMinWidth:              60,
    resourceAreaWidth:        '220px',   // FC uses string; ds uses number
    resourceAreaHeaderContent: 'Teams & Rooms',
    nowIndicator:              true,     // FC name; ds uses showNowIndicator
    height:                    480,
    schedulerLicenseKey:      'GPL-My-Project-Is-Open-Source',
    // Callbacks map to @Output() EventEmitters in ds-timeline
    eventClick:   (info) => this.addLog('fc', 'eventClick',   '"' + info.event.title + '"'),
    eventChange:  (info) => this.addLog('fc', 'eventChange',  'Moved "' + info.event.title + '"'),
    select:       (info) => this.addLog('fc', 'select',       info.startStr + ' – ' + info.endStr),
    datesSet:     (info) => this.addLog('fc', 'datesSet',     info.view.type + ' | ' + info.view.title),
    dateClick:    (info) => this.addLog('fc', 'dateClick',    info.dateStr),
  };

  ngOnInit() {
    // Nothing needed — data is set at field initialization
  }

  // ---- ds-timeline @Output handlers ----
  onDsEventClick(arg: EventClickArg) {
    this.addLog('ds', 'eventClick', '"' + arg.event.title + '"');
  }
  onDsEventChange(arg: EventChangeArg) {
    this.addLog('ds', 'eventChange', 'Moved "' + arg.event.title + '"');
  }
  onDsSelect(arg: SelectArg) {
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.addLog('ds', 'select', fmt(arg.start) + ' – ' + fmt(arg.end) + (arg.resource ? ' · ' + arg.resource.title : ''));
  }
  onDsDatesSet(arg: DatesSetArg) {
    this.addLog('ds', 'datesSet', arg.view + ' | ' + arg.title);
  }
  onDsDateClick(arg: DateClickArg) {
    this.addLog('ds', 'dateClick', arg.date.toLocaleString());
  }
  onDsResourceClick(arg: ResourceClickArg) {
    this.addLog('ds', 'resourceClick', '"' + arg.resource.title + '"');
  }

  private addLog(source: 'ds' | 'fc', type: string, message: string) {
    this.log.push({ source, type, message, time: new Date().toLocaleTimeString() });
    if (this.log.length > 30) this.log.shift();
  }
}
