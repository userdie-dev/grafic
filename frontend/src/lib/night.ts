/** Ночная смена: переходит через полночь или начинается поздно вечером. */
export function isNightShift(s: { start: string; end: string }): boolean {
  return s.end <= s.start || s.start >= '22:00'
}
