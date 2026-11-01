import {SEEDS, EPOCHS, snapshot} from './realms-model.mjs';

// Original, local comparison over two fresh runs of the same pinned fictional model.
export const CLAIM_CEILING = 'LOCAL_SYNTHETIC_SAME_EPOCH_SEED_COMPARISON_ONLY';
export const SOURCE = Object.freeze({
  repository: 'Juri-Halveth/halveth-realms',
  commit: '01a84005c19379e9fe7bee9567c3cb7140fe3d37',
  path: 'shared/world.mjs',
  sha256: '99b445ba4f001196374e59301e6e927eed6f978cffb9c5e837073db82205d257'
});

const NPC_IDS = Object.freeze(Array.from({length: 18}, (_, index) => `npc-${index + 1}`));

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function requireSeed(seedId) {
  const choice = typeof seedId === 'string' ? SEEDS.find(seed => seed.id === seedId) : null;
  if (!choice) throw new RangeError('Seed ID must be one of the three declared Realms choices.');
  return choice;
}

function requireEpoch(epoch) {
  if (!Number.isInteger(epoch) || !EPOCHS.includes(epoch)) {
    throw new RangeError('Model epoch must be an integer from 0 to 10.');
  }
}

function requireNpcId(npcId) {
  if (typeof npcId !== 'string' || !NPC_IDS.includes(npcId)) {
    throw new RangeError('NPC ID must be one of npc-1 through npc-18.');
  }
}

function inspectView(view, choice, epoch) {
  const world = view?.world;
  if (view.seedId !== choice.id || view.seed !== choice.seed || view.epoch !== epoch ||
      view.timeBasis !== 'MODEL_EPOCH' || world?.seed !== choice.seed || world.epoch !== epoch ||
      !Array.isArray(world.npcs) || world.npcs.length !== NPC_IDS.length ||
      world.npcs.some((npc, index) => npc?.id !== NPC_IDS[index]) ||
      !Array.isArray(world.landmarks) || world.landmarks.length !== 6 ||
      !Array.isArray(world.cultures)) {
    throw new TypeError('Pinned Realms seed, epoch, or NPC identity binding changed.');
  }
  return view;
}

function guildsOf(world) {
  return world.cultures.map(guild => ({
    id: guild.id,
    name: guild.name,
    formedAt: guild.formedAt,
    memberIds: [...guild.members]
  }));
}

function selectedNpcOf(world, npcId) {
  const npc = world.npcs.find(item => item.id === npcId);
  if (!npc) throw new TypeError('Selected NPC is absent from the pinned world.');
  const guild = npc.culture === null ? null : world.cultures.find(item => item.id === npc.culture);
  if (npc.culture !== null && !guild) throw new TypeError('Selected NPC refers to an absent model guild.');
  return {
    id: npc.id,
    name: npc.name,
    role: npc.role,
    position: {x: npc.x, z: npc.z, units: 'MODEL_COORDINATES'},
    joinsGuilds: npc.joinsGuilds,
    traits: {...npc.traits},
    cultureId: npc.culture,
    guild: guild ? {id: guild.id, name: guild.name, formedAt: guild.formedAt} : null
  };
}

function guildDifferences(leftGuilds, rightGuilds) {
  const leftById = new Map(leftGuilds.map(guild => [guild.id, guild]));
  const rightById = new Map(rightGuilds.map(guild => [guild.id, guild]));
  const ids = [...new Set([...leftById.keys(), ...rightById.keys()])].sort();
  const entries = ids.map(guildId => {
    const left = leftById.get(guildId)?.memberIds ?? [];
    const right = rightById.get(guildId)?.memberIds ?? [];
    const leftSet = new Set(left), rightSet = new Set(right);
    const leftOnly = left.filter(id => !rightSet.has(id));
    const rightOnly = right.filter(id => !leftSet.has(id));
    return {guildId, sameMembers: leftOnly.length === 0 && rightOnly.length === 0,
      leftOnly, rightOnly};
  });
  return {kind: 'MODEL_GUILD_MEMBERSHIP_SET_COMPARISON',
    same: entries.every(entry => entry.sameMembers), entries};
}

/** Same pinned rules and model epoch; two seed choices, one stable template NPC ID. */
export function pair(leftSeedId, rightSeedId, epoch, npcId) {
  const leftChoice = requireSeed(leftSeedId);
  const rightChoice = requireSeed(rightSeedId);
  requireEpoch(epoch);
  requireNpcId(npcId);

  const leftView = inspectView(snapshot(leftChoice.id, epoch), leftChoice, epoch);
  const rightView = inspectView(snapshot(rightChoice.id, epoch), rightChoice, epoch);
  if (leftSeedId === rightSeedId && JSON.stringify(leftView.world) !== JSON.stringify(rightView.world)) {
    throw new TypeError('The same seed and epoch did not reproduce the same model world.');
  }

  const leftGuilds = guildsOf(leftView.world), rightGuilds = guildsOf(rightView.world);
  const leftNpc = selectedNpcOf(leftView.world, npcId);
  const rightNpc = selectedNpcOf(rightView.world, npcId);
  if (leftNpc.name !== rightNpc.name || leftNpc.role !== rightNpc.role) {
    throw new TypeError('The selected template NPC identity changed across seeds.');
  }
  const dx = rightNpc.position.x - leftNpc.position.x;
  const dz = rightNpc.position.z - leftNpc.position.z;

  return freezeDeep({
    kind: 'REALMS_SAME_EPOCH_SEED_PAIR',
    source: {...SOURCE},
    epoch,
    timeBasis: 'MODEL_EPOCH',
    selectedNpcId: npcId,
    npcIds: [...NPC_IDS],
    left: {
      seedId: leftChoice.id, seedLabel: leftChoice.label, seed: leftChoice.seed,
      npc: leftNpc, guilds: leftGuilds
    },
    right: {
      seedId: rightChoice.id, seedLabel: rightChoice.label, seed: rightChoice.seed,
      npc: rightNpc, guilds: rightGuilds
    },
    difference: {
      basis: 'SAME_PINNED_RULES_AND_MODEL_EPOCH',
      relation: 'SAME_TEMPLATE_NPC_ID_ACROSS_SEEDED_WORLDS_NOT_TRAVEL',
      sameSeed: leftSeedId === rightSeedId,
      position: {
        kind: 'CROSS_SEED_MODEL_COORDINATE_DELTA_NOT_MOTION',
        dx, dz, distance: Math.hypot(dx, dz),
        same: dx === 0 && dz === 0
      },
      culture: {
        kind: 'MODEL_GUILD_ASSIGNMENT_COMPARISON',
        leftId: leftNpc.cultureId, rightId: rightNpc.cultureId,
        same: leftNpc.cultureId === rightNpc.cultureId
      },
      joinFlag: {
        kind: 'GENERATED_MODEL_JOIN_FLAG_COMPARISON',
        left: leftNpc.joinsGuilds, right: rightNpc.joinsGuilds,
        same: leftNpc.joinsGuilds === rightNpc.joinsGuilds
      },
      guildMembership: guildDifferences(leftGuilds, rightGuilds)
    },
    claimCeiling: CLAIM_CEILING,
    claim: 'Zwei deterministische, fiktionale Zustände derselben gepinnten Realms-Regeln bei einer gemeinsamen Modellepoche. Gleiche NPC-ID bezeichnet eine Modellvorlage, keine reale Person. Positionsdifferenz ist keine Bewegung; weder Projekthistorie noch Außenweltbeobachtung.'
  });
}
