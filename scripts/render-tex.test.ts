import { describe, it, expect } from "vitest";
import { renderHeader, renderExperience, renderEducation, renderSkills, renderProjects, renderCertifications, renderTex } from "./render-tex.js";
import type { CV, ResumeProfile } from "../data/schema.js";

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
      highlights: ["Built systems", "Led teams"],
    },
  ],
  education: [
    {
      id: "edu-a",
      institution: "University A",
      degree: "BS",
      field: "Computer Science",
      start: "2016-09",
      end: "2020-05",
      highlights: [],
    },
  ],
  skills: [
    { id: "lang", category: "Languages", items: ["Rust", "Go", "TypeScript"] },
  ],
  projects: [
    {
      id: "proj-a",
      name: "Project A",
      description: "A CLI tool",
      url: "https://github.com/test/a",
      highlights: ["500+ stars"],
    },
  ],
  certifications: [
    {
      id: "cert-a",
      name: "AWS SAA",
      issuer: "AWS",
      date: "2023-06",
      url: "https://aws.amazon.com",
    },
  ],
};

describe("renderHeader", () => {
  it("produces LaTeX header with personal info", () => {
    const result = renderHeader(sampleCV.personal);
    expect(result).toContain("Test User");
    expect(result).toContain("test@example.com");
    expect(result).toContain("github.com/test");
    expect(result).toContain("\\begin{center}");
  });
});

describe("renderExperience", () => {
  it("produces LaTeX experience section", () => {
    const result = renderExperience(sampleCV.experience);
    expect(result).toContain("\\section{Experience}");
    expect(result).toContain("Company A");
    expect(result).toContain("Senior Engineer");
    expect(result).toContain("Built systems");
    expect(result).toContain("\\resumeSubheading");
  });

  it("returns empty string for empty array", () => {
    expect(renderExperience([])).toBe("");
  });
});

describe("renderSkills", () => {
  it("formats skills as category: items", () => {
    const result = renderSkills(sampleCV.skills);
    expect(result).toContain("\\section{Skills}");
    expect(result).toContain("Languages");
    expect(result).toContain("Rust, Go, TypeScript");
  });
});

describe("renderTex", () => {
  it("produces a complete .tex document", () => {
    const profile: ResumeProfile = {
      slug: "test",
      title: "Test",
      include: {
        experience: ["job-a"],
        education: ["edu-a"],
        skills: ["lang"],
        projects: ["proj-a"],
        certifications: ["cert-a"],
      },
    };

    const template = `\\begin{document}\n%%HEADER%%\n%%EXPERIENCE%%\n%%EDUCATION%%\n%%SKILLS%%\n%%PROJECTS%%\n%%CERTIFICATIONS%%\n\\end{document}`;
    const result = renderTex(sampleCV, profile, template);
    expect(result).toContain("\\begin{document}");
    expect(result).toContain("\\end{document}");
    expect(result).toContain("Test User");
    expect(result).toContain("Company A");
    expect(result).not.toContain("%%HEADER%%");
    expect(result).not.toContain("%%EXPERIENCE%%");
  });
});

describe("renderEducation", () => {
  it("produces LaTeX education section", () => {
    const result = renderEducation(sampleCV.education);
    expect(result).toContain("\\section{Education}");
    expect(result).toContain("University A");
    expect(result).toContain("BS in Computer Science");
  });

  it("returns empty string for empty array", () => {
    expect(renderEducation([])).toBe("");
  });
});

describe("renderProjects", () => {
  it("produces LaTeX projects section", () => {
    const result = renderProjects(sampleCV.projects);
    expect(result).toContain("\\section{Projects}");
    expect(result).toContain("Project A");
    expect(result).toContain("github.com/test/a");
  });

  it("returns empty string for empty array", () => {
    expect(renderProjects([])).toBe("");
  });
});

describe("renderCertifications", () => {
  it("produces LaTeX certifications section", () => {
    const result = renderCertifications(sampleCV.certifications);
    expect(result).toContain("\\section{Certifications}");
    expect(result).toContain("AWS SAA");
    expect(result).toContain("AWS");
  });

  it("returns empty string for empty array", () => {
    expect(renderCertifications([])).toBe("");
  });
});
