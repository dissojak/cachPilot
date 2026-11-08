import { Money } from "../value-objects/money";
import { DateOnly } from "../value-objects/date-only";

export interface ExpectedReceipt {
  dueDate: DateOnly;
  remaining: Money;
}

export interface PlannedDisbursement {
  plannedDate: DateOnly;
  amount: Money;
}

export class ForecastEngine {
  forecast(referenceBalance: Money, receipts: ExpectedReceipt[], disbursements: PlannedDisbursement[], targetDate: DateOnly) {
    const receiptTotal = receipts
      .filter((item) => !item.dueDate.isAfter(targetDate))
      .reduce((sum, item) => sum.add(item.remaining), Money.of(0, referenceBalance.currency));
    const disbursementTotal = disbursements
      .filter((item) => !item.plannedDate.isAfter(targetDate))
      .reduce((sum, item) => sum.add(item.amount), Money.of(0, referenceBalance.currency));
    return referenceBalance.add(receiptTotal).subtract(disbursementTotal);
  }
}
