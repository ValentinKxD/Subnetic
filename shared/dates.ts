import type { BillingPeriod } from './money.js';

/** Дати як рядки 'YYYY-MM-DD' (без часових поясів) і місяці як 'YYYY-MM' */

export type ISODate = string;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isISODate(v: string): boolean {
  if (!ISO_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isISOMonth(v: string): boolean {
  return MONTH_RE.test(v);
}

function parse(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function fmt(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

/** Сьогоднішня дата за локальним часом. */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

/** Додає місяці, обрізаючи день до кінця місяця (31 січ + 1 міс = 28/29 лют). */
export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return fmt(d);
}

export function addPeriod(iso: ISODate, period: BillingPeriod, times = 1): ISODate {
  switch (period) {
    case 'week':
      return addDays(iso, 7 * times);
    case 'month':
      return addMonths(iso, times);
    case 'quarter':
      return addMonths(iso, 3 * times);
    case 'year':
      return addMonths(iso, 12 * times);
  }
}

/** Кількість днів від `from` до `to` (може бути від'ємною). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

export function monthOf(iso: ISODate): string {
  return iso.slice(0, 7);
}

export function addMonthsToMonth(month: string, n: number): string {
  return monthOf(addMonths(`${month}-01`, n));
}

export function monthRange(month: string): { start: ISODate; end: ISODate } {
  const start = `${month}-01`;
  return { start, end: addDays(addMonths(start, 1), -1) };
}
