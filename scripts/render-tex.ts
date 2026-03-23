import { resolveResume } from "../data/resolve.js";
import type {
  CV,
  ResumeProfile,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
} from "../data/schema.js";

function escapeLatex(text: string): string {
  // Order matters: escape backslash last to avoid double-escaping braces
  return text
    .replace(/[&%$#_]/g, match => `\\${match}`)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, match => `\\${match}`);
}

function formatDate(date: string | null): string {
  if (!date) return "Present";
  const [year, month] = date.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return month ? `${months[parseInt(month) - 1]}. ${year}` : year;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export function renderHeader(personal: PersonalInfo): string {
  const e = escapeLatex;
  return `\\begin{center}
  \\textbf{\\Huge \\scshape ${e(personal.name)}} \\\\ \\vspace{1pt}
  \\small ${e(personal.phone)} $|$
  \\href{mailto:${personal.email}}{\\underline{${e(personal.email)}}} $|$
  \\href{${personal.links.linkedin}}{\\underline{${stripProtocol(personal.links.linkedin)}}} $|$
  \\href{${personal.links.github}}{\\underline{${stripProtocol(personal.links.github)}}}
\\end{center}`;
}

export function renderExperience(experience: Experience[]): string {
  if (experience.length === 0) return "";
  const e = escapeLatex;

  const items = experience.map(job => {
    const highlights = job.highlights
      .map(h => `      \\resumeItem{${e(h)}}`)
      .join("\n");

    return `    \\resumeSubheading
      {${e(job.title)}}{${formatDate(job.start)} -- ${formatDate(job.end)}}
      {${e(job.company)}}{${e(job.location)}}
      \\resumeItemListStart
${highlights}
      \\resumeItemListEnd`;
  }).join("\n");

  return `\\section{Experience}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderEducation(education: Education[]): string {
  if (education.length === 0) return "";
  const e = escapeLatex;

  const items = education.map(edu =>
    `    \\resumeSubheading
      {${e(edu.institution)}}{${formatDate(edu.start)} -- ${formatDate(edu.end)}}
      {${e(edu.degree)} in ${e(edu.field)}}{}`
  ).join("\n");

  return `\\section{Education}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderSkills(skills: Skill[]): string {
  if (skills.length === 0) return "";
  const e = escapeLatex;

  const rows = skills
    .map(s => `    \\textbf{${e(s.category)}}{: ${e(s.items.join(", "))}} \\\\`)
    .join("\n");

  return `\\section{Skills}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${rows}
    }}
  \\end{itemize}`;
}

export function renderProjects(projects: Project[]): string {
  if (projects.length === 0) return "";
  const e = escapeLatex;

  const items = projects.map(proj => {
    const highlights = proj.highlights
      .map(h => `      \\resumeItem{${e(h)}}`)
      .join("\n");

    return `    \\resumeProjectHeading
      {\\textbf{${e(proj.name)}} $|$ \\href{${proj.url}}{\\underline{${stripProtocol(proj.url)}}}}{}
      \\resumeItemListStart
${highlights}
      \\resumeItemListEnd`;
  }).join("\n");

  return `\\section{Projects}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd`;
}

export function renderCertifications(certifications: Certification[]): string {
  if (certifications.length === 0) return "";
  const e = escapeLatex;

  const items = certifications
    .map(c => `    \\resumeItem{\\href{${c.url}}{\\underline{${e(c.name)}}} -- ${e(c.issuer)} (${formatDate(c.date)})}`)
    .join("\n");

  return `\\section{Certifications}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${items}
    }}
  \\end{itemize}`;
}

/** Accepts template content as a string (not a file path) for testability.
 *  The CLI wrapper (render-tex-cli.ts) handles file I/O and validation.
 *  Design decision: validation is done at the boundary (CLI entry point),
 *  not inside renderTex. This keeps renderTex pure and testable. */
export function renderTex(
  cv: CV,
  profile: ResumeProfile,
  templateContent: string,
): string {
  const resolved = resolveResume(cv, profile);

  return templateContent
    .replace("%%HEADER%%", renderHeader(resolved.personal))
    .replace("%%EXPERIENCE%%", renderExperience(resolved.experience))
    .replace("%%EDUCATION%%", renderEducation(resolved.education))
    .replace("%%SKILLS%%", renderSkills(resolved.skills))
    .replace("%%PROJECTS%%", renderProjects(resolved.projects))
    .replace("%%CERTIFICATIONS%%", renderCertifications(resolved.certifications));
}
