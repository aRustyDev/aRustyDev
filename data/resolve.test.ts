import { describe, it, expect } from "vitest";
import { resolveResume } from "./resolve.js";
import type { CV, ResumeProfile } from "./schema.js";

const sampleCV: CV = {
  personal: {
    name: "Test User",
    email: "test@example.com",
    phone: "+1-555-0100",
    location: "Remote",
    links: {
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/in/test",
      website: "https://test.dev",
      blog: "https://blog.test.dev",
    },
  },
  experience: [
    {
      id: "job-a",
      company: "Company A",
      title: "Senior Engineer",
      location: "Remote",
      start: "2023-01",
      end: null,
      highlights: ["Original highlight A1", "Original highlight A2"],
      tags: ["backend"],
    },
    {
      id: "job-b",
      company: "Company B",
      title: "Engineer",
      location: "NYC",
      start: "2020-01",
      end: "2022-12",
      highlights: ["Highlight B1"],
      tags: ["frontend"],
    },
    {
      id: "job-c",
      company: "Company C",
      title: "Intern",
      location: "SF",
      start: "2019-06",
      end: "2019-09",
      highlights: ["Highlight C1"],
    },
  ],
  education: [
    {
      id: "edu-a",
      institution: "University A",
      degree: "BS",
      field: "CS",
      start: "2016",
      end: "2020",
      highlights: [],
    },
  ],
  skills: [
    { id: "lang", category: "Languages", items: ["Rust", "Go"] },
    { id: "infra", category: "Infra", items: ["AWS", "Docker"] },
  ],
  projects: [
    {
      id: "proj-a",
      name: "Project A",
      description: "Desc A",
      url: "https://github.com/test/a",
      highlights: ["Star count"],
    },
  ],
  certifications: [
    {
      id: "cert-a",
      name: "Cert A",
      issuer: "Issuer A",
      date: "2023-01",
      url: "https://cert.example.com",
    },
  ],
};

describe("resolveResume", () => {
  it("cherry-picks entries by ID", () => {
    const profile: ResumeProfile = {
      slug: "backend",
      title: "Backend Engineer",
      include: {
        experience: ["job-a", "job-b"],
        education: ["edu-a"],
        skills: ["lang"],
        projects: ["proj-a"],
        certifications: ["cert-a"],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.slug).toBe("backend");
    expect(result.title).toBe("Backend Engineer");
    expect(result.personal).toEqual(sampleCV.personal);
    expect(result.experience).toHaveLength(2);
    expect(result.experience[0].id).toBe("job-a");
    expect(result.experience[1].id).toBe("job-b");
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].id).toBe("lang");
  });

  it("preserves order from include list", () => {
    const profile: ResumeProfile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["job-b", "job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.experience[0].id).toBe("job-b");
    expect(result.experience[1].id).toBe("job-a");
  });

  it("applies overrides as full replacement", () => {
    const profile: ResumeProfile = {
      slug: "backend",
      title: "Backend",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-a.highlights": ["Custom highlight 1", "Custom highlight 2"],
      },
    };

    const result = resolveResume(sampleCV, profile);

    expect(result.experience[0].highlights).toEqual([
      "Custom highlight 1",
      "Custom highlight 2",
    ]);
    // Original CV data should not be mutated
    expect(sampleCV.experience[0].highlights).toEqual([
      "Original highlight A1",
      "Original highlight A2",
    ]);
  });

  it("throws on override referencing ID not in include", () => {
    const profile: ResumeProfile = {
      slug: "bad",
      title: "Bad",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-c.highlights": ["Should fail"],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /override references ID "job-c" not in include/i
    );
  });

  it("throws on override targeting non-existent field", () => {
    const profile: ResumeProfile = {
      slug: "bad",
      title: "Bad",
      include: {
        experience: ["job-a"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
      overrides: {
        "experience.job-a.nonexistent": ["Should fail"],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /field "nonexistent" does not exist/i
    );
  });

  it("throws on ID not found in CV", () => {
    const profile: ResumeProfile = {
      slug: "missing",
      title: "Missing",
      include: {
        experience: ["job-nonexistent"],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      },
    };

    expect(() => resolveResume(sampleCV, profile)).toThrow(
      /ID "job-nonexistent" not found in experience/i
    );
  });
});
