import { RetainerId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";
import { PartyId } from "../value-objects/ids";
import { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";

export type RetainerStatus = "active" | "paused";

export class Retainer {
  private constructor(
    readonly id: RetainerId,
    private props: {
      companyId: CompanyId;
      customerId: PartyId;
      name: string;
      amount: Money;
      intervalDays: number;
      nextGenerationDate: DateOnly;
      status: RetainerStatus;
    },
  ) {}

  static create(input: {
    id?: RetainerId;
    companyId: CompanyId;
    customerId: PartyId;
    name: string;
    amount: Money;
    intervalDays: number;
    nextGenerationDate: DateOnly;
    status?: RetainerStatus;
  }) {
    return new Retainer(input.id ?? RetainerId.next(), {
      companyId: input.companyId,
      customerId: input.customerId,
      name: input.name,
      amount: input.amount,
      intervalDays: input.intervalDays,
      nextGenerationDate: input.nextGenerationDate,
      status: input.status ?? "active",
    });
  }

  static restore(input: {
    id: RetainerId;
    companyId: CompanyId;
    customerId: PartyId;
    name: string;
    amount: Money;
    intervalDays: number;
    nextGenerationDate: DateOnly;
    status: RetainerStatus;
  }) {
    return new Retainer(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get customerId() { return this.props.customerId; }
  get name() { return this.props.name; }
  get amount() { return this.props.amount; }
  get intervalDays() { return this.props.intervalDays; }
  get nextGenerationDate() { return this.props.nextGenerationDate; }
  get status() { return this.props.status; }

  pause() { this.props.status = "paused"; }
  resume() { this.props.status = "active"; }
  advance() { this.props.nextGenerationDate = this.props.nextGenerationDate.addDays(this.props.intervalDays); }

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
