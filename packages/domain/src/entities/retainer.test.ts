import { describe, it, expect } from "vitest";
import { Retainer } from "./retainer";
import { Party } from "./party";
import { CompanyId, PartyId } from "../value-objects/ids";
import { DateOnly } from "../value-objects/date-only";
import { Money } from "../value-objects/money";

const base = {
  companyId: CompanyId.next(),
  customerId: PartyId.next(),
  name: "Monthly design",
  amount: Money.positive(1500000),
  intervalDays: 30,
  nextGenerationDate: DateOnly.from("2026-11-01"),
};

describe("Retainer", () => {
  it("lists every period due up to a date", () => {
    const retainer = Retainer.create(base);
    expect(retainer.dueDates(DateOnly.from("2026-12-15")).map((d) => d.value)).toEqual(["2026-11-01", "2026-12-01"]);
  });

  it("generates nothing while paused, and pause/resume follow the state machine", () => {
    const retainer = Retainer.create(base);
    retainer.pause();
    expect(retainer.dueDates(DateOnly.from("2027-01-01"))).toEqual([]);
    expect(() => retainer.pause()).toThrow(/active/);
    retainer.resume();
    expect(() => retainer.resume()).toThrow(/paused/);
  });

  it("rejects bad terms", () => {
    expect(() => Retainer.create({ ...base, intervalDays: 0 })).toThrow(/interval/);
    expect(() => Retainer.create({ ...base, name: " " })).toThrow(/name/);
    expect(() => Retainer.create(base).update({ intervalDays: 400 })).toThrow(/interval/);
  });
});

describe("Party", () => {
  it("requires a name and validates the e-mail", () => {
    expect(() => Party.create({ companyId: CompanyId.next(), type: "customer", name: "" })).toThrow(/name/);
    expect(() => Party.create({ companyId: CompanyId.next(), type: "customer", name: "Acme", email: "nope" })).toThrow();
  });

  it("updates details through update()", () => {
    const party = Party.create({ companyId: CompanyId.next(), type: "customer", name: "Acme" });
    party.update({ name: "Acme SARL", email: "BILLING@acme.tn" });
    expect(party.snapshot()).toMatchObject({ name: "Acme SARL", email: "billing@acme.tn" });
  });
});
