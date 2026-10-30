# Divya Garg | Personal Portfolio

A responsive personal portfolio for **Divya Garg**, B.Tech CSE (AIML) student at JECRC University, with project search, light/dark mode and an AI chatbot that answers questions about the portfolio.

**Live website:** https://portfolio-website-two-tau-jo9lb8irkn.vercel.app/

## Sections
Home · About Me · Skills · Projects · Contact Information · AI Chatbot

## Features
- **Five project cards**, each with description, technologies and a GitHub repository link (a "Live application" button appears automatically when a project has a live URL).
- **Project search**: type a name or technology (for example `Python`, `Quiz`, `Book`); results update as you type, with a result count, a no-match message and a Clear button.
- **Light/dark mode** toggle. Dark is the default and the choice is remembered in the browser.
- **AI chatbot** powered by the Google Gemini API through a Vercel serverless function. Answers are grounded in `data/portfolio.json`, loading and error states are shown, and the API key never reaches the browser.
- Responsive layout for desktop, tablet and mobile, keyboard-friendly, with subtle animations that respect "reduce motion".

## Projects showcased
| Project | Technologies | Repository |
|---|---|---|
| Python Programs Collection | Python | [repo](https://github.com/divyaaaagarg/python-programs-collection) |
| Messy Python Code Improvement | Python, Refactoring, AI-assisted coding | [repo](https://github.com/divyaaaagarg/messy-python-code-improvement) |
| Bug Fixing Using Cursor AI | Python, Cursor AI, Debugging | [repo](https://github.com/divyaaaagarg/-Bug-Fixing-Using-Cursor-AI) |
| Interactive Quiz Application | HTML5, CSS3, JavaScript | [repo](https://github.com/divyaaaagarg/Interactive-Quiz-Application) |
| Book Reading List Application | HTML5, CSS3, JavaScript, Local Storage | [repo](https://github.com/divyaaaagarg/Book-Reading-List-Application) |

## Technologies used
HTML5, CSS3, JavaScript (no framework), Node.js serverless function, Google Gemini API, Git/GitHub, Vercel, Cursor AI.

## Project structure
```
portfolio-website/
├── index.html            # page structure
├── css/style.css         # themes, layout, responsive rules
├── js/app.js             # rendering, theme, search UI, chatbot UI
├── js/filter.js          # search logic (also unit-tested)
├── data/portfolio.json   # ALL portfolio content: edit here to update the site and the chatbot
├── api/chat.js           # Vercel serverless function that calls Gemini
├── dev-server.js         # optional local server (static files + /api/chat)
├── tests/run-tests.js    # automated checks
├── vercel.json
├── .env.example          # template for the secret key (real .env is git-ignored)
└── .gitignore
```

## How the chatbot works
1. The browser sends the visitor's question to `/api/chat` on the same site.
2. `api/chat.js` runs on Vercel. It builds a prompt from `data/portfolio.json`, tells the model to answer only from that information, and calls the Gemini `generateContent` endpoint.
3. The key is read from the `GEMINI_API_KEY` **environment variable** on the server. It is not in the code, the repository or the browser.
4. If anything fails (rate limit, bad key, network, timeout) the visitor sees a clear message instead of a broken page.

## Setup: run locally
Requires Node.js 18 or newer.
```bash
git clone https://github.com/divyaaaagarg/portfolio-website.git
cd portfolio-website
cp .env.example .env        # then put your Gemini key in .env
npm start                   # opens on http://localhost:3000
npm test                    # runs the automated checks
```
Get a free key at [Google AI Studio](https://aistudio.google.com/). Without a key the site still works; the chatbot shows a "not configured" message.

## Deploy on Vercel
1. Push this repository to GitHub.
2. In Vercel choose **Add New > Project**, import the repository and keep the default settings (no build command needed).
3. Open **Settings > Environment Variables** and add `GEMINI_API_KEY` with your key (all environments), then **redeploy**.
4. Open the live URL and test the projects, search, theme toggle and chatbot.

## Updating content
Edit `data/portfolio.json`. To add a live link to a project, fill its `"live"` field, for example `"live": "https://your-app.vercel.app"`. Commit and push; Vercel redeploys automatically.

## Author
Divya Garg · [GitHub](https://github.com/divyaaaagarg) · [LinkedIn](https://www.linkedin.com/in/divya-garg-524bb0383) · divyagarg4922@gmail.com
