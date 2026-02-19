import { Component, ViewChild, OnInit, ElementRef, AfterViewChecked } from '@angular/core';
import {
  NgxTimelineCalendarComponent,
  CalendarEvent, CalendarResource, CalendarView,
  DatesSetArg, EventClickArg, EventChangeArg, DateClickArg, SelectArg, ResourceClickArg
} from '../../projects/ngx-timeline-calendar/src/public-api';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <div class="demo" [ngClass]="{ 'demo-dark': theme === 'dark' }">

      <!-- Header -->
      <header class="demo-hdr">
        <div class="demo-hdr-inner">
          <div class="demo-brand">
            <span class="demo-brand-icon">&#128197;</span>
            <div>
              <div class="demo-brand-name">ngx-timeline-calendar</div>
              <div class="demo-brand-tag">Angular 6 &rarr; 20+ &bull; Drag-Select &bull; Hover Tooltip &bull; Overlap Modes</div>
            </div>
          </div>
          <div class="demo-controls">

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Theme</label>
              <div class="demo-btn-grp">
                <button type="button" [ngClass]="{ active: theme === 'light' }" (click)="theme = 'light'">&#9728; Light</button>
                <button type="button" [ngClass]="{ active: theme === 'dark'  }" (click)="theme = 'dark'">&#9790; Dark</button>
              </div>
            </div>

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Event Mode</label>
              <div class="demo-btn-grp">
                <button type="button"
                  [ngClass]="{ active: eventOverlap === 'multiple' }"
                  (click)="eventOverlap = 'multiple'"
                  title="Events can overlap freely">&#9776; Multiple</button>
                <button type="button"
                  [ngClass]="{ active: eventOverlap === 'single' }"
                  (click)="eventOverlap = 'single'"
                  title="Only one event per time slot. Conflicts shown with red hatch.">&#128274; Single</button>
              </div>
            </div>

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Slot Width</label>
              <select (change)="slotMinWidth = +$any($event.target).value">
                <option value="40">Compact</option>
                <option value="60" selected>Normal</option>
                <option value="90">Wide</option>
                <option value="120">X-Wide</option>
              </select>
            </div>

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Row Height</label>
              <select (change)="rowHeight = +$any($event.target).value">
                <option value="30">Compact</option>
                <option value="40" selected>Normal</option>
                <option value="56">Tall</option>
              </select>
            </div>

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Time Format</label>
              <div class="demo-btn-grp">
                <button type="button"
                  [ngClass]="{ active: timeFormat === '12h' }"
                  (click)="timeFormat = '12h'"
                  title="12-hour AM/PM format">12h</button>
                <button type="button"
                  [ngClass]="{ active: timeFormat === '24h' }"
                  (click)="timeFormat = '24h'"
                  title="24-hour format">24h</button>
              </div>
            </div>

            <div class="demo-ctl-grp">
              <label class="demo-lbl">Row Drag</label>
              <div class="demo-btn-grp">
                <button type="button"
                  [ngClass]="{ active: allowResourceDrag }"
                  (click)="allowResourceDrag = true"
                  title="Drag events between resource rows">On</button>
                <button type="button"
                  [ngClass]="{ active: !allowResourceDrag }"
                  (click)="allowResourceDrag = false"
                  title="Drag stays in the same row">Off</button>
              </div>
            </div>

            <button class="demo-add-btn" type="button" (click)="addRandomEvent()">+ Add Event</button>
          </div>
        </div>
      </header>

      <!-- Mode badge -->
      <div class="demo-mode-bar" [ngClass]="{ 'demo-mode-single': eventOverlap === 'single' }">
        <span *ngIf="eventOverlap === 'multiple'">
          &#9776; <strong>Multiple mode</strong> — events can freely overlap in the same row. Hover any event to see its tooltip.
        </span>
        <span *ngIf="eventOverlap === 'single'">
          &#128274; <strong>Single mode</strong> — only one event allowed per time slot. Conflicting events show a red hatch pattern and cannot be dragged. Drag on empty rows to create new events.
        </span>
      </div>

      <!-- Calendar -->
      <div class="demo-cal-wrap">
        <ngx-timeline-calendar
          #cal
          [events]="events"
          [resources]="resources"
          [theme]="theme"
          [slotMinWidth]="slotMinWidth"
          [rowHeight]="rowHeight"
          [resourceAreaWidth]="220"
          [resourceAreaHeaderContent]="'Teams & Rooms'"
          [showNowIndicator]="true"
          [selectable]="true"
          [editable]="true"
          [eventOverlap]="eventOverlap"
          [timeFormat]="timeFormat"
          [allowResourceDrag]="allowResourceDrag"
          [showEventTooltip]="true"
          [tooltipDelay]="250"
          (eventClick)="onEventClick($event)"
          (eventChange)="onEventChange($event)"
          (dateClick)="onDateClick($event)"
          (datesSet)="onDatesSet($event)"
          (select)="onSelect($event)"
          (resourceClick)="onResourceClick($event)">
        </ngx-timeline-calendar>
      </div>

      <!-- ===== SELECTION DIALOG ===== -->
      <div class="demo-overlay" *ngIf="pendingSelection" (click)="cancelSelection()">
        <div class="demo-dialog" (click)="$event.stopPropagation()">
          <div class="demo-dialog-header">
            <span class="demo-dialog-icon">&#9998;</span>
            <span class="demo-dialog-title">Create New Event</span>
            <button type="button" class="demo-dialog-close" (click)="cancelSelection()">&#10005;</button>
          </div>

          <div class="demo-dialog-range">
            <span class="demo-dialog-range-icon">&#128336;</span>
            <span class="demo-dialog-range-text">{{ pendingLabel }}</span>
          </div>

          <div class="demo-dialog-resource" *ngIf="pendingSelection.resource">
            <span>&#128100;</span>
            <span>{{ pendingSelection.resource.title }}</span>
          </div>

          <div class="demo-dialog-body">
            <label class="demo-field-label">Event Title</label>
            <input
              #titleInput
              class="demo-input"
              type="text"
              placeholder="Enter event title..."
              [(ngModel)]="newEventTitle"
              (keydown.enter)="confirmSelection()"
              (keydown.escape)="cancelSelection()" />

            <label class="demo-field-label">Color</label>
            <div class="demo-color-row">
              <button *ngFor="let c of colorOptions" type="button"
                class="demo-color-btn"
                [ngClass]="{ 'demo-color-active': newEventColor === c }"
                [style.backgroundColor]="c"
                (click)="newEventColor = c">
                <span *ngIf="newEventColor === c" class="demo-color-check">&#10003;</span>
              </button>
            </div>

            <label class="demo-field-label">Description (optional)</label>
            <input class="demo-input" type="text" placeholder="Add a note..." [(ngModel)]="newEventDesc" />
          </div>

          <div class="demo-dialog-actions">
            <button type="button" class="demo-btn-cancel" (click)="cancelSelection()">Cancel</button>
            <button type="button" class="demo-btn-create" (click)="confirmSelection()"
              [disabled]="!newEventTitle.trim()">
              &#10003; Create Event
            </button>
          </div>
        </div>
      </div>

      <!-- Log -->
      <div class="demo-log-panel">
        <div class="demo-log-title">&#128203; Event Log</div>
        <div class="demo-log-empty" *ngIf="log.length === 0">
          Interact with the calendar — drag rows, hover events, click events, click a resource&hellip;
        </div>
        <div class="demo-log-row" *ngFor="let entry of log.slice().reverse()">
          <span class="log-time">{{ entry.time }}</span>
          <span class="log-badge" [ngClass]="'badge-' + entry.type">{{ entry.type }}</span>
          <span class="log-msg">{{ entry.message }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .demo { min-height: 100vh; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    .demo.demo-dark { background: #12151a; color: #e8eaf0; }

    /* HEADER */
    .demo-hdr { background: #1a1d23; border-bottom: 1px solid #2e3341; }
    .demo-hdr-inner { max-width: 1440px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
    .demo-brand { display: flex; align-items: center; gap: 12px; }
    .demo-brand-icon { font-size: 28px; }
    .demo-brand-name { font-size: 17px; font-weight: 700; color: #3d91ff; }
    .demo-brand-tag  { font-size: 11px; color: #8892a4; margin-top: 2px; }

    .demo-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
    .demo-ctl-grp  { display: flex; align-items: center; gap: 7px; }
    .demo-lbl { font-size: 11px; color: #8892a4; white-space: nowrap; }

    .demo-btn-grp { display: flex; }
    .demo-btn-grp button { border: 1px solid #2e3341; background: #22262f; color: #8892a4; padding: 5px 12px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.14s; white-space: nowrap; }
    .demo-btn-grp button:first-child { border-radius: 5px 0 0 5px; }
    .demo-btn-grp button:last-child  { border-radius: 0 5px 5px 0; border-left: none; }
    .demo-btn-grp button.active { background: #3d91ff; color: #fff; border-color: #3d91ff; }

    select { border: 1px solid #2e3341; background: #22262f; color: #e8eaf0; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
    .demo-add-btn { background: #2ed573; color: #1a1d23; border: none; padding: 6px 16px; border-radius: 5px; font-size: 13px; font-weight: 700; cursor: pointer; }

    /* MODE BAR */
    .demo-mode-bar {
      max-width: 1440px; margin: 12px auto 0; padding: 0 24px;
    }
    .demo-mode-bar > span, .demo-mode-bar {
      display: block;
      background: #e8f4fd; border: 1px solid #bee3f8; border-radius: 7px;
      padding: 9px 16px; font-size: 12px; color: #1a6fa8;
    }
    .demo-mode-single > span, .demo-mode-single {
      background: #fff5f5; border-color: #fed7d7; color: #c53030;
    }
    .demo-dark .demo-mode-bar { background: #1a2a3a; border-color: #2d4a6a; color: #7ec8e3; }
    .demo-dark .demo-mode-single { background: #2d1a1a; border-color: #6b2a2a; color: #fc8181; }

    /* CAL */
    .demo-cal-wrap { max-width: 1440px; margin: 12px auto; padding: 0 24px; height: 530px; }
    .demo-cal-wrap ngx-timeline-calendar { height: 100%; display: block; }

    /* DIALOG OVERLAY */
    .demo-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(3px); animation: fade-in 0.15s ease; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .demo-dialog { background: #fff; border-radius: 14px; width: 400px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slide-up 0.18s ease; overflow: hidden; }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .demo-dialog-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px 14px; border-bottom: 1px solid #f0f2f5; }
    .demo-dialog-icon { font-size: 20px; }
    .demo-dialog-title { font-size: 16px; font-weight: 700; color: #212529; flex: 1; }
    .demo-dialog-close { background: none; border: none; cursor: pointer; font-size: 16px; color: #6c757d; padding: 4px; border-radius: 4px; }
    .demo-dialog-close:hover { background: #f0f2f5; }
    .demo-dialog-range { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #f0f7ff; border-bottom: 1px solid #e0eefa; }
    .demo-dialog-range-icon { font-size: 16px; }
    .demo-dialog-range-text { font-size: 14px; font-weight: 700; color: #1565c0; }
    .demo-dialog-resource { display: flex; align-items: center; gap: 8px; padding: 8px 20px; background: #f8f9fa; border-bottom: 1px solid #f0f2f5; font-size: 13px; color: #495057; }
    .demo-dialog-body { padding: 16px 20px; }
    .demo-field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; margin-bottom: 6px; }
    .demo-input { width: 100%; padding: 10px 14px; border: 1.5px solid #dee2e6; border-radius: 8px; font-size: 14px; color: #212529; outline: none; transition: border-color 0.15s; margin-bottom: 14px; }
    .demo-input:focus { border-color: #3d91ff; box-shadow: 0 0 0 3px rgba(61,145,255,0.12); }
    .demo-color-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .demo-color-btn { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.12s; }
    .demo-color-btn:hover { transform: scale(1.15); }
    .demo-color-btn.demo-color-active { border-color: #1a1d23; transform: scale(1.2); }
    .demo-color-check { color: #fff; font-size: 12px; font-weight: 700; }
    .demo-dialog-actions { display: flex; gap: 10px; padding: 14px 20px 18px; border-top: 1px solid #f0f2f5; }
    .demo-btn-cancel { flex: 1; padding: 10px; border: 1.5px solid #dee2e6; background: #fff; color: #495057; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .demo-btn-cancel:hover { background: #f8f9fa; }
    .demo-btn-create { flex: 2; padding: 10px; border: none; background: #3d91ff; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .demo-btn-create:hover:not([disabled]) { background: #2d7ee6; }
    .demo-btn-create[disabled] { opacity: 0.5; cursor: not-allowed; }

    /* LOG */
    .demo-log-panel { max-width: 1440px; margin: 0 auto 40px; padding: 0 24px; }
    .demo-log-title { font-size: 13px; font-weight: 700; color: #495057; margin-bottom: 8px; }
    .demo-dark .demo-log-title { color: #8892a4; }
    .demo-log-empty { background: #fff; border: 1px solid #dee2e6; border-radius: 7px; padding: 14px 18px; color: #6c757d; font-size: 12px; }
    .demo-dark .demo-log-empty { background: #22262f; border-color: #2e3341; color: #8892a4; }
    .demo-log-row { display: flex; align-items: center; gap: 10px; padding: 7px 14px; background: #fff; border: 1px solid #dee2e6; border-radius: 6px; margin-bottom: 4px; font-size: 12px; }
    .demo-dark .demo-log-row { background: #22262f; border-color: #2e3341; }
    .log-time  { color: #6c757d; min-width: 72px; font-family: monospace; font-size: 11px; }
    .log-badge { padding: 2px 9px; border-radius: 10px; font-size: 10px; font-weight: 700; min-width: 88px; text-align: center; }
    .badge-select      { background: #d1fae5; color: #065f46; }
    .badge-eventClick  { background: #dbeafe; color: #1d4ed8; }
    .badge-eventChange { background: #fef3c7; color: #92400e; }
    .badge-dateClick   { background: #ede9fe; color: #5b21b6; }
    .badge-datesSet       { background: #f3f4f6; color: #374151; }
    .badge-addEvent       { background: #d1fae5; color: #065f46; }
    .badge-resourceClick  { background: #fce7f3; color: #9d174d; }
    .log-msg { color: #212529; flex: 1; }
    .demo-dark .log-msg { color: #e8eaf0; }
  `]
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChild('cal')        cal!: NgxTimelineCalendarComponent;
  @ViewChild('titleInput') titleInputRef!: ElementRef<HTMLInputElement>;

  theme: 'light' | 'dark' = 'light';
  slotMinWidth = 60;
  rowHeight = 40;
  eventOverlap: 'multiple' | 'single' = 'multiple';
  timeFormat: '12h' | '24h' = '12h';
  allowResourceDrag = true;
  log: { time: string; type: string; message: string }[] = [];

  // dialog state
  pendingSelection: SelectArg | null = null;
  pendingLabel = '';
  newEventTitle = '';
  newEventColor = '#3d91ff';
  newEventDesc = '';
  private needsFocus = false;

  colorOptions = [
    '#3d91ff', '#ff4757', '#2ed573', '#ffa502',
    '#a29bfe', '#fd79a8', '#00b894', '#e17055',
    '#fdcb6e', '#6c5ce7', '#00cec9', '#fab1a0'
  ];

  resources: CalendarResource[] = [
    {
      id: 'eng', title: 'Engineering', extendedProps: { subtitle: '18 engineers' },
      children: [
        { id: 'fe',  title: 'Frontend Team',  extendedProps: { subtitle: 'Angular · React' } },
        { id: 'be',  title: 'Backend Team',   extendedProps: { subtitle: 'Node · Go' } },
        { id: 'qa',  title: 'QA & Testing',   extendedProps: { subtitle: 'Automation' } },
        { id: 'ops', title: 'DevOps / Infra', extendedProps: { subtitle: 'K8s · AWS' } }
      ]
    },
    {
      id: 'design', title: 'Design', extendedProps: { subtitle: '6 designers' },
      children: [
        { id: 'ux', title: 'UX Research',   extendedProps: { subtitle: 'User studies' } },
        { id: 'ui', title: 'Visual Design', extendedProps: { subtitle: 'Figma' } }
      ]
    },
    { id: 'pm',  title: 'Product',   extendedProps: { subtitle: '4 PMs' } },
    { id: 'mkt', title: 'Marketing', extendedProps: { subtitle: '7 members' } },
    { id: 'rma', title: 'Room A',    extendedProps: { subtitle: 'Cap: 8' } },
    { id: 'rmb', title: 'Room B',    extendedProps: { subtitle: 'Cap: 20' } }
  ];

  events: CalendarEvent[] = [];

  ngOnInit() { this.generateSampleEvents(); }

  ngAfterViewChecked() {
    if (this.needsFocus && this.titleInputRef) {
      this.titleInputRef.nativeElement.focus();
      this.needsFocus = false;
    }
  }

  // ===== SELECTION DIALOG =====
  onSelect(arg: SelectArg) {
    this.pendingSelection = arg;
    this.pendingLabel = this.buildLabel(arg);
    this.newEventTitle = '';
    this.newEventColor = '#3d91ff';
    this.newEventDesc  = '';
    this.needsFocus = true;
    const fmt = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    this.addLog('select', fmt(arg.start) + ' \u2013 ' + fmt(arg.end) + (arg.resource ? ' \u00b7 ' + arg.resource.title : ''));
  }

  confirmSelection() {
    if (!this.pendingSelection || !this.newEventTitle.trim()) return;
    const sel = this.pendingSelection;
    const evt: CalendarEvent = {
      id: 'sel-' + Date.now(),
      title: this.newEventTitle.trim(),
      start: sel.start, end: sel.end,
      resourceId: sel.resource ? sel.resource.id : undefined,
      color: this.newEventColor,
      extendedProps: this.newEventDesc ? { description: this.newEventDesc } : undefined
    };
    if (this.cal) { this.cal.addEvent(evt); } else { this.events = this.events.concat([evt]); }
    this.addLog('addEvent', 'Created "' + evt.title + '" — ' + this.pendingLabel);
    this.pendingSelection = null;
  }

  cancelSelection() {
    this.pendingSelection = null;
    if (this.cal) this.cal.clearSelection();
  }

  private buildLabel(arg: SelectArg): string {
    const fmtTime = (d: Date) => {
      const h = d.getHours() % 12 || 12, m = d.getMinutes(), p = d.getHours() >= 12 ? 'PM' : 'AM';
      return h + (m ? ':' + (m < 10 ? '0' + m : m) : '') + '\u202f' + p;
    };
    const fmtDate = (d: Date) => {
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return days[d.getDay()] + ', ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const sameDay = arg.start.toDateString() === arg.end.toDateString();
    return sameDay
      ? fmtDate(arg.start) + '  \u00b7  ' + fmtTime(arg.start) + ' \u2013 ' + fmtTime(arg.end)
      : fmtDate(arg.start) + ' \u2013 ' + fmtDate(arg.end);
  }

  // ===== OTHER HANDLERS =====
  addRandomEvent() {
    const rids = ['fe','be','qa','ops','ux','ui','pm','mkt','rma','rmb'];
    const titles = ['Sprint Planning','Design Sync','Architecture Review','Client Demo','1:1 Check-in','Code Review','Retrospective','Release Planning','Incident Review','Workshop'];
    const now = new Date();
    const dayOffset = Math.floor(Math.random() * 5);
    const startHour = 8 + Math.floor(Math.random() * 9);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, startHour);
    const end   = new Date(start.getTime() + (1 + Math.floor(Math.random() * 2)) * 3600000);
    const color = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const evt: CalendarEvent = {
      id: 'rand-' + Date.now(), title, start, end,
      resourceId: rids[Math.floor(Math.random() * rids.length)],
      color,
      extendedProps: { description: 'Auto-generated event' }
    };
    if (this.cal) { this.cal.addEvent(evt); } else { this.events = this.events.concat([evt]); }
    this.addLog('addEvent', '"' + title + '"');
  }

  onEventClick(arg: EventClickArg)       { this.addLog('eventClick',     '"' + arg.event.title + '"'); }
  onEventChange(arg: EventChangeArg)     { this.addLog('eventChange',    'Moved/resized "' + arg.event.title + '"'); }
  onDateClick(arg: DateClickArg)         { this.addLog('dateClick',      arg.date.toLocaleString()); }
  onDatesSet(arg: DatesSetArg)           { this.addLog('datesSet',       arg.view + ' | ' + arg.title); }
  onResourceClick(arg: ResourceClickArg) { this.addLog('resourceClick',  '"' + arg.resource.title + '" (id: ' + arg.resource.id + ')'); }

  private addLog(type: string, message: string) {
    this.log.push({ time: new Date().toLocaleTimeString(), type, message });
    if (this.log.length > 25) this.log.shift();
  }

  private generateSampleEvents() {
    const now = new Date();
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0,0,0,0);
    const descs = ['Weekly sync', 'Bi-weekly review', 'Urgent discussion', 'Planned maintenance', 'Customer interview', 'Team alignment'];
    const colors = ['#3d91ff','#ff4757','#2ed573','#ffa502','#a29bfe','#fd79a8','#00b894','#e17055'];
    const titles = ['Sprint Planning','Design Review','Team Standup','Product Demo','Client Call','1:1 Meeting','Code Review','Architecture Talk','Release Planning','Retrospective'];
    const rids = ['fe','be','qa','ops','ux','ui','pm','mkt','rma','rmb'];
    let id = 1;
    for (let day = 0; day < 7; day++) {
      for (let e = 0; e < 2 + Math.floor(Math.random() * 3); e++) {
        const h = 8 + Math.floor(Math.random() * 10);
        const dur = [1, 1, 1.5, 2][Math.floor(Math.random() * 4)];
        const start = new Date(ws); start.setDate(start.getDate() + day); start.setHours(h, 0, 0, 0);
        this.events.push({
          id: 'seed-' + id++,
          title: titles[Math.floor(Math.random() * titles.length)],
          start, end: new Date(start.getTime() + dur * 3600000),
          resourceId: rids[Math.floor(Math.random() * rids.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          extendedProps: { description: descs[Math.floor(Math.random() * descs.length)] }
        });
      }
    }
  }
}
