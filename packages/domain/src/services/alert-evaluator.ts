export class AlertEvaluator {
  hasNegativeForecast(balanceMillimes: number) {
    return balanceMillimes < 0;
  }
}
