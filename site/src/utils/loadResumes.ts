import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveResume } from "@data/resolve";
import type { CV, ResumeProfile, ResolvedResume } from "@data/schema";
import cvData from "@data/cv.json";

const cv = cvData as CV;

const resumesDir = resolve(import.meta.dirname, "../../../data/resumes");

function loadProfiles(): ResumeProfile[] {
  const files = readdirSync(resumesDir).filter(f => f.endsWith(".json"));
  return files.map(f => {
    const raw = readFileSync(resolve(resumesDir, f), "utf-8");
    return JSON.parse(raw) as ResumeProfile;
  });
}

const profiles = loadProfiles();

export function getAllProfiles(): ResumeProfile[] {
  return profiles;
}

export function getAllResolved(): ResolvedResume[] {
  return profiles.map(profile => resolveResume(cv, profile));
}

export function getResolvedBySlug(slug: string): ResolvedResume | undefined {
  const profile = profiles.find(p => p.slug === slug);
  if (!profile) return undefined;
  return resolveResume(cv, profile);
}
