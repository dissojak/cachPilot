import { Money } from "../value-objects/money";
import type { DateOnly } from "../value-objects/date-only";
import type { CashMovement } from "../entities/cash-movement";
import type { Invoice } from "../entities/invoice";
import type { Expense } from "../entities/expense";
import { CashBalanceCalculator } from "./cash-balance-calculator";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

/** Money the company still expects to receive, anchored to a date (BR-21). */
export interface ExpectedReceipt {
  sourceId: string;
  label: string;
  date: DateOnly;
  amount: Money;
}

/** Money the company plans to pay out, anchored to a date (BR-22). */
export interface PlannedDisbursement {
  sourceId: string;
  label: string;
  date: DateOnly;
  amount: Money;
}

/**
 * Everything the forecast engine needs: the rules that build it live here
 * and nowhere else (P1-7, BR-20).
 */
export interface ForecastInputs {
  referenceDate: DateOnly;
  referenceBalance: Money;
  receipts: ExpectedReceipt[];
  disbursements: PlannedDisbursement[];
}

export interface ForecastPoint {
  date: DateOnly;
  balance: Money;
}

export interface ShortageWindow {
  start: DateOnly;
  end: DateOnly;
  minimum: Money;
  minimumDate: DateOnly;
}

/**
 * The single place where the forecast input rules exist: expected receipts
 * from non-cancelled validated/partially paid invoices at their due date,
 * planned disbursements from approved not-yet-paid expenses, and the real
 * balance as of the reference date from the cash movements (BR-17, BR-21, BR-22).
 */
export function buildForecastInputs(input: {
  referenceDate: DateOnly;
  movements: readonly CashMovement[];
  invoices: readonly Invoice[];
  expenses: readonly Expense[];
}): ForecastInputs {
  const receipts = input.invoices.flatMap((invoice) => {
    const expected = invoice.expectedReceipt();
    if (!expected) return [];
    return [{
      sourceId: expected.invoiceId,
      label: invoice.number.value,
      date: expected.dueDate,
      amount: expected.amount,
    }];
  });
  const disbursements = input.expenses.flatMap((expense) => {
    const planned = expense.plannedDisbursement();
    if (!planned) return [];
    return [{
      sourceId: planned.expenseId,
      label: expense.description,
      date: planned.date,
      amount: planned.amount,
    }];
  });
  return {
    referenceDate: input.referenceDate,
    referenceBalance: new CashBalanceCalculator().balanceAt(input.movements, input.referenceDate),
    receipts,
    disbursements,
  };
}

/**
 * BR-20: forecast at a date = reference balance + receipts with date on or
 * before the target − disbursements with date on or before the target.
 */
export class ForecastEngine {
  balanceAt(inputs: ForecastInputs, target: DateOnly): Money {
    const currency = inputs.referenceBalance.currency;
    const receiptTotal = inputs.receipts
      .filter((receipt) => !receipt.date.isAfter(target))
      .reduce((sum, receipt) => sum.add(receipt.amount), Money.zero(currency));
    const disbursementTotal = inputs.disbursements
      .filter((disbursement) => !disbursement.date.isAfter(target))
      .reduce((sum, disbursement) => sum.add(disbursement.amount), Money.zero(currency));
    return inputs.referenceBalance.add(receiptTotal).subtract(disbursementTotal);
  }

  /** Day 0 … day N inclusive. */
  dailySeries(inputs: ForecastInputs, days: number): ForecastPoint[] {
    if (!Number.isInteger(days) || days < 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, `Number of days must be a non-negative integer: ${days}`);
    }
    const series: ForecastPoint[] = [];
    for (let offset = 0; offset <= days; offset++) {
      const date = inputs.referenceDate.addDays(offset);
      series.push({ date, balance: this.balanceAt(inputs, date) });
    }
    return series;
  }

  /** Reference date then +30, +60 and +90 days. */
  horizons(inputs: ForecastInputs): ForecastPoint[] {
    return [0, 30, 60, 90].map((days) => {
      const date = inputs.referenceDate.addDays(days);
      return { date, balance: this.balanceAt(inputs, date) };
    });
  }
}

/**
 * BR-27: consecutive negative days form one shortage window, with its lowest
 * balance and the date it happens.
 */
export function findShortageWindows(series: readonly ForecastPoint[]): ShortageWindow[] {
  const windows: ShortageWindow[] = [];
  let current: ShortageWindow | null = null;
  for (const point of series) {
    if (!point.balance.isNegative()) {
      if (current) {
        windows.push(current);
        current = null;
      }
      continue;
    }
    if (!current) {
      current = { start: point.date, end: point.date, minimum: point.balance, minimumDate: point.date };
    } else {
      current.end = point.date;
      if (point.balance.amount < current.minimum.amount) {
        current.minimum = point.balance;
        current.minimumDate = point.date;
      }
    }
  }
  if (current) windows.push(current);
  return windows;
}
