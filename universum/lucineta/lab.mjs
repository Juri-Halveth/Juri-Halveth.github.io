import {WIDTH, HEIGHT, createState, stepState, differenceCount, population} from './model.mjs';

const $ = id => document.getElementById(id);
const CELL = 20;
const INITIAL = 777;
let seed = INITIAL;
let state = createState(seed);
let portal = false; // Default is isolated so the visitor can falsify the baseline.
let running = false;
let timer = null;
const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function paint(canvas, values, controls, color) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#0a1020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x, px = x * CELL, py = y * CELL;
      ctx.strokeStyle = 'rgba(120,145,210,.08)';
      ctx.strokeRect(px + .5, py + .5, CELL - 1, CELL - 1);
      if (values[i]) {
        ctx.fillStyle = color;
        ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
      }
      if (values[i] !== controls[i]) {
        ctx.strokeStyle = '#ffc56c';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
        if (!values[i]) {
          ctx.beginPath();
          ctx.moveTo(px + 5, py + 5);
          ctx.lineTo(px + CELL - 5, py + CELL - 5);
          ctx.moveTo(px + CELL - 5, py + 5);
          ctx.lineTo(px + 5, py + CELL - 5);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      }
    }
  }
}
function announce(message) { $('feedback').textContent = message; }
function draw() {
  paint($('canvasA'), state.a, state.isolatedA, '#25d7ec');
  paint($('canvasB'), state.b, state.isolatedB, '#be9fff');
  $('generation').textContent = String(state.generation);
  $('countA').textContent = String(population(state.a));
  $('countB').textContent = String(population(state.b));
  $('different').textContent = String(differenceCount(state));
  $('firstDifference').textContent = state.firstDifference === null ? 'Noch keine' : String(state.firstDifference);
  $('portalState').textContent = portal ? 'OFFEN' : 'GESCHLOSSEN';
  $('portal').textContent = portal ? 'Portal schließen' : 'Portal öffnen';
  $('portal').setAttribute('aria-pressed', String(portal));
  $('pause').textContent = running ? 'Pausieren' : 'Starten';
  $('pause').setAttribute('aria-pressed', String(!running));
}
function step() { state = stepState(state, portal); draw(); }
function stop() {
  if (timer !== null) window.clearInterval(timer);
  timer = null; running = false; draw();
}
function toggleRun() {
  if (running) { stop(); announce('Angehalten bei Generation ' + state.generation + '.'); return; }
  running = true; draw();
  timer = window.setInterval(step, 220);
  announce('Beide Welten entwickeln sich. Die isolierte Kontrolle läuft parallel.');
}
function reset() {
  const requested = Number($('seed').value);
  if (!Number.isSafeInteger(requested) || requested < 1 || requested > 999999999) {
    announce('Seed muss eine ganze Zahl zwischen 1 und 999999999 sein.');
    $('seed').focus();
    return;
  }
  stop(); seed = requested; state = createState(seed); portal = false;
  draw(); announce('Beide Welten und die isolierte Kontrolle auf Generation 0 zurückgesetzt.');
}
$('portal').addEventListener('click', () => {
  portal = !portal; draw();
  announce(portal ? 'Portal offen: ab dem nächsten Schritt fließen fremde Nachbarsignale.' : 'Portal geschlossen: bisherige Folgen bleiben erhalten.');
});
$('pause').addEventListener('click', toggleRun);
$('step').addEventListener('click', () => {
  if (running) stop();
  step();
  announce('Generation ' + state.generation + ': ' + differenceCount(state) + ' Unterschiede zur isolierten Kontrolle.');
});
$('reset').addEventListener('click', reset);
$('seed').addEventListener('change', reset);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) { stop(); announce('Automatisch pausiert, weil die Seite nicht sichtbar ist.'); }
});
document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,button,a')) return;
  const key = e.key.toLowerCase();
  if (key === 'p') $('portal').click();
  if (key === 'n') $('step').click();
  if (key === 'r') $('reset').click();
  if (e.key === ' ') { e.preventDefault(); $('pause').click(); }
});
draw();
announce(reduced ? 'Reduzierte Bewegung aktiv. Nutze Ein Schritt oder Starten.' : 'Bereit. Öffne das Portal und gehe einen Schritt weiter.');
