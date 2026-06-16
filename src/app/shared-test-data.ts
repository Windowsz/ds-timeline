/**
 * shared-test-data.ts
 *
 * Single source of truth for events and resources used in BOTH
 * the FullCalendar comparison demo and the compatibility spec suite.
 *
 * Data is written in ds-timeline's CalendarEvent / CalendarResource types,
 * which are structurally identical to FullCalendar's EventInput / ResourceInput —
 * the SAME objects are passed directly to BOTH calendars without any conversion.
 */

import { CalendarEvent, CalendarResource } from '../../projects/ds-timeline/src/public-api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date();
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - now.getDay());
weekStart.setHours(0, 0, 0, 0);

/** Build a Date for day d (0=Sun) at hour h within the current week. */
export function d(day: number, hour: number, minute = 0): Date {
  const dt = new Date(weekStart);
  dt.setDate(weekStart.getDate() + day);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

// ---------------------------------------------------------------------------
// Resources  (identical structure to FullCalendar ResourceInput)
// ---------------------------------------------------------------------------
export const TEST_RESOURCES: CalendarResource[] = [
  {
    id: 'eng',
    title: 'Engineering',
    extendedProps: { subtitle: '18 engineers' },
    children: [
      {
        id: 'fe',
        title: 'Frontend',
        extendedProps: { subtitle: 'Angular · React' }
      },
      {
        id: 'be',
        title: 'Backend',
        extendedProps: { subtitle: 'Node · Go' }
      },
      {
        id: 'qa',
        title: 'QA & Test',
        extendedProps: { subtitle: 'Automation' },
        // Per-resource default color — both FC and ds support these fields
        eventBackgroundColor: '#00b894',
        eventBorderColor: '#00a381',
        eventTextColor: '#ffffff'
      }
    ]
  },
  {
    id: 'design',
    title: 'Design',
    extendedProps: { subtitle: '6 designers' },
    children: [
      { id: 'ux', title: 'UX Research',   extendedProps: { subtitle: 'User studies' } },
      { id: 'ui', title: 'Visual Design', extendedProps: { subtitle: 'Figma' } }
    ]
  },
  { id: 'pm',  title: 'Product',   extendedProps: { subtitle: '4 PMs' } },
  { id: 'rma', title: 'Room A',    extendedProps: { subtitle: 'Cap: 8' } }
];

// ---------------------------------------------------------------------------
// Events  (identical structure to FullCalendar EventInput)
// Each event is annotated with the FC API feature it exercises.
// ---------------------------------------------------------------------------
export const TEST_EVENTS: CalendarEvent[] = [

  // 1. Basic event with color
  {
    id: 'e1',
    title: 'Sprint Planning',
    start: d(1, 9),
    end:   d(1, 11),
    resourceId: 'fe',
    color: '#3d91ff',
    extendedProps: { description: 'Weekly sprint kick-off', priority: 'high' }
  },

  // 2. backgroundColor + borderColor + textColor (FC API — separate fields)
  {
    id: 'e2',
    title: 'Design Review',
    start: d(1, 14),
    end:   d(1, 15, 30),
    resourceId: 'ux',
    backgroundColor: '#fd79a8',
    borderColor:     '#e84393',
    textColor:       '#ffffff',
    extendedProps: { description: 'Separate backgroundColor/borderColor/textColor fields (FC parity)' }
  },

  // 3. editable: false — event cannot be moved or resized
  {
    id: 'e3',
    title: 'Server Maintenance (locked)',
    start: d(2, 22),
    end:   d(3, 6),
    resourceId: 'rma',
    color: '#e17055',
    editable: false,
    extendedProps: { description: 'editable:false — cannot drag or resize' }
  },

  // 4. startEditable+durationEditable both false — fully locked
  {
    id: 'e4',
    title: 'Product Sync (fixed)',
    start: d(3, 9),
    end:   d(3, 10),
    resourceId: 'pm',
    color: '#ffa502',
    startEditable:    false,
    durationEditable: false,
    extendedProps: { description: 'startEditable:false + durationEditable:false — both handles hidden' }
  },

  // 5. resourceEditable: false — can drag in time but NOT to another resource row
  {
    id: 'e5',
    title: 'FE-only Task (row locked)',
    start: d(3, 13),
    end:   d(3, 15),
    resourceId: 'fe',
    color: '#a29bfe',
    resourceEditable: false,
    extendedProps: { description: 'resourceEditable:false — cannot be moved to a different resource' }
  },

  // 6. event.url — opens URL in new tab on click
  {
    id: 'e6',
    title: 'Docs (click opens URL)',
    start: d(4, 10),
    end:   d(4, 11),
    resourceId: 'be',
    color: '#00b894',
    url: 'https://github.com/Windowsz/ds-timeline',
    extendedProps: { description: 'event.url: clicking opens https://github.com/Windowsz/ds-timeline in a new tab' }
  },

  // 7. display: 'background' — non-interactive full-row highlight
  {
    id: 'e7',
    title: 'Background Block',
    start: d(0, 9),
    end:   d(6, 17),
    resourceId: 'qa',
    color: '#6c5ce7',
    display: 'background',
    extendedProps: { description: "display:'background' — non-interactive translucent highlight across the row" }
  },

  // 8. Inherits color from resource.eventBackgroundColor (no color set)
  {
    id: 'e8',
    title: 'Automation Run',
    start: d(5, 9),
    end:   d(5, 10, 30),
    resourceId: 'qa',
    // No color — inherits resource.eventBackgroundColor (#00b894)
    extendedProps: { description: 'No color on event → inherits resource.eventBackgroundColor' }
  },

  // 9. durationEditable: false — can drag to move but end handle is hidden
  {
    id: 'e9',
    title: 'Duration-locked Meeting',
    start: d(5, 14),
    end:   d(5, 15),
    resourceId: 'ui',
    color: '#e84393',
    durationEditable: false,
    extendedProps: { description: 'durationEditable:false — end handle hidden; can still drag to move' }
  },

  // 10. groupId stored on event (FC parity field)
  {
    id: 'e10',
    title: 'Standup (groupId set)',
    start: d(2, 9),
    end:   d(2, 9, 30),
    resourceId: 'be',
    groupId: 'daily-standups',
    color: '#74b9ff',
    extendedProps: { description: "groupId:'daily-standups' — stored on event for FC parity" }
  },

  // 11. Multi-day spanning event
  {
    id: 'e11',
    title: 'Research Sprint (multi-day)',
    start: d(1, 8),
    end:   d(5, 17),
    resourceId: 'ux',
    color: '#55efc4',
    extendedProps: { description: 'Multi-day event spanning Mon–Fri' }
  },

  // 12. Rich extendedProps
  {
    id: 'e12',
    title: 'Team Retro',
    start: d(4, 15),
    end:   d(4, 16),
    resourceId: 'eng',
    color: '#fdcb6e',
    extendedProps: {
      description: 'Weekly retrospective',
      attendees: 18,
      tags: ['team', 'recurring']
    }
  }
];

// ---------------------------------------------------------------------------
// Option mapping table  (used in the comparison UI)
// ---------------------------------------------------------------------------
export interface OptionMapping {
  fcOption: string;
  dsInput: string;
  notes: string;
  compatible: 'full' | 'partial';
}

export const OPTION_MAP: OptionMapping[] = [
  // Data inputs
  { fcOption: 'events',                        dsInput: '[events]',                        notes: 'Same object shape — identical objects passed to both, zero conversion', compatible: 'full' },
  { fcOption: 'resources',                     dsInput: '[resources]',                     notes: 'Same object shape (id, title, children, extendedProps)', compatible: 'full' },
  // View options
  { fcOption: 'initialView',                   dsInput: '[initialView]',                   notes: 'Identical strings: resourceTimelineDay / Week / Month', compatible: 'full' },
  { fcOption: 'initialDate',                   dsInput: '[initialDate]',                   notes: 'Both accept Date | string', compatible: 'full' },
  { fcOption: 'views (toolbar)',               dsInput: '[views]',                         notes: 'FC uses headerToolbar.right; ds uses views[] array', compatible: 'partial' },
  // Interaction
  { fcOption: 'editable',                      dsInput: '[editable]',                      notes: 'Identical boolean — enables drag+resize globally', compatible: 'full' },
  { fcOption: 'selectable',                    dsInput: '[selectable]',                    notes: 'Identical boolean — enables range selection', compatible: 'full' },
  // Appearance
  { fcOption: 'slotMinWidth',                  dsInput: '[slotMinWidth]',                  notes: 'Identical number (px per slot)', compatible: 'full' },
  { fcOption: 'slotDuration',                  dsInput: '[slotDuration]',                  notes: 'Same "HH:MM:SS" format', compatible: 'full' },
  { fcOption: 'resourceAreaWidth',             dsInput: '[resourceAreaWidth]',             notes: 'FC accepts "200px" string; ds accepts number', compatible: 'partial' },
  { fcOption: 'resourceAreaHeaderContent',     dsInput: '[resourceAreaHeaderContent]',     notes: 'Identical string', compatible: 'full' },
  { fcOption: 'nowIndicator',                  dsInput: '[showNowIndicator]',              notes: 'Different input name', compatible: 'partial' },
  // Callbacks
  { fcOption: 'eventClick(info)',              dsInput: '(eventClick)',                    notes: 'Both provide { event, el, jsEvent }', compatible: 'full' },
  { fcOption: 'eventChange(info)',             dsInput: '(eventChange)',                   notes: 'Both provide { event, oldEvent, revert }', compatible: 'full' },
  { fcOption: 'eventDrop(info)',               dsInput: '(eventDrop)',                     notes: 'Both provide { event, oldEvent, oldResource, newResource, revert }', compatible: 'full' },
  { fcOption: 'eventResize(info)',             dsInput: '(eventResize)',                   notes: 'Both provide { event, oldEvent, revert }', compatible: 'full' },
  { fcOption: 'select(info)',                  dsInput: '(select)',                        notes: 'Both provide { start, end, resource }', compatible: 'full' },
  { fcOption: 'datesSet(info)',                dsInput: '(datesSet)',                      notes: 'Both provide { view, start, end, title }', compatible: 'full' },
  { fcOption: 'dateClick(info)',               dsInput: '(dateClick)',                     notes: 'Both provide { date, resource, jsEvent }', compatible: 'full' },
  // Overlap
  { fcOption: 'eventOverlap',                  dsInput: "[eventOverlap]",                  notes: "FC: boolean/fn; ds: 'multiple'|'single'", compatible: 'partial' },
  // FC-parity inputs
  { fcOption: 'slotMinTime',                   dsInput: '[slotMinTime]',                   notes: "Same 'HH:MM:SS' format. Limits Day view start.", compatible: 'full' },
  { fcOption: 'slotMaxTime',                   dsInput: '[slotMaxTime]',                   notes: "Same 'HH:MM:SS' format. Limits Day view end.", compatible: 'full' },
  { fcOption: 'scrollTime',                    dsInput: '[scrollTime]',                    notes: 'Same string. Auto-scrolls Day view on load.', compatible: 'full' },
  { fcOption: 'scrollTimeReset',               dsInput: '[scrollTimeReset]',               notes: 'Identical boolean (default true).', compatible: 'full' },
  { fcOption: 'resourcesInitiallyExpanded',    dsInput: '[resourcesInitiallyExpanded]',    notes: 'Identical boolean.', compatible: 'full' },
  { fcOption: 'eventMinWidth',                 dsInput: '[eventMinWidth]',                 notes: 'Identical number (px).', compatible: 'full' },
  { fcOption: 'expandRows',                    dsInput: '[expandRows]',                    notes: 'Identical boolean.', compatible: 'full' },
  { fcOption: 'resourceGroupField',            dsInput: '[resourceGroupField]',            notes: 'Identical string. Groups by extendedProps field.', compatible: 'full' },
  { fcOption: 'resourceOrder',                 dsInput: '[resourceOrder]',                 notes: "Same format ('title', '-title').", compatible: 'full' },
  { fcOption: 'filterResourcesWithEvents',     dsInput: '[filterResourcesWithEvents]',     notes: 'Identical boolean.', compatible: 'full' },
  { fcOption: 'eventMaxStack',                 dsInput: '[eventMaxStack]',                 notes: "Identical number. Extras become '+N more'.", compatible: 'full' },
  { fcOption: 'slotLabelInterval',             dsInput: '[slotLabelInterval]',             notes: 'Same string format.', compatible: 'full' },
  { fcOption: 'businessHours',                 dsInput: '[businessHours]',                 notes: 'boolean | {startTime, endTime, daysOfWeek}.', compatible: 'full' },
  { fcOption: 'locale',                        dsInput: '[locale]',                        notes: "BCP 47 tag (e.g. 'th-TH'). All date/time labels use this locale.", compatible: 'full' },
  { fcOption: 'firstDay',                      dsInput: '[firstDay]',                      notes: '0=Sun, 1=Mon … 6=Sat. Same semantics as FC.', compatible: 'full' },
  { fcOption: 'hiddenDays',                    dsInput: '[hiddenDays]',                    notes: 'Array of day-of-week numbers to hide (0=Sun).', compatible: 'full' },
  { fcOption: 'weekNumbers',                   dsInput: '[weekNumbers]',                   notes: 'ISO week numbers in Week title + Month first-day label. No dedicated column yet.', compatible: 'partial' },
  { fcOption: 'height',                        dsInput: '[height]',                        notes: 'number|string|null. Sets component total height.', compatible: 'full' },
  { fcOption: 'contentHeight',                 dsInput: '[contentHeight]',                 notes: 'number|string|null. Sets body area height.', compatible: 'full' },
  { fcOption: 'aspectRatio',                   dsInput: '[aspectRatio]',                   notes: 'number|null. height = width / aspectRatio.', compatible: 'full' },
  { fcOption: 'resourceAreaColumns',           dsInput: '[resourceAreaColumns]',           notes: 'Array of { field, headerContent, width? }. Multi-column resource area.', compatible: 'full' },
  { fcOption: 'eventConstraint',               dsInput: '[eventConstraint]',               notes: "'businessHours' or { start?, end?, daysOfWeek? }. Restricts drag/resize.", compatible: 'full' },
  { fcOption: 'selectConstraint',              dsInput: '[selectConstraint]',              notes: "'businessHours' or { start?, end?, daysOfWeek? }. Restricts drag-to-select.", compatible: 'full' },
  { fcOption: 'droppable',                     dsInput: '[droppable]',                     notes: 'Accept HTML5 external drag-drop. Fires (drop) and (eventReceive).', compatible: 'full' },
  { fcOption: 'moreLinkClick',                 dsInput: '(moreLinkClick)',                 notes: '{ resource, hiddenEvents, jsEvent }. Fires on "+N more" chip click.', compatible: 'full' },
  { fcOption: 'drop',                          dsInput: '(drop)',                          notes: '{ date, resource, jsEvent }. Fires on external drag-drop.', compatible: 'full' },
  { fcOption: 'eventReceive',                  dsInput: '(eventReceive)',                  notes: '{ event, revert }. Fires when external event JSON is received.', compatible: 'full' },
  // Per-event fields
  { fcOption: 'event.url',                     dsInput: 'CalendarEvent.url',               notes: 'Opens URL in new tab on click.', compatible: 'full' },
  { fcOption: 'event.display',                 dsInput: 'CalendarEvent.display',           notes: "'background'/'none' supported.", compatible: 'partial' },
  { fcOption: 'event.groupId',                 dsInput: 'CalendarEvent.groupId',           notes: 'Field stored; group-drag not yet implemented.', compatible: 'partial' },
  { fcOption: 'event.resourceEditable',        dsInput: 'CalendarEvent.resourceEditable',  notes: 'Prevents moving to different resource.', compatible: 'full' },
  { fcOption: 'event.editable',                dsInput: 'CalendarEvent.editable',          notes: 'Disables drag+resize on a single event.', compatible: 'full' },
  { fcOption: 'event.startEditable',           dsInput: 'CalendarEvent.startEditable',     notes: 'Hides start-edge resize handle.', compatible: 'full' },
  { fcOption: 'event.durationEditable',        dsInput: 'CalendarEvent.durationEditable',  notes: 'Hides end-edge resize handle.', compatible: 'full' },
  { fcOption: 'event.backgroundColor',         dsInput: 'CalendarEvent.backgroundColor',   notes: 'Same field name.', compatible: 'full' },
  { fcOption: 'event.borderColor',             dsInput: 'CalendarEvent.borderColor',       notes: 'Same field name.', compatible: 'full' },
  { fcOption: 'event.textColor',               dsInput: 'CalendarEvent.textColor',         notes: 'Same field name.', compatible: 'full' },
  { fcOption: 'event.extendedProps',           dsInput: 'CalendarEvent.extendedProps',     notes: 'Identical { [key]: any }. Preserved in callbacks.', compatible: 'full' },
  // Per-resource fields
  { fcOption: 'resource.eventBackgroundColor', dsInput: 'CalendarResource.eventBackgroundColor', notes: 'Default bg for all events on that row.', compatible: 'full' },
  { fcOption: 'resource.eventBorderColor',     dsInput: 'CalendarResource.eventBorderColor',     notes: 'Default border color.', compatible: 'full' },
  { fcOption: 'resource.eventTextColor',       dsInput: 'CalendarResource.eventTextColor',       notes: 'Default text color.', compatible: 'full' },
  { fcOption: 'resource.children',             dsInput: 'CalendarResource.children',             notes: 'Identical nested array. Collapsible group rows.', compatible: 'full' },
  { fcOption: 'resource.extendedProps',        dsInput: 'CalendarResource.extendedProps',        notes: 'subtitle shown as secondary line; all props preserved.', compatible: 'full' },
  // Theme
  { fcOption: 'themeSystem',                   dsInput: '[theme]',                         notes: "FC: 'standard'|'bootstrap'; ds: 'light'|'dark'", compatible: 'partial' }
];
