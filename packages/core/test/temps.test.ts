import { describe, expect, it } from 'vitest';
import {
  dateLocale,
  heureLocale,
  jourCourtLocal,
  jourLocal,
  jourSemaineLocal,
  versUtc,
} from '../src';

describe('temps', () => {
  it('runs on a device set to New York time', () => {
    expect(new Date('2026-10-26T07:30:00.000Z').getHours()).toBe(3);
  });

  it('shows Tunis wall time whatever the device zone', () => {
    expect(heureLocale('2026-10-26T07:30:00.000Z')).toBe('08:30');
    expect(jourLocal('2026-10-26T07:30:00.000Z')).toBe('lundi 26 octobre');
    expect(jourCourtLocal('2026-10-26T07:30:00.000Z')).toBe('Lun. 26 oct.');
    expect(dateLocale('2026-10-25T23:30:00.000Z')).toBe('2026-10-26');
  });

  it('converts Tunis wall time to UTC', () => {
    expect(versUtc('2026-10-26', '08:30')).toBe('2026-10-26T07:30:00.000Z');
    expect(versUtc('2026-10-26', '00:15')).toBe('2026-10-25T23:15:00.000Z');
  });

  it('numbers weekdays from lundi = 1 in Tunis', () => {
    expect(jourSemaineLocal('2026-10-25T23:30:00.000Z')).toBe(1); // 00:30 lundi a Tunis
    expect(jourSemaineLocal('2026-10-25T12:00:00.000Z')).toBe(7);
  });
});
