/** Public contact details supplied by the portfolio owner. */
export const portfolioProfile = {
  name: "Mizanur Hasan",
  email: "eng.mizanur.hasan@gmail.com",
  github: "https://github.com/mizanurhasan0",
  linkedin: "https://www.linkedin.com/in/mizanur-hasan/",
  portfolio: "https://mizanurhasan404.vercel.app/",
  resume: "https://mizanurhasan404.vercel.app/resume.pdf",
  role: "Full-stack developer · Frontend focused",
} as const;

export const contactHref = `mailto:${portfolioProfile.email}`;
