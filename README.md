# ngx-timeline-calendar

An Angular resource-timeline calendar component inspired by FullCalendar's Timeline view. Supports drag-and-drop, resize, drag-to-select, nested resources, overlap modes, theming, and more — compatible with **Angular 6 through 20+**.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Module Setup](#module-setup)
- [Basic Usage](#basic-usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Data Types](#data-types)
  - [CalendarEvent](#calendarevent)
  - [CalendarResource](#calendarresource)
  - [CalendarView](#calendarview)
  - [SlotDuration](#slotduration)
  - [Output Argument Types](#output-argument-types)
- [Public API Methods](#public-api-methods)
- [Resize Controls](#resize-controls)
- [Overlap Modes](#overlap-modes)
- [Theming](#theming)
- [Demo App](#demo-app)

---

## Features

- **3 built-in views** — Day, Week, Month (resource-timeline layout)
- **Drag and drop** — move events in time and across resource rows
- **Resize** — drag start or end edge to change event duration; per-event control via `editable`, `startEditable`, `durationEditable`
- **Drag-to-select** — click and drag on empty grid cells to create new events
- **Nested resources** — multi-level resource hierarchy with expand/collapse
- **Overlap modes** — `multiple` (free overlap) or `single` (one event per slot, conflicts shown with red hatch)
- **Now indicator** — live red line showing the current time (updates every 30 s)
- **Hover tooltips** — rich event detail tooltip on mouse hover
- **Light / Dark themes** — full CSS variable theming
- **12h / 24h time format** — configurable header and event labels
- **OnPush change detection** — optimized for performance
- **Zero external dependencies** — pure Angular, no third-party libraries required

---

## Installation

```bash
npm install ngx-timeline-calendar
```

---

## Module Setup

Import `NgxTimelineCalendarModule` into your Angular module:

```typescript
import { NgModule } from '@angular/core';
import { NgxTimelineCalendarModule } from 'ngx-timeline-calendar';

@NgModule({
  imports: [
    NgxTimelineCalendarModule
  ]
})
export class AppModule {}
```

---

## Basic Usage

```html
<ngx-timeline-calendar
  [events]="events"
  [resources]="resources"
  (eventClick)="onEventClick($event)"
  (eventChange)="onEventChange($event)"
  (select)="onSelect($event)">
</ngx-timeline-calendar>
```

```typescript
import { Component } from '@angular/core';
import { CalendarEvent, CalendarResource } from 'ngx-timeline-calendar';

@Component({ ... })
export class AppComponent {

  resources: CalendarResource[] = [
    { id: 'alice', title: 'Alice' },
    { id: 'bob',   title: 'Bob' }
  ];

  events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Standup',
      start: new Date(2026, 1, 19, 9, 0),
      end:   new Date(2026, 1, 19, 10, 0),
      resourceId: 'alice',
      color: '#3d91ff'
    }
  ];

  onEventClick(arg: any)   { console.log('clicked', arg.event); }
  onEventChange(arg: any)  { console.log('moved/resized', arg.event); }
  onSelect(arg: any)       { console.log('selected', arg.start, arg.end); }
}
```

---

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `events` | `CalendarEvent[]` | `[]` | Array of events to display. |
| `resources` | `CalendarResource[]` | `[]` | Array of resources (rows). Supports nested children for grouping. |
| `initialView` | `CalendarView` | `'resourceTimelineWeek'` | The view to display on first render. |
| `initialDate` | `Date \| null` | `null` | The date the calendar starts on. Defaults to today. |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme. |
| `slotMinWidth` | `number` | `60` | Minimum width in pixels of each time slot column. |
| `slotDuration` | `SlotDuration` | `'01:00:00'` | Duration of each time slot. Affects Day view granularity. |
| `timeFormat` | `'12h' \| '24h'` | `'12h'` | Time label format in headers and event times. |
| `resourceAreaWidth` | `number` | `200` | Width in pixels of the left resource column. |
| `resourceAreaHeaderContent` | `string` | `'Resources'` | Label shown at the top of the resource column. |
| `headerHeight` | `number` | `52` | Height in pixels of the sticky timeline header. |
| `rowHeight` | `number` | `40` | Height in pixels of each resource row. |
| `eventHeight` | `number` | `28` | Height in pixels of rendered event bars. |
| `showToolbar` | `boolean` | `true` | Show or hide the top toolbar (navigation + view switcher). |
| `showViewSwitcher` | `boolean` | `true` | Show or hide the Day / Week / Month buttons inside the toolbar. |
| `showNowIndicator` | `boolean` | `true` | Show the red vertical line indicating the current time. |
| `selectable` | `boolean` | `true` | Enable drag-to-select on empty grid cells. |
| `selectMinDuration` | `number` | `900000` | Minimum selection duration in milliseconds before a `select` event fires. Default is 15 minutes (900 000 ms). |
| `editable` | `boolean` | `true` | Master switch for drag and resize. When `false`, no events can be moved or resized. |
| `defaultEventColor` | `string` | `'#3d91ff'` | Fallback background color for events with no `color` property. |
| `showEventTooltip` | `boolean` | `true` | Show a rich hover tooltip when the mouse rests on an event. |
| `tooltipDelay` | `number` | `300` | Delay in milliseconds before the hover tooltip appears. |
| `eventOverlap` | `'multiple' \| 'single'` | `'multiple'` | Overlap mode. See [Overlap Modes](#overlap-modes). |
| `allowResourceDrag` | `boolean` | `true` | When `true`, dragging an event vertically moves it to a different resource row. When `false`, drag is horizontal-only. |

---

## Outputs

| Output | Payload | When it fires |
|---|---|---|
| `eventClick` | `EventClickArg` | User clicks an event bar. |
| `eventChange` | `EventChangeArg` | An event was moved or resized and the mouse was released. |
| `dateClick` | `DateClickArg` | User clicks an empty grid cell (without dragging). |
| `select` | `SelectArg` | User finishes a drag-to-select gesture (mouseup). |
| `selecting` | `SelectArg` | Fires continuously while the user is drag-selecting. |
| `viewChange` | `{ view, start, end }` | User switches between Day / Week / Month views. |
| `datesSet` | `DatesSetArg` | Fires on initial render and whenever the visible date range changes. |

---

## Data Types

### CalendarEvent

```typescript
interface CalendarEvent {
  id: string;                              // Unique identifier
  title: string;                           // Display label on the event bar
  start: Date | string;                   // Start date/time
  end?: Date | string;                    // End date/time (defaults to start + 1 hour)
  resourceId?: string;                    // Assign to a single resource row
  resourceIds?: string[];                 // Assign to multiple resource rows
  color?: string;                         // Background and border color (hex)
  backgroundColor?: string;               // Override background color only
  borderColor?: string;                   // Override border color only
  textColor?: string;                     // Override text color only
  editable?: boolean;                     // false → cannot be dragged or resized
  startEditable?: boolean;                // false → start-edge resize handle hidden
  durationEditable?: boolean;             // false → end-edge resize handle hidden
  allDay?: boolean;                       // Mark as an all-day event
  overlap?: boolean;                      // Single-mode overlap hint
  groupId?: string;                       // Logical group identifier
  classNames?: string[];                  // Extra CSS classes on the event element
  extendedProps?: { [key: string]: any }; // Custom metadata (e.g. description, priority)
}
```

**Per-event editability quick reference:**

| Flag on event | Drag | Start handle | End handle |
|---|:---:|:---:|:---:|
| *(defaults — all enabled)* | yes | shown | shown |
| `editable: false` | no | hidden | hidden |
| `startEditable: false` | no | hidden | shown |
| `durationEditable: false` | yes | shown | hidden |
| `startEditable: false` + `durationEditable: false` | no | hidden | hidden |

> The global `[editable]` input is a master switch. If it is `false`, all per-event flags are overridden and nothing can be edited.

---

### CalendarResource

```typescript
interface CalendarResource {
  id: string;                              // Unique identifier
  title: string;                           // Display name in the resource column
  children?: CalendarResource[];          // Nested child resources (creates a collapsible group)
  eventColor?: string;                    // Default event color for events on this resource
  extendedProps?: { [key: string]: any }; // Custom metadata (e.g. subtitle, capacity)
}
```

**Nested resource example:**

```typescript
const resources: CalendarResource[] = [
  {
    id: 'engineering',
    title: 'Engineering',
    extendedProps: { subtitle: '18 engineers' },
    children: [
      { id: 'frontend', title: 'Frontend Team' },
      { id: 'backend',  title: 'Backend Team' },
      { id: 'devops',   title: 'DevOps / Infra' }
    ]
  },
  { id: 'room-a', title: 'Room A', extendedProps: { subtitle: 'Cap: 8' } }
];
```

Groups are expanded by default. Users can click the arrow button to collapse/expand them.

`extendedProps.subtitle` is rendered as a secondary line below the resource name in the resource column.

---

### CalendarView

```typescript
type CalendarView =
  | 'resourceTimelineDay'    // Single day; columns are time slots
  | 'resourceTimelineWeek'   // 7-day week (Sun–Sat); columns are days
  | 'resourceTimelineMonth'; // Full calendar month; columns are days
```

---

### SlotDuration

Controls the granularity of time slot columns in the **Day view**:

```typescript
type SlotDuration =
  | '00:15:00'    // 15-minute slots
  | '00:30:00'    // 30-minute slots
  | '01:00:00'    // 1-hour slots (default)
  | '06:00:00'    // 6-hour slots
  | '1.00:00:00'; // 1-day slot
```

> `slotDuration` only affects the **Day view**. Week and Month views always use one column per day.

---

### Output Argument Types

```typescript
interface EventClickArg {
  event: CalendarEvent;   // The clicked event
  el: HTMLElement;        // The event's DOM element
  jsEvent: MouseEvent;    // The native mouse event
}

interface EventChangeArg {
  event: CalendarEvent;     // Updated event (new start/end/resourceId)
  oldEvent: CalendarEvent;  // State before the change
  revert: () => void;       // Call this to undo the move/resize
}

interface DateClickArg {
  date: Date;                    // The date/time of the clicked cell
  resource?: CalendarResource;   // The resource row that was clicked
  jsEvent: MouseEvent;
}

interface SelectArg {
  start: Date;                   // Selection start
  end: Date;                     // Selection end
  resource?: CalendarResource;   // The resource row the selection is on
}

interface DatesSetArg {
  view: CalendarView;
  start: Date;    // First visible date of the current view
  end: Date;      // Last visible date (exclusive)
  title: string;  // Formatted display title, e.g. "Feb 2026"
}
```

---

## Public API Methods

Obtain a reference to the component with `@ViewChild`, then call these methods programmatically:

```html
<ngx-timeline-calendar #cal ...></ngx-timeline-calendar>
```

```typescript
@ViewChild('cal') cal!: NgxTimelineCalendarComponent;
```

| Method | Signature | Description |
|---|---|---|
| `today` | `today(): void` | Navigate to the current date. |
| `prev` | `prev(): void` | Navigate to the previous period (day / week / month). |
| `next` | `next(): void` | Navigate to the next period. |
| `changeView` | `changeView(view: CalendarView): void` | Switch to a different view. |
| `getDate` | `getDate(): Date` | Returns the current focal date of the calendar. |
| `addEvent` | `addEvent(event: CalendarEvent): void` | Append a new event and refresh. |
| `removeEvent` | `removeEvent(id: string): void` | Remove an event by its `id`. |
| `updateEvent` | `updateEvent(event: CalendarEvent): void` | Replace an existing event matched by `id`. |
| `clearSelection` | `clearSelection(): void` | Cancel and clear any in-progress drag-to-select. |
| `scrollToTime` | `scrollToTime(time: string): void` | Scroll the timeline to a specific time string, e.g. `'09:30'`. |
| `refetchEvents` | `refetchEvents(): void` | Force re-render of all events. |

**Navigation example:**

```typescript
this.cal.today();
this.cal.next();
this.cal.changeView('resourceTimelineDay');
this.cal.scrollToTime('09:00');
```

**Add and remove events programmatically:**

```typescript
const newEvent: CalendarEvent = {
  id: 'evt-' + Date.now(),
  title: 'New Meeting',
  start: new Date(2026, 1, 20, 10, 0),
  end:   new Date(2026, 1, 20, 11, 0),
  resourceId: 'alice',
  color: '#2ed573'
};
this.cal.addEvent(newEvent);

// Remove it later
this.cal.removeEvent(newEvent.id);
```

**Reverting a drag/resize:**

```typescript
onEventChange(arg: EventChangeArg) {
  const ok = confirm(`Move "${arg.event.title}"?`);
  if (!ok) {
    arg.revert(); // restores the event to its original position/size
  }
}
```

---

## Resize Controls

Each event's resize behaviour is controlled at three levels:

### 1. Component level (global switch)

```html
<!-- Disable all editing for every event -->
<ngx-timeline-calendar [editable]="false">
```

### 2. Per-event — disable all editing

```typescript
const event: CalendarEvent = {
  id: '1',
  title: 'Locked Event',
  start: ..., end: ..., resourceId: ...,
  editable: false  // hides both resize handles and disables drag
};
```

### 3. Per-event — fine-grained control

```typescript
// End handle only (duration locked, but start can still be dragged)
const event: CalendarEvent = {
  id: '2', title: 'No End Resize', start: ..., end: ..., resourceId: ...,
  durationEditable: false  // end-edge handle hidden
};

// Start handle only (event can still be dragged to a new time)
const event: CalendarEvent = {
  id: '3', title: 'No Start Resize', start: ..., end: ..., resourceId: ...,
  startEditable: false  // start-edge handle hidden, drag also disabled
};

// Completely locked — no resize, no drag
const event: CalendarEvent = {
  id: '4', title: 'Fully Locked', start: ..., end: ..., resourceId: ...,
  startEditable: false,
  durationEditable: false
};
```

> Events blocked by the `single` overlap mode also have their resize handles hidden and drag disabled automatically, regardless of these flags.

---

## Overlap Modes

### `'multiple'` (default)

Events freely overlap in the same resource row. All events remain fully interactive regardless of overlap.

```html
<ngx-timeline-calendar [eventOverlap]="'multiple'">
```

### `'single'`

Only one event is allowed per time slot per resource. When a later event in the `events` array conflicts with an earlier one:

- It is rendered with a **red diagonal hatch pattern** at reduced opacity.
- Its resize handles are hidden.
- It cannot be dragged.
- Dragging another event into an occupied slot is blocked.

```html
<ngx-timeline-calendar [eventOverlap]="'single'">
```

The **first** event in the `events` array that occupies a given time range is considered the "winner". All subsequent overlapping events on the same resource are marked blocked.

---

## Theming

### Built-in themes

```html
<ngx-timeline-calendar [theme]="'light'">  <!-- default -->
<ngx-timeline-calendar [theme]="'dark'">
```

### CSS custom properties

All colors are driven by CSS variables. Override them on the host element in your global stylesheet:

```css
ngx-timeline-calendar {
  --ntc-primary:    #7c3aed;               /* accent color, today highlight */
  --ntc-bg:         #ffffff;               /* main background */
  --ntc-surface:    #f8f9fa;               /* hover/surface background */
  --ntc-border:     #dee2e6;               /* main border */
  --ntc-border-lt:  #e9ecef;               /* light border (grid lines) */
  --ntc-text:       #212529;               /* primary text */
  --ntc-muted:      #6c757d;               /* secondary / muted text */
  --ntc-hdr-bg:     #f8f9fa;               /* header and resource column background */
  --ntc-row-bg:     #ffffff;               /* even row background */
  --ntc-row-alt:    #fafbfc;               /* odd row background */
  --ntc-grp-bg:     #eef2f7;               /* group row background */
  --ntc-weekend-bg: rgba(0,0,0,0.018);     /* weekend column tint */
  --ntc-today-bg:   rgba(61,145,255,0.09); /* today column tint */
  --ntc-today-bdr:  rgba(61,145,255,0.4);  /* today column border */
  --ntc-now:        #ff4757;               /* now-indicator line */
  --ntc-sel-bg:     rgba(61,145,255,0.15); /* drag-to-select box fill */
  --ntc-sel-bdr:    rgba(61,145,255,0.65); /* drag-to-select box border */
  --ntc-radius:     4px;                   /* event border radius */
}
```

### Event colors

Individual event colors are set on each `CalendarEvent`:

```typescript
const event: CalendarEvent = {
  id: '1', title: 'Meeting', start: ..., end: ..., resourceId: ...,
  color: '#ff4757',           // sets both background and border
  // or individually:
  backgroundColor: '#ff4757',
  borderColor: '#c0392b',
  textColor: '#ffffff'
};
```

Text color contrast is computed automatically when `textColor` is not specified — the component picks white or dark text based on the background luminance.

---

## Demo App

A full demo application is included in `src/app/`. Run it with:

```bash
npm start
```

The demo showcases:

- Light / Dark theme toggle
- Multiple / Single overlap mode toggle
- Slot width selector (Compact → X-Wide)
- Row height selector
- 12h / 24h time format toggle
- Cross-row drag toggle (`allowResourceDrag`)
- Random event generator
- Drag-to-select with a dialog to create events
- Event log panel showing all emitted output events in real time

**Sample resource structure used in the demo:**

```
Engineering (group)
  ├─ Frontend Team
  ├─ Backend Team
  ├─ QA & Testing
  └─ DevOps / Infra
Design (group)
  ├─ UX Research
  └─ Visual Design
Product
Marketing
Room A
Room B
```

---

## License

MIT
