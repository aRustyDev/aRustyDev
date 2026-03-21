import type { CV, ResumeProfile } from "./schema.js";

const COLLECTIONS = ["experience", "education", "skills", "projects", "certifications"] as const;

export function validateCV(cv: unknown): asserts cv is CV {
  if (!cv || typeof cv !== "object") {
    throw new Error("CV must be an object");
  }

  const data = cv as Record<string, unknown>;

  if (!data.personal || typeof data.personal !== "object") {
    throw new Error("CV must have a personal section");
  }

  const personal = data.personal as Record<string, unknown>;
  for (const field of ["name", "email", "phone", "location"]) {
    if (typeof personal[field] !== "string") {
      throw new Error(`personal.${field} must be a string`);
    }
  }

  if (!personal.links || typeof personal.links !== "object") {
    throw new Error("personal.links must be an object");
  }

  for (const collection of COLLECTIONS) {
    if (!Array.isArray(data[collection])) {
      throw new Error(`CV must have a ${collection} array`);
    }

    const entries = data[collection] as Array<Record<string, unknown>>;
    const ids = new Set<string>();

    for (const entry of entries) {
      if (typeof entry.id !== "string" || entry.id === "") {
        throw new Error(`Each ${collection} entry must have a non-empty id`);
      }
      if (ids.has(entry.id)) {
        throw new Error(`Duplicate id "${entry.id}" in ${collection}`);
      }
      ids.add(entry.id);
    }
  }
}

export function validateProfile(profile: unknown): asserts profile is ResumeProfile {
  if (!profile || typeof profile !== "object") {
    throw new Error("Profile must be an object");
  }

  const data = profile as Record<string, unknown>;

  if (typeof data.slug !== "string" || data.slug === "") {
    throw new Error("Profile must have a non-empty slug");
  }

  if (typeof data.title !== "string" || data.title === "") {
    throw new Error("Profile must have a non-empty title");
  }

  if (!data.include || typeof data.include !== "object") {
    throw new Error("Profile must have an include section");
  }

  const include = data.include as Record<string, unknown>;
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(include[collection])) {
      throw new Error(`include.${collection} must be an array`);
    }
  }

  if (data.overrides) {
    if (typeof data.overrides !== "object") {
      throw new Error("overrides must be an object");
    }

    for (const path of Object.keys(data.overrides as object)) {
      const parts = path.split(".");
      if (parts.length !== 3) {
        throw new Error(
          `Override path "${path}" must be <collection>.<id>.<field> (3 parts)`,
        );
      }
    }
  }
}
