import { DateOnly } from "@cashpilot/domain";
import type { Clock } from "@cashpilot/application";

/** The only place that reads the system time. */
export class SystemClock implements Clock {
  today() { return DateOnly.fromDate(new Date()); }
  now() { return new Date(); }
}
