/* Vercel serverless function: POST /api/chat
   Receives a visitor question, adds the portfolio information as context and
   asks the Google Gemini API for an answer.

   The API key lives ONLY in the GEMINI_API_KEY environment variable on the
   server. It is never sent to the browser or stored in the repository. */

const portfolio = require("../data/portfolio.json");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;
const TIMEOUT_MS = 20000;

// Turns data/portfolio.json into plain text the model can use as its only source of truth.
function buildKnowledge(p) {
  const lines = [];
  lines.push("NAME: " + p.name);
  lines.push("TITLE: " + p.title);
  lines.push("INTRO: " + p.intro);
  lines.push("ABOUT: " + p.bio.join(" "));
  lines.push(
    "EDUCATION: " + p.education.degree + ", " + p.education.institution + " (" + p.education.status + ")"
  );
  lines.push("CAREER GOAL: " + p.goals);
  lines.push(
    "SKILLS: " + p.skills.map((g) => g.group + ": " + g.items.join(", ")).join(" | ")
  );
  lines.push("EMAIL: " + p.contact.email);
  lines.push("GITHUB: " + p.contact.github);
  lines.push("LINKEDIN: " + p.contact.linkedin);
  lines.push("PROJECTS (" + p.projects.length + "):");
  p.projects.forEach((proj, i) => {
    lines.push(
      i + 1 + ". " + proj.title +
        "\n   Description: " + proj.description +
        "\n   Technologies: " + proj.technologies.join(", ") +
        "\n   GitHub repository: " + proj.repo +
        "\n   Live link: " + (proj.live || "no live link listed")
    );
  });
  return lines.join("\n");
}

function buildSystemPrompt(p) {
  return [
    "You are the AI assistant on " + p.name + "'s personal portfolio website.",
    "Answer visitors' questions about her, her skills, education and projects.",
    "Use ONLY the portfolio information below. If the answer is not in it, say you don't have that information and suggest contacting her by email or GitHub.",
    "Never invent experience, certifications, links or project details.",
    "Speak about Divya in the third person unless the visitor asks 'you', in which case you may answer as her assistant.",
    "Keep answers short (2-5 sentences) and friendly. Plain text only, no markdown tables.",
    "If asked something unrelated to the portfolio, politely say you can only answer questions about it.",
    "",
    "PORTFOLIO INFORMATION:",
    buildKnowledge(p)
  ].join("\n");
}

// Keep only well-formed, size-limited history turns from the browser.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((h) => h && (h.role === "user" || h.role === "bot") && typeof h.text === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text.slice(0, 1000) }]
    }));
}

function send(res, status, body) {
  res.status(status).json(body);
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, {
      error: "The chatbot isn't configured yet (missing GEMINI_API_KEY on the server)."
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  const message = body && typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return send(res, 400, { error: "Please type a question." });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return send(res, 400, { error: "Your question is too long. Please keep it under " + MAX_MESSAGE_LENGTH + " characters." });
  }

  const payload = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(portfolio) }] },
    contents: sanitizeHistory(body.history).concat([{ role: "user", parts: [{ text: message }] }]),
    generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!apiRes.ok) {
      // Log details server-side only; never echo provider errors (they may mention keys) to visitors.
      console.error("Gemini API error", apiRes.status);
      if (apiRes.status === 429) {
        return send(res, 429, { error: "The chatbot is busy (free usage limit reached). Please try again in a minute." });
      }
      if (apiRes.status === 400 || apiRes.status === 401 || apiRes.status === 403) {
        return send(res, 502, { error: "The chatbot's API key or settings are not valid. The site owner needs to check the configuration." });
      }
      return send(res, 502, { error: "The AI service had a problem. Please try again shortly." });
    }

    const data = await apiRes.json();
    const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    const reply = Array.isArray(parts) ? parts.map((x) => x.text || "").join("").trim() : "";
    if (!reply) {
      return send(res, 502, { error: "I couldn't generate an answer for that. Please try rephrasing your question." });
    }
    return send(res, 200, { reply });
  } catch (err) {
    if (err && err.name === "AbortError") {
      return send(res, 504, { error: "The AI service took too long to respond. Please try again." });
    }
    console.error("Chat handler error", err && err.message);
    return send(res, 502, { error: "Couldn't reach the AI service. Please try again shortly." });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = handler;
module.exports.buildKnowledge = buildKnowledge;
module.exports.buildSystemPrompt = buildSystemPrompt;
module.exports.sanitizeHistory = sanitizeHistory;

