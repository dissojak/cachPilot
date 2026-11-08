import { CompanyId } from "../value-objects/ids";
import { UserId } from "../value-objects/ids";
import { DateOnly } from "../value-objects/date-only";

export type CashMovementType = "opening" | "invoice_payment" | "expense_payment" | "adjustment" | "reversal";

export class CashMovement {
  private constructor(
    readonly id: string,
    private props: {
      companyId: CompanyId;
      type: CashMovementType;
      amountMillimes: number;
      movementDate: DateOnly;
      sourceType: string;
      sourceId: string;
      actorId: UserId;
      reason?: string;
    },
  ) {}

  static create(input: {
    id?: string;
    companyId: CompanyId;
    type: CashMovementType;
    amountMillimes: number;
    movementDate: DateOnly;
    sourceType: string;
    sourceId: string;
    actorId: UserId;
    reason?: string;
  }) {
    return new CashMovement(input.id ?? crypto.randomUUID(), input);
  }

  static restore(input: {
    id: string;
    companyId: CompanyId;
    type: CashMovementType;
    amountMillimes: number;
    movementDate: DateOnly;
    sourceType: string;
    sourceId: string;
    actorId: UserId;
    reason?: string;
  }) {
    return new CashMovement(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get amountMillimes() { return this.props.amountMillimes; }
  get movementDate() { return this.props.movementDate; }

  snapshot() {
    return {
      id: this.id,
      companyId: this.props.companyId.value,
      type: this.props.type,
      amountMillimes: this.props.amountMillimes,
      movementDate: this.props.movementDate.value,
      sourceType: this.props.sourceType,
      sourceId: this.props.sourceId,
      actorId: this.props.actorId.value,
      reason: this.props.reason,
    };
  }
}
