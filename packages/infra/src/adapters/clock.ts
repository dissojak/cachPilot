import { DateOnly } from "@cashpilot/domain";
import type { Clock } from "@cashpilot/application";

/**
 * The only place that reads the system time.
 * For demos, DEMO_DATE=YYYY-MM-DD makes "today" that day (the time of day keeps running).
 * Leave it unset in production.
 */
export class SystemClock implements Clock {
  private readonly offsetMs: number;

  constructor(demoDate: string | undefined = process.env.DEMO_DATE) {
    if (!demoDate) {
      this.offsetMs = 0;
      return;
    }
    const target = DateOnly.from(demoDate);
    const targetMs = Date.parse(`${target.value}T${new Date().toISOString().slice(11)}`);
    this.offsetMs = targetMs - Date.now();
  }

  today() { return DateOnly.fromDate(this.now()); }
  now() { return new Date(Date.now() + this.offsetMs); }
}
