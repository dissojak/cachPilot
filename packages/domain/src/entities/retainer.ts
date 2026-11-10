import { RetainerId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import type { PartyId } from "../value-objects/ids";
import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type RetainerStatus = "active" | "paused";

interface RetainerProps {
  companyId: CompanyId;
  customerId: PartyId;
  name: string;
  amount: Money;
  intervalDays: number;
  nextGenerationDate: DateOnly;
  status: RetainerStatus;
}

type RetainerTerms = Pick<RetainerProps, "customerId" | "name" | "amount" | "intervalDays" | "nextGenerationDate">;

/**
 * Original feature (digital agency): a recurring retainer generates one
 * validated invoice per period. Pausing stops future invoices.
 */
export class Retainer {
  private constructor(
    readonly id: RetainerId,
    private props: RetainerProps,
  ) {}

  static create(input: { id?: RetainerId; companyId: CompanyId } & RetainerTerms) {
    Retainer.assertTerms(input);
    return new Retainer(input.id ?? RetainerId.next(), {
      companyId: input.companyId,
      customerId: input.customerId,
      name: input.name.trim(),
      amount: input.amount,
      intervalDays: input.intervalDays,
      nextGenerationDate: input.nextGenerationDate,
      status: "active",
    });
  }

  static restore(input: { id: RetainerId } & RetainerProps) {
    return new Retainer(input.id, {
      companyId: input.companyId,
      customerId: input.customerId,
      name: input.name,
      amount: input.amount,
      intervalDays: input.intervalDays,
      nextGenerationDate: input.nextGenerationDate,
      status: input.status,
    });
  }

  get companyId() { return this.props.companyId; }
  get customerId() { return this.props.customerId; }
  get name() { return this.props.name; }
  get amount() { return this.props.amount; }
  get intervalDays() { return this.props.intervalDays; }
  get nextGenerationDate() { return this.props.nextGenerationDate; }
  get status() { return this.props.status; }

  pause() {
    if (this.props.status !== "active") throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only an active retainer can be paused");
    this.props.status = "paused";
  }

  resume() {
    if (this.props.status !== "paused") throw new DomainError(DOMAIN_ERROR_CODES.INVALID_TRANSITION, "Only a paused retainer can be resumed");
    this.props.status = "active";
  }

  update(changes: Partial<RetainerTerms>) {
    const next = { ...this.props, ...changes };
    Retainer.assertTerms(next);
    this.props = { ...next, name: next.name.trim() };
  }

  /** Period start dates that are due on or before `asOf` (none when paused). Pure. */
  dueDates(asOf: DateOnly): DateOnly[] {
    if (this.props.status !== "active") return [];
    const dates: DateOnly[] = [];
    let date = this.props.nextGenerationDate;
    while (!date.isAfter(asOf)) {
      dates.push(date);
      date = date.addDays(this.props.intervalDays);
    }
    return dates;
  }

  advance() {
    this.props.nextGenerationDate = this.props.nextGenerationDate.addDays(this.props.intervalDays);
  }

  private static assertTerms(terms: RetainerTerms) {
    if (terms.name.trim().length === 0) throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "A retainer needs a name");
    if (!terms.amount.isPositive()) throw new DomainError(DOMAIN_ERROR_CODES.INVALID_MONEY_AMOUNT, "A retainer amount must be positive");
    if (!Number.isInteger(terms.intervalDays) || terms.intervalDays < 1 || terms.intervalDays > 366) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "The interval must be between 1 and 366 days");
    }
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      customerId: this.props.customerId.value,
      name: this.props.name,
      amountMillimes: this.props.amount.amount,
      intervalDays: this.props.intervalDays,
      nextGenerationDate: this.props.nextGenerationDate.value,
      status: this.props.status,
    };
  }
}
