// SPDX-License-Identifier: MIT
// Mathematical countermodels, not a model of a physically foldable sheet.
export const DEFAULTS = Object.freeze({
  widthM: 0.297,
  heightM: 0.210,
  thicknessM: 0.0001,
  massKg: 0.005,
  compressionRadiusM: 0.30,
});
export const PLANCK_LENGTH_M = 1.616255e-35; // CODATA 2022
export const G = 6.67430e-11;
export const C = 299792458;

export function firstIntegerCrossing(initial, target) {
  if (!(initial > 0) || !(target > 0)) throw new RangeError("positive lengths required");
  return Math.max(0, Math.ceil(Math.log2(initial / target)));
}

export function foldState(folds, parameters = DEFAULTS) {
  if (!Number.isInteger(folds) || folds < 0 || folds > 240)
    throw new RangeError("fold count must be an integer from 0 to 240");
  const {widthM, heightM, thicknessM, massKg, compressionRadiusM} = parameters;
  if (![widthM,heightM,thicknessM,massKg,compressionRadiusM].every(x => Number.isFinite(x) && x > 0))
    throw new RangeError("all input measurements must be positive and finite");
  let width = widthM, height = heightM;
  let widthHalvings = 0, heightHalvings = 0;
  for (let n = 0; n < folds; n++) {
    if (width >= height) { width /= 2; widthHalvings++; }
    else { height /= 2; heightHalvings++; }
  }
  const layers = 2 ** folds;
  const thickness = thicknessM * layers;
  const area = width * height;
  const initialVolume = widthM * heightM * thicknessM;
  const stackVolume = area * thickness;
  // Bounding-sphere radius is a geometric comparison, not a collapse criterion.
  const stackExtent = Math.hypot(width, height, thickness) / 2;
  const compressionRadius = compressionRadiusM / layers;
  const schwarzschildRadius = 2 * G * massKg / (C * C);
  const compressionDensity = massKg /
    ((4 / 3) * Math.PI * compressionRadius ** 3);
  return {
    folds,
    stack: {widthM: width, heightM: height, thicknessM: thickness,
      footprintAreaM2: area, volumeM3: stackVolume, initialVolumeM3: initialVolume,
      boundingRadiusM: stackExtent, layers, widthHalvings, heightHalvings},
    compression: {radiusM: compressionRadius, densityKgM3: compressionDensity,
      radiusBelowSchwarzschild: compressionRadius <= schwarzschildRadius},
    comparison: {schwarzschildRadiusM: schwarzschildRadius,
      planckLengthM: PLANCK_LENGTH_M,
      firstSchwarzschildFold: firstIntegerCrossing(compressionRadiusM, schwarzschildRadius),
      firstPlanckFold: firstIntegerCrossing(compressionRadiusM, PLANCK_LENGTH_M)},
  };
}

export const inspectionQuestions = Object.freeze({
  release: {
    question: "Ist die Veröffentlichung identisch mit dem gebauten Stand?",
    resolution: "Commit → Build-Rezept → Artefakt-Hash → ausgelieferte Bytes",
    reentry: "Ein Hash-Mismatch oder fehlender Build-Beleg öffnet die nächste Ebene.",
  },
  changed: {
    question: "Welche Datei änderte sich?",
    resolution: "Commit → Tree → begrenzter Diff → Datei",
    reentry: "Ein relevanter Diff oder ein fehlender Dateibeleg öffnet Funktion und Zeile.",
  },
  regression: {
    question: "Wo beginnt eine beobachtete Regression?",
    resolution: "Gleiche Versionen und Umgebung → erster abweichender Test → Diff → Funktion",
    reentry: "Ein reproduzierbarer Unterschied öffnet Zeile und Eingabe; ohne ihn bleibt UNKNOWN.",
  },
});
