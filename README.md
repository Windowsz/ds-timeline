# ds-timeline

An Angular resource-timeline calendar component inspired by FullCalendar's Timeline view. Supports drag-and-drop, resize, drag-to-select, nested resources, overlap modes, theming, mobile touch, and more — compatible with **Angular 6 through 20+**.

**[Live Demo →](https://windowsz.github.io/ds-timeline/)**

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
  - [BusinessHours](#businesshours)
  - [Output Argument Types](#output-argument-types)
- [Public API Methods](#public-api-methods)
- [FullCalendar Compatibility](#fullcalendar-compatibility)
- [Mobile Touch UX](#mobile-touch-ux)
- [Resize Controls](#resize-controls)
- [Date Picker](#date-picker)
- [Group Filter](#group-filter)
- [Overlap Modes](#overlap-modes)
- [Theming](#theming)
- [Demo App](#demo-app)

---

## Features

- **3 built-in views** — Day, Week, Month (resource-timeline layout)
- **Drag and drop** — move events in time and across resource rows; per-event `resourceEditable` flag
- **Resize** — drag start or end edge to change event duration; per-event control via `editable`, `startEditable`, `durationEditable`
- **Drag-to-select** — click and drag on empty grid cells to create new events
- **Nested resources** — multi-level resource hierarchy with expand/collapse; `resourcesInitiallyExpanded` controls default state
- **Resource grouping** — `resourceGroupField` groups flat resources by an `extendedProps` field value
- **Resource ordering** — `resourceOrder` sorts the resource list by any field (`'title'`, `'-title'`, etc.)
- **Filter by events** — `filterResourcesWithEvents` hides resources that have no events
- **Overlap modes** — `multiple` (free overlap) or `single` (one event per slot, conflicts shown with red hatch)
- **Event stacking** — `eventMaxStack` caps visible events per row and shows a "+N more" chip
- **Resize handles** — optional start/end drag handles on events via `resizable`; respects per-event `editable`, `startEditable`, `durationEditable`
- **Date picker** — `<input type="date">` in the toolbar for jumping directly to any date; respects `validRange`; toggle with `showDatePicker`
- **Group filter dropdown** — toolbar `<select>` to filter the resource list by group; works with both `resourceGroupField` and hierarchical (parent/children) modes; toggle with `showGroupFilter`
- **Select snap** — `selectSnap` controls whether drag-to-select snaps to slot boundaries (`'slot'`) or follows the exact mouse position (`'free'`)
- **Locale / i18n** — `locale` sets the BCP 47 language tag for all date/time labels (e.g. `'th-TH'`, `'de-DE'`)
- **First day of week** — `firstDay` controls which day starts the week (0=Sun, 1=Mon … 6=Sat); same as FullCalendar `firstDay`
- **Hidden days** — `hiddenDays` removes specific weekdays from the grid (e.g. `[0, 6]` hides weekends)
- **Week numbers** — `weekNumbers` displays ISO week numbers in the Week view title and Month view slot labels
- **Height control** — `height`, `contentHeight`, and `aspectRatio` inputs control the component dimensions
- **More-link click** — `moreLinkClick` output fires when the "+N more" chip is clicked; receives hidden events list
- **Multi-column resource area** — `resourceAreaColumns` renders multiple columns in the resource panel with custom field mapping
- **Drag/select constraints** — `eventConstraint` and `selectConstraint` restrict where events can be moved/selected
- **External drag-drop** — `droppable` accepts HTML5 drag-and-drop from outside the calendar; fires `drop` and `eventReceive`
- **All-day events** — events with `allDay: true` span the full day column in Day view and are date-boundary-snapped in Week/Month view; rendered with a distinct dashed style
- **Recurring events** — FC-compatible simple recurrence via `daysOfWeek`, `startRecur`, `endRecur`, `startTime`, `endTime` on CalendarEvent; instances are auto-expanded per view window
- **Timezone display** — `timeZone` input (IANA string) formats slot labels and event times in the specified timezone; positioning is UTC-offset-aware
- **Business hours** — `businessHours` shades non-business-hour slots in Day view
- **Event display modes** — `display: 'background'` renders translucent full-row highlight; `'none'` hides the event
- **Event URL** — `url` on an event opens the URL in a new tab on click
- **Per-resource colors** — `eventBackgroundColor`, `eventBorderColor`, `eventTextColor` on resources
- **Time bounds** — `slotMinTime` / `slotMaxTime` limit the Day view to a specific time range
- **Auto-scroll** — `scrollTime` auto-scrolls the Day view on load; `scrollTimeReset` controls scroll reset on navigation
- **Slot label interval** — `slotLabelInterval` shows labels less frequently than slot ticks
- **Now indicator** — live red line showing the current time (updates every 30 s)
- **Hover tooltips** — rich event detail tooltip on mouse hover
- **Mobile touch UX** — long-press (300 ms) activates drag or range-select; short taps scroll normally
- **Light / Dark themes** — full CSS variable theming
- **12h / 24h time format** — configurable header and event labels
- **OnPush change detection** — optimized for performance
- **FullCalendar-compatible** — accepts the same event/resource object shapes as FullCalendar's Timeline plugin
- **Zero external dependencies** — pure Angular, no third-party libraries required

---

## Installation

```bash
npm install ds-timeline
```

---

## Module Setup

Import `DsTimelineModule` into your Angular module:

```typescript
import { NgModule } from '@angular/core';
import { DsTimelineModule } from 'ds-timeline';

@NgModule({
  imports: [
    DsTimelineModule
  ]
})
export class AppModule {}
```

---

## Basic Usage

```html
<ds-timeline
  [events]="events"
  [resources]="resources"
  (eventClick)="onEventClick($event)"
  (eventChange)="onEventChange($event)"
  (select)="onSelect($event)">
</ds-timeline>
```

```typescript
import { Component } from '@angular/core';
import { CalendarEvent, CalendarResource } from 'ds-timeline';

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

### Core inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `events` | `CalendarEvent[]` | `[]` | Array of events to display. |
| `resources` | `CalendarResource[]` | `[]` | Array of resources (rows). Supports nested `children` for grouping. |
| `initialView` | `CalendarView` | `'resourceTimelineDay'` | The view to display on first render. |
| `initialDate` | `Date \| null` | `null` | The date the calendar starts on. Defaults to today. |
| `views` | `CalendarView[]` | all three | Views listed in the toolbar switcher. Pass a single-element array to lock to one view. |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme. |
| `locale` | `string` | `'en-US'` | BCP 47 locale tag for date/time labels (e.g. `'th-TH'`, `'de-DE'`). Same as FullCalendar `locale`. |
| `firstDay` | `number` | `0` | First day of the week: 0=Sunday, 1=Monday … 6=Saturday. Same as FullCalendar `firstDay`. |
| `hiddenDays` | `number[]` | `[]` | Days of the week to hide (0=Sun … 6=Sat). e.g. `[0, 6]` hides weekends. Same as FullCalendar `hiddenDays`. |
| `weekNumbers` | `boolean` | `false` | Show ISO week numbers. Week view: in title. Month view: on first day of each week. Same as FullCalendar `weekNumbers`. |
| `slotMinWidth` | `number` | `60` | Minimum width in pixels of each time slot column. |
| `slotDuration` | `SlotDuration` | `'01:00:00'` | Duration of each time slot (Day view granularity). |
| `timeFormat` | `'12h' \| '24h'` | `'12h'` | Time label format in headers and event times. |
| `resourceAreaWidth` | `number` | `200` | Width in pixels of the left resource column. |
| `resourceAreaHeaderContent` | `string` | `'Resources'` | Label shown at the top of the resource column. |
| `headerHeight` | `number` | `52` | Height in pixels of the sticky timeline header. |
| `rowHeight` | `number` | `40` | Height in pixels of each resource row. |
| `eventHeight` | `number` | `28` | Height in pixels of rendered event bars. |
| `showToolbar` | `boolean` | `true` | Show or hide the top toolbar. |
| `showViewSwitcher` | `boolean` | `true` | Show or hide the view switcher buttons. |
| `showDatePicker` | `boolean` | `true` | Show or hide the date-picker `<input type="date">` in the toolbar. |
| `showGroupFilter` | `boolean` | `true` | Show or hide the group filter dropdown in the toolbar. Only visible when groups exist. |
| `showNowIndicator` | `boolean` | `true` | Show the red vertical line indicating the current time. |
| `selectable` | `boolean` | `true` | Enable drag-to-select on empty grid cells. |
| `selectMinDuration` | `number` | `900000` | Minimum selection duration in ms before `select` fires (default 15 min). |
| `selectSnap` | `'slot' \| 'free'` | `'slot'` | Snap drag-to-select to slot boundaries (`'slot'`) or follow exact mouse position (`'free'`). |
| `editable` | `boolean` | `true` | Master switch for drag and resize. |
| `resizable` | `boolean` | `false` | Show start/end resize handles on event bars. Respects per-event `startEditable` / `durationEditable`. |
| `defaultEventColor` | `string` | `'#3d91ff'` | Fallback background color for events with no `color` set. |
| `showEventTooltip` | `boolean` | `true` | Show a rich hover tooltip on events. |
| `tooltipDelay` | `number` | `300` | Delay in ms before the hover tooltip appears. |
| `eventOverlap` | `'multiple' \| 'single'` | `'multiple'` | Overlap mode. See [Overlap Modes](#overlap-modes). |
| `allowResourceDrag` | `boolean` | `true` | When `true`, vertical drag moves event to a different resource. |
| `height` | `number \| string \| null` | `null` | Fixed height of the component (`600`, `'80vh'`). Defaults to filling the container (`height: 100%`). Same as FC `height`. |
| `contentHeight` | `number \| string \| null` | `null` | Fixed height of the body area only (excludes toolbar). Same as FC `contentHeight`. |
| `aspectRatio` | `number \| null` | `null` | Compute height as `width / aspectRatio`. Applied when `height` is null. Same as FC `aspectRatio`. |
| `resourceAreaColumns` | `ResourceAreaColumn[] \| null` | `null` | Define multiple columns in the resource area. Each specifies `field`, `headerContent`, and optional `width`. Same as FC `resourceAreaColumns`. |
| `eventConstraint` | `ConstraintInput \| null` | `null` | Restrict where events can be dragged/resized to. `'businessHours'` reuses the `businessHours` setting. Same as FC `eventConstraint`. |
| `selectConstraint` | `ConstraintInput \| null` | `null` | Restrict where drag-to-select is allowed. Same as FC `selectConstraint`. |
| `droppable` | `boolean` | `false` | Accept HTML5 drag-and-drop from outside the calendar. Fires `drop` and `eventReceive`. Same as FC `droppable`. |
| `timeZone` | `string` | `'local'` | IANA timezone for slot labels and event time display (e.g. `'America/New_York'`). Display-only; positioning uses the local system clock. Same as FC `timeZone` (partial). |

### FullCalendar-parity inputs

| Input | Type | Default | FC equivalent | Description |
|---|---|---|---|---|
| `slotMinTime` | `string` | `'00:00:00'` | `slotMinTime` | Earliest time slot in Day view (`'HH:MM:SS'`). |
| `slotMaxTime` | `string` | `'24:00:00'` | `slotMaxTime` | Latest time slot in Day view (`'HH:MM:SS'`). |
| `scrollTime` | `string \| null` | `null` | `scrollTime` | Auto-scroll target time on Day view load (`'HH:MM:SS'`). |
| `scrollTimeReset` | `boolean` | `true` | `scrollTimeReset` | Reset scroll position on navigation. Set `false` to preserve scroll. |
| `resourcesInitiallyExpanded` | `boolean` | `true` | `resourcesInitiallyExpanded` | Whether child resources are expanded on initial load. |
| `eventMinWidth` | `number` | `30` | `eventMinWidth` | Minimum pixel width of an event block. |
| `expandRows` | `boolean` | `false` | `expandRows` | Expand rows to fill available container height. |
| `resourceGroupField` | `string \| null` | `null` | `resourceGroupField` | Group resources by this `extendedProps` field value. |
| `resourceOrder` | `string \| null` | `null` | `resourceOrder` | Sort key for resources. Prefix with `'-'` for descending (e.g. `'-title'`). |
| `filterResourcesWithEvents` | `boolean` | `false` | `filterResourcesWithEvents` | Hide resources that have no events in the current view. |
| `eventMaxStack` | `number \| null` | `null` | `eventMaxStack` | Max stacked events per row; extras become "+N more". |
| `slotLabelInterval` | `string \| null` | `null` | `slotLabelInterval` | Show slot header labels every N duration (e.g. `'01:00:00'`). |
| `businessHours` | `BusinessHours` | `false` | `businessHours` | Shade non-business-hour slots. `true` = Mon–Fri 09:00–17:00. See [BusinessHours](#businesshours). |

**Locking to a single view:**

```html
<!-- Show only the Week view — switcher is hidden automatically -->
<ds-timeline [views]="['resourceTimelineWeek']">

<!-- Restrict Day view to business hours -->
<ds-timeline
  [views]="['resourceTimelineDay']"
  slotMinTime="08:00:00"
  slotMaxTime="18:00:00"
  scrollTime="08:00:00"
  [businessHours]="true">
```

> **Column fitting:** Week and Month view columns automatically expand to fill the available container width. Day view scrolls horizontally.

---

## Outputs

| Output | Payload | When it fires |
|---|---|---|
| `eventClick` | `EventClickArg` | User clicks an event bar. |
| `eventChange` | `EventChangeArg` | An event was moved or resized (fires on mouse-up). |
| `eventDrop` | `EventDropArg` | Event was dragged to a new time or resource (FC: `eventDrop`). |
| `eventResize` | `EventResizeArg` | Event duration was changed by resizing (FC: `eventResize`). |
| `dateClick` | `DateClickArg` | User clicks an empty grid cell (no drag). |
| `select` | `SelectArg` | User finishes a drag-to-select gesture. |
| `selecting` | `SelectArg` | Fires continuously while drag-selecting. |
| `viewChange` | `{ view, start, end }` | User switches between Day / Week / Month views. |
| `datesSet` | `DatesSetArg` | Fires on initial render and on every date range change. |
| `resourceClick` | `ResourceClickArg` | User clicks a row in the resource column. |
| `moreLinkClick` | `MoreLinkArg` | User clicks the "+N more" chip (requires `eventMaxStack`). |
| `drop` | `DropArg` | An external draggable was dropped onto the grid (requires `droppable`). |
| `eventReceive` | `EventReceiveArg` | An external event JSON was received and added to the calendar. |

> **Note:** `eventDrop` and `eventResize` fire *in addition to* `eventChange`. Use `eventChange` for a unified handler, or the specific outputs for FullCalendar parity.

---

## Data Types

### CalendarEvent

```typescript
interface CalendarEvent {
  id: string;                              // Unique identifier
  title: string;                           // Display label on the event bar
  start: Date | string;                    // Start date/time
  end?: Date | string;                     // End date/time (defaults to start + 1 hour)
  allDay?: boolean;                        // All-day flag (stored; Week/Month views always show full-day)
  resourceId?: string;                     // Assign to a single resource row
  resourceIds?: string[];                  // Assign to multiple resource rows
  groupId?: string;                        // Group ID (FC parity; field stored for future use)
  url?: string;                            // URL opened in new tab on click (preventDefault cancels)
  display?: 'auto' | 'block' | 'background' | 'inverse-background' | 'none';
  color?: string;                          // Background and border color (hex)
  backgroundColor?: string;               // Override background color only
  borderColor?: string;                   // Override border color only
  textColor?: string;                     // Override text color (auto-contrast if omitted)
  editable?: boolean;                     // false → cannot be dragged or resized
  startEditable?: boolean;                // false → start-edge resize handle hidden, drag disabled
  durationEditable?: boolean;             // false → end-edge resize handle hidden
  resourceEditable?: boolean;             // false → event cannot be moved to a different resource
  extendedProps?: { [key: string]: any }; // Custom metadata (e.g. description, priority)
  // Simple recurrence (FC-compatible):
  daysOfWeek?: number[];       // Repeat on these weekdays: 0=Sun…6=Sat
  startRecur?: Date | string;  // Earliest date (inclusive) for instances
  endRecur?: Date | string;    // Latest date (exclusive) for instances
  startTime?: string;          // 'HH:MM' start time for each occurrence
  endTime?: string;            // 'HH:MM' end time for each occurrence
}
```

**`display` values:**

| Value | Behavior |
|---|---|
| `'auto'` / `'block'` | Default rendering — colored event bar with title and time |
| `'background'` | Translucent full-row highlight; non-interactive |
| `'inverse-background'` | Same as `'background'` (inverse shading applied via CSS) |
| `'none'` | Event is not rendered |

**`url` example:**

```typescript
{
  id: '1', title: 'Docs', start: ..., end: ..., resourceId: 'fe',
  url: 'https://example.com/docs'
  // Clicking opens the URL in a new tab.
  // To cancel: (eventClick)="onClickHandler($event)" → arg.jsEvent.preventDefault()
}
```

**Per-event editability quick reference:**

| Flag | Drag | Start handle | End handle | Resource change |
|---|:---:|:---:|:---:|:---:|
| *(defaults)* | yes | shown | shown | yes |
| `editable: false` | no | hidden | hidden | no |
| `startEditable: false` | no | hidden | shown | yes |
| `durationEditable: false` | yes | shown | hidden | yes |
| `resourceEditable: false` | yes | shown | shown | **no** |

> The global `[editable]` input is a master switch. If it is `false`, per-event flags are ignored.

---

### CalendarResource

```typescript
interface CalendarResource {
  id: string;                              // Unique identifier
  title: string;                           // Display name in the resource column
  children?: CalendarResource[];           // Nested child resources (creates a collapsible group)
  extendedProps?: { [key: string]: any };  // Custom metadata (e.g. subtitle, capacity)
  // Default event colors for all events on this resource:
  eventBackgroundColor?: string;
  eventBorderColor?: string;
  eventTextColor?: string;
  eventClassNames?: string | string[];
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
    ]
  },
  {
    id: 'room-a',
    title: 'Room A',
    extendedProps: { subtitle: 'Cap: 8' },
    eventBackgroundColor: '#2ed573'  // all events on this resource are green by default
  }
];
```

**Resource grouping with `resourceGroupField`:**

```typescript
// Resources have a dept field in extendedProps
const resources: CalendarResource[] = [
  { id: 'alice', title: 'Alice', extendedProps: { dept: 'Engineering' } },
  { id: 'bob',   title: 'Bob',   extendedProps: { dept: 'Design' } },
  { id: 'carol', title: 'Carol', extendedProps: { dept: 'Engineering' } },
];
```

```html
<!-- Groups resources by extendedProps.dept with a bold separator row -->
<ds-timeline [resources]="resources" resourceGroupField="dept">
```

`extendedProps.subtitle` is rendered as a secondary line below the resource name.

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

### BusinessHours

```typescript
type BusinessHours =
  | boolean
  | {
      startTime: string;      // e.g. '09:00:00'
      endTime: string;        // e.g. '17:00:00'
      daysOfWeek?: number[];  // 0=Sun, 1=Mon … 6=Sat. Defaults to [1,2,3,4,5]
    };
```

```html
<!-- Default: Mon–Fri, 09:00–17:00 -->
<ds-timeline [businessHours]="true">

<!-- Custom: Mon–Sat, 08:00–20:00 -->
<ds-timeline [businessHours]="{ startTime: '08:00:00', endTime: '20:00:00', daysOfWeek: [1,2,3,4,5,6] }">
```

Slots outside business hours are shaded with a subtle gray overlay. Business hours only render visually in the **Day view**.

---

### Output Argument Types

```typescript
interface EventClickArg {
  event: CalendarEvent;   // The clicked event
  el: HTMLElement;        // The event's DOM element
  jsEvent: MouseEvent;    // The native mouse event (call preventDefault() to cancel URL)
}

interface EventChangeArg {
  event: CalendarEvent;     // Updated event (new start/end/resourceId)
  oldEvent: CalendarEvent;  // State before the change
  revert: () => void;       // Call this to undo the move/resize
}

// FC parity: fires after a drag (in addition to eventChange)
interface EventDropArg {
  event: CalendarEvent;
  oldEvent: CalendarEvent;
  oldResource?: CalendarResource;  // Resource before the drag
  newResource?: CalendarResource;  // Resource after the drag
  revert: () => void;
}

// FC parity: fires after a resize (in addition to eventChange)
interface EventResizeArg {
  event: CalendarEvent;
  oldEvent: CalendarEvent;
  revert: () => void;
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

interface ResourceClickArg {
  resource: CalendarResource; // The resource that was clicked
  jsEvent: MouseEvent;
}

// Phase 2b: moreLinkClick
interface MoreLinkArg {
  resource: CalendarResource;    // The resource row the chip appeared in
  hiddenEvents: CalendarEvent[];  // Events not visible due to eventMaxStack
  jsEvent: MouseEvent;
}

// Phase 3b: external drop
interface DropArg {
  date: Date;                    // Date/time where the item was dropped
  resource?: CalendarResource;   // Resource row it was dropped on
  jsEvent: DragEvent;
}

interface EventReceiveArg {
  event: CalendarEvent;  // The newly created event (parsed from dataTransfer JSON)
  revert: () => void;    // Call to remove the event if unwanted
}
```

**Handling drag and resize separately (FC-style):**

```typescript
onEventDrop(arg: EventDropArg) {
  console.log('Dragged from', arg.oldResource?.title, '→', arg.newResource?.title);
  if (!confirm(`Move "${arg.event.title}"?`)) arg.revert();
}

onEventResize(arg: EventResizeArg) {
  console.log('Resized:', arg.oldEvent.end, '→', arg.event.end);
}
```

---

## Public API Methods

Obtain a reference to the component with `@ViewChild`, then call these methods programmatically:

```html
<ds-timeline #cal ...></ds-timeline>
```

```typescript
@ViewChild('cal') cal!: DsTimelineComponent;
```

| Method | Signature | Description |
|---|---|---|
| `today` | `today(): void` | Navigate to the current date. |
| `prev` | `prev(): void` | Navigate to the previous period (day / week / month). |
| `next` | `next(): void` | Navigate to the next period. |
| `changeView` | `changeView(view: CalendarView): void` | Switch to a different view. |
| `getDate` | `getDate(): Date` | Returns the current focal date. |
| `addEvent` | `addEvent(event: CalendarEvent): void` | Append a new event and refresh. |
| `removeEvent` | `removeEvent(id: string): void` | Remove an event by its `id`. |
| `updateEvent` | `updateEvent(event: CalendarEvent): void` | Replace an event matched by `id`. |
| `clearSelection` | `clearSelection(): void` | Cancel any in-progress drag-to-select. |
| `scrollToTime` | `scrollToTime(time: string): void` | Scroll the timeline to a specific time, e.g. `'09:30'`. |
| `refetchEvents` | `refetchEvents(): void` | Force re-render of all events. |

**Navigation example:**

```typescript
this.cal.today();
this.cal.next();
this.cal.changeView('resourceTimelineDay');
this.cal.scrollToTime('09:00');
```

**Reverting a drag/resize:**

```typescript
onEventChange(arg: EventChangeArg) {
  const ok = confirm(`Move "${arg.event.title}"?`);
  if (!ok) arg.revert(); // restores the event to its original position/size
}
```

---

## FullCalendar Compatibility

ds-timeline is designed so that the same event and resource objects you pass to FullCalendar's Timeline plugin can be passed directly to `<ds-timeline>` without modification.

| FullCalendar option | ds-timeline input | Compatibility |
|---|---|---|
| `events` | `[events]` | ✅ full |
| `resources` | `[resources]` | ✅ full |
| `initialView` | `[initialView]` | ✅ full (same strings) |
| `initialDate` | `[initialDate]` | ✅ full |
| `editable` | `[editable]` | ✅ full |
| `selectable` | `[selectable]` | ✅ full |
| `slotMinWidth` | `[slotMinWidth]` | ✅ full |
| `slotDuration` | `[slotDuration]` | ✅ full |
| `slotMinTime` | `[slotMinTime]` | ✅ full |
| `slotMaxTime` | `[slotMaxTime]` | ✅ full |
| `scrollTime` | `[scrollTime]` | ✅ full |
| `scrollTimeReset` | `[scrollTimeReset]` | ✅ full |
| `resourcesInitiallyExpanded` | `[resourcesInitiallyExpanded]` | ✅ full |
| `eventMinWidth` | `[eventMinWidth]` | ✅ full |
| `expandRows` | `[expandRows]` | ✅ full |
| `resourceGroupField` | `[resourceGroupField]` | ✅ full |
| `resourceOrder` | `[resourceOrder]` | ✅ full |
| `filterResourcesWithEvents` | `[filterResourcesWithEvents]` | ✅ full |
| `eventMaxStack` | `[eventMaxStack]` | ✅ full |
| `slotLabelInterval` | `[slotLabelInterval]` | ✅ full |
| `businessHours` | `[businessHours]` | ✅ full |
| `locale` | `[locale]` | ✅ full |
| `firstDay` | `[firstDay]` | ✅ full |
| `hiddenDays` | `[hiddenDays]` | ✅ full |
| `weekNumbers` | `[weekNumbers]` | ⚠️ partial (Week view: in title; Month view: first-day-of-week label; no dedicated column) |
| `height` | `[height]` | ✅ full |
| `contentHeight` | `[contentHeight]` | ✅ full |
| `aspectRatio` | `[aspectRatio]` | ✅ full |
| `resourceAreaWidth` | `[resourceAreaWidth]` | ⚠️ partial (FC accepts `"200px"` string; ds accepts number) |
| `resourceAreaColumns` | `[resourceAreaColumns]` | ✅ full |
| `eventConstraint` | `[eventConstraint]` | ✅ full |
| `selectConstraint` | `[selectConstraint]` | ✅ full |
| `droppable` | `[droppable]` | ✅ full |
| `timeZone` | `[timeZone]` | ⚠️ partial (display labels only; full pipeline offset is a future enhancement) |
| `nowIndicator` | `[showNowIndicator]` | ⚠️ partial (different input name) |
| `themeSystem` | `[theme]` | ⚠️ partial (`'light'\|'dark'` instead of `'standard'\|'bootstrap'`) |
| `eventClick(info)` | `(eventClick)` | ✅ full |
| `eventChange(info)` | `(eventChange)` | ✅ full |
| `eventDrop(info)` | `(eventDrop)` | ✅ full |
| `eventResize(info)` | `(eventResize)` | ✅ full |
| `select(info)` | `(select)` | ✅ full |
| `datesSet(info)` | `(datesSet)` | ✅ full |
| `dateClick(info)` | `(dateClick)` | ✅ full |
| `moreLinkClick(info)` | `(moreLinkClick)` | ✅ full |
| `drop(info)` | `(drop)` | ✅ full |
| `eventReceive(info)` | `(eventReceive)` | ✅ full |
| `event.url` | `CalendarEvent.url` | ✅ full |
| `event.display` | `CalendarEvent.display` | ⚠️ partial (`background`/`none` supported) |
| `event.resourceEditable` | `CalendarEvent.resourceEditable` | ✅ full |
| `resource.eventBackgroundColor` | `CalendarResource.eventBackgroundColor` | ✅ full |
| `resource.eventBorderColor` | `CalendarResource.eventBorderColor` | ✅ full |
| `resource.eventTextColor` | `CalendarResource.eventTextColor` | ✅ full |

> A full side-by-side comparison UI is available in the demo app at the **Compare** tab.

---

## Mobile Touch UX

ds-timeline uses a **long-press pattern** for touch devices to avoid conflicting with native scroll:

- **Short tap** on an event → fires `eventClick` (normal tap behavior)
- **Long-press (300 ms) on an event** → activates drag mode (haptic vibration if supported)
- **Long-press on empty cell** → activates range-select mode
- **Moving finger > 8 px before 300 ms** → cancels the timer and lets the browser scroll normally

This means users can freely scroll the timeline by swiping, and opt into drag/select by holding.

---

## Resize Controls

Each event's resize behaviour is controlled at three levels:

### 1. Component level (global switch)

```html
<ds-timeline [editable]="false">
```

### 2. Per-event — disable all editing

```typescript
{ id: '1', title: 'Locked', start: ..., end: ..., resourceId: ..., editable: false }
```

### 3. Per-event — fine-grained control

```typescript
// Cannot be moved to a different resource, but can be dragged in time
{ id: '2', ..., resourceEditable: false }

// Duration is locked; can still be dragged
{ id: '3', ..., durationEditable: false }

// Start time is locked; can still resize the end
{ id: '4', ..., startEditable: false }
```

---

## Date Picker

The toolbar contains a native `<input type="date">` that lets users jump directly to any date without clicking the navigation arrows.

```html
<!-- shown by default -->
<ds-timeline [showDatePicker]="true">

<!-- hide it -->
<ds-timeline [showDatePicker]="false">
```

When `[validRange]` is set, the input's `min` and `max` attributes are automatically bound to the range boundaries so the browser prevents out-of-range selection.

---

## Group Filter

When resources are grouped (either via `resourceGroupField` or a parent/children hierarchy), a `<select>` dropdown appears in the toolbar's right side. Selecting a group hides all other resources; selecting **All** restores the full list.

```html
<!-- shown by default whenever groups exist -->
<ds-timeline [showGroupFilter]="true">

<!-- hide it -->
<ds-timeline [showGroupFilter]="false">
```

The dropdown is hidden automatically when there are no groups (flat resource list).

---

## Overlap Modes

### `'multiple'` (default)

Events freely overlap in the same resource row. All events remain fully interactive.

```html
<ds-timeline [eventOverlap]="'multiple'">
```

### `'single'`

Only one event is allowed per time slot per resource. Conflicting events are rendered with a **red diagonal hatch pattern** at reduced opacity and cannot be dragged.

```html
<ds-timeline [eventOverlap]="'single'">
```

**Capping visible events with `eventMaxStack`:**

```html
<!-- Show max 3 events per row; extras become "+2 more" chip -->
<ds-timeline [eventMaxStack]="3">
```

---

## Theming

### Built-in themes

```html
<ds-timeline [theme]="'light'">  <!-- default -->
<ds-timeline [theme]="'dark'">
```

### CSS custom properties

All colors are driven by CSS variables. Override them on the host element:

```css
ds-timeline {
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

Event colors are resolved in this priority order:
1. `event.color` / `event.backgroundColor`
2. `resource.eventBackgroundColor`
3. `[defaultEventColor]` input (global fallback)

```typescript
// Per-event color
{ id: '1', color: '#ff4757', ... }

// Per-resource default (all events on this resource inherit it)
{ id: 'room-a', title: 'Room A', eventBackgroundColor: '#2ed573' }
```

---

## Demo App

A live demo is hosted at **[https://windowsz.github.io/ds-timeline/](https://windowsz.github.io/ds-timeline/)**.

Run it locally with:

```bash
npm start
```

The demo includes:
- Light / Dark theme toggle
- Multiple / Single overlap mode
- Slot width, row height, slot duration controls
- 12h / 24h time format toggle
- Business hours toggle
- `resourceGroupField` demo
- `eventMaxStack` demo
- Mobile-friendly touch interactions
- **Compare tab** — side-by-side with FullCalendar using identical data
- Event log panel showing all emitted outputs in real time

---

## License

MIT
