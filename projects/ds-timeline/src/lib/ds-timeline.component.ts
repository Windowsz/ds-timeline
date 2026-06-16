import {
  Component, Input, Output, EventEmitter,
  OnInit, AfterViewInit, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ElementRef, ViewChild, OnDestroy, DoCheck
} from '@angular/core';
import {
  CalendarEvent, CalendarResource, CalendarView,
  FlatResource, HeaderTier, SlotDuration,
  DragState, ResizeState, BusinessHours, ValidRange,
  EventClickArg, EventChangeArg, EventDropArg, EventResizeArg,
  DateClickArg, SelectArg, DatesSetArg, ResourceClickArg, EventContentArg,
  MoreLinkArg, ResourceAreaColumn, ConstraintInput, DropArg, EventReceiveArg
} from './ds-timeline.types';
import { DsTimelineService } from './ds-timeline.service';
import { DsLocale, resolveLocale } from './ds-timeline.locales';

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
  selector: 'ds-timeline',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ntc-wrap" [ngClass]="'ntc-theme-' + theme" #wrapEl [style.height]="wrapHeightStyle" [attr.dir]="i18n.direction">

      <!-- TOOLBAR -->
      <div class="ntc-toolbar" *ngIf="showToolbar">
        <div class="ntc-toolbar-left">
          <button class="ntc-btn ntc-btn-today" type="button" (click)="goToToday()" [disabled]="!isInValidRange(today_date)">{{ i18n.buttonText.today }}</button>
          <div class="ntc-nav-group">
            <button class="ntc-btn ntc-btn-nav" type="button" (click)="navigate(-1)" [disabled]="!canNavigate(-1)">&#8249;</button>
            <button class="ntc-btn ntc-btn-nav" type="button" (click)="navigate(1)"  [disabled]="!canNavigate(1)">&#8250;</button>
          </div>
          <input *ngIf="showDatePicker" type="date" class="ntc-date-input"
            [value]="currentDateInput"
            [min]="dateInputMin"
            [max]="dateInputMax"
            (change)="goToDate($any($event.target).value)">
          <span class="ntc-title">{{ currentTitle }}</span>
        </div>
        <div class="ntc-toolbar-right">
          <select *ngIf="showGroupFilter && resourceGroupOptions.length > 0"
            class="ntc-group-filter"
            [value]="activeGroupFilter ?? ''"
            (change)="onGroupFilterChange($any($event.target).value)">
            <option value="">{{ i18n.allFilter }}</option>
            <option *ngFor="let g of resourceGroupOptions" [value]="g.value">{{ g.label }}</option>
          </select>
          <div class="ntc-view-group" *ngIf="showViewSwitcher && views.length > 1">
            <button *ngFor="let v of views"
              class="ntc-btn ntc-btn-view" type="button"
              [ngClass]="{ 'ntc-active': currentView === v }"
              (click)="setView(v)">{{ viewLabel(v) }}</button>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="ntc-body" [style.height]="bodyHeightStyle">

        <!-- Resource column -->
        <div class="ntc-res-col" [style.width]="resourceAreaWidthCss" (wheel)="onResColWheel($event)" (touchstart)="onResColTouchStart($event)" (touchmove)="onResColTouchMove($event)">
          <div class="ntc-res-header" [style.height.px]="headerHeight">
            <ng-container *ngIf="resourceAreaColumns; else singleResHeader">
              <div *ngFor="let col of resourceAreaColumns" class="ntc-res-col-cell ntc-res-col-header-cell"
                [style.width.px]="col.width || 120">{{ col.headerContent }}</div>
            </ng-container>
            <ng-template #singleResHeader>
              <span class="ntc-res-header-text">{{ resourceAreaHeaderContent }}</span>
            </ng-template>
          </div>
          <div class="ntc-res-rows" #resRows>
            <div *ngFor="let res of flatResources"
              class="ntc-res-row"
              [ngClass]="{
                'ntc-res-group': res.isGroup,
                'ntc-res-group-label': res.isGroupLabel
              }"
              [style.height.px]="res.isGroupLabel ? 28 : getEffectiveRowHeight()"
              [style.paddingLeft.px]="res.isGroupLabel ? 10 : res.level * 18 + 10"
              (click)="res.isGroupLabel ? null : onResourceClick($event, res)">
              <button *ngIf="res.isGroup" class="ntc-expand-btn" type="button"
                (click)="$event.stopPropagation(); toggleResource(res)">{{ res.expanded ? '&#9660;' : '&#9658;' }}</button>
              <div class="ntc-res-info" *ngIf="!resourceAreaColumns">
                <span class="ntc-res-name">{{ res.title }}</span>
                <span class="ntc-res-sub" *ngIf="!res.isGroupLabel && res.extendedProps && res.extendedProps['subtitle']">
                  {{ res.extendedProps['subtitle'] }}
                </span>
              </div>
              <ng-container *ngIf="resourceAreaColumns">
                <div *ngFor="let col of resourceAreaColumns" class="ntc-res-col-cell"
                  [style.width.px]="col.width || 120">{{ getResColValue(res, col) }}</div>
              </ng-container>
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
                  'ntc-today-col': svc.isToday(slot, currentView),
                  'ntc-hdr-silent': !showSlotLabel(slot)
                }">{{ showSlotLabel(slot) ? svc.formatSlotLabel(slot, currentView, slotDuration, timeFormat, locale, weekNumbers, firstDay, timeZone, i18n.weekText) : '' }}</div>
              <div class="ntc-hdr-cell ntc-hdr-filler"></div>
            </div>
          </div>

          <!-- Grid -->
          <div class="ntc-grid" [style.minWidth.px]="totalWidth">
            <div *ngFor="let res of flatResources"
              class="ntc-grid-row"
              [ngClass]="{
                'ntc-grid-group':      res.isGroup,
                'ntc-grid-group-label': res.isGroupLabel,
                'ntc-row-selecting':   selState && selState.resourceId === res.id,
                'ntc-row-drag-over':   (dragState && dragTargetResourceId === res.id && dragState.sourceResourceId !== res.id) || externalDragOverResourceId === res.id
              }"
              [style.height.px]="res.isGroupLabel ? 28 : getEffectiveRowHeight()"
              [style.cursor]="(selectable && !res.isGroup && !res.isGroupLabel) ? 'crosshair' : 'default'"
              (mousedown)="res.isGroupLabel ? null : onGridMouseDown($event, res)"
              (touchstart)="res.isGroupLabel ? null : onGridTouchStart($event, res)"
              (dragover)="droppable ? onGridDragOver($event, res) : null"
              (drop)="droppable ? onGridDrop($event, res) : null"
              (dragleave)="droppable ? onGridDragLeave($event) : null">

              <!-- Slot background columns -->
              <div class="ntc-bg-cols">
                <div *ngFor="let slot of slots"
                  class="ntc-bg-col"
                  [style.width.px]="slotWidth"
                  [ngClass]="{
                    'ntc-weekend': svc.isWeekend(slot),
                    'ntc-today-col': svc.isToday(slot, currentView),
                    'ntc-non-business': isNonBusinessHour(slot)
                  }"></div>
                <div class="ntc-bg-filler"></div>
              </div>

              <!-- DRAG SELECTION BOX -->
              <div *ngIf="!res.isGroupLabel && selState && selState.resourceId === res.id"
                class="ntc-sel-box"
                [style.left.px]="getSelLeft()"
                [style.width.px]="getSelWidth()"
                [style.top.px]="getEventTop()"
                [style.height.px]="eventHeight">
                <span class="ntc-sel-label">{{ getSelLabel() }}</span>
              </div>

              <!-- Events (capped by eventMaxStack) -->
              <div class="ntc-evts-layer" *ngIf="!res.isGroupLabel">
                <div *ngFor="let evt of getVisibleEvents(res.id); let ei = index"
                  class="ntc-evt"
                  [ngClass]="{
                    'ntc-evt-selected': selectedEventId === evt.id,
                    'ntc-evt-dragging': dragState !== null && dragState.eventId === evt.id,
                    'ntc-evt-blocked': isBlocked(evt, res.id),
                    'ntc-evt-bg': evt.display === 'background',
                    'ntc-evt-inv-bg': evt.display === 'inverse-background',
                    'ntc-evt-hidden': evt.display === 'none',
                    'ntc-evt-allday': !!evt.allDay
                  }"
                  [style.left.px]="getEventLeft(evt)"
                  [style.width.px]="getEventWidth(evt)"
                  [style.minWidth.px]="isBgDisplay(evt) ? 0 : eventMinWidth"
                  [style.top.px]="isBgDisplay(evt) ? 0 : getEventTopStacked(evt, res.id, ei)"
                  [style.height.px]="isBgDisplay(evt) ? getEffectiveRowHeight() : eventHeight"
                  [style.backgroundColor]="getEventBgColor(evt, res)"
                  [style.borderColor]="evt.borderColor || evt.color || res.original?.eventBorderColor || defaultEventColor"
                  [style.color]="evt.textColor || res.original?.eventTextColor || svc.getContrastColor(getEventBgColor(evt, res))"
                  (mousedown)="onEventMouseDown($event, evt)"
                  (touchstart)="onEventTouchStart($event, evt)"
                  (click)="onEventClick($event, evt)"
                  (mouseenter)="onEventMouseEnter($event, evt)"
                  (mouseleave)="onEventMouseLeave()"
                  (mousemove)="onEventMouseMove($event)">
                  <div class="ntc-evt-inner">
                    <ng-container *ngIf="eventContent; else defaultEvtContent">
                      <span class="ntc-evt-custom" [innerHTML]="eventContent({ event: evt, view: currentView })"></span>
                    </ng-container>
                    <ng-template #defaultEvtContent>
                      <span class="ntc-evt-title">{{ evt.title }}</span>
                      <span class="ntc-evt-time" *ngIf="currentView === 'resourceTimelineDay' && !evt.allDay">
                        {{ formatEventTime(evt) }}
                      </span>
                    </ng-template>
                  </div>
                  <div *ngIf="resizable && editable && evt.editable !== false && evt.durationEditable !== false && !isBlocked(evt, res.id)"
                    class="ntc-resize ntc-resize-end"
                    (mousedown)="onResizeStart($event, evt, 'end')"
                    (touchstart)="onResizeTouchStart($event, evt, 'end')">
                    <span class="ntc-resize-grip"></span>
                  </div>
                  <div *ngIf="resizable && editable && evt.editable !== false && evt.startEditable !== false && !isBlocked(evt, res.id)"
                    class="ntc-resize ntc-resize-start"
                    (mousedown)="onResizeStart($event, evt, 'start')"
                    (touchstart)="onResizeTouchStart($event, evt, 'start')">
                    <span class="ntc-resize-grip"></span>
                  </div>
                </div>
              </div>

              <!-- +N more chip (eventMaxStack) -->
              <div *ngIf="!res.isGroupLabel && getHiddenEventsCount(res.id) > 0"
                class="ntc-more-chip"
                [style.top.px]="getMoreChipTop(res.id)"
                (click)="onMoreChipClick($event, res)">
                {{ i18n.moreLinkText(getHiddenEventsCount(res.id)) }}
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
        <div class="ntc-sel-tooltip-hint">{{ i18n.releaseToConfirm }}</div>
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
          <span class="ntc-evt-tooltip-badge">&#128274; {{ i18n.exclusive }}</span>
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
    .ntc-btn:disabled { opacity: 0.38; cursor: not-allowed; pointer-events: none; }
    .ntc-group-filter { border: 1px solid var(--ntc-border); background: var(--ntc-bg); color: var(--ntc-text); padding: 4px 8px; border-radius: var(--ntc-radius); font-size: 13px; cursor: pointer; height: 31px; outline: none; transition: border-color 0.14s; }
    .ntc-group-filter:focus { border-color: var(--ntc-primary); }
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
      user-select: none; box-sizing: border-box;
      transition: box-shadow 0.15s, opacity 0.15s;
      touch-action: none;
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
    .ntc-evt-inner { height: 100%; padding: 1px 18px 1px 7px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .ntc-evt-title { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; }
    .ntc-evt-time   { font-size: 10px; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; }
    .ntc-evt-custom { display: block; width: 100%; height: 100%; overflow: hidden; }
    /* +N MORE CHIP */
    .ntc-more-chip { position: absolute; left: 4px; font-size: 10px; font-weight: 700; color: var(--ntc-primary); background: rgba(61,145,255,0.12); border: 1px solid rgba(61,145,255,0.3); border-radius: 8px; padding: 1px 7px; cursor: pointer; white-space: nowrap; z-index: 3; }
    .ntc-more-chip:hover { background: rgba(61,145,255,0.22); }
    /* RESOURCE AREA MULTI-COLUMN */
    .ntc-res-col-cell { flex-shrink: 0; padding: 0 10px; font-size: 13px; display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-right: 1px solid var(--ntc-border-lt); box-sizing: border-box; min-width: 0; }
    .ntc-res-col-header-cell { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ntc-muted); }
    /* ALL-DAY EVENTS (Phase 4a) */
    .ntc-evt-allday { border-style: dashed !important; opacity: 0.88; }
    /* SILENT SLOT (slotLabelInterval) */
    .ntc-hdr-silent { color: transparent; border-right-color: var(--ntc-border-lt); }
    /* RESOURCE GROUP LABEL ROW (resourceGroupField) */
    .ntc-res-group-label { background: var(--ntc-grp-bg) !important; border-bottom: 1px solid var(--ntc-border); cursor: default !important; }
    .ntc-res-group-label .ntc-res-name { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; color: var(--ntc-muted); }
    .ntc-grid-group-label { background: var(--ntc-grp-bg) !important; cursor: default !important; }
    /* NON-BUSINESS HOURS shading (businessHours) */
    .ntc-non-business { background: rgba(0,0,0,0.035) !important; }
    .ntc-theme-dark .ntc-non-business { background: rgba(0,0,0,0.18) !important; }
    /* BACKGROUND EVENT (display: 'background') */
    .ntc-evt-bg { border-radius: 0; border: none !important; opacity: 0.3; pointer-events: none; z-index: 0; }
    /* INVERSE-BACKGROUND EVENT (display: 'inverse-background') — dark overlay, inverted from background events */
    .ntc-evt-inv-bg { border-radius: 0; border: none !important; opacity: 0.15; pointer-events: none; z-index: 0; filter: invert(100%) hue-rotate(180deg); }
    .ntc-theme-dark .ntc-evt-inv-bg { opacity: 0.2; }
    /* HIDDEN EVENT (display: 'none') */
    .ntc-evt-hidden { display: none !important; }
    /* RESIZE */
    .ntc-resize { position: absolute; top: 0; bottom: 0; width: 16px; cursor: col-resize; z-index: 5; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; touch-action: none; }
    .ntc-evt:hover .ntc-resize { opacity: 1; }
    @media (pointer: coarse) { .ntc-resize { opacity: 1; width: 20px; } }
    .ntc-resize-end   { right: 0; }
    .ntc-resize-start { left: 0; }
    .ntc-resize-grip  { display: block; width: 3px; height: 55%; border-radius: 2px; background: rgba(255,255,255,0.8); }
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
    /* RTL SUPPORT */
    .ntc-wrap[dir="rtl"] .ntc-body { flex-direction: row-reverse; }
    .ntc-wrap[dir="rtl"] .ntc-res-col { border-right: none; border-left: 2px solid var(--ntc-border); }
    .ntc-wrap[dir="rtl"] .ntc-toolbar { flex-direction: row-reverse; }
    .ntc-wrap[dir="rtl"] .ntc-toolbar-left  { flex-direction: row-reverse; }
    .ntc-wrap[dir="rtl"] .ntc-toolbar-right { flex-direction: row-reverse; }
    .ntc-wrap[dir="rtl"] .ntc-more-chip { left: auto; right: 4px; }
    .ntc-wrap[dir="rtl"] .ntc-evt-inner { padding: 1px 7px 1px 18px; }
    .ntc-wrap[dir="rtl"] .ntc-resize-end   { right: auto; left:  0; }
    .ntc-wrap[dir="rtl"] .ntc-resize-start { left:  auto; right: 0; }
  `]
})
export class DsTimelineComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy, DoCheck {

  @ViewChild('timelineEl') timelineEl!: ElementRef<HTMLDivElement>;
  @ViewChild('resRows')    resRowsEl!:  ElementRef<HTMLDivElement>;
  @ViewChild('wrapEl')     wrapEl!:     ElementRef<HTMLDivElement>;

  // ===== INPUTS =====
  @Input() events: CalendarEvent[] = [];
  @Input() resources: CalendarResource[] = [];
  @Input() initialView: CalendarView = 'resourceTimelineDay';
  @Input() initialDate: Date | null = null;
  /** Subset of views shown in the switcher. Pass a single-element array to lock to one view. */
  @Input() views: CalendarView[] = ['resourceTimelineDay', 'resourceTimelineWeek', 'resourceTimelineMonth'];
  @Input() theme: 'light' | 'dark' = 'light';
  /** BCP 47 locale tag for date/time formatting (e.g. 'en-US', 'th-TH', 'de-DE'). Same as FullCalendar locale. Default: 'en-US'. */
  @Input() locale = 'en-US';
  /** First day of the week: 0=Sunday, 1=Monday … 6=Saturday. Same as FullCalendar firstDay. Default: 0 (Sunday). */
  @Input() firstDay = 0;
  /** Days of the week to hide (0=Sun … 6=Sat). e.g. [0, 6] hides weekends. Same as FullCalendar hiddenDays. Default: []. */
  @Input() hiddenDays: number[] = [];
  /** Show ISO week numbers. Week view: shown in title. Month view: shown on first day of each week. Same as FullCalendar weekNumbers. Default: false. */
  @Input() weekNumbers = false;
  @Input() slotMinWidth = 60;
  @Input() slotDuration: SlotDuration = '01:00:00';
  /** '12h' = AM/PM labels (default), '24h' = 00:00–23:00 labels */
  @Input() timeFormat: '12h' | '24h' = '12h';
  /** Width of the resource column. Accepts a number (pixels) or CSS string like '200px', '20%'. Same as FullCalendar resourceAreaWidth. */
  @Input() resourceAreaWidth: number | string = 200;
  @Input() resourceAreaHeaderContent = 'Resources';

  get resourceAreaWidthCss(): string {
    return typeof this.resourceAreaWidth === 'string' ? this.resourceAreaWidth : this.resourceAreaWidth + 'px';
  }
  get resourceAreaWidthPx(): number {
    if (typeof this.resourceAreaWidth === 'string') {
      const n = parseFloat(this.resourceAreaWidth); return isNaN(n) ? 200 : n;
    }
    return this.resourceAreaWidth as number;
  }
  @Input() headerHeight = 52;
  @Input() rowHeight = 40;
  @Input() eventHeight = 28;
  @Input() showToolbar = true;
  @Input() showViewSwitcher = true;
  /** Show date-picker input in the toolbar for jumping to a specific date. Default: true. */
  @Input() showDatePicker = true;
  /** Show group filter dropdown in the toolbar. Default: true. */
  @Input() showGroupFilter = true;
  @Input() showNowIndicator = true;
  @Input() selectable = true;
  @Input() selectMinDuration = 900000;
  /**
   * Controls how drag-to-select snaps to time boundaries.
   * 'slot' (default) — snaps to slotDuration intervals (e.g. every 30min or 1hr).
   * 'free'           — no snapping; selection follows exact mouse position.
   */
  @Input() selectSnap: 'slot' | 'free' = 'slot';
  @Input() editable = true;
  @Input() defaultEventColor = '#3d91ff';
  @Input() showEventTooltip = true;
  @Input() tooltipDelay = 300; // ms before tooltip shows
  /**
   * Custom event content renderer. Return an HTML string for custom rendering,
   * or null/undefined to use the default title + time layout.
   * Same as FullCalendar eventContent (HTML string output).
   * ⚠ The returned string is inserted via innerHTML — sanitize user-generated content.
   */
  @Input() eventContent: ((arg: EventContentArg) => string | null | undefined) | null = null;

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
  /** Show resize handles on events. Default: false. */
  @Input() resizable = false;
  /**
   * true (default) — dragging an event that has a groupId also moves all other events
   *                  sharing the same groupId by the same delta (synchronized dragging).
   * false          — groupId field is stored but drag affects only the single event.
   * Same as FullCalendar groupId behaviour.
   */
  @Input() groupDrag = true;

  // ===== FULLCALENDAR-PARITY INPUTS =====
  /**
   * Earliest time slot shown in Day view (e.g. '08:00:00').
   * Same as FullCalendar slotMinTime. Default shows full day.
   */
  @Input() slotMinTime = '00:00:00';
  /**
   * Latest time slot shown in Day view (e.g. '20:00:00').
   * Same as FullCalendar slotMaxTime. Default shows full day.
   */
  @Input() slotMaxTime = '24:00:00';
  /**
   * Time to auto-scroll to when the view first renders (e.g. '08:00:00').
   * Same as FullCalendar scrollTime. Only applies to Day view.
   * Set to null to disable auto-scroll.
   */
  @Input() scrollTime: string | null = null;
  /**
   * Whether resource groups are expanded on initial load.
   * Same as FullCalendar resourcesInitiallyExpanded. Default: true.
   */
  @Input() resourcesInitiallyExpanded = true;
  /**
   * Minimum pixel width of an event block.
   * Same as FullCalendar eventMinWidth. Default: 30 (FC default).
   */
  @Input() eventMinWidth = 30;
  /**
   * When true, resource rows expand to fill the available container height.
   * Same as FullCalendar expandRows.
   */
  @Input() expandRows = false;
  /**
   * When set, resources are visually grouped by this extendedProps field value,
   * with a bold group-label row acting as a divider — instead of (or in addition to)
   * hierarchical children. Same as FullCalendar resourceGroupField.
   * e.g. resourceGroupField="dept" groups resources by extendedProps.dept.
   */
  @Input() resourceGroupField: string | null = null;
  /**
   * Maximum number of events that can be stacked vertically per row.
   * Additional events are hidden and represented by a "+N more" chip.
   * Same as FullCalendar eventMaxStack. Default: null (unlimited).
   */
  @Input() eventMaxStack: number | null = null;
  /**
   * How frequently the slot-header labels are shown.
   * e.g. slotDuration='00:15:00' + slotLabelInterval='01:00:00' → label every hour.
   * Same as FullCalendar slotLabelInterval. Only applies to Day view.
   */
  @Input() slotLabelInterval: string | null = null;
  /**
   * Sort key for resources. Prefix with '-' for descending.
   * e.g. 'title' sorts A→Z, '-title' sorts Z→A.
   * Same as FullCalendar resourceOrder.
   */
  @Input() resourceOrder: string | null = null;
  /**
   * When true, only resources that have at least one event are shown.
   * Same as FullCalendar filterResourcesWithEvents.
   */
  @Input() filterResourcesWithEvents = false;
  /**
   * When true (default), the scroll position resets to scrollTime on navigation.
   * Set to false to preserve scroll position across date changes.
   * Same as FullCalendar scrollTimeReset.
   */
  @Input() scrollTimeReset = true;
  /**
   * Highlight business hours in Day view.
   * Pass `true` for Mon–Fri 09:00–17:00, or an object for custom hours.
   * Same as FullCalendar businessHours.
   */
  @Input() businessHours: BusinessHours = false;
  /**
   * Restricts the dates the calendar can navigate to.
   * Navigation buttons and today() are blocked outside this range.
   * Same as FullCalendar validRange.
   * e.g. [validRange]="{ start: '2025-01-01', end: '2025-12-31' }"
   */
  @Input() validRange: ValidRange | null = null;

  // ===== PHASE 2a: HEIGHT / ASPECT RATIO =====
  /**
   * Fixed height of the entire component. Accepts a number (px) or CSS string ('600px', '80vh').
   * Same as FullCalendar height. Default: null (inherits from container via height: 100%).
   */
  @Input() height: number | string | null = null;
  /**
   * Fixed height of the body area (excludes toolbar). Accepts a number (px) or CSS string.
   * Same as FullCalendar contentHeight. Default: null.
   */
  @Input() contentHeight: number | string | null = null;
  /**
   * Aspect ratio (width / height). When set, the component height is computed as width / aspectRatio.
   * Only applied when height is null. Same as FullCalendar aspectRatio. Default: null.
   */
  @Input() aspectRatio: number | null = null;

  get wrapHeightStyle(): string | null {
    if (this.height !== null) return typeof this.height === 'number' ? this.height + 'px' : this.height as string;
    if (this.aspectRatio !== null && this.wrapEl) {
      const w = this.wrapEl.nativeElement.clientWidth;
      return w > 0 ? Math.round(w / this.aspectRatio) + 'px' : null;
    }
    return null;
  }
  get bodyHeightStyle(): string | null {
    if (this.contentHeight === null) return null;
    return typeof this.contentHeight === 'number' ? this.contentHeight + 'px' : this.contentHeight as string;
  }

  // ===== PHASE 2c: RESOURCE AREA COLUMNS =====
  /**
   * Define multiple columns in the resource area.
   * Each column specifies a field to read from resource.extendedProps (or 'title').
   * When set, overrides resourceAreaHeaderContent and the default single-column layout.
   * Same as FullCalendar resourceAreaColumns. Default: null (single column).
   */
  @Input() resourceAreaColumns: ResourceAreaColumn[] | null = null;

  // ===== PHASE 3a: CONSTRAINTS =====
  /**
   * Limits the time range / days that events can be dragged/resized into.
   * 'businessHours' reuses the businessHours setting. Object form: { start?, end?, daysOfWeek? }.
   * Same as FullCalendar eventConstraint. Default: null (no constraint).
   */
  @Input() eventConstraint: ConstraintInput | null = null;
  /**
   * Limits the time range / days that drag-to-select is allowed.
   * 'businessHours' reuses the businessHours setting. Object form: { start?, end?, daysOfWeek? }.
   * Same as FullCalendar selectConstraint. Default: null (no constraint).
   */
  @Input() selectConstraint: ConstraintInput | null = null;

  // ===== PHASE 3b: EXTERNAL DRAG-DROP =====
  /**
   * When true, the grid rows accept HTML5 drag-and-drop from outside the calendar.
   * Same as FullCalendar droppable. Default: false.
   */
  @Input() droppable = false;

  // ===== PHASE 4c: TIMEZONE =====
  /**
   * IANA timezone string for displaying slot labels and event times (e.g. 'America/New_York', 'Asia/Tokyo').
   * Positioning remains based on the local JS Date; only display labels are affected.
   * Use 'local' (default) to keep the system timezone.
   * Same as FullCalendar timeZone (partial — display-only; full pipeline support is a future enhancement).
   */
  @Input() timeZone = 'local';
  /**
   * Override or extend built-in locale strings. Takes precedence over the resolved locale table.
   * e.g. [localeData]="{ buttonText: { today: 'Heute' }, moreLinkText: n => n + ' Mehr' }"
   * Same as FullCalendar's locale object format.
   */
  @Input() localeData: (Partial<Omit<DsLocale, 'buttonText' | 'moreLinkText'>> & { buttonText?: Partial<DsLocale['buttonText']>; moreLinkText?: (n: number) => string }) | null = null;

  private _i18nCache: { locale: string; override: typeof this.localeData; result: DsLocale } | null = null;
  /** Resolved locale strings — used throughout the template. */
  get i18n(): DsLocale {
    if (this._i18nCache &&
        this._i18nCache.locale === this.locale &&
        this._i18nCache.override === this.localeData) {
      return this._i18nCache.result;
    }
    const result = resolveLocale(this.locale, this.localeData ?? undefined);
    this._i18nCache = { locale: this.locale, override: this.localeData, result };
    return result;
  }

  // ===== OUTPUTS =====
  @Output() eventClick    = new EventEmitter<EventClickArg>();
  @Output() eventChange   = new EventEmitter<EventChangeArg>();
  /** Fired when an event is dragged to a new time/resource (FC: eventDrop). */
  @Output() eventDrop     = new EventEmitter<EventDropArg>();
  /** Fired when an event is resized (FC: eventResize). */
  @Output() eventResize   = new EventEmitter<EventResizeArg>();
  @Output() dateClick     = new EventEmitter<DateClickArg>();
  @Output() select        = new EventEmitter<SelectArg>();
  @Output() selecting     = new EventEmitter<SelectArg>();
  @Output() viewChange    = new EventEmitter<{ view: CalendarView; start: Date; end: Date }>();
  @Output() datesSet      = new EventEmitter<DatesSetArg>();
  @Output() resourceClick = new EventEmitter<ResourceClickArg>();
  /** Fired when the "+N more" chip is clicked (FC: moreLinkClick). */
  @Output() moreLinkClick = new EventEmitter<MoreLinkArg>();
  /** Fired when an external draggable is dropped onto the grid (FC: drop). */
  @Output() drop          = new EventEmitter<DropArg>();
  /** Fired when an external event JSON is received and added to the calendar (FC: eventReceive). */
  @Output() eventReceive  = new EventEmitter<EventReceiveArg>();

  // ===== STATE =====
  currentView: CalendarView = 'resourceTimelineDay';
  currentDate: Date = new Date();
  currentTitle = '';
  slots: Date[] = [];
  headerTier1: HeaderTier[] = [];
  slotWidth = 60;
  totalWidth = 0;
  flatResources: FlatResource[] = [];
  activeGroupFilter: string | null = null;
  selectedEventId: string | null = null;
  dragState: DragState | null = null;
  dragTargetResourceId: string | null = null;
  resizeState: ResizeState | null = null;
  nowVisible = false;
  nowLeft = 0;

  // external drop visual state
  externalDragOverResourceId: string | null = null;
  // Phase 4b: recurring events expansion cache
  private _expandedEventsCache: { eventsRef: CalendarEvent[]; vsMs: number; veMs: number; result: CalendarEvent[] } | null = null;

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
  private touchMoveListener!: (e: TouchEvent) => void;
  private touchEndListener!:  (e: TouchEvent) => void;
  private resizeListener!:    () => void;
  private resColTouchStartY = 0;
  private bodyHeight = 0;
  private longPressTimer: any = null;
  private longPressStartX = 0;
  private longPressStartY = 0;
  private longPressType: 'event' | 'select' | null = null;
  private longPressEvent: CalendarEvent | null = null;
  private longPressRes: FlatResource | null = null;
  private nowTimer: any;
  private prevEventsLength = 0;

  constructor(public svc: DsTimelineService, private cdr: ChangeDetectorRef) {}

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.currentView = this.views.length > 0 && !this.views.includes(this.initialView)
      ? this.views[0]
      : this.initialView;
    this.currentDate = this.initialDate ? new Date(this.initialDate) : new Date();
    this.flattenResources();
    this.buildTimeline();
    this.updateNow();
    if (this.showNowIndicator) {
      this.nowTimer = setInterval(() => { this.updateNow(); this.cdr.markForCheck(); }, 30000);
    }
    this.mouseMoveListener = (e: MouseEvent) => this.onGlobalMouseMove(e);
    this.mouseUpListener   = (e: MouseEvent) => this.onGlobalMouseUp(e);
    this.touchMoveListener = (e: TouchEvent) => this.onGlobalTouchMove(e);
    this.touchEndListener  = (e: TouchEvent) => this.onGlobalTouchEnd(e);
    this.resizeListener    = () => { this.measureBodyHeight(); this.buildTimeline(); this.cdr.markForCheck(); };
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup',   this.mouseUpListener);
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false });
    document.addEventListener('touchend',  this.touchEndListener);
    window.addEventListener('resize', this.resizeListener);
  }

  ngAfterViewInit() {
    // Re-build with actual container width now that the DOM is available
    this.measureBodyHeight();
    this.buildTimeline();
    this.cdr.markForCheck();
  }

  private measureBodyHeight() {
    const el = this.timelineEl?.nativeElement;
    if (el) this.bodyHeight = Math.max(0, el.clientHeight - this.headerHeight);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resources']) this.activeGroupFilter = null;
    if (changes['resources'] || changes['resourceOrder'] || changes['filterResourcesWithEvents']) this.flattenResources();
    if (changes['views'] && this.views?.length > 0 && !this.views.includes(this.currentView)) {
      this.currentView = this.views[0];
    }
    if (changes['initialView'] && !changes['initialView'].firstChange) this.currentView = this.initialView;
    if (changes['slotDuration'] || changes['slotMinWidth'] || changes['initialView'] || changes['resources'] ||
        changes['resourceOrder'] || changes['filterResourcesWithEvents'] ||
        changes['locale'] || changes['firstDay'] || changes['hiddenDays'] || changes['weekNumbers'] ||
        changes['timeZone'] || changes['localeData']) { this._i18nCache = null; this.buildTimeline(); }
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
    this.clearLongPress();
    document.removeEventListener('mousemove', this.mouseMoveListener);
    document.removeEventListener('mouseup',   this.mouseUpListener);
    document.removeEventListener('touchmove', this.touchMoveListener);
    document.removeEventListener('touchend',  this.touchEndListener);
    window.removeEventListener('resize', this.resizeListener);
  }

  // ===== VIEW LABEL =====
  viewLabel(v: CalendarView): string {
    if (v === 'resourceTimelineDay')   return this.i18n.buttonText.day;
    if (v === 'resourceTimelineMonth') return this.i18n.buttonText.month;
    return this.i18n.buttonText.week;
  }

  // ===== GROUP FILTER =====
  get resourceGroupOptions(): { value: string; label: string }[] {
    if (this.resourceGroupField) {
      const field = this.resourceGroupField;
      const seen = new Map<string, string>();
      for (const r of this.resources) {
        const rows = r.children?.length ? r.children : [r];
        for (const row of rows) {
          const key = String(row.extendedProps?.[field] ?? r.extendedProps?.[field] ?? '(ungrouped)');
          if (!seen.has(key)) seen.set(key, key);
        }
      }
      return [...seen.entries()].map(([v, l]) => ({ value: v, label: l }));
    }
    return this.resources
      .filter(r => r.children?.length)
      .map(r => ({ value: r.id, label: r.title }));
  }

  onGroupFilterChange(value: string) {
    this.activeGroupFilter = value || null;
    this.flattenResources();
    this.cdr.markForCheck();
  }

  /** Exposed for template binding — today's date for the Today button disabled check. */
  readonly today_date = new Date();

  // ===== VALID RANGE HELPERS =====
  isInValidRange(date: Date): boolean {
    if (!this.validRange) return true;
    const s = this.validRange.start ? new Date(this.validRange.start) : null;
    const e = this.validRange.end   ? new Date(this.validRange.end)   : null;
    if (s && date < s) return false;
    if (e && date > e) return false;
    return true;
  }

  /** Returns false when navigating in `dir` direction would exit the validRange. */
  canNavigate(dir: number): boolean {
    const d = new Date(this.currentDate);
    if (this.currentView === 'resourceTimelineDay')   d.setDate(d.getDate() + dir);
    if (this.currentView === 'resourceTimelineWeek')  d.setDate(d.getDate() + dir * 7);
    if (this.currentView === 'resourceTimelineMonth') d.setMonth(d.getMonth() + dir);
    return this.isInValidRange(d);
  }

  get currentDateInput(): string {
    const d = this.currentDate;
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  get dateInputMin(): string {
    return this.validRange?.start ? this.formatDateInput(new Date(this.validRange.start)) : '';
  }
  get dateInputMax(): string {
    return this.validRange?.end ? this.formatDateInput(new Date(this.validRange.end)) : '';
  }
  private formatDateInput(d: Date): string {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  goToDate(dateStr: string) {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    this.currentDate = this.clampToValidRange(d);
    this.buildTimeline();
  }

  private clampToValidRange(date: Date): Date {
    if (!this.validRange) return date;
    const s = this.validRange.start ? new Date(this.validRange.start) : null;
    const e = this.validRange.end   ? new Date(this.validRange.end)   : null;
    let d = new Date(date);
    if (s && d < s) d = new Date(s);
    if (e && d > e) d = new Date(e);
    return d;
  }

  // ===== NAVIGATION =====
  goToToday() { this.currentDate = this.clampToValidRange(new Date()); this.buildTimeline(); }

  navigate(dir: number) {
    const d = new Date(this.currentDate);
    if (this.currentView === 'resourceTimelineDay')   d.setDate(d.getDate() + dir);
    if (this.currentView === 'resourceTimelineWeek')  d.setDate(d.getDate() + dir * 7);
    if (this.currentView === 'resourceTimelineMonth') d.setMonth(d.getMonth() + dir);
    if (!this.isInValidRange(d)) return; // block navigation outside validRange
    this.currentDate = d; this.buildTimeline();
  }

  setView(view: CalendarView) {
    this.currentView = view; this.buildTimeline();
    this.viewChange.emit({ view, start: this.getViewStart(), end: this.getViewEnd() });
  }

  private _visViewStart: Date | null = null;
  private _visViewEnd: Date | null = null;

  buildTimeline(resetScroll = true) {
    const containerWidth = this.timelineEl?.nativeElement?.clientWidth || 0;
    const r = this.svc.buildTimeline({
      view: this.currentView, date: this.currentDate,
      slotDuration: this.slotDuration, slotMinWidth: this.slotMinWidth,
      containerWidth, slotMinTime: this.slotMinTime, slotMaxTime: this.slotMaxTime,
      locale: this.locale, firstDay: this.firstDay,
      hiddenDays: this.hiddenDays, weekNumbers: this.weekNumbers, timeZone: this.timeZone,
      weekText: this.i18n.weekText
    });
    this._expandedEventsCache = null; // invalidate on each navigation/rebuild
    this.slots = r.slots; this.headerTier1 = r.tier1;
    this.slotWidth = r.slotWidth; this.totalWidth = r.totalWidth; this.currentTitle = r.title;
    // compute visible slot range for accurate event positioning when hiddenDays is active
    if (this.slots.length > 0 && this.currentView !== 'resourceTimelineDay') {
      const first = this.slots[0], last = this.slots[this.slots.length - 1];
      this._visViewStart = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      this._visViewEnd   = new Date(last.getFullYear(),  last.getMonth(),  last.getDate() + 1);
    } else {
      this._visViewStart = null; this._visViewEnd = null;
    }
    this.updateNow(); this.cdr.markForCheck();
    this.datesSet.emit({ view: this.currentView, start: this.getViewStart(), end: this.getViewEnd(), title: this.currentTitle });
    // Auto-scroll: on navigation, respect scrollTimeReset; on first load always scroll
    if (this.scrollTime && (resetScroll || this.scrollTimeReset)) {
      setTimeout(() => { this.scrollToTime(this.scrollTime!); }, 0);
    }
  }

  // ===== RESOURCES =====
  flattenResources() {
    const prev = this.flatResources; // preserve expand state across rebuilds
    this.flatResources = [];

    // --- resourceGroupField: flat grouping by extendedProps field ---
    if (this.resourceGroupField) {
      const field = this.resourceGroupField;
      const groups = new Map<string, CalendarResource[]>();
      for (const r of this.resources) {
        // Support one level of children too
        const rows = (r.children && r.children.length) ? r.children : [r];
        for (const row of rows) {
          const key = String(row.extendedProps?.[field] ?? r.extendedProps?.[field] ?? '(ungrouped)');
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(row);
        }
      }
      for (const [groupValue, members] of groups) {
        // Synthetic group-label row — not a real resource
        this.flatResources.push({
          id: '__grplabel__' + groupValue,
          title: groupValue,
          level: 0,
          isGroup: false,
          expanded: true,
          isGroupLabel: true,
          groupLabelValue: groupValue,
          original: { id: '__grplabel__' + groupValue, title: groupValue }
        });
        for (const r of members) {
          this.flatResources.push({ id: r.id, title: r.title, level: 1, isGroup: false, expanded: true, extendedProps: r.extendedProps, original: r, groupLabelValue: groupValue });
        }
      }
      // Apply group filter for resourceGroupField mode
      if (this.activeGroupFilter !== null) {
        this.flatResources = this.flatResources.filter(r => r.groupLabelValue === this.activeGroupFilter);
      }
      return;
    }

    // --- Default: hierarchical children flattening ---
    const flatten = (list: CalendarResource[], level: number) => {
      for (const r of list) {
        const hasChildren = !!(r.children && r.children.length);
        const existing    = prev.find(f => f.id === r.id);
        const expanded    = existing ? existing.expanded : this.resourcesInitiallyExpanded;
        this.flatResources.push({ id: r.id, title: r.title, level, isGroup: hasChildren, expanded, children: r.children, extendedProps: r.extendedProps, original: r });
        if (hasChildren && expanded) flatten(r.children!, level + 1);
      }
    };
    flatten(this.resources, 0);

    // --- resourceOrder: sort by a field ('title', '-id', etc.) ---
    if (this.resourceOrder) {
      const key  = this.resourceOrder.startsWith('-') ? this.resourceOrder.slice(1) : this.resourceOrder;
      const desc = this.resourceOrder.startsWith('-');
      this.flatResources.sort((a, b) => {
        const va = (key === 'title' ? a.title : (a.extendedProps?.[key] ?? a.id)) ?? '';
        const vb = (key === 'title' ? b.title : (b.extendedProps?.[key] ?? b.id)) ?? '';
        const cmp = String(va).localeCompare(String(vb));
        return desc ? -cmp : cmp;
      });
    }

    // --- filterResourcesWithEvents: remove resources with no events ---
    if (this.filterResourcesWithEvents) {
      const eventIds = new Set(this.events.map(e => e.resourceId).filter(Boolean));
      this.flatResources = this.flatResources.filter(r => {
        if (r.isGroupLabel) return true; // keep group headers for now (pruned below)
        return eventIds.has(r.id);
      });
    }

    // --- Active group filter (hierarchical mode) ---
    if (this.activeGroupFilter !== null) {
      const group = this.resources.find(r => r.id === this.activeGroupFilter);
      if (group) {
        const keepIds = new Set([group.id, ...(group.children?.map(c => c.id) ?? [])]);
        this.flatResources = this.flatResources.filter(r => keepIds.has(r.id));
      }
    }
  }

  toggleResource(res: FlatResource) { res.expanded = !res.expanded; this.flattenResources(); this.cdr.markForCheck(); }

  // ===== EXPAND-ROWS: effective row height =====
  getEffectiveRowHeight(): number {
    if (!this.expandRows || this.bodyHeight <= 0 || this.flatResources.length === 0) return this.rowHeight;
    return Math.max(this.rowHeight, Math.floor(this.bodyHeight / this.flatResources.length));
  }

  // ===== SLOT LABEL INTERVAL =====
  /** Returns false when the slot should be silent (tick only, no label text). */
  showSlotLabel(slot: Date): boolean {
    if (!this.slotLabelInterval || this.currentView !== 'resourceTimelineDay') return true;
    const parts = this.slotLabelInterval.split(':').map(Number);
    const intervalMins = (parts[0] || 0) * 60 + (parts[1] || 0);
    if (intervalMins <= 0) return true;
    const slotMins = slot.getHours() * 60 + slot.getMinutes();
    return slotMins % intervalMins === 0;
  }

  // ===== EVENT MAX STACK =====
  /** Events to actually render (capped at eventMaxStack). */
  getVisibleEvents(resourceId: string): CalendarEvent[] {
    const all = this.getResourceEvents(resourceId);
    return (this.eventMaxStack !== null && this.eventMaxStack > 0) ? all.slice(0, this.eventMaxStack) : all;
  }
  /** Number of events hidden by eventMaxStack cap. */
  getHiddenEventsCount(resourceId: string): number {
    if (this.eventMaxStack === null) return 0;
    return Math.max(0, this.getResourceEvents(resourceId).length - this.eventMaxStack);
  }
  /** Top offset for the "+N more" chip, placed just below the last visible stacked event. */
  getMoreChipTop(resourceId: string): number {
    if (this.eventOverlap === 'single' && this.eventMaxStack !== null) {
      return this.getEventTop() + this.eventMaxStack * (this.eventHeight + 2);
    }
    return this.getEventTop() + this.eventHeight + 4;
  }

  // ===== PHASE 2b: MORE LINK CLICK =====
  onMoreChipClick(jsEvent: MouseEvent, res: FlatResource) {
    jsEvent.stopPropagation();
    const all = this.getResourceEvents(res.id);
    const hiddenEvents = all.slice(this.eventMaxStack ?? all.length);
    this.moreLinkClick.emit({ resource: res.original, hiddenEvents, jsEvent });
  }

  // ===== PHASE 2c: RESOURCE AREA COLUMNS =====
  getResColValue(res: FlatResource, col: ResourceAreaColumn): string {
    if (col.field === 'title') return res.title;
    return String(res.extendedProps?.[col.field] ?? '');
  }

  // ===== PHASE 3a: CONSTRAINT HELPER =====
  private withinConstraint(start: Date, end: Date, constraint: ConstraintInput): boolean {
    if (constraint === 'businessHours') {
      const bh = this.businessHours === true
        ? { startTime: '09:00:00', endTime: '17:00:00', daysOfWeek: [1,2,3,4,5] }
        : (this.businessHours || { startTime: '09:00:00', endTime: '17:00:00', daysOfWeek: [1,2,3,4,5] });
      if (typeof bh === 'boolean') return true;
      const bhObj = bh as { startTime: string; endTime: string; daysOfWeek?: number[] };
      const dow = bhObj.daysOfWeek ?? [1,2,3,4,5];
      if (!dow.includes(start.getDay())) return false;
      const cStartMs = this.svc.parseTimeMs(bhObj.startTime || '09:00:00');
      const cEndMs   = this.svc.parseTimeMs(bhObj.endTime   || '17:00:00');
      const sMs = (start.getHours() * 3600 + start.getMinutes() * 60) * 1000;
      const eMs = (end.getHours()   * 3600 + end.getMinutes()   * 60) * 1000;
      return sMs >= cStartMs && eMs <= cEndMs;
    }
    const c = constraint as { start?: string; end?: string; daysOfWeek?: number[] };
    if (c.daysOfWeek && !c.daysOfWeek.includes(start.getDay())) return false;
    if (c.start && start < new Date(c.start)) return false;
    if (c.end   && end   > new Date(c.end))   return false;
    return true;
  }

  // ===== PHASE 3b: EXTERNAL DRAG-DROP =====
  onGridDragOver(e: DragEvent, res: FlatResource) {
    if (!this.droppable || res.isGroup || res.isGroupLabel) return;
    e.preventDefault();
    if (this.externalDragOverResourceId !== res.id) {
      this.externalDragOverResourceId = res.id;
      this.cdr.markForCheck();
    }
  }

  onGridDragLeave(_e: DragEvent) {
    if (!this.droppable) return;
    this.externalDragOverResourceId = null;
    this.cdr.markForCheck();
  }

  onGridDrop(e: DragEvent, res: FlatResource) {
    if (!this.droppable || res.isGroup || res.isGroupLabel) return;
    e.preventDefault();
    this.externalDragOverResourceId = null;
    const x    = this.gridXFromClient(e.clientX);
    const date = this.dateFromX(x);
    this.drop.emit({ date, resource: res.original, jsEvent: e });
    const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain') || '';
    if (raw) {
      try {
        const evtData = JSON.parse(raw) as CalendarEvent;
        if (evtData && evtData.id && evtData.title) {
          const newEvt: CalendarEvent = { ...evtData, start: date, resourceId: res.id };
          this.events = this.events.concat([newEvt]);
          const revert = () => { this.events = this.events.filter(ev => ev.id !== newEvt.id); this.cdr.markForCheck(); };
          this.eventReceive.emit({ event: newEvt, revert });
        }
      } catch { /* not JSON — ignore */ }
    }
    this.cdr.markForCheck();
  }

  // ===== BUSINESS HOURS =====
  /** Returns true when a slot falls inside business hours (used for CSS shading). */
  isBusinessHour(slot: Date): boolean {
    if (!this.businessHours) return false;
    const bh = this.businessHours === true
      ? { startTime: '09:00:00', endTime: '17:00:00', daysOfWeek: [1,2,3,4,5] }
      : this.businessHours as { startTime: string; endTime: string; daysOfWeek?: number[] };
    const dow = bh.daysOfWeek ?? [1,2,3,4,5];
    if (!dow.includes(slot.getDay())) return false;
    const slotMs  = (slot.getHours() * 3600 + slot.getMinutes() * 60) * 1000;
    const startMs = this.svc.parseTimeMs(bh.startTime || '09:00:00');
    const endMs   = this.svc.parseTimeMs(bh.endTime   || '17:00:00');
    return slotMs >= startMs && slotMs < endMs;
  }

  /** True when the slot is OUTSIDE business hours (shade it). */
  isNonBusinessHour(slot: Date): boolean {
    if (!this.businessHours) return false;
    return !this.isBusinessHour(slot);
  }

  // ===== PHASE 4b: RECURRING EVENTS CACHE =====
  private getExpandedEvents(): CalendarEvent[] {
    const vs = this.getViewStart().getTime();
    const ve = this.getViewEnd().getTime();
    if (this._expandedEventsCache &&
        this._expandedEventsCache.eventsRef === this.events &&
        this._expandedEventsCache.vsMs === vs &&
        this._expandedEventsCache.veMs === ve) {
      return this._expandedEventsCache.result;
    }
    const result = this.svc.expandRecurringEvents(this.events, new Date(vs), new Date(ve));
    this._expandedEventsCache = { eventsRef: this.events, vsMs: vs, veMs: ve, result };
    return result;
  }

  // ===== EVENTS =====
  getResourceEvents(resourceId: string): CalendarEvent[] {
    const vs = this.getViewStart().getTime();
    const ve = this.getViewEnd().getTime();
    return this.getExpandedEvents().filter(e => {
      // must belong to this resource
      const inResource = e.resourceId === resourceId || (e.resourceIds && e.resourceIds.indexOf(resourceId) > -1);
      if (!inResource) return false;
      // must overlap the current view range (start < viewEnd AND end > viewStart)
      const es = new Date(e.start).getTime();
      const ee = e.end ? new Date(e.end).getTime() : (e.allDay ? es + 86400000 : es + 3600000);
      return es < ve && ee > vs;
    });
  }

  getEventLeft(evt: CalendarEvent): number {
    // Phase 4a: allDay events in day view always start at position 0
    if (evt.allDay && this.currentView === 'resourceTimelineDay') return 0;
    const vs = this.getViewStart(), ve = this.getViewEnd(), t = ve.getTime() - vs.getTime();
    if (t <= 0) return 0;
    // Phase 4a: allDay events in week/month view are pinned to start of their day
    let start = new Date(evt.start);
    if (evt.allDay) start = this.svc.startOfDay(start);
    return (Math.max(0, start.getTime() - vs.getTime()) / t) * this.totalWidth;
  }

  getEventWidth(evt: CalendarEvent): number {
    // Phase 4a: allDay events in day view span the entire view width
    if (evt.allDay && this.currentView === 'resourceTimelineDay') return this.totalWidth;
    const vs = this.getViewStart(), ve = this.getViewEnd();
    let es = new Date(evt.start);
    let ee = evt.end ? new Date(evt.end) : new Date(es.getTime() + 3600000);
    if (evt.allDay) {
      // Phase 4a: allDay in week/month — snap to day boundaries
      es = this.svc.startOfDay(es);
      ee = this.svc.startOfDay(new Date(ee));
      if (ee.getTime() <= es.getTime()) ee = new Date(es.getTime() + 86400000);
    }
    const t = ve.getTime() - vs.getTime();
    if (t <= 0) return 4;
    const clampedEnd   = Math.min(ee.getTime(), ve.getTime());
    const clampedStart = Math.max(es.getTime(), vs.getTime());
    return Math.max(4, (clampedEnd - clampedStart) / t * this.totalWidth);
  }

  getEventTop(): number { return Math.floor((this.rowHeight - this.eventHeight) / 2); }

  /**
   * In 'single' mode: stack overlapping events vertically (each gets narrower height).
   * In 'multiple' mode: all events sit at the same top (they visually overlap).
   * Phase 4a: allDay events in day view stack in their own band at the top of the row.
   */
  getEventTopStacked(evt: CalendarEvent, resourceId: string, eventIndex: number): number {
    if (evt.allDay && this.currentView === 'resourceTimelineDay') {
      // Stack allDay events from the top (each in its own lane)
      const allDayEvts = this.getResourceEvents(resourceId).filter(e => !!e.allDay);
      const lane = allDayEvts.findIndex(e => e.id === evt.id);
      return Math.max(0, lane) * (this.eventHeight + 2) + 2;
    }
    if (this.eventOverlap === 'multiple') return this.getEventTop();
    const siblings = this.getResourceEvents(resourceId);
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

  /** True for display modes that render as full-row background (background / inverse-background). */
  isBgDisplay(evt: CalendarEvent): boolean {
    return evt.display === 'background' || evt.display === 'inverse-background';
  }

  /** Resolves effective background color: event > resource default > global default. */
  getEventBgColor(evt: CalendarEvent, res: FlatResource): string {
    return evt.color || evt.backgroundColor || res.original?.eventBackgroundColor || this.defaultEventColor;
  }

  // ===== SELECTION BOX HELPERS =====
  private dateToX(date: Date): number {
    const vs = this.getViewStart(), ve = this.getViewEnd();
    const t = ve.getTime() - vs.getTime();
    if (t <= 0) return 0;
    return Math.max(0, Math.min(this.totalWidth, (date.getTime() - vs.getTime()) / t * this.totalWidth));
  }

  getSelLeft(): number {
    if (!this.selState) return 0;
    if (this.selectSnap === 'slot') {
      const [s] = this.normalizedSel();
      return this.dateToX(s);
    }
    return Math.min(this.selState.startX, this.selState.currentX);
  }
  getSelWidth(): number {
    if (!this.selState) return 0;
    if (this.selectSnap === 'slot') {
      const [s, e] = this.normalizedSel();
      return Math.max(2, this.dateToX(e) - this.dateToX(s));
    }
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
    const el = e.currentTarget as HTMLElement;
    this.eventClick.emit({ event: evt, el, jsEvent: e });
    // Open url unless the event listener called preventDefault()
    if (evt.url && !e.defaultPrevented) {
      window.open(evt.url, '_blank', 'noopener');
    }
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
    this.collectGroupForDrag(evt);
    this.dragTargetResourceId = evt.resourceId || null;
    this.cdr.markForCheck();
  }

  /** Collects group members into dragState when groupDrag is enabled. */
  private collectGroupForDrag(evt: CalendarEvent) {
    if (!this.dragState || !this.groupDrag || !evt.groupId) return;
    const members = this.events.filter(e => e.groupId === evt.groupId && e.id !== evt.id);
    this.dragState.groupEventIds  = members.map(e => e.id);
    this.dragState.groupOriginals = new Map(members.map(e => [e.id, this.clone(e)]));
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

  // ===== LONG-PRESS HELPERS =====
  private clearLongPress() {
    if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
    this.longPressType = null;
    this.longPressEvent = null;
    this.longPressRes = null;
  }

  // ===== TOUCH HANDLERS =====
  onEventTouchStart(e: TouchEvent, evt: CalendarEvent) {
    if (!this.editable || evt.editable === false || evt.startEditable === false) return;
    if (this.isBlocked(evt, evt.resourceId || '')) return;
    const t = e.touches[0]; if (!t) return;
    e.stopPropagation(); // prevent grid's onGridTouchStart from firing
    this.clearLongPress();
    this.longPressStartX = t.clientX;
    this.longPressStartY = t.clientY;
    this.longPressType   = 'event';
    this.longPressEvent  = evt;
    this.longPressTimer  = setTimeout(() => {
      this.longPressTimer = null;
      this.hoverTooltip   = null;
      this.dragState = {
        eventId: evt.id,
        originalEvent: this.clone(evt),
        startX: this.longPressStartX,
        startY: this.longPressStartY,
        sourceResourceId: evt.resourceId || ''
      };
      this.collectGroupForDrag(evt);
      this.dragTargetResourceId = evt.resourceId || null;
      if ('vibrate' in navigator) (navigator as any).vibrate(30);
      this.cdr.markForCheck();
    }, 300);
  }

  onResizeTouchStart(e: TouchEvent, evt: CalendarEvent, handle: 'start' | 'end') {
    if (!this.editable || evt.editable === false) return;
    if (this.isBlocked(evt, evt.resourceId || '')) return;
    if (handle === 'end'   && evt.durationEditable === false) return;
    if (handle === 'start' && evt.startEditable    === false) return;
    const t = e.touches[0]; if (!t) return;
    e.preventDefault(); e.stopPropagation();
    this.hoverTooltip = null;
    this.resizeState = { eventId: evt.id, handle, originalEvent: this.clone(evt), startX: t.clientX };
    this.cdr.markForCheck();
  }

  onGridTouchStart(e: TouchEvent, res: FlatResource) {
    if ((e.target as HTMLElement).closest('.ntc-evt'))    return;
    if ((e.target as HTMLElement).closest('.ntc-resize')) return;
    if (!this.selectable || res.isGroup) return;
    const t = e.touches[0]; if (!t) return;
    this.clearLongPress();
    this.longPressStartX = t.clientX;
    this.longPressStartY = t.clientY;
    this.longPressType   = 'select';
    this.longPressRes    = res;
    this.longPressTimer  = setTimeout(() => {
      this.longPressTimer = null;
      const x    = this.gridXFromClient(this.longPressStartX);
      const date = this.dateFromX(x);
      this.isSelecting    = true;
      this.selMoved       = false;
      this.selResource    = this.longPressRes!;
      this.selState       = { resourceId: res.id, startX: x, currentX: x, startDate: date, endDate: date };
      this.tooltipVisible = false;
      if ('vibrate' in navigator) (navigator as any).vibrate(30);
      this.cdr.markForCheck();
    }, 300);
  }

  onResColTouchStart(e: TouchEvent) {
    this.resColTouchStartY = e.touches[0]?.clientY || 0;
  }

  onResColTouchMove(e: TouchEvent) {
    e.preventDefault();
    const t = e.touches[0]; if (!t) return;
    const dy = this.resColTouchStartY - t.clientY;
    this.resColTouchStartY = t.clientY;
    if (this.timelineEl) this.timelineEl.nativeElement.scrollTop += dy;
  }

  // ===== GLOBAL MOUSE MOVE =====
  private onGlobalMouseMove(e: MouseEvent) { this.handlePointerMove(e.clientX, e.clientY); }

  private onGlobalTouchMove(e: TouchEvent) {
    const t = e.touches[0]; if (!t) return;
    // If a long-press is pending and the finger moved more than 8px, cancel it
    // so the browser can handle the scroll gesture normally.
    if (this.longPressTimer) {
      const dx = Math.abs(t.clientX - this.longPressStartX);
      const dy = Math.abs(t.clientY - this.longPressStartY);
      if (dx > 8 || dy > 8) { this.clearLongPress(); }
    }
    if (this.dragState || this.resizeState || (this.isSelecting && this.selMoved)) {
      e.preventDefault();
    }
    this.handlePointerMove(t.clientX, t.clientY);
  }

  private handlePointerMove(clientX: number, clientY: number) {
    const viewStart = this.getViewStart();
    const viewEnd   = this.getViewEnd();
    const totalMs   = viewEnd.getTime() - viewStart.getTime();

    // --- drag-to-select ---
    if (this.isSelecting && this.selState) {
      const x = Math.max(0, Math.min(this.totalWidth, this.gridXFromClient(clientX)));
      const date = this.dateFromX(x);
      const moved = Math.abs(x - this.selState.startX) > 3;
      if (moved) {
        this.selMoved = true;
        this.autoScrollOnDrag(clientX);
        this.selState = Object.assign({}, this.selState, { currentX: x, endDate: date });
        const el = this.timelineEl?.nativeElement;
        if (el) {
          const midX = (Math.min(this.selState.startX, x) + Math.max(this.selState.startX, x)) / 2;
          this.tooltipX = midX - el.scrollLeft + (this.resourceAreaWidthPx);
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
      const dx  = clientX - this.dragState.startX;
      const deltaMs = dx * msPerPx;
      const idx = this.findIdx(this.dragState.eventId);

      const canChangeResource = this.allowResourceDrag && this.dragState.originalEvent.resourceEditable !== false;
      if (canChangeResource) {
        const targetRes = this.resourceAtClientY(clientY);
        this.dragTargetResourceId = targetRes ? targetRes.id : this.dragState.sourceResourceId;
      }

      if (idx > -1) {
        const orig = this.dragState.originalEvent;
        const os  = new Date(orig.start).getTime();
        const dur = (orig.end ? new Date(orig.end).getTime() : os + 3600000) - os;

        let newStartMs = os + deltaMs;
        newStartMs = Math.max(viewStart.getTime(), newStartMs);
        newStartMs = Math.min(viewEnd.getTime() - dur, newStartMs);

        const targetResourceId = canChangeResource
          ? (this.dragTargetResourceId || this.dragState.sourceResourceId)
          : this.dragState.sourceResourceId;

        if (this.eventOverlap === 'single') {
          const newStart = new Date(newStartMs);
          const newEnd   = new Date(newStartMs + dur);
          const siblings = this.getResourceEvents(targetResourceId).filter(ev => ev.id !== this.dragState!.eventId);
          const wouldOverlap = siblings.some(sib => {
            const ss = new Date(sib.start).getTime();
            const se = sib.end ? new Date(sib.end).getTime() : ss + 3600000;
            return ss < newEnd.getTime() && se > newStart.getTime();
          });
          if (wouldOverlap) { this.cdr.markForCheck(); return; }
        }

        if (this.eventConstraint) {
          const ns2 = new Date(newStartMs);
          if (!this.withinConstraint(ns2, new Date(newStartMs + dur), this.eventConstraint)) { this.cdr.markForCheck(); return; }
        }

        const ns = new Date(newStartMs);
        this.events = this.events.slice();
        this.events[idx] = Object.assign({}, this.events[idx], {
          start: ns,
          end: new Date(ns.getTime() + dur),
          resourceId: targetResourceId
        });

        // Move group members by the same deltaMs
        if (this.dragState.groupEventIds?.length) {
          for (const gid of this.dragState.groupEventIds) {
            const gi = this.events.findIndex(e => e.id === gid);
            if (gi < 0) continue;
            const gorig = this.dragState.groupOriginals!.get(gid)!;
            const gos  = new Date(gorig.start).getTime();
            const gdur = (gorig.end ? new Date(gorig.end).getTime() : gos + 3600000) - gos;
            const gnew = Math.max(viewStart.getTime(), Math.min(viewEnd.getTime() - gdur, gos + deltaMs));
            this.events[gi] = Object.assign({}, this.events[gi], {
              start: new Date(gnew),
              end:   new Date(gnew + gdur)
            });
          }
        }

        this.cdr.markForCheck();
      }
    }

    // --- resize (clamped to view boundaries) ---
    if (this.resizeState) {
      const dx = clientX - this.resizeState.startX;
      const deltaMs = dx * msPerPx;
      const idx = this.findIdx(this.resizeState.eventId);
      if (idx > -1) {
        const orig = this.resizeState.originalEvent;
        const os = new Date(orig.start).getTime();
        const oe = orig.end ? new Date(orig.end).getTime() : os + 3600000;
        this.events = this.events.slice();
        if (this.resizeState.handle === 'end') {
          const ne = Math.min(viewEnd.getTime(), oe + deltaMs);
          if (ne - os >= 900000) {
            if (!this.eventConstraint || this.withinConstraint(new Date(os), new Date(ne), this.eventConstraint)) {
              this.events[idx] = Object.assign({}, this.events[idx], { end: new Date(ne) });
            }
          }
        } else {
          const ns = Math.max(viewStart.getTime(), os + deltaMs);
          if (oe - ns >= 900000) {
            if (!this.eventConstraint || this.withinConstraint(new Date(ns), new Date(oe), this.eventConstraint)) {
              this.events[idx] = Object.assign({}, this.events[idx], { start: new Date(ns) });
            }
          }
        }
        this.cdr.markForCheck();
      }
    }
  }

  // ===== GLOBAL MOUSE UP =====
  private onGlobalMouseUp(e: MouseEvent) { this.handlePointerUp(e.clientX, e.clientY, e); }

  private onGlobalTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    // Finger lifted before long-press fired → cancel pending timer; the
    // browser will emit a click event naturally (e.g. to open the event).
    if (this.longPressTimer) { this.clearLongPress(); return; }
    this.handlePointerUp(t?.clientX || 0, t?.clientY || 0, null);
  }

  private handlePointerUp(clientX: number, clientY: number, jsEvent: MouseEvent | null) {
    if (this.isSelecting) {
      const moved = this.selMoved, state = this.selState, resource = this.selResource?.original;
      this.isSelecting = false; this.selMoved = false;
      this.tooltipVisible = false; this.selState = null; this.selResource = null;
      if (moved && state) {
        const [s, en] = this.normalizedSelFrom(state);
        if (en.getTime() - s.getTime() >= this.selectMinDuration) {
          if (!this.selectConstraint || this.withinConstraint(s, en, this.selectConstraint)) {
            this.select.emit({ start: s, end: en, resource });
          }
        }
      } else if (!moved && state && jsEvent) {
        this.dateClick.emit({ date: state.startDate, resource, jsEvent });
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
          const groupOriginals = this.dragState?.groupOriginals ? new Map(this.dragState.groupOriginals) : null;
          const revert = () => {
            this.events = this.events.slice();
            this.events[ci] = oldEvt;
            // also revert group members
            if (groupOriginals) {
              for (const [gid, gorig] of groupOriginals) {
                const gi = this.events.findIndex(e => e.id === gid);
                if (gi > -1) this.events[gi] = gorig;
              }
            }
            this.cdr.markForCheck();
          };
          this.eventChange.emit({ event: newEvt, oldEvent: oldEvt, revert });
          // Also emit specific eventDrop (FC parity)
          const oldRes = oldEvt.resourceId ? this.flatResources.find(r => r.id === oldEvt.resourceId)?.original : undefined;
          const newRes = newEvt.resourceId ? this.flatResources.find(r => r.id === newEvt.resourceId)?.original : undefined;
          this.eventDrop.emit({ event: newEvt, oldEvent: oldEvt, oldResource: oldRes, newResource: newRes, revert });
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
        const revert = () => { this.events = this.events.slice(); this.events[ci] = oldEvt; this.cdr.markForCheck(); };
        this.eventChange.emit({ event: this.events[idx], oldEvent: oldEvt, revert });
        // Also emit specific eventResize (FC parity)
        this.eventResize.emit({ event: this.events[idx], oldEvent: oldEvt, revert });
      }
      this.resizeState = null; this.cdr.markForCheck();
    }
  }

  // ===== COORDINATE UTILS =====
  private gridXFromClient(clientX: number): number {
    const el = this.timelineEl?.nativeElement;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(this.totalWidth, clientX - rect.left + el.scrollLeft));
  }

  private gridX(e: MouseEvent): number { return this.gridXFromClient(e.clientX); }

  private dateFromX(x: number): Date {
    const s  = this.getViewStart();
    const en = this.getViewEnd();
    const totalMs = en.getTime() - s.getTime();
    if (x >= this.totalWidth) return new Date(en);
    if (x <= 0)               return new Date(s);
    const rawMs = (x / this.totalWidth) * totalMs;
    if (this.selectSnap === 'free') {
      return new Date(s.getTime() + Math.min(rawMs, totalMs));
    }
    if (this.currentView === 'resourceTimelineDay') {
      const slotMs  = this.svc.slotMs(this.slotDuration);
      const snapped = Math.round(rawMs / slotMs) * slotMs;
      return new Date(s.getTime() + Math.min(snapped, totalMs));
    }
    const dayMs   = 86400000;
    const snapped = Math.round(rawMs / dayMs) * dayMs;
    return new Date(s.getTime() + Math.min(snapped, totalMs));
  }

  // Map a clientY position to whichever FlatResource row the cursor is over
  private resourceAtClientY(clientY: number): FlatResource | null {
    const el = this.timelineEl?.nativeElement;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const yInGrid = clientY - rect.top - this.headerHeight + el.scrollTop;
    if (yInGrid < 0) return null;
    const rowIdx = Math.floor(yInGrid / this.rowHeight);
    const res = this.flatResources[rowIdx];
    if (!res || res.isGroup) return null;
    return res;
  }

  private resourceAtY(e: MouseEvent): FlatResource | null { return this.resourceAtClientY(e.clientY); }

  // Auto-scroll timeline when dragging near edges
  private autoScrollOnDrag(clientX: number): void {
    const el = this.timelineEl?.nativeElement;
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const zone  = 60;
    const speed = 12;
    const dRight = rect.right - clientX;
    const dLeft  = clientX   - rect.left;
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
  getViewStart() { return this._visViewStart ?? this.svc.getViewStart(this.currentView, this.currentDate, this.slotMinTime, this.firstDay); }
  getViewEnd()   { return this._visViewEnd   ?? this.svc.getViewEnd(this.currentView, this.currentDate, this.slotMaxTime, this.firstDay); }

  // ===== FORMAT =====
  formatEventTime(evt: CalendarEvent): string {
    const s = new Date(evt.start), e = evt.end ? new Date(evt.end) : null;
    // Phase 4c: use Intl for timezone-aware display
    if (this.timeZone && this.timeZone !== 'local') {
      try {
        const intlFmt = new Intl.DateTimeFormat(this.locale, {
          timeZone: this.timeZone,
          hour: 'numeric', minute: 'numeric', hour12: this.timeFormat === '12h'
        });
        return e ? intlFmt.format(s) + ' \u2013 ' + intlFmt.format(e) : intlFmt.format(s);
      } catch { /* fall through */ }
    }
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
  scrollToTime(t: string) {
    if (!this.timelineEl) return;
    const [h, m] = (t || '00:00').split(':').map(Number);
    const targetMs = (h * 60 + m) * 60000;
    if (this.currentView === 'resourceTimelineDay') {
      const minMs   = this.svc.parseTimeMs(this.slotMinTime);
      const maxMs   = this.svc.parseTimeMs(this.slotMaxTime);
      const rangeMs = Math.max(1, maxMs - minMs);
      const offset  = Math.max(0, targetMs - minMs);
      this.timelineEl.nativeElement.scrollLeft = (offset / rangeMs) * this.totalWidth;
    } else {
      this.timelineEl.nativeElement.scrollLeft = (targetMs / 86400000) * this.totalWidth;
    }
  }
  refetchEvents()                     { this.cdr.markForCheck(); }
}
