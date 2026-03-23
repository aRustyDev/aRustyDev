// scripts/render-tex-cli.ts
// CLI entry point: reads a profile slug from argv, renders .tex to stdout.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderTex } from "./render-tex.js";
import { validateCV, validateProfile } from "../data/validate.js";
import type { CV, ResumeProfile } from "../data/schema.js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: render-tex-cli.ts <slug>");
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, "..");
const cvPath = resolve(repoRoot, "data/cv.json");
const profilePath = resolve(repoRoot, `data/resumes/${slug}.json`);
const templatePath = resolve(repoRoot, "templates/resume.tex");

const cv = JSON.parse(readFileSync(cvPath, "utf-8"));
validateCV(cv);

const profile: ResumeProfile = JSON.parse(readFileSync(profilePath, "utf-8"));
validateProfile(profile);

const templateContent = readFileSync(templatePath, "utf-8");
const tex = renderTex(cv as CV, profile, templateContent);
process.stdout.write(tex);
