# Profile page audit

Review of the personal profile webpage in this folder (`index.html`, `style.css`, `script.js`).

## Requirements checklist

| Requirement | Status | Notes |
| --- | --- | --- |
| HTML in `index.html` | Met | Single page document with semantic landmarks. |
| Styling in `style.css` (no inline `style` attributes) | Met | Linked stylesheet only; no `style=""` on elements. |
| JavaScript in `script.js` | Met | Footer year and light/dark theme toggle. |
| Page title | Met | `Divya — Personal Profile`. |
| One main heading | Met | A single `h1` with the name Divya. |
| About section | Met | `#about` with two paragraphs plus a location line. |
| Skills section as a list | Met | `#skills` uses an unordered list of skill chips. |
| Projects section with links | Met | `#projects` lists three linked projects. |
| Unknown details marked `PLACEHOLDER` | Met | Search the HTML for `PLACEHOLDER` to replace copy and URLs. |

## Structure and accessibility

- Landmarks: `header`, `nav`, `main`, `footer`, and labelled `section`s.
- Heading order: `h1` then `h2` per section (About, Skills, Projects, Contact).
- Skip link is present for keyboard users.
- Theme toggle uses `aria-pressed` and updates its label.
- Project and contact links currently point at placeholder hostnames. Replace them before sharing the site, or browsers will fail to load those destinations.

## Placeholders to replace

Search `index.html` for `PLACEHOLDER`. Expected replacements:

1. Tagline under the name
2. About paragraph (studies, interests, next step)
3. City / region
4. Three extra skills
5. Three project titles, descriptions, and `href` values
6. Email, LinkedIn, and GitHub

Known details used without placeholders: the name **Divya** and the student framing in the header eyebrow.

## Visual and interaction notes

- Layout is a single column, max width ~760px, card sections on a warm paper background.
- Skills render as pills rather than bullets; they remain an HTML list.
- Dark theme persists in `localStorage` under `profile-theme`.
- Smooth scrolling is enabled for in-page nav.

## Gaps and follow-ups

- No photo, résumé download, or real project screenshots yet.
- Placeholder URLs (`https://PLACEHOLDER-project-one.example` and similar) are not real sites.
- Contact section was added for a complete profile; it was not in the original required list.
- There is no form validation or contact form JavaScript.
- Print stylesheet and Open Graph meta tags are not included.

## How to review locally

Open `index.html` in a browser, or serve the folder and visit the local URL. Confirm:

1. Title appears in the tab.
2. About, Skills, and Projects sections are visible and linked from the nav.
3. Skills are a list; projects are clickable (expect placeholder destinations to fail until replaced).
4. Theme button switches appearance and the year in the footer is current.
5. A page-wide search for `PLACEHOLDER` still finds every unfinished field.
