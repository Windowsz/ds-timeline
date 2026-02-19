import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChild, OnDestroy, DoCheck
} from '@angular/core';
import {
  CalendarEvent, CalendarResource, CalendarView,
  FlatResource, HeaderTier, SlotDuration,
  DragState, ResizeState,
  EventClickArg, EventChangeArg, DateClickArg, SelectArg, DatesSetArg, ResourceClickArg
} from './ngx-timeline-calendar.types';
import { NgxTimelineCalendarService } from './ngx-timeline-calendar.service';

export interface SelectionState {
  resourceId: string;
  startX: number;
  currentX: number;
  startDate: Date;
  endDate: Date;
}

export interface HoverTooltip {
  event: CalendarEvent;
  x: number;   // px relative to ntc-wrap
  y: number;
  visible: boolean;
}

@Component({
  selector: 'ngx-timeline-calendar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ntc-wrap" [ngClass]="'ntc-theme-' + theme" #wrapEl>

      <!-- TOOLBAR -->
      <div class="ntc-toolbar" *ngIf="showToolbar">
        <div class="ntc-toolbar-left">
          <button class="ntc-btn ntc-btn-today" type="button" (click)="goToToday()">Today</button>
          <div class="ntc-nav-group">
            <button class="ntc-btn ntc-btn-nav" type="button" (click)="navigate(-1)">&#8249;</button>
            <button class="ntc-btn ntc-btn-nav" type="button" (click)="navigate(1)">&#8250;</button>
          </div>
          <span class="ntc-title">{{ currentTitle }}</span>
        </div>
        <div class="ntc-toolbar-right" *ngIf="showViewSwitcher">
          <div class="ntc-view-group">
            <button class="ntc-btn ntc-btn-view" type="button"
              [ngClass]="{ 'ntc-active': currentView === 'resourceTimelineDay' }"
              (click)="setView('resourceTimelineDay')">Day</button>
            <button class="ntc-btn ntc-btn-view" type="button"
              [ngClass]="{ 'ntc-active': currentView === 'resourceTimelineWeek' }"
              (click)="setView('resourceTimelineWeek')">Week</button>
            <button class="ntc-btn ntc-btn-view" type="button"
              [ngClass]="{ 'ntc-active': currentView === 'resourceTimelineMonth' }"
              (click)="setView('resourceTimelineMonth')">Month</button>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="ntc-body">

        <!-- Resource column -->
        <div class="ntc-res-col" [style.width.px]="resourceAreaWidth" (wheel)="onResColWheel($event)">
          <div class="ntc-res-header" [style.height.px]="headerHeight">
            <span class="ntc-res-header-text">{{ resourceAreaHeaderContent }}</span>
          </div>
          <div class="ntc-res-rows" #resRows>
            <div *ngFor="let res of flatResources"
              class="ntc-res-row"
              [ngClass]="{ 'ntc-res-group': res.isGroup }"
              [style.height.px]="rowHeight"
              [style.paddingLeft.px]="res.level * 18 + 10"
              (click)="onResourceClick($event, res)">
              <button *ngIf="res.isGroup" class="ntc-expand-btn" type="button"
                (click)="$event.stopPropagation(); toggleResource(res)">{{ res.expanded ? '&#9660;' : '&#9658;' }}</button>
              <div class="ntc-res-info">
                <span class="ntc-res-name">{{ res.title }}</span>
                <span class="ntc-res-sub" *ngIf="res.extendedProps && res.extendedProps['subtitle']">
                  {{ res.extendedProps['subtitle'] }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline area -->
        <div class="ntc-timeline" #timelineEl (scroll)="onScroll($event)">

          <!-- Header -->
          <div class="ntc-hdr" [style.height.px]="headerHeight" [style.minWidth.px]="totalWidth">
            <div class="ntc-hdr-tier ntc-hdr-tier1">
              <div *ngFor="let col of headerTier1"
                class="ntc-hdr-cell ntc-hdr-cell-lg"
                [style.width.px]="col.width">{{ col.label }}</div>
            </div>
            <div class="ntc-hdr-tier ntc-hdr-tier2">
              <div *ngFor="let slot of slots"
                class="ntc-hdr-cell"
                [style.width.px]="slotWidth"
                [ngClass]="{
                  'ntc-weekend': svc.isWeekend(slot),
                  'ntc-today-col': svc.isToday(slot, currentView)
                }">{{ svc.formatSlotLabel(slot, currentView, slotDuration, timeFormat) }}</div>
              <div class="ntc-hdr-cell ntc-hdr-filler"></div>
            </div>
          </div>

          <!-- Grid -->
          <div class="ntc-grid" [style.minWidth.px]="totalWidth">
            <div *ngFor="let res of flatResources"
              class="ntc-grid-row"
              [ngClass]="{
                'ntc-grid-group': res.isGroup,
                'ntc-row-selecting': selState && selState.resourceId === res.id,
                'ntc-row-drag-over': dragState && dragTargetResourceId === res.id && dragState.sourceResourceId !== res.id
              }"
              [style.height.px]="rowHeight"
              [style.cursor]="selectable && !res.isGroup ? 'crosshair' : 'default'"
              (mousedown)="onGridMouseDown($event, res)">

              <!-- Slot background columns -->
              <div class="ntc-bg-cols">
                <div *ngFor="let slot of slots"
                  class="ntc-bg-col"
                  [style.width.px]="slotWidth"
                  [ngClass]="{
                    'ntc-weekend': svc.isWeekend(slot),
                    'ntc-today-col': svc.isToday(slot, currentView)
                  }"></div>
                <div class="ntc-bg-filler"></div>
              </div>

              <!-- DRAG SELECTION BOX -->
              <div *ngIf="selState && selState.resourceId === res.id"
                class="ntc-sel-box"
                [style.left.px]="getSelLeft()"
                [style.width.px]="getSelWidth()"
                [style.top.px]="getEventTop()"
                [style.height.px]="eventHeight">
                <span class="ntc-sel-label">{{ getSelLabel() }}</span>
              </div>

              <!-- Events -->
              <div class="ntc-evts-layer">
                <div *ngFor="let evt of getResourceEvents(res.id); let ei = index"
                  class="ntc-evt"
                  [ngClass]="{
                    'ntc-evt-selected': selectedEventId === evt.id,
                    'ntc-evt-dragging': dragState !== null && dragState.eventId === evt.id,
                    'ntc-evt-blocked': isBlocked(evt, res.id)
                  }"
                  [style.left.px]="getEventLeft(evt)"
                  [style.width.px]="getEventWidth(evt)"
                  [style.top.px]="getEventTopStacked(evt, res.id, ei)"
                  [style.height.px]="eventHeight"
                  [style.backgroundColor]="evt.color || evt.backgroundColor || defaultEventColor"
                  [style.borderColor]="evt.borderColor || evt.color || defaultEventColor"
                  [style.color]="svc.getContrastColor(evt.color || evt.backgroundColor || defaultEventColor)"
                  (mousedown)="onEventMouseDown($event, evt)"
                  (click)="onEventClick($event, evt)"
                  (mouseenter)="onEventMouseEnter($event, evt)"
                  (mouseleave)="onEventMouseLeave()"
                  (mousemove)="onEventMouseMove($event)">
                  <div class="ntc-evt-inner">
                    <span class="ntc-evt-title">{{ evt.title }}</span>
                    <span class="ntc-evt-time" *ngIf="currentView === 'resourceTimelineDay'">
                      {{ formatEventTime(evt) }}
                    </span>
                  </div>
                  <div *ngIf="editable && evt.editable !== false && evt.durationEditable !== false && !isBlocked(evt, res.id)"
                    class="ntc-resize ntc-resize-end"
                    (mousedown)="onResizeStart($event, evt, 'end')">
                    <span class="ntc-resize-grip"></span>
                  </div>
                  <div *ngIf="editable && evt.editable !== false && evt.startEditable !== false && !isBlocked(evt, res.id)"
                    class="ntc-resize ntc-resize-start"
                    (mousedown)="onResizeStart($event, evt, 'start')">
                    <span class="ntc-resize-grip"></span>
                  </div>
                </div>
              </div>

              <!-- Now indicator -->
              <div *ngIf="showNowIndicator && nowVisible"
                class="ntc-now-line"
                [style.left.px]="nowLeft"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLOATING SELECTION TOOLTIP -->
      <div *ngIf="selState && tooltipVisible"
        class="ntc-sel-tooltip"
        [style.left.px]="tooltipX"
        [style.top.px]="tooltipY">
        <div class="ntc-sel-tooltip-row">
          <span>&#128336;</span>
          <strong>{{ getSelLabel() }}</strong>
        </div>
        <div class="ntc-sel-tooltip-res" *ngIf="selResource">{{ selResource.title }}</div>
        <div class="ntc-sel-tooltip-hint">Release to confirm</div>
      </div>

      <!-- ===== EVENT HOVER TOOLTIP ===== -->
      <div *ngIf="hoverTooltip && hoverTooltip.visible"
        class="ntc-evt-tooltip"
        [style.left.px]="hoverTooltip.x"
        [style.top.px]="hoverTooltip.y">
        <div class="ntc-evt-tooltip-title">{{ hoverTooltip.event.title }}</div>
        <div class="ntc-evt-tooltip-time">
          <span class="ntc-evt-tooltip-icon">&#128336;</span>
          {{ formatEventTime(hoverTooltip.event) }}
        </div>
        <div class="ntc-evt-tooltip-res" *ngIf="getEventResource(hoverTooltip.event)">
          <span class="ntc-evt-tooltip-icon">&#128100;</span>
          {{ getEventResource(hoverTooltip.event) }}
        </div>
        <div class="ntc-evt-tooltip-extra" *ngIf="hoverTooltip.event.extendedProps && hoverTooltip.event.extendedProps['description']">
          {{ hoverTooltip.event.extendedProps['description'] }}
        </div>
        <div class="ntc-evt-tooltip-mode" *ngIf="eventOverlap === 'single'">
          <span class="ntc-evt-tooltip-badge">&#128274; Exclusive</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --ntc-primary:    #3d91ff;
      --ntc-bg:         #ffffff;
      --ntc-surface:    #f8f9fa;
      --ntc-border:     #dee2e6;
      --ntc-border-lt:  #e9ecef;
      --ntc-text:       #212529;
      --ntc-muted:      #6c757d;
      --ntc-hdr-bg:     #f8f9fa;
      --ntc-row-bg:     #ffffff;
      --ntc-row-alt:    #fafbfc;
      --ntc-grp-bg:     #eef2f7;
      --ntc-weekend-bg: rgba(0,0,0,0.018);
      --ntc-today-bg:   rgba(61,145,255,0.09);
      --ntc-today-bdr:  rgba(61,145,255,0.4);
      --ntc-now:        #ff4757;
      --ntc-sel-bg:     rgba(61,145,255,0.15);
      --ntc-sel-bdr:    rgba(61,145,255,0.65);
      --ntc-radius:     4px;
    }
    .ntc-theme-dark {
      --ntc-bg:         #1a1d23;
      --ntc-surface:    #22262f;
      --ntc-border:     #2e3341;
      --ntc-border-lt:  #252931;
      --ntc-text:       #e8eaf0;
      --ntc-muted:      #8892a4;
      --ntc-hdr-bg:     #1e2229;
      --ntc-row-bg:     #1a1d23;
      --ntc-row-alt:    #1d2028;
      --ntc-grp-bg:     #1e2229;
      --ntc-weekend-bg: rgba(255,255,255,0.012);
      --ntc-today-bg:   rgba(61,145,255,0.13);
      --ntc-sel-bg:     rgba(61,145,255,0.22);
    }
    .ntc-wrap {
      position: relative; background: var(--ntc-bg); color: var(--ntc-text);
      border: 1px solid var(--ntc-border); border-radius: 8px;
      overflow: hidden; height: 100%; display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
    }
    /* TOOLBAR */
    .ntc-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--ntc-border); background: var(--ntc-hdr-bg); flex-shrink: 0; }
    .ntc-toolbar-left, .ntc-toolbar-right { display: flex; align-items: center; gap: 8px; }
    .ntc-title { font-size: 15px; font-weight: 700; margin-left: 6px; white-space: nowrap; }
    .ntc-btn { border: 1px solid var(--ntc-border); background: var(--ntc-bg); color: var(--ntc-text); padding: 5px 13px; border-radius: var(--ntc-radius); cursor: pointer; font-size: 13px; font-weight: 500; line-height: 1.5; transition: background 0.14s; }
    .ntc-btn:hover { background: var(--ntc-surface); }
    .ntc-btn:focus { outline: 2px solid var(--ntc-primary); outline-offset: 1px; }
    .ntc-nav-group { display: flex; }
    .ntc-nav-group .ntc-btn-nav { padding: 5px 10px; font-size: 17px; line-height: 1; }
    .ntc-nav-group .ntc-btn-nav:first-child { border-radius: var(--ntc-radius) 0 0 var(--ntc-radius); border-right: none; }
    .ntc-nav-group .ntc-btn-nav:last-child  { border-radius: 0 var(--ntc-radius) var(--ntc-radius) 0; }
    .ntc-view-group { display: flex; }
    .ntc-view-group .ntc-btn-view { border-radius: 0; border-right: none; }
    .ntc-view-group .ntc-btn-view:first-child { border-radius: var(--ntc-radius) 0 0 var(--ntc-radius); }
    .ntc-view-group .ntc-btn-view:last-child  { border-radius: 0 var(--ntc-radius) var(--ntc-radius) 0; border-right: 1px solid var(--ntc-border); }
    .ntc-view-group .ntc-btn-view.ntc-active  { background: var(--ntc-primary); color: #fff; border-color: var(--ntc-primary); }
    /* BODY */
    .ntc-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
    /* RESOURCE COL */
    .ntc-res-col { flex-shrink: 0; border-right: 2px solid var(--ntc-border); background: var(--ntc-hdr-bg); display: flex; flex-direction: column; overflow: hidden; z-index: 10; }
    .ntc-res-header { display: flex; align-items: center; border-bottom: 1px solid var(--ntc-border); flex-shrink: 0; }
    .ntc-res-header-text { padding: 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ntc-muted); }
    .ntc-res-rows { overflow-y: hidden; flex: 1; }
    .ntc-res-row { display: flex; align-items: center; gap: 5px; border-bottom: 1px solid var(--ntc-border-lt); background: var(--ntc-row-bg); box-sizing: border-box; overflow: hidden; transition: background 0.1s; cursor: pointer; }
    .ntc-res-row:hover { background: var(--ntc-surface); }
    .ntc-res-group { background: var(--ntc-grp-bg) !important; }
    .ntc-expand-btn { background: none; border: none; cursor: pointer; color: var(--ntc-muted); font-size: 10px; padding: 2px 3px; flex-shrink: 0; line-height: 1; }
    .ntc-res-info { min-width: 0; flex: 1; overflow: hidden; }
    .ntc-res-name { display: block; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ntc-res-group .ntc-res-name { font-weight: 700; }
    .ntc-res-sub { display: block; font-size: 11px; color: var(--ntc-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* TIMELINE */
    .ntc-timeline { flex: 1; overflow: auto; position: relative; }
    /* HEADER */
    .ntc-hdr { position: sticky; top: 0; z-index: 9; background: var(--ntc-hdr-bg); border-bottom: 2px solid var(--ntc-border); display: flex; flex-direction: column; }
    .ntc-hdr-tier { display: flex; flex: 1; border-bottom: 1px solid var(--ntc-border-lt); }
    .ntc-hdr-tier:last-child { border-bottom: none; }
    .ntc-hdr-cell { flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--ntc-muted); border-right: 1px solid var(--ntc-border-lt); box-sizing: border-box; padding: 0 4px; white-space: nowrap; overflow: hidden; }
    .ntc-hdr-filler { flex: 1 1 auto; border-right: none; }
    .ntc-hdr-cell-lg { justify-content: flex-start; font-size: 12px; font-weight: 700; color: var(--ntc-text); padding-left: 10px; }
    .ntc-hdr-cell.ntc-today-col { color: var(--ntc-primary); background: var(--ntc-today-bg); }
    .ntc-hdr-cell.ntc-weekend { opacity: 0.75; }
    /* GRID */
    .ntc-hdr  { width: 100%; }
    .ntc-grid { position: relative; width: 100%; }
    .ntc-row-drag-over { background: rgba(61,145,255,0.08) !important; outline: 2px dashed rgba(61,145,255,0.5); outline-offset: -2px; }
    .ntc-grid-row { position: relative; border-bottom: 1px solid var(--ntc-border-lt); box-sizing: border-box; background: var(--ntc-row-bg); }
    .ntc-grid-row:nth-child(even) { background: var(--ntc-row-alt); }
    .ntc-grid-group { background: var(--ntc-grp-bg) !important; }
    .ntc-row-selecting { background: rgba(61,145,255,0.04) !important; }
    .ntc-bg-cols { display: flex; position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
    .ntc-bg-col { flex-shrink: 0; height: 100%; border-right: 1px solid var(--ntc-border-lt); box-sizing: border-box; }
    .ntc-bg-filler { flex: 1; height: 100%; }
    .ntc-bg-col.ntc-weekend   { background: var(--ntc-weekend-bg); }
    .ntc-bg-col.ntc-today-col { background: var(--ntc-today-bg); border-right-color: var(--ntc-today-bdr); }
    /* EVENTS */
    .ntc-evts-layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
    .ntc-evt {
      position: absolute; border-radius: 3px; border: 1px solid transparent;
      pointer-events: all; cursor: pointer; overflow: visible;
      user-select: none; box-sizing: border-box; min-width: 4px;
      transition: box-shadow 0.15s, opacity 0.15s;
    }
    .ntc-evt:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.32); z-index: 2; }
    .ntc-evt.ntc-evt-selected { box-shadow: 0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px var(--ntc-primary); z-index: 3; }
    .ntc-evt.ntc-evt-dragging { opacity: 0.65; cursor: grabbing; z-index: 100; }
    /* Single-mode blocked events: show with red hatch + reduced opacity */
    .ntc-evt.ntc-evt-blocked {
      opacity: 0.45;
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        rgba(255,0,0,0.2) 4px,
        rgba(255,0,0,0.2) 8px
      ) !important;
      cursor: not-allowed;
    }
    .ntc-evt-inner { height: 100%; padding: 2px 18px 2px 7px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ntc-evt-title { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
    .ntc-evt-time  { font-size: 10px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* RESIZE */
    .ntc-resize { position: absolute; top: 0; bottom: 0; width: 10px; cursor: col-resize; z-index: 5; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
    .ntc-evt:hover .ntc-resize { opacity: 1; }
    .ntc-resize-end   { right: 0; }
    .ntc-resize-start { left: 0; }
    .ntc-resize-grip  { display: block; width: 2px; height: 55%; border-radius: 1px; background: rgba(255,255,255,0.75); }
    /* NOW */
    .ntc-now-line { position: absolute; top: -1px; bottom: -1px; width: 2px; background: var(--ntc-now); z-index: 4; pointer-events: none; }
    /* SELECTION BOX */
    .ntc-sel-box { position: absolute; background: var(--ntc-sel-bg); border: 2px solid var(--ntc-sel-bdr); border-radius: 3px; pointer-events: none; z-index: 50; display: flex; align-items: center; justify-content: center; min-width: 2px; box-shadow: 0 2px 8px rgba(61,145,255,0.18); }
    .ntc-sel-label { font-size: 11px; font-weight: 700; color: var(--ntc-primary); white-space: nowrap; padding: 0 5px; overflow: hidden; }
    /* SELECTION TOOLTIP */
    .ntc-sel-tooltip { position: absolute; background: #1a1d23; color: #e8eaf0; padding: 9px 14px; border-radius: 8px; font-size: 12px; pointer-events: none; z-index: 9999; box-shadow: 0 6px 20px rgba(0,0,0,0.35); transform: translate(-50%, -110%); white-space: nowrap; border: 1px solid #2e3341; }
    .ntc-sel-tooltip::after { content: ''; position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid #1a1d23; }
    .ntc-sel-tooltip-row { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; margin-bottom: 3px; }
    .ntc-sel-tooltip-res { font-size: 11px; color: #3d91ff; margin-bottom: 3px; }
    .ntc-sel-tooltip-hint { font-size: 10px; color: #8892a4; }

    /* ===== EVENT HOVER TOOLTIP ===== */
    .ntc-evt-tooltip {
      position: absolute;
      background: #1a1d23;
      color: #e8eaf0;
      border: 1px solid #2e3341;
      border-radius: 10px;
      padding: 10px 14px;
      min-width: 180px;
      max-width: 260px;
      pointer-events: none;
      z-index: 8000;
      box-shadow: 0 8px 28px rgba(0,0,0,0.4);
      transform: translate(-50%, calc(-100% - 10px));
      animation: ntc-tip-in 0.12s ease;
    }
    @keyframes ntc-tip-in {
      from { opacity: 0; transform: translate(-50%, calc(-100% - 6px)); }
      to   { opacity: 1; transform: translate(-50%, calc(-100% - 10px)); }
    }
    .ntc-evt-tooltip::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 7px solid #1a1d23;
    }
    .ntc-evt-tooltip-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
      line-height: 1.4;
      word-break: break-word;
    }
    .ntc-evt-tooltip-time,
    .ntc-evt-tooltip-res,
    .ntc-evt-tooltip-extra {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 11px;
      color: #b0bec5;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    .ntc-evt-tooltip-icon { font-size: 12px; flex-shrink: 0; margin-top: 1px; }
    .ntc-evt-tooltip-extra { color: #8892a4; font-style: italic; }
    .ntc-evt-tooltip-mode { margin-top: 6px; padding-top: 6px; border-top: 1px solid #2e3341; }
    .ntc-evt-tooltip-badge { font-size: 10px; background: rgba(255,71,87,0.18); color: #ff6b78; padding: 2px 8px; border-radius: 8px; font-weight: 700; }
  `]
})
export class NgxTimelineCalendarComponent implements OnInit, OnChanges, OnDestroy, DoCheck {

  @ViewChild('timelineEl') timelineEl!: ElementRef<HTMLDivElement>;
  @ViewChild('resRows')    resRowsEl!:  ElementRef<HTMLDivElement>;
  @ViewChild('wrapEl')     wrapEl!:     ElementRef<HTMLDivElement>;

  // ===== INPUTS =====
  @Input() events: CalendarEvent[] = [];
  @Input() resources: CalendarResource[] = [];
  @Input() initialView: CalendarView = 'resourceTimelineWeek';
  @Input() initialDate: Date | null = null;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() slotMinWidth = 60;
  @Input() slotDuration: SlotDuration = '01:00:00';
  /** '12h' = AM/PM labels (default), '24h' = 00:00–23:00 labels */
  @Input() timeFormat: '12h' | '24h' = '12h';
  @Input() resourceAreaWidth = 200;
  @Input() resourceAreaHeaderContent = 'Resources';
  @Input() headerHeight = 52;
  @Input() rowHeight = 40;
  @Input() eventHeight = 28;
  @Input() showToolbar = true;
  @Input() showViewSwitcher = true;
  @Input() showNowIndicator = true;
  @Input() selectable = true;
  @Input() selectMinDuration = 900000;
  @Input() editable = true;
  @Input() defaultEventColor = '#3d91ff';
  @Input() showEventTooltip = true;
  @Input() tooltipDelay = 300; // ms before tooltip shows

  /**
   * 'multiple' (default) — events overlap freely in the same row
   * 'single'             — only one event per time slot per resource;
   *                        overlapping events are shown with a red hatch
   *                        and drag is blocked for blocked events
   */
  @Input() eventOverlap: 'multiple' | 'single' = 'multiple';
  /**
   * true (default) — dragging an event up/down moves it to a different resource row.
   * false          — drag is horizontal-only; resource never changes.
   */
  @Input() allowResourceDrag = true;

  // ===== OUTPUTS =====
  @Output() eventClick    = new EventEmitter<EventClickArg>();
  @Output() eventChange   = new EventEmitter<EventChangeArg>();
  @Output() dateClick     = new EventEmitter<DateClickArg>();
  @Output() select        = new EventEmitter<SelectArg>();
  @Output() selecting     = new EventEmitter<SelectArg>();
  @Output() viewChange    = new EventEmitter<{ view: CalendarView; start: Date; end: Date }>();
  @Output() datesSet      = new EventEmitter<DatesSetArg>();
  @Output() resourceClick = new EventEmitter<ResourceClickArg>();

  // ===== STATE =====
  currentView: CalendarView = 'resourceTimelineWeek';
  currentDate: Date = new Date();
  currentTitle = '';
  slots: Date[] = [];
  headerTier1: HeaderTier[] = [];
  slotWidth = 60;
  totalWidth = 0;
  flatResources: FlatResource[] = [];
  selectedEventId: string | null = null;
  dragState: DragState | null = null;
  dragTargetResourceId: string | null = null;
  resizeState: ResizeState | null = null;
  nowVisible = false;
  nowLeft = 0;

  // drag-to-select
  selState: SelectionState | null = null;
  selResource: FlatResource | null = null;
  tooltipX = 0;
  tooltipY = 0;
  tooltipVisible = false;
  private isSelecting = false;
  private selMoved = false;

  // event hover tooltip
  hoverTooltip: HoverTooltip | null = null;
  private hoverTimer: any = null;

  private mouseMoveListener!: (e: MouseEvent) => void;
  private mouseUpListener!:   (e: MouseEvent) => void;
  private nowTimer: any;
  private prevEventsLength = 0;

  constructor(public svc: NgxTimelineCalendarService, private cdr: ChangeDetectorRef) {}

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.currentView = this.initialView;
    this.currentDate = this.initialDate ? new Date(this.initialDate) : new Date();
    this.flattenResources();
    this.buildTimeline();
    this.updateNow();
    if (this.showNowIndicator) {
      this.nowTimer = setInterval(() => { this.updateNow(); this.cdr.markForCheck(); }, 30000);
    }
    this.mouseMoveListener = (e: MouseEvent) => this.onGlobalMouseMove(e);
    this.mouseUpListener   = (e: MouseEvent) => this.onGlobalMouseUp(e);
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup',   this.mouseUpListener);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resources']) this.flattenResources();
    if (changes['initialView'] && !changes['initialView'].firstChange) this.currentView = this.initialView;
    if (changes['slotDuration'] || changes['slotMinWidth'] || changes['initialView'] || changes['resources']) this.buildTimeline();
  }

  ngDoCheck() {
    if (this.events && this.events.length !== this.prevEventsLength) {
      this.prevEventsLength = this.events.length;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy() {
    clearInterval(this.nowTimer);
    clearTimeout(this.hoverTimer);
    document.removeEventListener('mousemove', this.mouseMoveListener);
    document.removeEventListener('mouseup',   this.mouseUpListener);
  }

  // ===== NAVIGATION =====
  goToToday() { this.currentDate = new Date(); this.buildTimeline(); }

  navigate(dir: number) {
    const d = new Date(this.currentDate);
    if (this.currentView === 'resourceTimelineDay')   d.setDate(d.getDate() + dir);
    if (this.currentView === 'resourceTimelineWeek')  d.setDate(d.getDate() + dir * 7);
    if (this.currentView === 'resourceTimelineMonth') d.setMonth(d.getMonth() + dir);
    this.currentDate = d; this.buildTimeline();
  }

  setView(view: CalendarView) {
    this.currentView = view; this.buildTimeline();
    this.viewChange.emit({ view, start: this.getViewStart(), end: this.getViewEnd() });
  }

  buildTimeline() {
    const r = this.svc.buildTimeline(this.currentView, this.currentDate, this.slotDuration, this.slotMinWidth);
    this.slots = r.slots; this.headerTier1 = r.tier1;
    this.slotWidth = r.slotWidth; this.totalWidth = r.totalWidth; this.currentTitle = r.title;
    this.updateNow(); this.cdr.markForCheck();
    this.datesSet.emit({ view: this.currentView, start: this.getViewStart(), end: this.getViewEnd(), title: this.currentTitle });
  }

  // ===== RESOURCES =====
  flattenResources() {
    this.flatResources = [];
    const flatten = (list: CalendarResource[], level: number) => {
      for (const r of list) {
        const hasChildren = !!(r.children && r.children.length);
        const existing = this.flatResources.find(f => f.id === r.id);
        const expanded = existing ? existing.expanded : true;
        this.flatResources.push({ id: r.id, title: r.title, level, isGroup: hasChildren, expanded, children: r.children, extendedProps: r.extendedProps, original: r });
        if (hasChildren && expanded) flatten(r.children!, level + 1);
      }
    };
    flatten(this.resources, 0);
  }

  toggleResource(res: FlatResource) { res.expanded = !res.expanded; this.flattenResources(); this.cdr.markForCheck(); }

  // ===== EVENTS =====
  getResourceEvents(resourceId: string): CalendarEvent[] {
    const vs = this.getViewStart().getTime();
    const ve = this.getViewEnd().getTime();
    return this.events.filter(e => {
      // must belong to this resource
      const inResource = e.resourceId === resourceId || (e.resourceIds && e.resourceIds.indexOf(resourceId) > -1);
      if (!inResource) return false;
      // must overlap the current view range (start < viewEnd AND end > viewStart)
      const es = new Date(e.start).getTime();
      const ee = e.end ? new Date(e.end).getTime() : es + 3600000;
      return es < ve && ee > vs;
    });
  }

  getEventLeft(evt: CalendarEvent): number {
    const vs = this.getViewStart(), ve = this.getViewEnd(), t = ve.getTime() - vs.getTime();
    if (t <= 0) return 0;
    return (Math.max(0, new Date(evt.start).getTime() - vs.getTime()) / t) * this.totalWidth;
  }

  getEventWidth(evt: CalendarEvent): number {
    const vs = this.getViewStart(), ve = this.getViewEnd();
    const es = new Date(evt.start), ee = evt.end ? new Date(evt.end) : new Date(es.getTime() + 3600000);
    const t = ve.getTime() - vs.getTime();
    if (t <= 0) return 4;
    // clamp end to view end
    const clampedEnd = Math.min(ee.getTime(), ve.getTime());
    const clampedStart = Math.max(es.getTime(), vs.getTime());
    return Math.max(4, (clampedEnd - clampedStart) / t * this.totalWidth);
  }

  getEventTop(): number { return Math.floor((this.rowHeight - this.eventHeight) / 2); }

  /**
   * In 'single' mode: stack overlapping events vertically (each gets narrower height).
   * In 'multiple' mode: all events sit at the same top (they visually overlap).
   */
  getEventTopStacked(evt: CalendarEvent, resourceId: string, eventIndex: number): number {
    if (this.eventOverlap === 'multiple') return this.getEventTop();
    const siblings = this.getResourceEvents(resourceId);
    // find how many events overlap with this one that come before it in the list
    const evtStart = new Date(evt.start).getTime();
    const evtEnd   = evt.end ? new Date(evt.end).getTime() : evtStart + 3600000;
    let lane = 0;
    for (let i = 0; i < eventIndex; i++) {
      const s = new Date(siblings[i].start).getTime();
      const e = siblings[i].end ? new Date(siblings[i].end).getTime() : s + 3600000;
      if (s < evtEnd && e > evtStart) lane++;
    }
    const laneH = this.eventHeight + 2;
    const totalH = lane * laneH;
    const base = Math.floor((this.rowHeight - this.eventHeight) / 2);
    return Math.min(base + totalH, this.rowHeight - this.eventHeight - 1);
  }

  /**
   * In single mode, return true if this event overlaps another event in same resource.
   * The FIRST event in a slot wins; all subsequent overlapping events are "blocked".
   */
  isBlocked(evt: CalendarEvent, resourceId: string): boolean {
    if (this.eventOverlap !== 'single') return false;
    const siblings = this.getResourceEvents(resourceId);
    const idx = siblings.findIndex(e => e.id === evt.id);
    if (idx <= 0) return false;
    const evtStart = new Date(evt.start).getTime();
    const evtEnd   = evt.end ? new Date(evt.end).getTime() : evtStart + 3600000;
    for (let i = 0; i < idx; i++) {
      const s = new Date(siblings[i].start).getTime();
      const e = siblings[i].end ? new Date(siblings[i].end).getTime() : s + 3600000;
      if (s < evtEnd && e > evtStart) return true;
    }
    return false;
  }

  // ===== HOVER TOOLTIP =====
  onEventMouseEnter(e: MouseEvent, evt: CalendarEvent) {
    if (!this.showEventTooltip) return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      const pos = this.tooltipPosFromMouse(e);
      this.hoverTooltip = { event: evt, x: pos.x, y: pos.y, visible: true };
      this.cdr.markForCheck();
    }, this.tooltipDelay);
  }

  onEventMouseMove(e: MouseEvent) {
    if (!this.hoverTooltip || !this.hoverTooltip.visible) return;
    const pos = this.tooltipPosFromMouse(e);
    this.hoverTooltip = Object.assign({}, this.hoverTooltip, { x: pos.x, y: pos.y });
    this.cdr.markForCheck();
  }

  onEventMouseLeave() {
    clearTimeout(this.hoverTimer);
    this.hoverTooltip = null;
    this.cdr.markForCheck();
  }

  private tooltipPosFromMouse(e: MouseEvent): { x: number; y: number } {
    const wrap = this.wrapEl?.nativeElement;
    if (!wrap) return { x: e.clientX, y: e.clientY };
    const rect = wrap.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  getEventResource(evt: CalendarEvent): string {
    if (!evt.resourceId) return '';
    const res = this.flatResources.find(r => r.id === evt.resourceId);
    return res ? res.title : evt.resourceId;
  }

  // ===== SELECTION BOX HELPERS =====
  getSelLeft(): number {
    if (!this.selState) return 0;
    return Math.min(this.selState.startX, this.selState.currentX);
  }
  getSelWidth(): number {
    if (!this.selState) return 0;
    return Math.max(2, Math.abs(this.selState.currentX - this.selState.startX));
  }
  getSelLabel(): string {
    if (!this.selState) return '';
    const [s, e] = this.selState.startDate <= this.selState.endDate
      ? [this.selState.startDate, this.selState.endDate]
      : [this.selState.endDate,   this.selState.startDate];
    return this.fmtRange(s, e);
  }

  private fmtRange(start: Date, end: Date): string {
    const fmtTime = (d: Date) => {
      const h = d.getHours() % 12 || 12, m = d.getMinutes(), p = d.getHours() >= 12 ? 'PM' : 'AM';
      return h + (m ? ':' + (m < 10 ? '0' + m : m) : '') + '\u202f' + p;
    };
    const fmtDate = (d: Date) => {
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return days[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
    };
    if (this.currentView === 'resourceTimelineDay') return fmtTime(start) + ' \u2013 ' + fmtTime(end);
    return fmtDate(start) + ' \u2013 ' + fmtDate(end);
  }

  // ===== GRID MOUSEDOWN =====
  onGridMouseDown(e: MouseEvent, res: FlatResource) {
    if ((e.target as HTMLElement).closest('.ntc-evt'))    return;
    if ((e.target as HTMLElement).closest('.ntc-resize')) return;
    if (!this.selectable || res.isGroup) return;
    e.preventDefault();
    const x = this.gridX(e);
    const date = this.dateFromX(x);
    this.isSelecting = true;
    this.selMoved    = false;
    this.selResource = res;
    this.selState    = { resourceId: res.id, startX: x, currentX: x, startDate: date, endDate: date };
    this.tooltipVisible = false;
    this.cdr.markForCheck();
  }

  // ===== SCROLL =====
  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (this.resRowsEl) this.resRowsEl.nativeElement.scrollTop = el.scrollTop;
  }

  onResColWheel(e: WheelEvent) {
    e.preventDefault();
    if (this.timelineEl) this.timelineEl.nativeElement.scrollTop += e.deltaY;
  }

  // ===== RESOURCE CLICK =====
  onResourceClick(e: MouseEvent, res: FlatResource) {
    this.resourceClick.emit({ resource: res.original, jsEvent: e });
  }

  // ===== EVENT CLICK =====
  onEventClick(e: MouseEvent, evt: CalendarEvent) {
    if (this.isBlocked(evt, evt.resourceId || '')) return;
    e.stopPropagation();
    this.selectedEventId = evt.id;
    this.eventClick.emit({ event: evt, el: e.currentTarget as HTMLElement, jsEvent: e });
    this.cdr.markForCheck();
  }

  // ===== EVENT DRAG =====
  onEventMouseDown(e: MouseEvent, evt: CalendarEvent) {
    if (!this.editable || evt.editable === false || evt.startEditable === false) return;
    if (this.isBlocked(evt, evt.resourceId || '')) return;
    e.preventDefault(); e.stopPropagation();
    this.hoverTooltip = null;
    this.dragState = {
      eventId: evt.id,
      originalEvent: this.clone(evt),
      startX: e.clientX,
      startY: e.clientY,
      sourceResourceId: evt.resourceId || ''
    };
    this.dragTargetResourceId = evt.resourceId || null;
    this.cdr.markForCheck();
  }

  // ===== RESIZE =====
  onResizeStart(e: MouseEvent, evt: CalendarEvent, handle: 'start' | 'end') {
    if (!this.editable || evt.editable === false) return;
    if (this.isBlocked(evt, evt.resourceId || '')) return;
    if (handle === 'end'   && evt.durationEditable === false) return;
    if (handle === 'start' && evt.startEditable    === false) return;
    e.preventDefault(); e.stopPropagation();
    this.hoverTooltip = null;
    this.resizeState = { eventId: evt.id, handle, originalEvent: this.clone(evt), startX: e.clientX };
    this.cdr.markForCheck();
  }

  // ===== GLOBAL MOUSE MOVE =====
  private onGlobalMouseMove(e: MouseEvent) {
    const viewStart = this.getViewStart();
    const viewEnd   = this.getViewEnd();
    const totalMs   = viewEnd.getTime() - viewStart.getTime();

    // --- drag-to-select ---
    if (this.isSelecting && this.selState) {
      // Clamp X to grid width so selection never goes past end of view
      const x = Math.max(0, Math.min(this.totalWidth, this.gridX(e)));
      const date = this.dateFromX(x);
      const moved = Math.abs(x - this.selState.startX) > 3;
      if (moved) {
        this.selMoved = true;
        this.autoScrollOnDrag(e);   // auto-scroll when near edges
        this.selState = Object.assign({}, this.selState, { currentX: x, endDate: date });
        const el = this.timelineEl?.nativeElement;
        if (el) {
          const midX = (Math.min(this.selState.startX, x) + Math.max(this.selState.startX, x)) / 2;
          const rect = el.getBoundingClientRect();
          this.tooltipX = midX - el.scrollLeft + (this.resourceAreaWidth);
          this.tooltipY = this.headerHeight + 6;
          this.tooltipVisible = true;
        }
        const [s, en] = this.normalizedSel();
        this.selecting.emit({ start: s, end: en, resource: this.selResource?.original });
        this.cdr.markForCheck();
      }
      return;
    }

    if (totalMs <= 0 || this.totalWidth <= 0) return;
    const msPerPx = totalMs / this.totalWidth;

    // --- event drag (clamped to view boundaries) ---
    if (this.dragState) {
      const dx  = e.clientX - this.dragState.startX;
      const deltaMs = dx * msPerPx;
      const idx = this.findIdx(this.dragState.eventId);

      // Detect which resource row the cursor is over (for cross-row drag)
      if (this.allowResourceDrag) {
        const targetRes = this.resourceAtY(e);
        this.dragTargetResourceId = targetRes ? targetRes.id : this.dragState.sourceResourceId;
      }

      if (idx > -1) {
        const orig = this.dragState.originalEvent;
        const os  = new Date(orig.start).getTime();
        const dur = (orig.end ? new Date(orig.end).getTime() : os + 3600000) - os;

        // Clamp to view boundaries
        let newStartMs = os + deltaMs;
        newStartMs = Math.max(viewStart.getTime(), newStartMs);
        newStartMs = Math.min(viewEnd.getTime() - dur, newStartMs);

        const targetResourceId = this.allowResourceDrag
          ? (this.dragTargetResourceId || this.dragState.sourceResourceId)
          : this.dragState.sourceResourceId;

        // --- Single-mode overlap guard ---
        if (this.eventOverlap === 'single') {
          const newStart = new Date(newStartMs);
          const newEnd   = new Date(newStartMs + dur);
          const siblings = this.getResourceEvents(targetResourceId).filter(ev => ev.id !== this.dragState!.eventId);
          const wouldOverlap = siblings.some(sib => {
            const ss = new Date(sib.start).getTime();
            const se = sib.end ? new Date(sib.end).getTime() : ss + 3600000;
            return ss < newEnd.getTime() && se > newStart.getTime();
          });
          if (wouldOverlap) {
            this.cdr.markForCheck();
            return; // refuse the move — keep current position
          }
        }

        const ns = new Date(newStartMs);
        this.events = this.events.slice();
        this.events[idx] = Object.assign({}, this.events[idx], {
          start: ns,
          end: new Date(ns.getTime() + dur),
          resourceId: targetResourceId
        });
        this.cdr.markForCheck();
      }
    }

    // --- resize (clamped to view boundaries) ---
    if (this.resizeState) {
      const dx = e.clientX - this.resizeState.startX;
      const deltaMs = dx * msPerPx;
      const idx = this.findIdx(this.resizeState.eventId);
      if (idx > -1) {
        const orig = this.resizeState.originalEvent;
        const os = new Date(orig.start).getTime();
        const oe = orig.end ? new Date(orig.end).getTime() : os + 3600000;
        this.events = this.events.slice();
        if (this.resizeState.handle === 'end') {
          // end cannot exceed viewEnd
          const ne = Math.min(viewEnd.getTime(), oe + deltaMs);
          if (ne - os >= 900000) this.events[idx] = Object.assign({}, this.events[idx], { end: new Date(ne) });
        } else {
          // start cannot go before viewStart
          const ns = Math.max(viewStart.getTime(), os + deltaMs);
          if (oe - ns >= 900000) this.events[idx] = Object.assign({}, this.events[idx], { start: new Date(ns) });
        }
        this.cdr.markForCheck();
      }
    }
  }

  // ===== GLOBAL MOUSE UP =====
  private onGlobalMouseUp(e: MouseEvent) {
    if (this.isSelecting) {
      const moved = this.selMoved, state = this.selState, resource = this.selResource?.original;
      this.isSelecting = false; this.selMoved = false;
      this.tooltipVisible = false; this.selState = null; this.selResource = null;
      if (moved && state) {
        const [s, en] = this.normalizedSelFrom(state);
        if (en.getTime() - s.getTime() >= this.selectMinDuration) {
          this.select.emit({ start: s, end: en, resource });
        }
      } else if (!moved && state) {
        // Simple click on a grid cell (no drag) → dateClick
        this.dateClick.emit({ date: state.startDate, resource, jsEvent: e });
      }
      this.cdr.markForCheck(); return;
    }
    if (this.dragState) {
      const idx = this.findIdx(this.dragState.eventId);
      if (idx > -1) {
        const newEvt = this.events[idx], oldEvt = this.dragState.originalEvent;
        const timeChanged     = new Date(newEvt.start).getTime() !== new Date(oldEvt.start).getTime();
        const resourceChanged = newEvt.resourceId !== oldEvt.resourceId;
        if (timeChanged || resourceChanged) {
          const ci = idx;
          this.eventChange.emit({ event: newEvt, oldEvent: oldEvt, revert: () => { this.events = this.events.slice(); this.events[ci] = oldEvt; this.cdr.markForCheck(); } });
        }
      }
      this.dragState = null;
      this.dragTargetResourceId = null;
      this.cdr.markForCheck();
    }
    if (this.resizeState) {
      const idx = this.findIdx(this.resizeState.eventId);
      if (idx > -1) {
        const ci = idx, oldEvt = this.resizeState.originalEvent;
        this.eventChange.emit({ event: this.events[idx], oldEvent: oldEvt, revert: () => { this.events = this.events.slice(); this.events[ci] = oldEvt; this.cdr.markForCheck(); } });
      }
      this.resizeState = null; this.cdr.markForCheck();
    }
  }

  // ===== COORDINATE UTILS =====
  private gridX(e: MouseEvent): number {
    const el = this.timelineEl?.nativeElement;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(this.totalWidth, e.clientX - rect.left + el.scrollLeft));
  }

  private dateFromX(x: number): Date {
    const s  = this.getViewStart();
    const en = this.getViewEnd();
    const totalMs = en.getTime() - s.getTime();
    // x at or beyond totalWidth = exactly end of view (end of scrollbar)
    if (x >= this.totalWidth) return new Date(en);
    if (x <= 0)               return new Date(s);
    const pct   = x / this.totalWidth;
    const rawMs = pct * totalMs;
    if (this.currentView === 'resourceTimelineDay') {
      const slotMs  = this.svc.slotMs(this.slotDuration);
      const snapped = Math.round(rawMs / slotMs) * slotMs;
      return new Date(s.getTime() + Math.min(snapped, totalMs));
    }
    const dayMs   = 86400000;
    const snapped = Math.round(rawMs / dayMs) * dayMs;
    return new Date(s.getTime() + Math.min(snapped, totalMs));
  }

  // Map a mouse Y position to whichever FlatResource row the cursor is over
  private resourceAtY(e: MouseEvent): FlatResource | null {
    const el = this.timelineEl?.nativeElement;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // Y relative to grid (below sticky header)
    const yInGrid = e.clientY - rect.top - this.headerHeight + el.scrollTop;
    if (yInGrid < 0) return null;
    const rowIdx = Math.floor(yInGrid / this.rowHeight);
    const res = this.flatResources[rowIdx];
    // Don't allow dropping onto group rows
    if (!res || res.isGroup) return null;
    return res;
  }

  // Auto-scroll timeline when dragging near edges
  private autoScrollOnDrag(e: MouseEvent): void {
    const el = this.timelineEl?.nativeElement;
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const zone  = 60;
    const speed = 12;
    const dRight = rect.right - e.clientX;
    const dLeft  = e.clientX  - rect.left;
    if (dRight < zone && dRight > 0) el.scrollLeft += speed * (1 - dRight / zone);
    else if (dLeft < zone && dLeft > 0) el.scrollLeft -= speed * (1 - dLeft / zone);
  }

  private normalizedSel(): [Date, Date] {
    if (!this.selState) return [new Date(), new Date()];
    return this.normalizedSelFrom(this.selState);
  }
  private normalizedSelFrom(state: SelectionState): [Date, Date] {
    return state.startDate <= state.endDate ? [state.startDate, state.endDate] : [state.endDate, state.startDate];
  }

  // ===== VIEW RANGE =====
  getViewStart() { return this.svc.getViewStart(this.currentView, this.currentDate); }
  getViewEnd()   { return this.svc.getViewEnd(this.currentView, this.currentDate); }

  // ===== FORMAT =====
  formatEventTime(evt: CalendarEvent): string {
    const s = new Date(evt.start), e = evt.end ? new Date(evt.end) : null;
    const fmt = (d: Date) => {
      if (this.timeFormat === '24h') {
        const h = d.getHours(), m = d.getMinutes();
        return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
      }
      const h = d.getHours() % 12 || 12, m = d.getMinutes(), p = d.getHours() >= 12 ? 'PM' : 'AM';
      return h + (m ? ':' + (m < 10 ? '0' + m : m) : '') + '\u202f' + p;
    };
    return e ? fmt(s) + ' \u2013 ' + fmt(e) : fmt(s);
  }

  private updateNow() {
    const now = new Date(), s = this.getViewStart(), e = this.getViewEnd();
    this.nowVisible = now >= s && now <= e;
    if (this.nowVisible && this.totalWidth > 0) this.nowLeft = ((now.getTime() - s.getTime()) / (e.getTime() - s.getTime())) * this.totalWidth;
  }

  private findIdx(id: string) { return this.events.findIndex(e => e.id === id); }
  private clone(evt: CalendarEvent): CalendarEvent { return Object.assign({}, evt, { start: new Date(evt.start), end: evt.end ? new Date(evt.end) : undefined }); }

  // ===== PUBLIC API =====
  today()  { this.goToToday(); }
  prev()   { this.navigate(-1); }
  next()   { this.navigate(1); }
  changeView(view: CalendarView) { this.setView(view); }
  getDate() { return new Date(this.currentDate); }
  addEvent(event: CalendarEvent)      { this.events = this.events.concat([event]); this.cdr.markForCheck(); }
  removeEvent(id: string)             { this.events = this.events.filter(e => e.id !== id); this.cdr.markForCheck(); }
  updateEvent(u: CalendarEvent)       { const i = this.findIdx(u.id); if (i > -1) { this.events = this.events.slice(); this.events[i] = u; this.cdr.markForCheck(); } }
  clearSelection()                    { this.selState = null; this.isSelecting = false; this.cdr.markForCheck(); }
  scrollToTime(t: string)             { if (!this.timelineEl) return; const [h, m] = t.split(':').map(Number); this.timelineEl.nativeElement.scrollLeft = ((h * 60 + m) / 1440) * this.totalWidth; }
  refetchEvents()                     { this.cdr.markForCheck(); }
}
