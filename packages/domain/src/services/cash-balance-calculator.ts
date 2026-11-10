import { Money } from "../value-objects/money";
import type { DateOnly } from "../value-objects/date-only";
import type { CashMovement } from "../entities/cash-movement";

/**
 * BR-17: the real balance is the sum of the company's cash movements up to a
 * date. The opening balance is just the first movement (D2), so there is no
 * second input to double-count.
 */
export class CashBalanceCalculator {
  balanceAt(movements: readonly CashMovement[], date: DateOnly): Money {
    return movements
      .filter((movement) => !movement.movementDate.isAfter(date))
      .reduce((sum, movement) => sum.add(movement.amount), Money.zero());
  }
}
