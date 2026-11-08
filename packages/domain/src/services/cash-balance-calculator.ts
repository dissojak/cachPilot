export class CashBalanceCalculator {
  calculate(openingBalanceMillimes: number, movementMillimes: number[]) {
    return movementMillimes.reduce((sum, amount) => sum + amount, openingBalanceMillimes);
  }
}
