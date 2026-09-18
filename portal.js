"use strict";
(() => {
  const english = {
    skip: "Skip to content", brandSub: "A project by Juri Halveth", brandLabel: "HALVETH home", navLabel: "Main navigation", navProjects: "Projects", navPrinciples: "Approach", navContact: "Contact",
    eyebrow: "Sources. Ideas. Your own path.", heroTitle: "Many perspectives.<br>One place to explore.", heroLead: "Welcome to HALVETH and LUCINET. Creative worlds, traceable research and tools for learning meet here.",
    enterScarlet: 'Explore Scarlet <span aria-hidden="true">↗</span>', allProjects: 'All projects <span aria-hidden="true">↓</span>', heroCaption: "Original contributions. Visible sources. Space for open questions.", coreCaption: "CONNECTIONS", orbitLearn: "LEARNING",
    projectEyebrow: "Find your starting point", projectsTitle: "Where would you like to go?", projectIntro: "Three ways in. The sources are always within reach.", tagExperience: "EXPLORE", tagResearch: "INVESTIGATE", tagLearn: "KEEP LEARNING",
    scarletText: "The visual portal: Earth, stories, entities and research perspectives — with routes to their individual contributions.", scarletLink: 'Open the portal <span aria-hidden="true">↗</span>', source: "Source code on GitHub",
    researchText: "Theses, questions and topical research branches. Sources, observations and interpretations are presented in context.", researchLink: 'Open the topic wiki <span aria-hidden="true">↗</span>', researchSource: "Research repository on GitHub", researchNotice: "Latest: HALVETH Research",
    learningText: "Free learning about AI, programming, mathematics and more. Accessible explanations, exercises and individual learning paths.", learningLink: 'Visit Lernstudio <span aria-hidden="true">↗</span>',
    moreLabel: "More public projects", birthLink: 'Birth environment · Research question <span aria-hidden="true">↗</span>', githubProfile: 'GitHub profile <span aria-hidden="true">↗</span>',
    principlesEyebrow: "Our approach", principlesTitle: "Stay curious.<br>Make the work traceable.", p1Title: "Every work has a context.", p1Text: "Stories, models and empirical claims each have their own place and appropriate sources.", p2Title: "Further thinking is welcome.", p2Text: "Corrections, new sources and concrete proposals can improve a contribution. Changes should remain traceable.", p3Title: "Keep rights visible.", p3Text: "Each work retains its own license and provenance. New original PIRL contributions are source-available; earlier grants and third-party rights remain applicable.",
    contactEyebrow: "Have a concrete idea?", contactTitle: "Let's talk about it.", contactText: "A source, correction, collaboration or licensing request: name the project and the contribution you are referring to.", rights: "Rights & provenance", licenses: "Licenses", privacy: "This portal uses no analytics trackers."
  };
  const nodes = [...document.querySelectorAll("[data-i18n]")];
  const german = new Map(nodes.map(node => [node, node.innerHTML]));
  const ariaNodes = [...document.querySelectorAll("[data-i18n-aria]")];
  const germanAria = new Map(ariaNodes.map(node => [node, node.getAttribute("aria-label")]));
  const setLanguage = language => {
    const isEnglish = language === "en";
    document.documentElement.lang = isEnglish ? "en" : "de";
    document.title = isEnglish ? "HALVETH × LUCINET · Projects & Perspectives" : "HALVETH × LUCINET · Projekte & Perspektiven";
    nodes.forEach(node => { node.innerHTML = isEnglish ? english[node.dataset.i18n] || german.get(node) : german.get(node); });
    ariaNodes.forEach(node => node.setAttribute("aria-label", isEnglish ? english[node.dataset.i18nAria] || germanAria.get(node) : germanAria.get(node)));
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
    document.querySelectorAll("[data-lang-target]").forEach(link => { link.href = link.dataset.langTarget + "?lang=" + language; });
    document.querySelector('meta[name="description"]').content = isEnglish ? "HALVETH × LUCINET — projects, sources, stories and free learning by Juri Halveth." : "HALVETH × LUCINET — Projekte, Quellen, Geschichten und kostenloses Lernen von Juri Halveth.";
  };
  const initial = new URL(location.href).searchParams.get("lang") === "en" ? "en" : "de";
  setLanguage(initial);
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => {
    const language = button.dataset.lang;
    setLanguage(language);
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    history.replaceState(null, "", url);
  }));
})();
