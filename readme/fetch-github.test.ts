import { describe, it, expect } from "vitest";
import { processLanguageData, processContributions } from "./fetch-github.js";

describe("processLanguageData", () => {
  it("calculates percentages and sorts by bytes descending", () => {
    const raw = {
      TypeScript: { bytes: 50000, color: "#3178c6" },
      Rust: { bytes: 30000, color: "#dea584" },
      Shell: { bytes: 20000, color: "#89e051" },
    };

    const result = processLanguageData(raw);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("TypeScript");
    expect(result[0].percentage).toBe(50);
    expect(result[1].name).toBe("Rust");
    expect(result[1].percentage).toBe(30);
    expect(result[2].name).toBe("Shell");
    expect(result[2].percentage).toBe(20);
  });

  it("returns empty array for empty input", () => {
    expect(processLanguageData({})).toEqual([]);
  });
});

describe("processContributions", () => {
  it("aggregates daily contributions into weekly buckets", () => {
    const weeks = [
      {
        contributionDays: [
          { date: "2026-01-05", contributionCount: 3 },
          { date: "2026-01-06", contributionCount: 5 },
          { date: "2026-01-07", contributionCount: 0 },
        ],
      },
      {
        contributionDays: [
          { date: "2026-01-12", contributionCount: 2 },
        ],
      },
    ];

    const result = processContributions(weeks);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(8); // 3+5+0
    expect(result[1].count).toBe(2);
  });
});
