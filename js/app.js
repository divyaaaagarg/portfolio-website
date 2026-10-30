/* Portfolio front-end: renders content from data/portfolio.json,
   handles project search, theme toggle and the chatbot UI. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var data = null;
  var history = []; // recent chat turns sent to the API for context

  /* ---------- helpers ---------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    var btn = $("themeToggle");
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1220" : "#f6f8fb");
  }
  function initTheme() {
    applyTheme(currentTheme());
    $("themeToggle").addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  /* ---------- mobile nav ---------- */
  function initNav() {
    var toggle = $("navToggle");
    var links = $("navLinks");
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- content ---------- */
  function renderStatic(d) {
    document.title = d.name + " | " + d.title;
    $("heroName").textContent = d.name;
    $("heroTitle").textContent = d.title;
    $("heroIntro").textContent = d.intro;
    $("avatarInitials").textContent = d.initials;

    var about = $("aboutText");
    d.bio.forEach(function (para) { about.appendChild(el("p", "", para)); });

    $("eduDegree").textContent = d.education.degree;
    $("eduInstitution").textContent = d.education.institution;
    $("eduStatus").textContent = d.education.status;
    $("goals").textContent = d.goals;

    var grid = $("skillsGrid");
    d.skills.forEach(function (g) {
      var card = el("div", "card skill-card reveal");
      card.appendChild(el("h3", "", g.group));
      var list = el("ul", "tags");
      g.items.forEach(function (s) { list.appendChild(el("li", "tag", s)); });
      card.appendChild(list);
      grid.appendChild(card);
    });

    var mail = $("contactEmail");
    mail.href = "mailto:" + d.contact.email;
    $("contactEmailText").textContent = d.contact.email;
    $("contactGithub").href = d.contact.github;
    $("contactGithubText").textContent = d.contact.github.replace("https://", "");
    $("contactLinkedin").href = d.contact.linkedin;

    $("year").textContent = new Date().getFullYear();
  }

  /* ---------- projects + search ---------- */
  function projectCard(p) {
    var card = el("article", "card project-card reveal");
    card.appendChild(el("h3", "", p.title));
    card.appendChild(el("p", "project-desc", p.description));

    var tags = el("ul", "tags");
    p.technologies.forEach(function (t) { tags.appendChild(el("li", "tag", t)); });
    card.appendChild(tags);

    var links = el("div", "project-links");
    var repo = el("a", "btn btn-primary btn-small", "GitHub repository");
    repo.href = p.repo;
    repo.target = "_blank";
    repo.rel = "noopener noreferrer";
    links.appendChild(repo);

    if (p.live) {
      var live = el("a", "btn btn-ghost btn-small", "Live application");
      live.href = p.live;
      live.target = "_blank";
      live.rel = "noopener noreferrer";
      links.appendChild(live);
    }
    card.appendChild(links);
    return card;
  }

  function renderProjects(query) {
    var grid = $("projectsGrid");
    var matches = ProjectFilter.filterProjects(data.projects, query);
    grid.textContent = "";
    matches.forEach(function (p) { grid.appendChild(projectCard(p)); });

    var q = (query || "").trim();
    $("noResults").hidden = matches.length !== 0;
    $("clearSearch").hidden = q === "";
    $("resultCount").textContent = q
      ? matches.length + " of " + data.projects.length + " projects match “" + q + "”"
      : "Showing all " + data.projects.length + " projects";
    observeReveal();
  }

  function initSearch() {
    var input = $("projectSearch");
    input.addEventListener("input", function () { renderProjects(input.value); });
    $("clearSearch").addEventListener("click", function () {
      input.value = "";
      renderProjects("");
      input.focus();
    });
  }

  /* ---------- scroll reveal (subtle) ---------- */
  var observer = null;
  function observeReveal() {
    var items = document.querySelectorAll(".reveal:not(.visible)");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("visible"); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            observer.unobserve(en.target);
          }
        });
      }, { threshold: 0.1 });
    }
    items.forEach(function (n) { observer.observe(n); });
  }

  /* ---------- chatbot ---------- */
  function addMessage(role, text, isError) {
    var log = $("chatLog");
    var msg = el("div", "msg " + role + (isError ? " error" : ""));
    msg.appendChild(el("p", "", text));
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
    return msg;
  }

  function friendlyError(status, serverMessage) {
    if (serverMessage) return serverMessage;
    if (status === 429) return "The chatbot is getting too many requests right now. Please wait a moment and try again.";
    if (status === 404) return "The chatbot service was not found. It only works on the deployed site or with the local dev server (see README).";
    if (status >= 500) return "The chatbot service had a problem. Please try again shortly.";
    return "Sorry, I couldn't get an answer. Please try again.";
  }

  async function sendMessage(text) {
    var input = $("chatInput");
    var send = $("chatSend");
    addMessage("user", text);
    input.value = "";
    input.disabled = true;
    send.disabled = true;
    var typing = addMessage("bot typing", "Thinking…");

    try {
      var res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-6) })
      });
      var body = null;
      try { body = await res.json(); } catch (e) { /* non-JSON response */ }

      typing.remove();
      if (!res.ok || !body || typeof body.reply !== "string") {
        addMessage("bot", friendlyError(res.status, body && body.error), true);
      } else {
        addMessage("bot", body.reply);
        history.push({ role: "user", text: text });
        history.push({ role: "bot", text: body.reply });
      }
    } catch (err) {
      typing.remove();
      addMessage("bot", "Network error: I couldn't reach the chatbot. Check your internet connection and try again.", true);
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  }

  function initChat() {
    $("chatForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = $("chatInput").value.trim();
      if (text) sendMessage(text);
    });
    $("chatSuggestions").addEventListener("click", function (e) {
      if (e.target.classList.contains("chip") && !$("chatInput").disabled) {
        sendMessage(e.target.textContent);
      }
    });
  }

  /* ---------- start ---------- */
  function start() {
    initTheme();
    initNav();
    initChat();
    initSearch();
    observeReveal();

    fetch("data/portfolio.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        data = d;
        renderStatic(d);
        renderProjects("");
        observeReveal();
      })
      .catch(function () {
        $("loadError").hidden = false;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

