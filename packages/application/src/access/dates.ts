import { DateOnly, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Clock } from "../ports/clock";

/**
 * A realized operation (payment, cash movement) cannot be dated in the
 * future: it would be missing from both the real balance and the forecast.
 */
export function realizedDate(value: string, clock: Clock): DateOnly {
  const date = DateOnly.from(value);
  if (date.isAfter(clock.today())) {
    throw new DomainError(DOMAIN_ERROR_CODES.INVALID_DATE, "A realized operation cannot be dated in the future");
  }
  return date;
}
