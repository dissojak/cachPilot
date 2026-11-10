import { ScenarioId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import type { UserId } from "../value-objects/ids";
import type { DateOnly } from "../value-objects/date-only";
import type { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type HypothesisType = "client_delay" | "new_expense" | "extra_income";

export type Hypothesis =
  | { type: "client_delay"; invoiceId: string; delayDays: number }
  | { type: "new_expense"; amount: Money; date: DateOnly; label: string }
  | { type: "extra_income"; amount: Money; date: DateOnly; label: string };

export class Scenario {
  private constructor(
    readonly id: ScenarioId,
    private props: {
      companyId: CompanyId;
      name: string;
      baseReferenceDate: DateOnly;
      hypotheses: Hypothesis[];
      createdBy: UserId;
    },
  ) {}

  static create(input: {
    id?: ScenarioId;
    companyId: CompanyId;
    name: string;
    baseReferenceDate: DateOnly;
    createdBy: UserId;
  }) {
    return new Scenario(input.id ?? ScenarioId.next(), {
      companyId: input.companyId,
      name: input.name,
      baseReferenceDate: input.baseReferenceDate,
      hypotheses: [],
      createdBy: input.createdBy,
    });
  }

  static restore(input: {
    id: ScenarioId;
    companyId: CompanyId;
    name: string;
    baseReferenceDate: DateOnly;
    hypotheses: Hypothesis[];
    createdBy: UserId;
  }) {
    return new Scenario(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get name() { return this.props.name; }
  get baseReferenceDate() { return this.props.baseReferenceDate; }
  get hypotheses() { return this.props.hypotheses; }

  /**
   * BR-26: every hypothesis is validated before being stored, in a typed
   * form (no free fields around).
   */
  addHypothesis(hypothesis: Hypothesis) {
    if (hypothesis.type === "client_delay") {
      const invoiceId = hypothesis.invoiceId.trim();
      if (invoiceId.length === 0) {
        throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "A client delay needs an invoice");
      }
      const delayDays = hypothesis.delayDays;
      if (!Number.isInteger(delayDays) || delayDays < 1 || delayDays > 365) {
        throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, `Delay must be between 1 and 365 days: ${delayDays}`);
      }
      this.props.hypotheses.push({ type: "client_delay", invoiceId, delayDays });
      return;
    }

    if (!hypothesis.amount.isPositive()) {
      throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "Hypothesis amount must be positive");
    }
    const label = hypothesis.label.trim();
    if (label.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "A hypothesis needs a label");
    }
    this.props.hypotheses.push(hypothesis.type === "new_expense"
      ? { type: "new_expense", amount: hypothesis.amount, date: hypothesis.date, label }
      : { type: "extra_income", amount: hypothesis.amount, date: hypothesis.date, label });
  }

  removeHypothesis(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.props.hypotheses.length) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, `Hypothesis index does not exist: ${index}`);
    }
    this.props.hypotheses.splice(index, 1);
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      name: this.props.name,
      baseReferenceDate: this.props.baseReferenceDate.value,
      hypotheses: this.props.hypotheses.map((hypothesis) => hypothesis.type === "client_delay"
        ? { type: hypothesis.type, invoiceId: hypothesis.invoiceId, delayDays: hypothesis.delayDays }
        : { type: hypothesis.type, amountMillimes: hypothesis.amount.amount, date: hypothesis.date.value, label: hypothesis.label }),
      createdBy: this.props.createdBy.value,
    };
  }
}
