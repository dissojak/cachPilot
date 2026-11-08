export class DateOnly {
  private constructor(readonly value: string) {}

  static from(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date");
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
    return new DateOnly(value);
  }

  static today() {
    return DateOnly.from(new Date().toISOString().slice(0, 10));
  }

  addDays(days: number) {
    const date = new Date(`${this.value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return DateOnly.from(date.toISOString().slice(0, 10));
  }

  isBefore(other: DateOnly) {
    return this.value < other.value;
  }

  isAfter(other: DateOnly) {
    return this.value > other.value;
  }

  equals(other: DateOnly) {
    return this.value === other.value;
  }
}
