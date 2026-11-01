import { createWorld, evolveWorld } from './vendor/realms/shared/world.mjs';

// A bounded, read-only view over the pinned fictional Realms world rules.
export const SEEDS = Object.freeze([
  Object.freeze({ id: 'morgenlicht', label: 'Morgenlicht', seed: 'HALVETH · Morgenlicht' }),
  Object.freeze({ id: 'hain', label: 'Sterne über dem Hain', seed: 'Sterne über dem Hain 🌿' }),
  Object.freeze({ id: 'zusammenarbeit', label: 'Freie Zusammenarbeit', seed: 'Freie Zusammenarbeit' })
]);
export const EPOCHS = Object.freeze(Array.from({ length: 11 }, (_, epoch) => epoch));
export const CLAIM_CEILING = 'LOCAL_SYNTHETIC_WORLD_MODEL_ONLY';

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Recomputes from a fresh world; an epoch is a model step, not elapsed real time. */
export function snapshot(seedId, epoch) {
  const chosenSeed = arguments.length === 0 ? 'morgenlicht' : seedId;
  const chosenEpoch = arguments.length < 2 ? 0 : epoch;
  const selected = SEEDS.find(item => item.id === chosenSeed);
  if (!selected) throw new RangeError('Choose one of the declared Realms seed IDs.');
  if (!Number.isInteger(chosenEpoch) || chosenEpoch < 0 || chosenEpoch > 10) {
    throw new RangeError('Realms epoch must be an integer from 0 to 10.');
  }
  const world = createWorld(selected.seed);
  if (chosenEpoch > 0) evolveWorld(world, chosenEpoch);
  return freezeDeep({
    seedId: selected.id,
    seedLabel: selected.label,
    seed: selected.seed,
    epoch: chosenEpoch,
    timeBasis: 'MODEL_EPOCH',
    world,
    claimCeiling: CLAIM_CEILING,
    claim: 'Fiktionaler, deterministischer Software-Weltzustand. Keine Beobachtung einer Außenwelt, kein Server- oder Multiplayer-Zustand.'
  });
}

/** A reset is a fresh epoch-zero calculation, not a mutation of an earlier snapshot. */
export function reset(seedId) {
  return snapshot(arguments.length === 0 ? 'morgenlicht' : seedId, 0);
}
