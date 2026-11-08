import { DateOnly } from "../value-objects/date-only";

export class ScenarioEngine {
  shiftDate(date: DateOnly, days: number) {
    return date.addDays(days);
  }
}
