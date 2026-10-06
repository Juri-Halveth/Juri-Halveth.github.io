function ray(radius, height, correction) {
  const start = {x: -3, y: height};
  const slope = -correction * height / 1000;
  const norm = Math.hypot(1, slope);
  const ix = 1 / norm, iy = slope / norm;
  const ox = start.x - radius, oy = start.y;
  const b = ox * ix + oy * iy;
  const discriminant = b * b - (ox * ox + oy * oy - radius * radius);
  if (discriminant < 0) throw new Error('Ray misses the reduced surface');
  const travel = -b - Math.sqrt(discriminant);
  const x = start.x + travel * ix, y = start.y + travel * iy;
  const nx = (x - radius) / radius, ny = y / radius;
  const cosi = -(ix * nx + iy * ny), eta = 1 / 1.336;
  const factor = eta * cosi - Math.sqrt(1 - eta * eta * (1 - cosi * cosi));
  const tx = eta * ix + factor * nx, ty = eta * iy + factor * ny;
  return {x, y, tx, ty, at: plane => y + (plane - x) * ty / tx};
}
function paraxialFocus(radius, correction) {
  const power = 0.336 / (radius / 1000);
  const incident = correction / (1 - 0.003 * correction);
  return 1000 * 1.336 / (power + incident);
}
function position(t, turn) {
  return turn && t > 1000 ? 50 - 0.04 * (t - 1000) : 10 + 0.04 * t;
}
function temporal(t, delay, gain, turn) {
  const sampleTime = t - delay;
  const current = position(t, turn), delayed = position(sampleTime, turn);
  const velocity = (delayed - position(sampleTime - 20, turn)) / 20;
  const predicted = delayed + gain * delay * velocity;
  return {current, delayed, predicted, errorDelayed: Math.abs(delayed-current), errorPredicted: Math.abs(predicted-current)};
}
export { ray, paraxialFocus, position, temporal };
