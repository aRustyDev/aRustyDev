import { describe, it, expect } from "vitest";
import { validateCV, validateProfile } from "./validate.js";

describe("validateCV", () => {
  it("accepts valid CV data", () => {
    const cv = {
      personal: {
        name: "Test",
        email: "t@t.com",
        phone: "555",
        location: "Remote",
        links: { github: "", linkedin: "", website: "", blog: "" },
      },
      experience: [
        {
          id: "a",
          company: "C",
          title: "T",
          location: "L",
          start: "2023-01",
          end: null,
          highlights: [],
        },
      ],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    expect(() => validateCV(cv)).not.toThrow();
  });

  it("rejects CV with duplicate IDs in a collection", () => {
    const cv = {
      personal: {
        name: "Test",
        email: "t@t.com",
        phone: "555",
        location: "Remote",
        links: { github: "", linkedin: "", website: "", blog: "" },
      },
      experience: [
        { id: "dup", company: "A", title: "T", location: "L", start: "2023", end: null, highlights: [] },
        { id: "dup", company: "B", title: "T", location: "L", start: "2022", end: null, highlights: [] },
      ],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    expect(() => validateCV(cv)).toThrow(/duplicate.*id.*"dup".*experience/i);
  });

  it("rejects CV missing required fields", () => {
    expect(() => validateCV({ personal: { name: "Test" } } as any)).toThrow();
  });
});

describe("validateProfile", () => {
  it("accepts valid profile", () => {
    const profile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };
    expect(() => validateProfile(profile)).not.toThrow();
  });

  it("rejects profile missing slug", () => {
    const profile = {
      title: "Test",
      include: { experience: [], education: [], skills: [], projects: [], certifications: [] },
    };
    expect(() => validateProfile(profile as any)).toThrow(/slug/i);
  });

  it("rejects profile with invalid override path format", () => {
    const profile = {
      slug: "test",
      title: "Test",
      include: { experience: [], education: [], skills: [], projects: [], certifications: [] },
      overrides: { "bad.path": "value" },
    };
    expect(() => validateProfile(profile)).toThrow(/override path/i);
  });
});
