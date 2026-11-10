import type { DateOnly } from "@cashpilot/domain";

export interface Clock {
  today(): DateOnly;
  now(): Date;
}
