// data/schema.ts
// Canonical TypeScript types for cv.json and resume profiles.
// Single source of truth — imported by the Astro site, PDF pipeline, and validation.

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: {
    github: string;
    linkedin: string;
    website: string;
    blog: string;
  };
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location: string;
  start: string;
  end: string | null;
  highlights: string[];
  tags?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  highlights: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface CV {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

export interface ResumeProfile {
  slug: string;
  title: string;
  include: {
    experience: string[];
    education: string[];
    skills: string[];
    projects: string[];
    certifications: string[];
  };
  overrides?: Record<string, unknown>;
}

/** The resolved output after applying a profile to cv.json */
export interface ResolvedResume {
  slug: string;
  title: string;
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}
