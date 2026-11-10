import type { MembershipRepository } from "../ports/membership-repository";
import type { Clock } from "../ports/clock";
import { authorize } from "../access/authorize";
import { describeForecast } from "./forecast-context";
import type { ForecastContextLoader } from "./forecast-context";

export interface GetForecastInput { userId: string; companyId: string; }

/** M8: projection at today, +30, +60, +90 days plus the daily series and shortages. */
export class GetForecast {
  constructor(
    private readonly loader: ForecastContextLoader,
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetForecastInput) {
    await authorize(this.memberships, input, "forecast.view");
    const { inputs } = await this.loader.load(input.companyId, this.clock.today());
    return describeForecast(inputs);
  }
}
