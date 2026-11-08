import { ScenarioId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";
import { UserId } from "../value-objects/ids";
import { DateOnly } from "../value-objects/date-only";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type HypothesisType = "client_delay" | "new_expense" | "extra_income";

export interface Hypothesis {
  type: HypothesisType;
  invoiceId?: string;
  delayDays?: number;
  amountMillimes?: number;
  plannedDate?: string;
  category?: string;
  description?: string;
  expectedDate?: string;
}

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

  addHypothesis(hypothesis: Hypothesis) {
    if (hypothesis.type === "client_delay" && (!hypothesis.invoiceId || !hypothesis.delayDays)) {
      throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "Client delay hypothesis requires invoice and delay");
    }
    if ((hypothesis.type === "new_expense" || hypothesis.type === "extra_income") && !hypothesis.amountMillimes) {
      throw new DomainError(DOMAIN_ERROR_CODES.SCENARIO_HYPOTHESIS_INVALID, "Amount hypothesis requires an amount");
    }
    this.props.hypotheses.push(hypothesis);
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      name: this.props.name,
      baseReferenceDate: this.props.baseReferenceDate.value,
      hypotheses: this.props.hypotheses,
      createdBy: this.props.createdBy.value,
    };
  }
}
