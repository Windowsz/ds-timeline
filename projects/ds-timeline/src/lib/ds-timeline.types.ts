export type CalendarView =
  | 'resourceTimelineDay'
  | 'resourceTimelineWeek'
  | 'resourceTimelineMonth';

export type SlotDuration =
  | '00:15:00'
  | '00:30:00'
  | '01:00:00'
  | '06:00:00'
  | '1.00:00:00';

/** Restricts the dates the user can navigate to. Same as FullCalendar validRange. */
export interface ValidRange {
  start?: Date | string;
  end?: Date | string;
}

/** Business-hours definition — identical to FullCalendar's businessHours option. */
export type BusinessHours =
  | boolean
  | { startTime: string; endTime: string; daysOfWeek?: number[] };

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  resourceId?: string;
  resourceIds?: string[];
  groupId?: string;            // links events for synchronized dragging (FC: groupId)
  url?: string;                // open URL on click; can preventDefault() to cancel
  display?: 'auto' | 'block' | 'background' | 'inverse-background' | 'none';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;          // overrides auto-contrast text color
  editable?: boolean;
  startEditable?: boolean;
  durationEditable?: boolean;
  resourceEditable?: boolean;  // allow moving to a different resource
  extendedProps?: { [key: string]: any };
  // ── Simple recurrence (FC-compatible, same as FullCalendar simple-recurrence) ──
  /** Days of the week to repeat on: 0=Sun … 6=Sat. Turns the event into a recurring template. */
  daysOfWeek?: number[];
  /** Earliest date (inclusive) that recurring instances may start. */
  startRecur?: Date | string;
  /** Latest date (exclusive) for recurring instances. */
  endRecur?: Date | string;
  /** Clock start of each occurrence e.g. '09:00'. Only used when daysOfWeek is set. */
  startTime?: string;
  /** Clock end of each occurrence e.g. '10:00'. Only used when daysOfWeek is set. */
  endTime?: string;
}

export interface CalendarResource {
  id: string;
  title: string;
  children?: CalendarResource[];
  extendedProps?: { [key: string]: any };
  /** Default event colors for all events on this resource */
  eventBackgroundColor?: string;
  eventBorderColor?: string;
  eventTextColor?: string;
  eventClassNames?: string | string[];
}

export interface FlatResource {
  id: string;
  title: string;
  level: number;
  isGroup: boolean;
  expanded: boolean;
  children?: CalendarResource[];
  extendedProps?: { [key: string]: any };
  original: CalendarResource;
  /** True for synthetic group-label rows inserted by resourceGroupField */
  isGroupLabel?: boolean;
  /** The group field value displayed in a group-label row */
  groupLabelValue?: string;
}

export interface HeaderTier {
  label: string;
  width: number;
}

export interface TimelineResult {
  slots: Date[];
  tier1: HeaderTier[];
  slotWidth: number;
  totalWidth: number;
  title: string;
}

export interface BuildOptions {
  view: CalendarView;
  date: Date;
  slotDuration: SlotDuration;
  slotMinWidth: number;
  containerWidth?: number;
  slotMinTime?: string;
  slotMaxTime?: string;
  locale?: string;
  firstDay?: number;
  hiddenDays?: number[];
  weekNumbers?: boolean;
  /** IANA timezone string for slot label display (e.g. 'America/New_York'). 'local' = system default. */
  timeZone?: string;
}

export interface DragState {
  eventId: string;
  originalEvent: CalendarEvent;
  startX: number;
  startY: number;            // client Y when drag began
  sourceResourceId: string;  // resource the event started on
  /** IDs of other events in the same groupId (when groupDrag is enabled). */
  groupEventIds?: string[];
  /** Original copies of group-member events, keyed by event ID. */
  groupOriginals?: Map<string, CalendarEvent>;
}

export interface ResizeState {
  eventId: string;
  handle: 'start' | 'end';
  originalEvent: CalendarEvent;
  startX: number;
}

export interface EventClickArg {
  event: CalendarEvent;
  el: HTMLElement;
  jsEvent: MouseEvent;
}

export interface EventChangeArg {
  event: CalendarEvent;
  oldEvent: CalendarEvent;
  revert: () => void;
}

/** Emitted when an event is dragged to a new time or resource (FC: eventDrop). */
export interface EventDropArg {
  event: CalendarEvent;
  oldEvent: CalendarEvent;
  oldResource?: CalendarResource;
  newResource?: CalendarResource;
  revert: () => void;
}

/** Emitted when an event is resized (FC: eventResize). */
export interface EventResizeArg {
  event: CalendarEvent;
  oldEvent: CalendarEvent;
  revert: () => void;
}

export interface DateClickArg {
  date: Date;
  resource?: CalendarResource;
  jsEvent: MouseEvent;
}

export interface SelectArg {
  start: Date;
  end: Date;
  resource?: CalendarResource;
}

export interface DatesSetArg {
  view: CalendarView;
  start: Date;
  end: Date;
  title: string;
}

export interface ResourceClickArg {
  resource: CalendarResource;
  jsEvent: MouseEvent;
}

/** Argument passed to the eventContent callback. Same as FullCalendar EventContentArg (simplified). */
export interface EventContentArg {
  event: CalendarEvent;
  /** The current view type. */
  view: CalendarView;
}

/** Emitted when the "+N more" chip is clicked (FC: moreLinkClick). */
export interface MoreLinkArg {
  resource: CalendarResource;
  hiddenEvents: CalendarEvent[];
  jsEvent: MouseEvent;
}

/** Single column definition for resourceAreaColumns. */
export interface ResourceAreaColumn {
  /** The field to read from resource.extendedProps (or 'title' for the resource title). */
  field: string;
  /** Text shown in the column header. */
  headerContent: string;
  /** Column width in px. Default: 120. */
  width?: number;
}

/**
 * Constraint that limits when drag/select is allowed.
 * 'businessHours' — reuse the current businessHours setting.
 * Object form — { start?, end?, daysOfWeek? }.
 * Same as FullCalendar eventConstraint / selectConstraint.
 */
export type ConstraintInput =
  | 'businessHours'
  | { start?: string; end?: string; daysOfWeek?: number[] };

/** Emitted when an external item is dropped onto the grid (FC: drop). */
export interface DropArg {
  date: Date;
  resource?: CalendarResource;
  jsEvent: DragEvent;
}

/** Emitted when an external event is received and added to the calendar (FC: eventReceive). */
export interface EventReceiveArg {
  event: CalendarEvent;
  revert: () => void;
}
