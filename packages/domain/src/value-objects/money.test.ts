
import { describe, it, expect } from "vitest";
import { Money } from "./money";

describe("Money", () => {
  it("accepte un montant entier en millimes", () => {
    const money = Money.of(5000000);

    expect(money.amount).toBe(5000000);
    expect(money.currency).toBe("DNT");
  });

  it("refuse les montants négatifs", () => {
    expect(() => Money.of(-1000)).toThrow();
  });

  it("refuse les montants décimaux", () => {
    expect(() => Money.of(10.5)).toThrow();
  });

  it("additionne deux montants", () => {
    const result = Money.of(3000000).add(Money.of(2000000));

    expect(result.amount).toBe(5000000);
  });

  it("soustrait deux montants", () => {
    const result = Money.of(3000000).subtract(Money.of(1000000));

    expect(result.amount).toBe(2000000);
  });

  it("refuse une soustraction négative", () => {
    expect(() =>
      Money.of(1000000).subtract(Money.of(2000000))
    ).toThrow();
  });

  it("refuse les monnaies différentes", () => {
    expect(() =>
      Money.of(1000, "DNT").add(Money.of(1000, "EUR"))
    ).toThrow("Currency mismatch");
  });
});
