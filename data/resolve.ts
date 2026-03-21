import type {
  CV,
  ResumeProfile,
  ResolvedResume,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
} from "./schema.js";

type CVCollection = "experience" | "education" | "skills" | "projects" | "certifications";
type CVEntry = Experience | Education | Skill | Project | Certification;

function pickByIds<T extends { id: string }>(
  entries: T[],
  ids: string[],
  collectionName: string,
): T[] {
  return ids.map(id => {
    const entry = entries.find(e => e.id === id);
    if (!entry) {
      throw new Error(`ID "${id}" not found in ${collectionName}`);
    }
    return structuredClone(entry);
  });
}

function applyOverrides(
  result: ResolvedResume,
  overrides: Record<string, unknown>,
): void {
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split(".");
    if (parts.length !== 3) {
      throw new Error(
        `Override path "${path}" must be <collection>.<id>.<field>`,
      );
    }

    const [collection, id, field] = parts;
    const collectionKey = collection as CVCollection;

    const entries = result[collectionKey] as CVEntry[] | undefined;
    if (!entries) {
      throw new Error(`Collection "${collection}" does not exist`);
    }

    const includeIds = entries.map((e: CVEntry) => e.id);
    if (!includeIds.includes(id)) {
      throw new Error(
        `Override references ID "${id}" not in include for ${collection}`,
      );
    }

    const entry = entries.find((e: CVEntry) => e.id === id);
    if (!entry) {
      throw new Error(`Entry "${id}" not found in resolved ${collection}`);
    }

    if (!(field in entry)) {
      throw new Error(
        `Field "${field}" does not exist on ${collection} entry "${id}"`,
      );
    }

    (entry as Record<string, unknown>)[field] = value;
  }
}

export function resolveResume(cv: CV, profile: ResumeProfile): ResolvedResume {
  const result: ResolvedResume = {
    slug: profile.slug,
    title: profile.title,
    personal: structuredClone(cv.personal),
    experience: pickByIds(cv.experience, profile.include.experience, "experience"),
    education: pickByIds(cv.education, profile.include.education, "education"),
    skills: pickByIds(cv.skills, profile.include.skills, "skills"),
    projects: pickByIds(cv.projects, profile.include.projects, "projects"),
    certifications: pickByIds(cv.certifications, profile.include.certifications, "certifications"),
  };

  if (profile.overrides) {
    applyOverrides(result, profile.overrides);
  }

  return result;
}
