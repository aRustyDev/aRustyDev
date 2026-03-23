import { describe, it, expect } from "vitest";
import { wrapSvg, COLORS, formatNumber } from "./shared.js";

describe("wrapSvg", () => {
  it("wraps content in SVG element with correct dimensions", () => {
    const result = wrapSvg("<rect />", 800, 200);
    expect(result).toContain('width="800"');
    expect(result).toContain('height="200"');
    expect(result).toContain("<rect />");
    expect(result).toContain("xmlns=");
  });

  it("includes prefers-color-scheme media query", () => {
    const result = wrapSvg("<rect />", 800, 200);
    expect(result).toContain("prefers-color-scheme: dark");
  });
});

describe("formatNumber", () => {
  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(15000)).toBe("15k");
  });

  it("leaves small numbers as-is", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("COLORS", () => {
  it("has light and dark themes", () => {
    expect(COLORS.light.bg).toBeDefined();
    expect(COLORS.dark.bg).toBeDefined();
    expect(COLORS.light.fg).toBeDefined();
    expect(COLORS.dark.fg).toBeDefined();
  });
});
