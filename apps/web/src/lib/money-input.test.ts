import { describe, it, expect } from "vitest";
import { parseDntToMillimes } from "./money-input";
import { money } from "./format";

describe("money input", () => {
  it.each([
    ["2000", 2_000_000],
    ["2,000.5", 2_000_500],
    ["0.001", 1],
    ["1000.333", 1_000_333],
    ["  12 345.678 DNT ", 12_345_678],
  ])("parses %s", (text, expected) => {
    expect(parseDntToMillimes(text)).toBe(expected);
  });

  it("rejects garbage, 4 decimals and negatives unless allowed", () => {
    expect(parseDntToMillimes("abc")).toBeNull();
    expect(parseDntToMillimes("1.2345")).toBeNull();
    expect(parseDntToMillimes("-5")).toBeNull();
    expect(parseDntToMillimes("-5", { allowNegative: true })).toBe(-5_000);
  });

  it("formats millimes in English with 3 decimals", () => {
    expect(money(2_000_500)).toBe("2,000.500 DNT");
    expect(money(-1_000_000)).toBe("−1,000.000 DNT");
    expect(money(7)).toBe("0.007 DNT");
  });
});
