// Deterministic scene coordinates for the browser's first-person project flight.
// Route rights and terms: ../LICENSES.md and CREDITS.md (HALVETH PIRL 2.0 where rights exist).
(function (root, factory) {
  "use strict";
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  if (root) root.HALVETH_FLIGHT_MODEL = model;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const MAX_TRAVEL = 240;
  const NEAR_PLANE = 1.8;
  const TAU = Math.PI * 2;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  // The symbols refer to each project's public subject, rather than its first category.
  // The signature is the stable catalog ID, not a generated claim about the project.
  const projectMarks = Object.freeze([
    ["halveth-scarlet", "✳", 350],             // cells / states
    ["lucinet-seedspace", "⌁", 184],            // reconnecting work
    ["halveth-forschungslabor", "◇", 39],       // four-point perspective / models
    ["halveth-tresor", "▣", 178],                // local vault
    ["mein-lernportal", "▤", 46],               // lessons
    ["halveth-field-difference-lab", "⋈", 190], // diverging paths
    ["c-drohne-red-room", "△", 10],             // three-point drone scene
    ["halveth-realms", "⟁", 276],               // world contour
    ["halveth-cannabis-reform-forschung", "§", 91], // sources / reform
    ["lernstudio", "⊞", 48],                    // learning steps
    ["fortuna", "✦", 56],                       // decision space
    ["halveth-project0-keeper", "⟐", 203],      // three-part local tools
    ["halveth-morrowind-genesis", "✢", 258],    // game world / compass
    ["halveth-unreal", "⬡", 275],               // engine geometry
    ["halveth-tron-security-lab", "⎔", 151],    // protocol research
    ["leviathan-wallet-portal", "⟡", 177],      // wallet portal
    ["Juri-Halveth.github.io", "⌂", 29],        // web entrance
    ["Juri-Halveth", "◎", 328]                  // profile source
  ]);
  const topicMarks = Object.freeze([
    ["software", "⌘", 186],
    ["security", "⛨", 13],
    ["models", "◉", 347],
    ["worlds", "✴", 273],
    ["learning", "☷", 45],
    ["society", "¶", 92]
  ]);
  const PROJECT_IDS = Object.freeze(projectMarks.map((entry) => entry[0]));
  const TOPIC_IDS = Object.freeze(topicMarks.map((entry) => entry[0]));
  const projects = new Map(projectMarks.map(([id, glyph, hue]) => [id, Object.freeze({ glyph, signature: id, hue })]));
  const topics = new Map(topicMarks.map(([id, glyph, hue]) => [id, Object.freeze({ glyph, signature: "topic-" + id, hue })]));

  function finite(value, label) {
    if (!Number.isFinite(value)) throw new TypeError(label + " must be finite");
    return value;
  }
  function indexInRange(index, length, label) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= length) {
      throw new RangeError(label + " must be an integer in [0, " + (length - 1) + "]");
    }
  }
  function clampTravel(z) {
    return Math.max(0, Math.min(MAX_TRAVEL, finite(z, "travel")));
  }
  function projectWorld(index) {
    indexInRange(index, PROJECT_IDS.length, "project index");
    const angle = index * GOLDEN_ANGLE + 0.7;
    const radius = 5.3 + (index % 4) * 0.8;
    return Object.freeze({
      id: PROJECT_IDS[index],
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.7,
      z: 40 + index * 11
    });
  }
  function topicWorld(index) {
    indexInRange(index, TOPIC_IDS.length, "topic index");
    const angle = index * GOLDEN_ANGLE + 2.2;
    const radius = 8.5 + (index % 2);
    return Object.freeze({
      id: "topic-" + TOPIC_IDS[index],
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.72,
      z: 30 + index * 36
    });
  }
  function projectPoint(point, travel, width, height) {
    if (!point || typeof point !== "object") throw new TypeError("point must be an object");
    const x = finite(point.x, "point.x");
    const y = finite(point.y, "point.y");
    const z = finite(point.z, "point.z");
    finite(travel, "travel");
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new RangeError("viewport dimensions must be positive and finite");
    }
    const depth = z - clampTravel(travel);
    if (depth <= NEAR_PLANE) return null;
    const focal = Math.min(width * 0.98, height * 1.35);
    const scale = focal / depth;
    return { x: width / 2 + x * scale, y: height / 2 - y * scale, depth, scale };
  }
  function randomGenerator(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function stars(count, seed = 0x48A17E) {
    if (!Number.isSafeInteger(count) || count < 0 || count > 4000) {
      throw new RangeError("star count must be an integer in [0, 4000]");
    }
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) {
      throw new RangeError("star seed must be a uint32");
    }
    const random = randomGenerator(seed);
    const points = [];
    for (let index = 0; index < count; index += 1) {
      const angle = random() * TAU;
      const radius = 1.8 + Math.sqrt(random()) * 43;
      const z = 5 + random() * (MAX_TRAVEL + 95);
      const kind = index % 6 === 0 ? "star" : "dust";
      points.push(Object.freeze({
        id: "particle-" + index,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.68,
        z,
        kind,
        radius: kind === "star" ? 0.7 + random() * 1.15 : 0.25 + random() * 0.48,
        alpha: kind === "star" ? 0.38 + random() * 0.48 : 0.10 + random() * 0.25
      }));
    }
    return Object.freeze(points);
  }
  function identity(id, index) {
    if (index !== undefined) indexInRange(index, PROJECT_IDS.length, "project index");
    const mark = projects.get(id);
    if (!mark) throw new RangeError("unknown project identity: " + String(id));
    return mark;
  }
  function topicIdentity(id) {
    const mark = topics.get(id);
    if (!mark) throw new RangeError("unknown topic identity: " + String(id));
    return mark;
  }

  return Object.freeze({
    MAX_TRAVEL, NEAR_PLANE, PROJECT_IDS, TOPIC_IDS,
    clampTravel, projectWorld, topicWorld, projectPoint, stars, identity, topicIdentity
  });
});
