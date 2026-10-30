# Component Lab: job-readiness plan

**Target role:** Full-stack engineer, with frontend as the primary strength.  
**Site role:** A separate component showcase that supports the [main portfolio](https://mizanurhasan404.vercel.app/).

## Current assessment

The initial hiring review rated the showcase about **4/10** for job applications: attractive demos, but limited professional context, contact routes, and project proof. After this pass, the provisional rating is **8/10** for its intended role as a supporting showcase. This is a qualitative review of the repository and local rendering, not a recruiter study or a production performance audit.

| Criterion | Current result | Next proof needed |
| --- | --- | --- |
| Role and contact | Frontend-focused full-stack positioning, email, GitHub, LinkedIn, résumé, and main portfolio are visible | Check links on the deployed showcase |
| Product evidence | The Sales CRM Workspace and Multi-Vendor Marketplace have case studies covering the problem, personal contribution, technology, delivered workflows, and selected product screens | Add verified outcomes |
| Component evidence | 54 demos with live previews and accessible source | Curate the strongest 6–8 for recruiter review |
| Mobile and accessibility | Shorter hero, compact stack disclosure, touch and reduced-motion handling, stronger text contrast | Run a full keyboard and screen-reader pass on production |
| Performance and code quality | Gallery reveals 12 cards at a time; demos load by route and near viewport; tests, types, lint, and Webpack build pass | Measure production Core Web Vitals and fix any failing route |

## Completed in this pass

1. Added internal Sales CRM Workspace and Multi-Vendor Marketplace case-study pages, a career timeline, direct contact routes, résumé, and main portfolio links.
2. Reduced hero height and made the tech stack compact on smaller screens. Selected Work starts at about 787px on 1280–1536px desktop widths, 871px at 1024–1200px, and 1001px at 390px in local visual checks.
3. Split component previews into per-component chunks, deferred gallery previews until near the viewport, and showed 12 cards initially while preserving search and filters.
4. Replaced network-dependent build fonts with local files and made lint ignore vendored public assets.
5. Verified 17 tests, full ESLint, TypeScript, and a Webpack production build generating 63 static pages, including all 54 component routes.

## Path to 10/10

1. **Document outcomes.** For each featured product, add only results that can be verified or explained in an interview: before/after task time, adoption, reliability, conversion, or a concrete engineering tradeoff. State the measurement method and your exact responsibility. Client-sensitive details can stay private.
2. **Curate a recruiter path.** Put the strongest product case studies first on the main portfolio. Link to 6–8 Component Lab demos chosen for UI architecture, accessibility, interaction design, and reusable code. Keep this lab as the deeper catalog. Align the displayed name on the main portfolio and résumé with the confirmed “Mizanur Hasan” identity used here.
3. **Publish and audit.** Provide the showcase's canonical production URL, set `metadataBase`, verify social previews and every outbound link, then measure mobile performance and accessibility on the deployed site. Fix measured issues before assigning a final score.
4. **Interview proof.** Prepare a two-minute explanation for the CRM and marketplace work covering the problem, architecture, one hard decision, your contribution, and the result. Keep a permitted walkthrough ready for private work.

Do not present unverified percentages, client numbers, or project counts as hiring evidence. A 10/10 claim needs the missing outcome and production checks above, plus feedback from real reviewers.
