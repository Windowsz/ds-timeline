import { Injectable } from '@angular/core';
import { CalendarView, SlotDuration, TimelineResult, HeaderTier, BuildOptions } from './ds-timeline.types';

@Injectable({ providedIn: 'root' })
export class DsTimelineService {

  buildTimeline(opts: BuildOptions): TimelineResult {
    const {
      view, date, slotDuration, slotMinWidth,
      containerWidth = 0, slotMinTime = '00:00:00', slotMaxTime = '24:00:00',
      locale = 'en-US', firstDay = 0, hiddenDays = [], weekNumbers = false
    } = opts;
    switch (view) {
      case 'resourceTimelineDay':   return this.buildDay(date, slotDuration, slotMinWidth, slotMinTime, slotMaxTime, locale);
      case 'resourceTimelineMonth': return this.buildMonth(date, slotMinWidth, containerWidth, locale, hiddenDays, weekNumbers, firstDay);
      default:                      return this.buildWeek(date, slotMinWidth, containerWidth, locale, firstDay, hiddenDays, weekNumbers);
    }
  }

  private buildDay(date: Date, slotDuration: SlotDuration, slotMinWidth: number, slotMinTime: string, slotMaxTime: string, locale: string): TimelineResult {
    const dayStart  = this.startOfDay(date);
    const slotMs    = this.slotMs(slotDuration);
    const slotWidth = Math.max(slotMinWidth, 56);
    const minMs     = this.parseTimeMs(slotMinTime);
    const maxMs     = this.parseTimeMs(slotMaxTime);
    const rangeMs   = Math.max(0, maxMs - minMs);
    const count     = Math.floor(rangeMs / slotMs);
    const slots: Date[] = [];
    for (let i = 0; i < count; i++) slots.push(new Date(dayStart.getTime() + minMs + i * slotMs));
    const tier1: HeaderTier[] = [{ label: date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), width: slots.length * slotWidth }];
    return { slots, tier1, slotWidth, totalWidth: slots.length * slotWidth, title: tier1[0].label };
  }

  private buildWeek(date: Date, slotMinWidth: number, containerWidth: number, locale: string, firstDay: number, hiddenDays: number[], weekNumbers: boolean): TimelineResult {
    const ws = this.startOfWeek(date, firstDay);
    const allSlots: Date[] = [];
    for (let d = 0; d < 7; d++) allSlots.push(new Date(ws.getTime() + d * 86400000));
    const slots = hiddenDays.length ? allSlots.filter(s => !hiddenDays.includes(s.getDay())) : allSlots;
    if (slots.length === 0) {
      return { slots: [], tier1: [{ label: '', width: 0 }], slotWidth: slotMinWidth, totalWidth: 0, title: '' };
    }
    const count = slots.length;
    const slotWidth = containerWidth > 0
      ? Math.max(slotMinWidth, Math.floor(containerWidth / count))
      : Math.max(slotMinWidth, 80);
    const visStart = slots[0];
    const visEnd   = slots[count - 1];
    let title = this.shortDate(visStart, locale) + ' – ' + this.shortDate(visEnd, locale);
    if (weekNumbers) title = 'W' + this.getWeekNumber(ws) + ': ' + title;
    const tier1: HeaderTier[] = [{ label: visStart.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), width: count * slotWidth }];
    return { slots, tier1, slotWidth, totalWidth: count * slotWidth, title };
  }

  private buildMonth(date: Date, slotMinWidth: number, containerWidth: number, locale: string, hiddenDays: number[], weekNumbers: boolean, firstDay: number): TimelineResult {
    const ms = this.startOfMonth(date);
    const me = this.endOfMonth(date);
    const allSlots: Date[] = [];
    const cur = new Date(ms);
    while (cur <= me) { allSlots.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    const slots = hiddenDays.length ? allSlots.filter(s => !hiddenDays.includes(s.getDay())) : allSlots;
    const count = slots.length || 1;
    const slotWidth = containerWidth > 0
      ? Math.max(slotMinWidth, Math.floor(containerWidth / count))
      : Math.max(slotMinWidth, 36);
    const label = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return { slots, tier1: [{ label, width: count * slotWidth }], slotWidth, totalWidth: count * slotWidth, title: label };
  }

  getViewStart(view: CalendarView, date: Date, slotMinTime = '00:00:00', firstDay = 0): Date {
    if (view === 'resourceTimelineDay') {
      const s = this.startOfDay(date);
      const minMs = this.parseTimeMs(slotMinTime);
      return new Date(s.getTime() + minMs);
    }
    if (view === 'resourceTimelineMonth') return this.startOfMonth(date);
    return this.startOfWeek(date, firstDay);
  }

  getViewEnd(view: CalendarView, date: Date, slotMaxTime = '24:00:00', firstDay = 0): Date {
    if (view === 'resourceTimelineDay') {
      const s    = this.startOfDay(date);
      const maxMs = this.parseTimeMs(slotMaxTime);
      return new Date(s.getTime() + maxMs);
    }
    if (view === 'resourceTimelineMonth') { const e = this.endOfMonth(date); e.setDate(e.getDate() + 1); return e; }
    return new Date(this.startOfWeek(date, firstDay).getTime() + 7 * 86400000);
  }

  formatSlotLabel(date: Date, view: CalendarView, slotDuration: SlotDuration, timeFormat: '12h' | '24h' = '12h', locale = 'en-US', weekNumbers = false, firstDay = 0): string {
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
      return date.toLocaleDateString(locale, { weekday: 'short' }) + ' ' + date.getDate();
    }
    // Month view: show week number prefix on first day of each week
    if (weekNumbers && date.getDay() === firstDay) {
      return 'W' + this.getWeekNumber(date) + ' ' + date.getDate();
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

  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

  /** Parse 'HH:MM:SS' (or '24:00:00') → milliseconds from midnight. */
  parseTimeMs(t: string): number {
    const parts = (t || '00:00:00').split(':').map(Number);
    return ((parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)) * 1000;
  }

  startOfDay(d: Date): Date   { const r = new Date(d); r.setHours(0,0,0,0); return r; }
  endOfDay(d: Date): Date     { const r = new Date(d); r.setHours(23,59,59,999); return r; }
  startOfWeek(d: Date, firstDay = 0): Date {
    const r = new Date(d);
    const offset = (r.getDay() - firstDay + 7) % 7;
    r.setDate(r.getDate() - offset);
    r.setHours(0, 0, 0, 0);
    return r;
  }
  startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
  endOfMonth(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
  private shortDate(d: Date, locale = 'en-US'): string { return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }); }
}
