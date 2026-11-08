import { DateOnly } from "@cashpilot/domain";
import { Clock } from "@cashpilot/application";

export class SystemClock implements Clock {
  today() { return DateOnly.from(new Date().toISOString().slice(0, 10)); }
  now() { return new Date(); }
}
