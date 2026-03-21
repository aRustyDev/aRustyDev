export const SITE = {
  website: "https://im.arusty.dev/",
  author: "aRustyDev",
  title: "aRustyDev",
  description: "Portfolio, CV, and resume — Adam's corner of the internet",
  ogImage: "og-image.jpg",
  dir: "ltr" as const,
  lang: "en",
} as const;

export const SOCIALS = [
  { name: "GitHub", href: "https://github.com/aRustyDev", active: true },
  { name: "LinkedIn", href: "https://linkedin.com/in/arustydev", active: true },
  { name: "Blog", href: "https://blog.arusty.dev", active: true },
] as const;

export const NAV_LINKS = [
  { name: "About", href: "/about" },
  { name: "CV", href: "/cv" },
  { name: "Resume", href: "/resume" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Contact", href: "/contact" },
] as const;
