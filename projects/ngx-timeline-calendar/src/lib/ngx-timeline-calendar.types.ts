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

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  resourceId?: string;
  resourceIds?: string[];
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  editable?: boolean;
  allDay?: boolean;
  extendedProps?: { [key: string]: any };
  classNames?: string[];
  groupId?: string;
  durationEditable?: boolean;
  startEditable?: boolean;
  overlap?: boolean;
}

export interface CalendarResource {
  id: string;
  title: string;
  children?: CalendarResource[];
  eventColor?: string;
  extendedProps?: { [key: string]: any };
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

export interface DragState {
  eventId: string;
  originalEvent: CalendarEvent;
  startX: number;
  startY: number;            // client Y when drag began
  sourceResourceId: string;  // resource the event started on
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
