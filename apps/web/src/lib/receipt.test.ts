import { describe, it, expect } from "vitest";
import { isImageUrl, receiptLink } from "./receipt";

describe("receipt link", () => {
  it("accepts only https links", () => {
    expect(receiptLink("https://res.cloudinary.com/demo/image/upload/r.png")).toBe("https://res.cloudinary.com/demo/image/upload/r.png");
    expect(receiptLink("http://example.com/r.png")).toBeUndefined();
    expect(receiptLink("javascript:alert(1)")).toBeUndefined();
    expect(receiptLink(undefined)).toBeUndefined();
  });

  it("previews images but not PDFs", () => {
    expect(isImageUrl("https://x.test/a/b.JPG")).toBe(true);
    expect(isImageUrl("https://x.test/a/b.webp?v=2")).toBe(true);
    expect(isImageUrl("https://x.test/a/b.pdf")).toBe(false);
  });
});
