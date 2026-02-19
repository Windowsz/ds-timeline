import { Injectable } from '@angular/core';
import { CalendarView, SlotDuration, TimelineResult, HeaderTier } from './ngx-timeline-calendar.types';

@Injectable({ providedIn: 'root' })
export class NgxTimelineCalendarService {

  buildTimeline(view: CalendarView, date: Date, slotDuration: SlotDuration, slotMinWidth: number): TimelineResult {
    switch (view) {
      case 'resourceTimelineDay':   return this.buildDay(date, slotDuration, slotMinWidth);
      case 'resourceTimelineMonth': return this.buildMonth(date, slotMinWidth);
      default:                      return this.buildWeek(date, slotMinWidth);
    }
  }

  private buildDay(date: Date, slotDuration: SlotDuration, slotMinWidth: number): TimelineResult {
    const start = this.startOfDay(date);
    const slots: Date[] = [];
    const slotMs = this.slotMs(slotDuration);
    const count = Math.floor((24 * 3600000) / slotMs);
    const slotWidth = Math.max(slotMinWidth, 56);
    for (let i = 0; i < count; i++) slots.push(new Date(start.getTime() + i * slotMs));
    const tier1: HeaderTier[] = [{ label: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), width: slots.length * slotWidth }];
    return { slots, tier1, slotWidth, totalWidth: slots.length * slotWidth, title: tier1[0].label };
  }

  private buildWeek(date: Date, slotMinWidth: number): TimelineResult {
    const ws = this.startOfWeek(date);
    const slots: Date[] = [];
    const slotWidth = Math.max(slotMinWidth, 80);
    for (let d = 0; d < 7; d++) slots.push(new Date(ws.getTime() + d * 86400000));
    const we = new Date(ws.getTime() + 6 * 86400000);
    const tier1: HeaderTier[] = [{ label: ws.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), width: 7 * slotWidth }];
    return { slots, tier1, slotWidth, totalWidth: slots.length * slotWidth, title: this.shortDate(ws) + ' \u2013 ' + this.shortDate(we) };
  }

  private buildMonth(date: Date, slotMinWidth: number): TimelineResult {
    const ms = this.startOfMonth(date);
    const me = this.endOfMonth(date);
    const slots: Date[] = [];
    const slotWidth = Math.max(slotMinWidth, 36);
    const cur = new Date(ms);
    while (cur <= me) { slots.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { slots, tier1: [{ label, width: slots.length * slotWidth }], slotWidth, totalWidth: slots.length * slotWidth, title: label };
  }

  getViewStart(view: CalendarView, date: Date): Date {
    if (view === 'resourceTimelineDay')   return this.startOfDay(date);
    if (view === 'resourceTimelineMonth') return this.startOfMonth(date);
    return this.startOfWeek(date);
  }

  getViewEnd(view: CalendarView, date: Date): Date {
    if (view === 'resourceTimelineDay')   return new Date(this.startOfDay(date).getTime() + 86400000); // exact midnight = no scrollbar overflow
    if (view === 'resourceTimelineMonth') { const e = this.endOfMonth(date); e.setDate(e.getDate() + 1); return e; }
    return new Date(this.startOfWeek(date).getTime() + 7 * 86400000);
  }

  formatSlotLabel(date: Date, view: CalendarView, slotDuration: SlotDuration, timeFormat: '12h' | '24h' = '12h'): string {
    if (view === 'resourceTimelineDay') {
      if (timeFormat === '24h') {
        const h = date.getHours();
        const m = date.getMinutes();
        return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
      }
      const h = date.getHours() % 12 || 12;
      const m = date.getMinutes();
      const p = date.getHours() >= 12 ? 'PM' : 'AM';
      return h + (m ? ':' + (m < 10 ? '0' + m : m) : '') + ' ' + p;
    }
    if (view === 'resourceTimelineWeek') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()] + ' ' + date.getDate();
    }
    return '' + date.getDate();
  }

  isWeekend(date: Date): boolean { const d = date.getDay(); return d === 0 || d === 6; }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  isToday(date: Date, view: CalendarView): boolean {
    const now = new Date();
    if (view === 'resourceTimelineDay') return date.getHours() === now.getHours() && this.isSameDay(date, now);
    return this.isSameDay(date, now);
  }

  getContrastColor(hex: string): string {
    try {
      const c = (hex || '#3d91ff').replace('#', '');
      if (c.length < 6) return '#ffffff';
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1d23' : '#ffffff';
    } catch { return '#ffffff'; }
  }

  slotMs(slot: SlotDuration): number {
    const map: { [k: string]: number } = { '00:15:00': 900000, '00:30:00': 1800000, '01:00:00': 3600000, '06:00:00': 21600000, '1.00:00:00': 86400000 };
    return map[slot] || 3600000;
  }

  startOfDay(d: Date): Date   { const r = new Date(d); r.setHours(0,0,0,0); return r; }
  endOfDay(d: Date): Date     { const r = new Date(d); r.setHours(23,59,59,999); return r; }
  startOfWeek(d: Date): Date  { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r; }
  startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
  endOfMonth(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
  private shortDate(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
}
