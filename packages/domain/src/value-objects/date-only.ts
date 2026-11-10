import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

/** A calendar date with no time and no timezone: always stored and compared as YYYY-MM-DD. */
export class DateOnly {
  private constructor(readonly value: string) {}

  static from(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_DATE, `Invalid date: ${value}`);
    }
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_DATE, `Impossible date: ${value}`);
    }
    return new DateOnly(value);
  }

  /** Converts a JS Date to its UTC calendar date. For the Clock adapter only. */
  static fromDate(date: Date) {
    return DateOnly.from(date.toISOString().slice(0, 10));
  }

  addDays(days: number) {
    if (!Number.isInteger(days)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, `Day offset must be an integer: ${days}`);
    }
    const date = new Date(Date.UTC(
      Number(this.value.slice(0, 4)),
      Number(this.value.slice(5, 7)) - 1,
      Number(this.value.slice(8, 10)) + days,
    ));
    return DateOnly.from(date.toISOString().slice(0, 10));
  }

  /** Whole days from this date to `other` (positive when other is later). */
  daysUntil(other: DateOnly) {
    const ms = Date.UTC(
      Number(other.value.slice(0, 4)),
      Number(other.value.slice(5, 7)) - 1,
      Number(other.value.slice(8, 10)),
    ) - Date.UTC(
      Number(this.value.slice(0, 4)),
      Number(this.value.slice(5, 7)) - 1,
      Number(this.value.slice(8, 10)),
    );
    return Math.round(ms / 86_400_000);
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
