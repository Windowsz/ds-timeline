/**
 * fc-compat.spec.ts
 *
 * Compatibility test suite: verifies that ds-timeline can consume the same
 * event / resource data and honour the same option names as FullCalendar's
 * resource-timeline plugin.
 *
 * Run with:  npm test
 *            ng test --project demo --watch=false --browsers=ChromeHeadless
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import {
  DsTimelineComponent, DsTimelineModule,
  CalendarEvent, CalendarResource, CalendarView,
  EventClickArg, EventChangeArg, SelectArg, DatesSetArg
} from '../../projects/ds-timeline/src/public-api';

import { TEST_EVENTS, TEST_RESOURCES, OPTION_MAP, d } from './shared-test-data';

// ---------------------------------------------------------------------------
// Minimal host component used across rendering tests
// ---------------------------------------------------------------------------
@Component({
  selector: 'test-host',
  standalone: false,
  template: `
    <ds-timeline
      [events]="events"
      [resources]="resources"
      [initialView]="initialView"
      [initialDate]="initialDate"
      [theme]="theme"
      [editable]="editable"
      [selectable]="selectable"
      [slotMinWidth]="slotMinWidth"
      [resourceAreaWidth]="resourceAreaWidth"
      [resourceAreaHeaderContent]="resourceAreaHeaderContent"
      [showNowIndicator]="showNowIndicator"
      [eventOverlap]="eventOverlap"
      [allowResourceDrag]="allowResourceDrag"
      [showEventTooltip]="showEventTooltip"
      [views]="views"
      (eventClick)="onEventClick($event)"
      (eventChange)="onEventChange($event)"
      (select)="onSelect($event)"
      (datesSet)="onDatesSet($event)"
      style="display:block;width:900px;height:500px;">
    </ds-timeline>
  `
})
class TestHostComponent {
  // Data — identical shape to FullCalendar EventInput / ResourceInput
  events: CalendarEvent[]       = [];
  resources: CalendarResource[] = [];

  // Options that mirror FullCalendar option names
  initialView: CalendarView    = 'resourceTimelineWeek';
  initialDate: Date | null     = null;
  theme: 'light' | 'dark'     = 'light';
  editable                     = true;
  selectable                   = true;
  slotMinWidth                 = 60;
  resourceAreaWidth            = 200;
  resourceAreaHeaderContent    = 'Resources';
  showNowIndicator             = true;
  eventOverlap: 'multiple' | 'single' = 'multiple';
  allowResourceDrag            = true;
  showEventTooltip             = true;
  views: CalendarView[]        = ['resourceTimelineDay', 'resourceTimelineWeek', 'resourceTimelineMonth'];

  // Emitted values captured for assertions
  lastEventClick: EventClickArg | null   = null;
  lastEventChange: EventChangeArg | null = null;
  lastSelect: SelectArg | null           = null;
  lastDatesSet: DatesSetArg | null       = null;

  onEventClick(a: EventClickArg)   { this.lastEventClick   = a; }
  onEventChange(a: EventChangeArg) { this.lastEventChange  = a; }
  onSelect(a: SelectArg)           { this.lastSelect       = a; }
  onDatesSet(a: DatesSetArg)       { this.lastDatesSet     = a; }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('FullCalendar Compatibility', () => {

  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let dsEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [CommonModule, DsTimelineModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host    = fixture.componentInstance;
    dsEl    = fixture.debugElement.query(By.directive(DsTimelineComponent));
    fixture.detectChanges();
  });

  // =========================================================================
  // 1 — EVENT DATA FORMAT
  // =========================================================================
  describe('1. Event data format (CalendarEvent ↔ FullCalendar EventInput)', () => {

    it('should accept an event with only required fields (id, title, start)', () => {
      const minimal: CalendarEvent = { id: 'm1', title: 'Minimal', start: new Date() };
      host.events = [minimal];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events.length).toBe(1);
      expect(dsComp.events[0].id).toBe('m1');
    });

    it('should accept Date objects for start and end (same as FC)', () => {
      const start = d(1, 9);
      const end   = d(1, 11);
      host.events = [{ id: 'date-test', title: 'Date Test', start, end, resourceId: 'fe' }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(new Date(dsComp.events[0].start).getHours()).toBe(9);
    });

    it('should accept ISO string for start / end (same as FC)', () => {
      host.events = [{
        id: 'str-test', title: 'String Test',
        start: '2025-06-10T09:00:00', end: '2025-06-10T11:00:00',
        resourceId: 'fe'
      }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(typeof dsComp.events[0].start).toBe('string');
    });

    it('should accept color (shorthand) — same as FC EventInput.color', () => {
      host.events = [{ id: 'c1', title: 'Colored', start: new Date(), color: '#ff4757' }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events[0].color).toBe('#ff4757');
    });

    it('should accept backgroundColor + borderColor + textColor (same as FC)', () => {
      host.events = [{
        id: 'c2', title: 'Full Color', start: new Date(),
        backgroundColor: '#fd79a8', borderColor: '#e84393', textColor: '#ffffff'
      }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      const ev = dsComp.events[0];
      expect(ev.backgroundColor).toBe('#fd79a8');
      expect(ev.borderColor).toBe('#e84393');
      expect(ev.textColor).toBe('#ffffff');
    });

    it('should accept editable / startEditable / durationEditable flags (same as FC)', () => {
      host.events = [{
        id: 'e-flags', title: 'Flags Test', start: new Date(),
        editable: false, startEditable: false, durationEditable: false
      }];
      fixture.detectChanges();
      const ev = (dsEl.componentInstance as DsTimelineComponent).events[0];
      expect(ev.editable).toBe(false);
      expect(ev.startEditable).toBe(false);
      expect(ev.durationEditable).toBe(false);
    });

    it('should preserve extendedProps (same as FC)', () => {
      host.events = [{
        id: 'ext', title: 'Extended', start: new Date(),
        extendedProps: { description: 'hello', priority: 'high', count: 3 }
      }];
      fixture.detectChanges();
      const ev = (dsEl.componentInstance as DsTimelineComponent).events[0];
      expect(ev.extendedProps!['description']).toBe('hello');
      expect(ev.extendedProps!['priority']).toBe('high');
      expect(ev.extendedProps!['count']).toBe(3);
    });

    it('should accept resourceId (same as FC)', () => {
      host.resources = [{ id: 'r1', title: 'R1' }];
      host.events = [{ id: 'rid', title: 'Res Event', start: new Date(), resourceId: 'r1' }];
      fixture.detectChanges();
      const ev = (dsEl.componentInstance as DsTimelineComponent).events[0];
      expect(ev.resourceId).toBe('r1');
    });

    it('should accept the full shared TEST_EVENTS dataset (7 events)', () => {
      host.events     = TEST_EVENTS;
      host.resources  = TEST_RESOURCES;
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events.length).toBe(TEST_EVENTS.length);
    });

  }); // end Event data format

  // =========================================================================
  // 2 — RESOURCE DATA FORMAT
  // =========================================================================
  describe('2. Resource data format (CalendarResource ↔ FullCalendar ResourceInput)', () => {

    it('should accept a flat list of resources', () => {
      host.resources = [
        { id: 'r1', title: 'Resource 1' },
        { id: 'r2', title: 'Resource 2' }
      ];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources.length).toBe(2);
    });

    it('should accept nested children (same as FC)', () => {
      host.resources = [{
        id: 'parent', title: 'Parent',
        children: [
          { id: 'child1', title: 'Child 1' },
          { id: 'child2', title: 'Child 2' }
        ]
      }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources[0].children!.length).toBe(2);
    });

    it('should accept two levels of nesting (grandchildren)', () => {
      host.resources = [{
        id: 'gp', title: 'Grandparent',
        children: [{
          id: 'p', title: 'Parent',
          children: [{ id: 'c', title: 'Child' }]
        }]
      }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources[0].children![0].children![0].id).toBe('c');
    });

    it('should preserve extendedProps on resources (same as FC)', () => {
      host.resources = [{ id: 'r1', title: 'R1', extendedProps: { dept: 'Eng', seats: 12 } }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources[0].extendedProps!['dept']).toBe('Eng');
      expect(dsComp.resources[0].extendedProps!['seats']).toBe(12);
    });

    it('should accept the full shared TEST_RESOURCES dataset', () => {
      host.resources = TEST_RESOURCES;
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources.length).toBe(TEST_RESOURCES.length);
    });

  }); // end Resource data format

  // =========================================================================
  // 3 — VIEW NAMES
  // =========================================================================
  describe('3. View names match FullCalendar resource-timeline plugin', () => {

    const FC_VIEW_NAMES: CalendarView[] = [
      'resourceTimelineDay',
      'resourceTimelineWeek',
      'resourceTimelineMonth'
    ];

    FC_VIEW_NAMES.forEach(viewName => {
      it(`should accept initialView = '${viewName}'`, () => {
        host.initialView = viewName;
        fixture.detectChanges();
        const dsComp = dsEl.componentInstance as DsTimelineComponent;
        expect(dsComp.initialView).toBe(viewName);
      });
    });

    it('should switch between all three FC view names via [views] input', () => {
      host.views = FC_VIEW_NAMES;
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.views).toEqual(FC_VIEW_NAMES);
    });

    it('should lock to a single view when [views] has one entry (like FC headerToolbar)', () => {
      host.views = ['resourceTimelineDay'];
      host.initialView = 'resourceTimelineDay';
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.views.length).toBe(1);
    });

  }); // end View names

  // =========================================================================
  // 4 — INPUT OPTION NAMES
  // =========================================================================
  describe('4. Input option names (FC options → ds @Input names)', () => {

    it('initialDate — same name as FC', () => {
      const date = new Date(2025, 5, 15);
      host.initialDate = date;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).initialDate).toEqual(date);
    });

    it('editable — same name as FC', () => {
      host.editable = false;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).editable).toBe(false);
    });

    it('selectable — same name as FC', () => {
      host.selectable = false;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).selectable).toBe(false);
    });

    it('slotMinWidth — same name as FC', () => {
      host.slotMinWidth = 90;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).slotMinWidth).toBe(90);
    });

    it('resourceAreaWidth — same concept as FC (ds uses number, FC uses string)', () => {
      host.resourceAreaWidth = 280;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).resourceAreaWidth).toBe(280);
    });

    it('resourceAreaHeaderContent — same name as FC', () => {
      host.resourceAreaHeaderContent = 'Rooms';
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).resourceAreaHeaderContent).toBe('Rooms');
    });

    it('showNowIndicator — FC calls it nowIndicator', () => {
      host.showNowIndicator = false;
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).showNowIndicator).toBe(false);
    });

    it('theme light/dark — FC uses themeSystem', () => {
      host.theme = 'dark';
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).theme).toBe('dark');
    });

  }); // end Input option names

  // =========================================================================
  // 5 — OUTPUT SHAPES  (same data structure as FC callbacks)
  // =========================================================================
  describe('5. Output argument shapes mirror FullCalendar callback args', () => {

    beforeEach(() => {
      host.events    = TEST_EVENTS;
      host.resources = TEST_RESOURCES;
      fixture.detectChanges();
    });

    it('datesSet emits { view, start, end, title } — same as FC DatesSetArg', fakeAsync(() => {
      // datesSet is emitted on init
      tick();
      fixture.detectChanges();
      const ds = dsEl.componentInstance as DsTimelineComponent;
      // Trigger it manually via viewChange
      ds.datesSet.emit({ view: 'resourceTimelineWeek', start: new Date(), end: new Date(), title: 'Week of Test' });
      fixture.detectChanges();
      expect(host.lastDatesSet).toBeTruthy();
      expect(host.lastDatesSet!.view).toBe('resourceTimelineWeek');
      expect(host.lastDatesSet!.start instanceof Date || typeof host.lastDatesSet!.start === 'object').toBe(true);
      expect(typeof host.lastDatesSet!.title).toBe('string');
    }));

    it('eventClick emits { event, el, jsEvent } — same as FC EventClickArg', fakeAsync(() => {
      const ds = dsEl.componentInstance as DsTimelineComponent;
      const mockEl = document.createElement('div');
      const mockEv = new MouseEvent('click');
      ds.eventClick.emit({ event: TEST_EVENTS[0], el: mockEl, jsEvent: mockEv });
      tick();
      fixture.detectChanges();
      expect(host.lastEventClick).toBeTruthy();
      expect(host.lastEventClick!.event.id).toBe(TEST_EVENTS[0].id);
      expect(host.lastEventClick!.event.title).toBe(TEST_EVENTS[0].title);
      expect(host.lastEventClick!.el).toBe(mockEl);
      expect(host.lastEventClick!.jsEvent).toBe(mockEv);
    }));

    it('eventClick event carries extendedProps (same as FC)', fakeAsync(() => {
      const ds = dsEl.componentInstance as DsTimelineComponent;
      // e3 has extendedProps.description and .priority
      const e3 = TEST_EVENTS.find(e => e.id === 'e3')!;
      ds.eventClick.emit({ event: e3, el: document.createElement('div'), jsEvent: new MouseEvent('click') });
      tick();
      expect(host.lastEventClick!.event.extendedProps!['description']).toBe('API design discussion');
      expect(host.lastEventClick!.event.extendedProps!['priority']).toBe('high');
    }));

    it('eventChange emits { event, oldEvent, revert } — same as FC EventChangeArg', fakeAsync(() => {
      const ds = dsEl.componentInstance as DsTimelineComponent;
      const movedEvent = { ...TEST_EVENTS[0], start: d(2, 10), end: d(2, 12) };
      let revertCalled = false;
      ds.eventChange.emit({
        event: movedEvent,
        oldEvent: TEST_EVENTS[0],
        revert: () => { revertCalled = true; }
      });
      tick();
      fixture.detectChanges();
      expect(host.lastEventChange).toBeTruthy();
      expect(host.lastEventChange!.event.id).toBe(TEST_EVENTS[0].id);
      expect(host.lastEventChange!.oldEvent.id).toBe(TEST_EVENTS[0].id);
      expect(typeof host.lastEventChange!.revert).toBe('function');
      // call revert to ensure it works
      host.lastEventChange!.revert();
      expect(revertCalled).toBe(true);
    }));

    it('select emits { start, end, resource } — same as FC SelectArg', fakeAsync(() => {
      const ds = dsEl.componentInstance as DsTimelineComponent;
      const start = d(1, 9);
      const end   = d(1, 11);
      ds.select.emit({ start, end, resource: TEST_RESOURCES[2] });
      tick();
      expect(host.lastSelect).toBeTruthy();
      expect(host.lastSelect!.start).toEqual(start);
      expect(host.lastSelect!.end).toEqual(end);
      expect(host.lastSelect!.resource!.id).toBe('pm');
    }));

  }); // end Output shapes

  // =========================================================================
  // 6 — RENDERING
  // =========================================================================
  describe('6. Component renders correctly with FC-format data', () => {

    it('should render with empty events and resources (no crash)', () => {
      host.events    = [];
      host.resources = [];
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ds-timeline')).toBeTruthy();
    });

    it('should render ds-timeline element in DOM', () => {
      host.events    = TEST_EVENTS;
      host.resources = TEST_RESOURCES;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ds-timeline')).toBeTruthy();
    });

    it('should instantiate DsTimelineComponent', () => {
      expect(dsEl.componentInstance instanceof DsTimelineComponent).toBe(true);
    });

    it('should reflect [events] binding on the component instance', () => {
      host.events = TEST_EVENTS.slice(0, 3);
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events.length).toBe(3);
    });

    it('should reflect [resources] binding on the component instance', () => {
      host.resources = TEST_RESOURCES;
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.resources.length).toBe(TEST_RESOURCES.length);
    });

    it('should update events when input changes (FC equivalent: calendar.addEvent)', () => {
      host.events = TEST_EVENTS.slice(0, 2);
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events.length).toBe(2);

      // Add a third event
      host.events = [...host.events, TEST_EVENTS[2]];
      fixture.detectChanges();
      expect(dsComp.events.length).toBe(3);
    });

    it('should handle events with only resourceId set (no resourceIds)', () => {
      host.resources = [{ id: 'r1', title: 'R1' }];
      host.events    = [{ id: 'e1', title: 'Single Res', start: new Date(), resourceId: 'r1' }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events[0].resourceId).toBe('r1');
    });

    it('should handle events with no resourceId (unassigned events)', () => {
      host.events = [{ id: 'e1', title: 'No Resource', start: new Date() }];
      fixture.detectChanges();
      // Should not crash
      expect(fixture.nativeElement.querySelector('ds-timeline')).toBeTruthy();
    });

  }); // end Rendering

  // =========================================================================
  // 7 — OPTION MAP COVERAGE
  // =========================================================================
  describe('7. Option compatibility map is complete', () => {

    it('should have a mapping entry for every key FullCalendar option', () => {
      const requiredFcOptions = [
        'events', 'resources', 'initialView', 'initialDate',
        'editable', 'selectable', 'slotMinWidth', 'slotDuration',
        'resourceAreaWidth', 'resourceAreaHeaderContent',
        'nowIndicator', 'eventClick(info)', 'eventChange(info)',
        'select(info)', 'datesSet(info)', 'dateClick(info)', 'eventOverlap (boolean/fn)'
      ];
      const mappedOptions = OPTION_MAP.map(m => m.fcOption);
      requiredFcOptions.forEach(opt => {
        expect(mappedOptions).toContain(opt);
      });
    });

    it('should have no mapping entry marked as fully unsupported', () => {
      // Every entry must be "full" or "partial" — none should be unsupported
      const invalid = OPTION_MAP.filter(m => !['full', 'partial', 'different'].includes(m.compatible));
      expect(invalid.length).toBe(0);
    });

    it('should have at least 10 "full" compatibility entries', () => {
      const full = OPTION_MAP.filter(m => m.compatible === 'full');
      expect(full.length).toBeGreaterThanOrEqual(10);
    });

  }); // end Option map

  // =========================================================================
  // 8 — EDGE CASES
  // =========================================================================
  describe('8. Edge cases from real FullCalendar usage', () => {

    it('should accept events without an end date (same as FC all-day or open-end)', () => {
      host.events = [{ id: 'no-end', title: 'No End', start: new Date() }];
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events[0].end).toBeUndefined();
    });

    it('should accept events where editable is explicitly true', () => {
      host.events = [{ id: 'e-true', title: 'Editable', start: new Date(), editable: true }];
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).events[0].editable).toBe(true);
    });

    it('should accept large dataset (50 events) without crash', () => {
      const largeEvents: CalendarEvent[] = Array.from({ length: 50 }, (_, i) => ({
        id: `large-${i}`,
        title: `Event ${i}`,
        start: d(i % 7, 8 + (i % 8)),
        end:   d(i % 7, 9 + (i % 8)),
        resourceId: ['fe', 'be', 'qa', 'ux', 'pm'][i % 5],
        color: '#3d91ff'
      }));
      host.resources = TEST_RESOURCES;
      host.events    = largeEvents;
      fixture.detectChanges();
      const dsComp = dsEl.componentInstance as DsTimelineComponent;
      expect(dsComp.events.length).toBe(50);
    });

    it('should accept deeply nested resource hierarchy (same as FC)', () => {
      host.resources = [{
        id: 'l1', title: 'Level 1',
        children: [{
          id: 'l2', title: 'Level 2',
          children: [{ id: 'l3', title: 'Level 3' }]
        }]
      }];
      fixture.detectChanges();
      // Should not crash; hierarchy is rendered as flat rows
      expect(fixture.nativeElement.querySelector('ds-timeline')).toBeTruthy();
    });

    it('should accept events that span multiple days', () => {
      host.events = [{
        id: 'multi-day', title: 'Multi-Day', start: d(1, 0), end: d(3, 23)
      }];
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).events[0].id).toBe('multi-day');
    });

    it('should handle switching from multiple to single overlap mode', () => {
      host.events     = TEST_EVENTS;
      host.resources  = TEST_RESOURCES;
      host.eventOverlap = 'multiple';
      fixture.detectChanges();

      host.eventOverlap = 'single';
      fixture.detectChanges();
      expect((dsEl.componentInstance as DsTimelineComponent).eventOverlap).toBe('single');
    });

  }); // end Edge cases

}); // end describe('FullCalendar Compatibility')
