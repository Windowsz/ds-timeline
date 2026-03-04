/**
 * shared-test-data.ts
 *
 * Single source of truth for events and resources used in BOTH
 * the FullCalendar comparison demo and the compatibility spec suite.
 *
 * Data is written in ds-timeline's CalendarEvent / CalendarResource types,
 * which are structurally identical to FullCalendar's EventInput / ResourceInput —
 * so the same objects can be passed directly to either calendar.
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
      { id: 'fe',  title: 'Frontend',  extendedProps: { subtitle: 'Angular · React' } },
      { id: 'be',  title: 'Backend',   extendedProps: { subtitle: 'Node · Go' } },
      { id: 'qa',  title: 'QA & Test', extendedProps: { subtitle: 'Automation' } }
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
// ---------------------------------------------------------------------------
export const TEST_EVENTS: CalendarEvent[] = [
  // --- basic event ---
  {
    id: 'e1',
    title: 'Sprint Planning',
    start: d(1, 9),
    end:   d(1, 11),
    resourceId: 'fe',
    color: '#3d91ff',
    extendedProps: { description: 'Weekly sprint kick-off' }
  },
  // --- uses backgroundColor + borderColor (FC API) instead of color ---
  {
    id: 'e2',
    title: 'Design Review',
    start: d(1, 14),
    end:   d(1, 15),
    resourceId: 'ux',
    backgroundColor: '#fd79a8',
    borderColor: '#e84393',
    textColor: '#ffffff',
    extendedProps: { description: 'Review latest mockups' }
  },
  // --- event on a group resource ---
  {
    id: 'e3',
    title: 'Architecture Talk',
    start: d(2, 10),
    end:   d(2, 12),
    resourceId: 'be',
    color: '#2ed573',
    extendedProps: { description: 'API design discussion', priority: 'high' }
  },
  // --- non-editable event (FC: editable: false) ---
  {
    id: 'e4',
    title: 'Blocked: Server Maintenance',
    start: d(3, 0),
    end:   d(3, 6),
    resourceId: 'rma',
    color: '#e17055',
    editable: false,
    startEditable: false,
    durationEditable: false,
    extendedProps: { description: 'Scheduled maintenance window' }
  },
  // --- start-only editable (FC: startEditable: true, durationEditable: false) ---
  {
    id: 'e5',
    title: 'Product Sync',
    start: d(3, 9),
    end:   d(3, 10),
    resourceId: 'pm',
    color: '#ffa502',
    startEditable: true,
    durationEditable: false,
    extendedProps: { description: 'Quick product alignment' }
  },
  // --- multi-char extendedProps ---
  {
    id: 'e6',
    title: 'Team Retro',
    start: d(4, 13),
    end:   d(4, 14),
    resourceId: 'eng',
    color: '#00b894',
    extendedProps: {
      description: 'Weekly retrospective',
      attendees: 18,
      tags: ['team', 'recurring']
    }
  },
  // --- uses resourceIds (multi-resource, FC API) ---
  {
    id: 'e7',
    title: 'Cross-Team Standup',
    start: d(5, 9),
    end:   d(5, 9, 30),
    resourceId: 'fe',     // ds-timeline picks the first matching resource
    color: '#a29bfe',
    extendedProps: { description: 'All-team morning standup' }
  }
];

// ---------------------------------------------------------------------------
// Option mapping table  (used in the comparison UI and in spec descriptions)
// ---------------------------------------------------------------------------
export interface OptionMapping {
  fcOption: string;
  dsInput: string;
  notes: string;
  compatible: 'full' | 'partial' | 'different';
}

export const OPTION_MAP: OptionMapping[] = [
  // Data inputs
  { fcOption: 'events',                    dsInput: '[events]',                    notes: 'Same object shape (id, title, start, end, resourceId, color, extendedProps…)', compatible: 'full' },
  { fcOption: 'resources',                 dsInput: '[resources]',                 notes: 'Same object shape (id, title, children, extendedProps)', compatible: 'full' },
  // View options
  { fcOption: 'initialView',               dsInput: '[initialView]',               notes: 'Identical strings: resourceTimelineDay / Week / Month', compatible: 'full' },
  { fcOption: 'initialDate',               dsInput: '[initialDate]',               notes: 'Both accept Date | string', compatible: 'full' },
  { fcOption: 'views (toolbar buttons)',   dsInput: '[views]',                     notes: 'FC uses headerToolbar.right; ds uses views[] array', compatible: 'partial' },
  // Interaction
  { fcOption: 'editable',                  dsInput: '[editable]',                  notes: 'Identical boolean — enables drag+resize', compatible: 'full' },
  { fcOption: 'selectable',               dsInput: '[selectable]',                notes: 'Identical boolean — enables range selection', compatible: 'full' },
  { fcOption: 'selectMinDistance',         dsInput: '(built-in, fixed 3 px)',      notes: 'FC: pixel threshold; ds uses 3 px internally', compatible: 'partial' },
  // Appearance
  { fcOption: 'slotMinWidth',              dsInput: '[slotMinWidth]',              notes: 'Identical number (px per slot column)', compatible: 'full' },
  { fcOption: 'slotDuration',              dsInput: '[slotDuration]',              notes: 'Same string format "HH:MM:SS" / "D.HH:MM:SS"', compatible: 'full' },
  { fcOption: 'resourceAreaWidth',         dsInput: '[resourceAreaWidth]',         notes: 'FC accepts "200px" string; ds accepts number (200)', compatible: 'partial' },
  { fcOption: 'resourceAreaHeaderContent', dsInput: '[resourceAreaHeaderContent]', notes: 'Identical string', compatible: 'full' },
  { fcOption: 'nowIndicator',              dsInput: '[showNowIndicator]',          notes: 'FC: nowIndicator; ds: showNowIndicator — different name', compatible: 'partial' },
  { fcOption: 'height / aspectRatio',      dsInput: 'CSS on host element',         notes: 'ds-timeline fills its host; set height via CSS', compatible: 'partial' },
  // Callbacks → Angular @Outputs
  { fcOption: 'eventClick(info)',          dsInput: '(eventClick)',                notes: 'Both provide { event, el, jsEvent }', compatible: 'full' },
  { fcOption: 'eventChange(info)',         dsInput: '(eventChange)',               notes: 'Both provide { event, oldEvent, revert }', compatible: 'full' },
  { fcOption: 'select(info)',              dsInput: '(select)',                    notes: 'Both provide { start, end, resource }', compatible: 'full' },
  { fcOption: 'datesSet(info)',            dsInput: '(datesSet)',                  notes: 'Both provide { view, start, end, title }', compatible: 'full' },
  { fcOption: 'dateClick(info)',           dsInput: '(dateClick)',                 notes: 'Both provide { date, resource, jsEvent }', compatible: 'full' },
  // Overlap / constraints
  { fcOption: 'eventOverlap (boolean/fn)', dsInput: '[eventOverlap]',             notes: "FC: boolean or function; ds: 'multiple'|'single' mode", compatible: 'partial' },
  // Theme
  { fcOption: 'themeSystem',               dsInput: '[theme]',                    notes: "FC: 'standard'|'bootstrap'; ds: 'light'|'dark'", compatible: 'partial' }
];
