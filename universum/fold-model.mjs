import { foldState } from './vendor/fold/model.js';

// The source computes two different formal operators under one index.
export const MAX_FOLDS = 240;
export const CLAIM_CEILING = 'LOCAL_FORMAL_FOLD_AND_COMPRESSION_MODEL_ONLY';
const SHEET_MODEL_LIMIT = 6; // Pinned sibling sheet-motion.js and README, not foldState itself.

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Recompute from the pinned defaults; model count is not a physical fold claim. */
export function snapshot(folds) {
  const count = arguments.length === 0 ? 0 : folds;
  if (!Number.isInteger(count) || count < 0 || count > MAX_FOLDS) {
    throw new RangeError('Fold count must be an integer from 0 to 240.');
  }
  const source = foldState(count);
  return freezeDeep({
    folds: source.folds,
    stack: source.stack,
    compression: source.compression,
    comparison: source.comparison,
    extrapolated: count > SHEET_MODEL_LIMIT,
    claimCeiling: CLAIM_CEILING,
    claim: 'Getrennte formale Operatoren: idealer Faltstapel und hypothetische isotrope Kompression. Die Werte belegen weder reale Papierfaltbarkeit noch ein Schwarzes Loch oder eine Planck-Struktur.'
  });
}
