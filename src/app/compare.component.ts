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
type SectionTab = 'table' | 'data' | 'log';

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
            <div class="cmp-title-main">FullCalendar &#8596; ds-timeline Comparison</div>
            <div class="cmp-title-sub">
              {{ sharedEvents.length }} events &bull;
              {{ flatResourceCount }} resources &bull;
              <strong>identical objects</strong> passed to both calendars &mdash; zero conversion
            </div>
          </div>
        </div>

        <!-- Calendar view tabs -->
        <div class="cmp-tabs">
          <button type="button" [class.active]="tab === 'ds'"   (click)="tab = 'ds'">&#128197; ds-timeline</button>
          <button type="button" [class.active]="tab === 'fc'"   (click)="tab = 'fc'">&#128218; FullCalendar</button>
          <button type="button" [class.active]="tab === 'both'" (click)="tab = 'both'">&#9889; Side by Side</button>
        </div>
      </div>

      <!-- ===== FEATURE COVERAGE PILLS ===== -->
      <div class="cmp-pills">
        <span class="pill pill-full"    *ngFor="let f of fullFeatures">&#10003; {{ f }}</span>
        <span class="pill pill-partial" *ngFor="let f of partialFeatures">&#126; {{ f }}</span>
      </div>

      <!-- ===== CALENDARS ===== -->
      <div class="cmp-cal-row" [class.side-by-side]="tab === 'both'">

        <!-- ds-timeline -->
        <div class="cmp-cal-wrap" [class.hidden]="tab === 'fc'">
          <div class="cmp-cal-label ds-label">&#128197; ds-timeline</div>
          <ds-timeline
            [events]="sharedEvents"
            [resources]="sharedResources"
            [initialView]="'resourceTimelineWeek'"
            [theme]="'light'"
            [editable]="true"
            [selectable]="true"
            [slotMinWidth]="60"
            [resourceAreaWidth]="200"
            [resourceAreaHeaderContent]="'Teams & Rooms'"
            [showNowIndicator]="true"
            [showEventTooltip]="true"
            [tooltipDelay]="250"
            [eventOverlap]="'multiple'"
            [allowResourceDrag]="true"
            [businessHours]="true"
            [slotMinTime]="'07:00:00'"
            [slotMaxTime]="'22:00:00'"
            [scrollTime]="'08:00:00'"
            [resourcesInitiallyExpanded]="true"
            [eventMinWidth]="30"
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

      <!-- ===== BOTTOM SECTION TABS ===== -->
      <div class="cmp-section">
        <div class="section-tabs">
          <button type="button" [class.active]="sectionTab === 'table'" (click)="sectionTab = 'table'">
            &#128203; API Compat ({{ totalFull }}/{{ optionMap.length }} full)
          </button>
          <button type="button" [class.active]="sectionTab === 'data'"  (click)="sectionTab = 'data'">
            &#128269; Data Inspector
          </button>
          <button type="button" [class.active]="sectionTab === 'log'"   (click)="sectionTab = 'log'">
            &#128221; Interaction Log
            <span class="log-count" *ngIf="log.length > 0">{{ log.length }}</span>
          </button>
        </div>

        <!-- ── API Compatibility Table ── -->
        <div *ngIf="sectionTab === 'table'" class="cmp-table-wrap">
          <table class="cmp-table">
            <thead>
              <tr>
                <th>FullCalendar Option / Field</th>
                <th>ds-timeline @Input / Type field</th>
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

        <!-- ── Data Inspector ── -->
        <div *ngIf="sectionTab === 'data'" class="data-inspector">

          <div class="data-note">
            <strong>&#128161; Zero-conversion proof:</strong> the <code>events</code> and <code>resources</code>
            arrays below are defined once in <code>shared-test-data.ts</code> and passed
            <em>directly</em> to both
            <code>&lt;ds-timeline [events]="..."&gt;</code> and FullCalendar's
            <code>options.events / options.resources</code> &mdash; no mapping, no adapter, same object references.
          </div>

          <div class="data-panels">

            <!-- Resources panel -->
            <div class="data-panel">
              <div class="data-panel-header">
                <span>TEST_RESOURCES ({{ sharedResources.length }} top-level)</span>
                <span class="data-legend">
                  <span class="dot dot-color">&#9679;</span> eventBackgroundColor set
                </span>
              </div>
              <div class="resource-tree">
                <ng-container *ngFor="let r of sharedResources">
                  <div class="res-row res-group">
                    <span class="res-icon">&#9660;</span>
                    <span class="res-title">{{ r.title }}</span>
                    <code class="res-id">{{ r.id }}</code>
                    <span class="res-sub" *ngIf="r.extendedProps?.['subtitle']">{{ r.extendedProps?.['subtitle'] }}</span>
                  </div>
                  <ng-container *ngFor="let c of (r.children || [])">
                    <div class="res-row res-child">
                      <span class="res-icon">&#9492;</span>
                      <span class="res-title">{{ c.title }}</span>
                      <code class="res-id">{{ c.id }}</code>
                      <span class="res-color-dot"
                        *ngIf="c.eventBackgroundColor"
                        [style.background]="c.eventBackgroundColor"
                        [title]="'eventBackgroundColor: ' + c.eventBackgroundColor">
                      </span>
                      <span class="res-sub" *ngIf="c.extendedProps?.['subtitle']">{{ c.extendedProps?.['subtitle'] }}</span>
                    </div>
                  </ng-container>
                </ng-container>
                <ng-container *ngFor="let r of sharedResources">
                  <ng-container *ngIf="!r.children">
                    <div class="res-row">
                      <span class="res-icon">&#8212;</span>
                      <span class="res-title">{{ r.title }}</span>
                      <code class="res-id">{{ r.id }}</code>
                      <span class="res-sub" *ngIf="r.extendedProps?.['subtitle']">{{ r.extendedProps?.['subtitle'] }}</span>
                    </div>
                  </ng-container>
                </ng-container>
              </div>
            </div>

            <!-- Events panel -->
            <div class="data-panel">
              <div class="data-panel-header">
                <span>TEST_EVENTS ({{ sharedEvents.length }} events)</span>
                <span class="data-legend">
                  <span class="dot dot-blue">&#9679;</span> new FC-parity field
                </span>
              </div>
              <div class="event-list">
                <div class="event-row" *ngFor="let e of sharedEvents">
                  <span class="ev-color"
                    [style.background]="e.color || e.backgroundColor || '#ccc'"
                    [class.ev-bg-stripe]="e.display === 'background'">
                  </span>
                  <div class="ev-info">
                    <span class="ev-title">{{ e.title }}</span>
                    <span class="ev-resource">&#8594; {{ e.resourceId }}</span>
                  </div>
                  <div class="ev-badges">
                    <span class="ev-badge"          *ngIf="e.editable === false">editable:false</span>
                    <span class="ev-badge"          *ngIf="e.startEditable === false">startEditable:false</span>
                    <span class="ev-badge"          *ngIf="e.durationEditable === false">durationEditable:false</span>
                    <span class="ev-badge ev-new"   *ngIf="e.resourceEditable === false">resourceEditable:false</span>
                    <span class="ev-badge ev-new"   *ngIf="e.url">url &#10003;</span>
                    <span class="ev-badge ev-new"   *ngIf="e.display">display:'{{ e.display }}'</span>
                    <span class="ev-badge ev-new"   *ngIf="e.groupId">groupId &#10003;</span>
                    <span class="ev-badge"          *ngIf="e.backgroundColor">bgColor</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Code snippet -->
          <div class="data-code">
            <div class="data-code-header">Same data, passed to both — no conversion</div>
            <pre class="code-block" [innerText]="codeSnippet"></pre>
          </div>
        </div>

        <!-- ── Interaction Log ── -->
        <div *ngIf="sectionTab === 'log'">
          <div class="log-toolbar">
            <span class="log-hint">Interact with either calendar &mdash; drag, resize, select, click events&hellip;</span>
            <button type="button" class="clear-btn" (click)="log = []">Clear</button>
          </div>
          <div class="cmp-log-empty" *ngIf="log.length === 0">
            No interactions yet. Try clicking or dragging an event on either calendar above.
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

      </div><!-- /cmp-section -->

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .cmp {
      background: #f0f2f5;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }

    /* HEADER */
    .cmp-header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .cmp-title { display: flex; align-items: center; gap: 12px; }
    .cmp-title-icon { font-size: 26px; }
    .cmp-title-main { font-size: 15px; font-weight: 700; color: #1a202c; }
    .cmp-title-sub  { font-size: 11px; color: #718096; margin-top: 2px; }
    .cmp-title-sub strong { color: #2d3748; }

    .cmp-tabs { display: flex; }
    .cmp-tabs button { border: 1px solid #e2e8f0; background: #f7fafc; color: #4a5568; padding: 7px 14px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.12s; }
    .cmp-tabs button:first-child { border-radius: 7px 0 0 7px; }
    .cmp-tabs button:last-child  { border-radius: 0 7px 7px 0; }
    .cmp-tabs button:nth-child(2) { border-left: none; border-right: none; }
    .cmp-tabs button.active { background: #3d91ff; color: #fff; border-color: #3d91ff; z-index: 1; }

    /* FEATURE PILLS */
    .cmp-pills { display: flex; flex-wrap: wrap; gap: 5px; padding: 10px 24px; background: #f7fafc; border-bottom: 1px solid #e2e8f0; }
    .pill { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 10px; white-space: nowrap; }
    .pill-full    { background: #d1fae5; color: #065f46; }
    .pill-partial { background: #fef3c7; color: #92400e; }

    /* CALENDARS */
    .cmp-cal-row { display: flex; gap: 16px; padding: 16px 24px 0; }
    .cmp-cal-row.side-by-side .cmp-cal-wrap { flex: 1; min-width: 0; }
    .cmp-cal-row:not(.side-by-side) .cmp-cal-wrap { flex: 1; }
    .cmp-cal-wrap.hidden { display: none; }

    .cmp-cal-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; padding: 3px 9px; border-radius: 5px; margin-bottom: 6px; display: inline-block; }
    .ds-label { background: #ebf4ff; color: #1d4ed8; }
    .fc-label { background: #f0fdf4; color: #166534; }

    ds-timeline { display: block; height: 460px; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    full-calendar { display: block; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

    /* BOTTOM SECTION */
    .cmp-section { margin: 16px 24px 32px; background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }

    .section-tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
    .section-tabs button { background: none; border: none; border-bottom: 3px solid transparent; padding: 11px 16px; font-size: 12px; font-weight: 600; color: #718096; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.12s; }
    .section-tabs button:hover { color: #2d3748; }
    .section-tabs button.active { color: #3d91ff; border-bottom-color: #3d91ff; }
    .log-count { background: #3d91ff; color: #fff; font-size: 9px; font-weight: 700; border-radius: 10px; padding: 1px 6px; }

    /* API TABLE */
    .cmp-table-wrap { overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .cmp-table th { background: #f7fafc; color: #4a5568; font-weight: 700; text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .cmp-table td { padding: 6px 12px; border-bottom: 1px solid #f0f4f8; vertical-align: top; }
    .cmp-table tr:last-child td { border-bottom: none; }
    .cmp-table tr:hover td { background: #f7fafc; }
    .cmp-table code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; color: #0f172a; }
    .notes { color: #64748b; max-width: 340px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .badge.full    { background: #d1fae5; color: #065f46; }
    .badge.partial { background: #fef3c7; color: #92400e; }

    /* DATA INSPECTOR */
    .data-inspector { padding: 16px; }
    .data-note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #78350f; margin-bottom: 16px; line-height: 1.6; }
    .data-note code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; }
    .data-note em { font-style: italic; }

    .data-panels { display: flex; gap: 16px; margin-bottom: 16px; }
    .data-panel { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .data-panel-header { background: #f7fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; font-size: 11px; font-weight: 700; color: #2d3748; display: flex; align-items: center; justify-content: space-between; }
    .data-legend { display: flex; align-items: center; gap: 5px; font-weight: 400; color: #718096; }
    .dot { font-size: 10px; }
    .dot-color { color: #10b981; }
    .dot-blue  { color: #3d91ff; }

    /* Resource tree */
    .resource-tree { padding: 6px 0; }
    .res-row { display: flex; align-items: center; gap: 6px; padding: 4px 12px; font-size: 12px; }
    .res-row:hover { background: #f7fafc; }
    .res-group { font-weight: 700; color: #1a202c; }
    .res-child { padding-left: 28px; color: #4a5568; }
    .res-icon  { color: #a0aec0; font-size: 10px; min-width: 12px; }
    .res-title { flex: 1; }
    .res-id    { font-family: 'SF Mono','Fira Code',monospace; font-size: 10px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; color: #64748b; }
    .res-sub   { font-size: 10px; color: #a0aec0; }
    .res-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.15); }

    /* Event list */
    .event-list { padding: 6px 0; max-height: 340px; overflow-y: auto; }
    .event-row { display: flex; align-items: flex-start; gap: 8px; padding: 5px 12px; font-size: 12px; }
    .event-row:hover { background: #f7fafc; }
    .ev-color { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
    .ev-bg-stripe { background: repeating-linear-gradient(45deg, #999 0px, #999 2px, transparent 2px, transparent 6px) !important; border: 1px solid #bbb; }
    .ev-info { flex: 1; min-width: 0; }
    .ev-title { font-weight: 600; color: #1a202c; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ev-resource { color: #718096; font-size: 10px; }
    .ev-badges { display: flex; flex-wrap: wrap; gap: 3px; }
    .ev-badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: #e2e8f0; color: #4a5568; white-space: nowrap; }
    .ev-new { background: #dbeafe; color: #1e40af; }

    /* Code block */
    .data-code { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .data-code-header { background: #1e293b; color: #94a3b8; padding: 8px 14px; font-size: 11px; font-weight: 600; }
    .code-block { background: #0f172a; color: #e2e8f0; padding: 14px 16px; font-size: 11px; font-family: 'SF Mono','Fira Code','Consolas',monospace; line-height: 1.7; margin: 0; overflow-x: auto; white-space: pre; }

    /* LOG */
    .log-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f0f4f8; }
    .log-hint { font-size: 11px; color: #a0aec0; }
    .clear-btn { background: none; border: 1px solid #e2e8f0; border-radius: 5px; padding: 3px 10px; font-size: 11px; cursor: pointer; color: #718096; }
    .cmp-log-empty { padding: 24px 16px; color: #a0aec0; font-size: 12px; text-align: center; }
    .cmp-log-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid #f0f4f8; font-size: 12px; }
    .cmp-log-row:last-child { border-bottom: none; }
    .log-source { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; min-width: 90px; text-align: center; flex-shrink: 0; }
    .log-ds { background: #ebf4ff; color: #1d4ed8; }
    .log-fc { background: #f0fdf4; color: #166534; }
    .log-badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; min-width: 80px; text-align: center; flex-shrink: 0; }
    .badge-eventClick    { background: #dbeafe; color: #1d4ed8; }
    .badge-eventChange   { background: #fef3c7; color: #92400e; }
    .badge-eventDrop     { background: #fef3c7; color: #92400e; }
    .badge-eventResize   { background: #fef3c7; color: #92400e; }
    .badge-select        { background: #d1fae5; color: #065f46; }
    .badge-datesSet      { background: #f3f4f6; color: #374151; }
    .badge-dateClick     { background: #ede9fe; color: #5b21b6; }
    .badge-resourceClick { background: #fce7f3; color: #9d174d; }
    .log-msg  { flex: 1; color: #2d3748; }
    .log-time { color: #a0aec0; font-size: 10px; font-family: monospace; white-space: nowrap; }
  `]
})
export class CompareComponent implements OnInit {

  tab: TabMode       = 'both';
  sectionTab: SectionTab = 'data';   // open Data Inspector by default

  readonly codeSnippet = [
    '// shared-test-data.ts — single source of truth',
    'const events: CalendarEvent[]       = TEST_EVENTS;     // 12 events',
    'const resources: CalendarResource[] = TEST_RESOURCES;  // 4 top-level, 7 children',
    '',
    '// ── ds-timeline (Angular template) ──────────────────────────────',
    '<ds-timeline',
    '  [events]="events"         <!-- same array -->',
    '  [resources]="resources"   <!-- same array -->',
    '  [editable]="true"',
    '  [slotMinTime]="\'07:00:00\'"',
    '  [slotMaxTime]="\'22:00:00\'"',
    '  [businessHours]="true"',
    '  [scrollTime]="\'08:00:00\'"',
    '  [resourcesInitiallyExpanded]="true"',
    '  [eventMinWidth]="30">',
    '</ds-timeline>',
    '',
    '// ── FullCalendar 6 (same arrays, zero conversion) ────────────────',
    'const fcOptions: CalendarOptions = {',
    '  plugins: [resourceTimelinePlugin, interactionPlugin],',
    '  resources: events,       // ← same reference',
    '  events:    resources,    // ← same reference',
    '  editable:  true,',
    '  slotMinTime: \'07:00:00\',',
    '  slotMaxTime: \'22:00:00\',',
    '  businessHours: true,',
    '  scrollTime: \'08:00:00\',',
    '  resourcesInitiallyExpanded: true,',
    '  eventMinWidth: 30,',
    '  schedulerLicenseKey: \'GPL-My-Project-Is-Open-Source\',',
    '};'
  ].join('\n');

  sharedEvents: CalendarEvent[]       = TEST_EVENTS;
  sharedResources: CalendarResource[] = TEST_RESOURCES;
  optionMap: OptionMapping[]          = OPTION_MAP;

  log: { source: 'ds' | 'fc'; type: string; message: string; time: string }[] = [];

  get totalFull(): number {
    return this.optionMap.filter(r => r.compatible === 'full').length;
  }

  get flatResourceCount(): number {
    let n = 0;
    const count = (rs: CalendarResource[]) => {
      for (const r of rs) { n++; if (r.children) count(r.children); }
    };
    count(this.sharedResources);
    return n;
  }

  readonly fullFeatures = [
    'events (same objects)',
    'resources (same objects)',
    'editable / selectable',
    'event.resourceEditable',
    'event.url',
    'display:background',
    'slotMinTime / slotMaxTime',
    'businessHours',
    'event.backgroundColor / borderColor / textColor',
    'resource.eventBackgroundColor',
    'eventDrop / eventResize callbacks',
    'datesSet / select / dateClick',
    'scrollTime',
    'resourcesInitiallyExpanded',
    'eventMinWidth'
  ];
  readonly partialFeatures = [
    'display (background only)',
    'eventOverlap',
    'themeSystem',
    'height (via CSS)',
    'headerToolbar'
  ];

  // ── FullCalendar options — mirrors the ds-timeline inputs above ────────────
  fcOptions: CalendarOptions = {
    plugins: [resourceTimelinePlugin, interactionPlugin],
    initialView: 'resourceTimelineWeek',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
    },
    // ← same object references as [events] and [resources] on ds-timeline
    resources: TEST_RESOURCES as any,
    events:    TEST_EVENTS    as any,
    // same option names / values
    editable:                   true,
    selectable:                 true,
    slotMinWidth:               60,
    resourceAreaWidth:         '200px',   // FC uses string; ds uses number
    resourceAreaHeaderContent:  'Teams & Rooms',
    nowIndicator:               true,     // FC name; ds uses showNowIndicator
    businessHours:              true,
    slotMinTime:               '07:00:00',
    slotMaxTime:               '22:00:00',
    scrollTime:                '08:00:00',
    resourcesInitiallyExpanded: true,
    eventMinWidth:              30,
    height:                     460,
    schedulerLicenseKey:       'GPL-My-Project-Is-Open-Source',
    // callbacks → same payload shape as ds-timeline @Outputs
    eventClick:   (info) => {
      if (info.event.url) info.jsEvent.preventDefault();
      this.addLog('fc', 'eventClick',
        `"${info.event.title}"${info.event.url ? ' \u2192 ' + info.event.url : ''}`);
    },
    eventDrop:    (info) => this.addLog('fc', 'eventDrop',
      `"${info.event.title}" \u2192 ${info.newResource?.title ?? '?'}`),
    eventResize:  (info) => this.addLog('fc', 'eventResize',  `"${info.event.title}"`),
    eventChange:  (info) => this.addLog('fc', 'eventChange',  `"${info.event.title}"`),
    select:       (info) => this.addLog('fc', 'select',       `${info.startStr} \u2013 ${info.endStr}`),
    datesSet:     (info) => this.addLog('fc', 'datesSet',     `${info.view.type} | ${info.view.title}`),
    dateClick:    (info) => this.addLog('fc', 'dateClick',    info.dateStr),
  };

  ngOnInit() {}

  // ── ds-timeline @Output handlers ──────────────────────────────────────────
  onDsEventClick(arg: EventClickArg) {
    const url = (arg.event as any).url;
    this.addLog('ds', 'eventClick', `"${arg.event.title}"${url ? ' \u2192 ' + url : ''}`);
  }
  onDsEventChange(arg: EventChangeArg) {
    this.addLog('ds', 'eventChange', `"${arg.event.title}"`);
  }
  onDsSelect(arg: SelectArg) {
    const fmt = (dt: Date) => dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.addLog('ds', 'select',
      `${fmt(arg.start)} \u2013 ${fmt(arg.end)}${arg.resource ? ' \u00b7 ' + arg.resource.title : ''}`);
  }
  onDsDatesSet(arg: DatesSetArg) {
    this.addLog('ds', 'datesSet', `${arg.view} | ${arg.title}`);
  }
  onDsDateClick(arg: DateClickArg) {
    this.addLog('ds', 'dateClick', arg.date.toLocaleString());
  }
  onDsResourceClick(arg: ResourceClickArg) {
    this.addLog('ds', 'resourceClick', `"${arg.resource.title}"`);
  }

  private addLog(source: 'ds' | 'fc', type: string, message: string) {
    this.sectionTab = 'log';
    this.log.push({ source, type, message, time: new Date().toLocaleTimeString() });
    if (this.log.length > 50) this.log.shift();
  }
}
