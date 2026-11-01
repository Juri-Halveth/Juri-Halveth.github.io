(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HALVETH_SOURCE_TIME = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
  });

  function timestamp(value) {
    if (typeof value !== 'string' || !UTC.test(value)) throw new RangeError('UTC source timestamp required.');
    const milliseconds = Date.parse(value);
    if (!Number.isFinite(milliseconds)) throw new RangeError('Valid UTC source timestamp required.');
    return milliseconds;
  }

  function interval(from, to) {
    const milliseconds = timestamp(to) - timestamp(from);
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
      throw new RangeError('Nonnegative exact source interval required.');
    }
    return milliseconds;
  }

  function pieces(milliseconds) {
    let remaining = milliseconds;
    const days = Math.floor(remaining / 86400000); remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000); remaining %= 60000;
    const seconds = Math.floor(remaining / 1000); remaining %= 1000;
    return {days, hours, minutes, seconds, milliseconds: remaining};
  }

  function formatUTC(value) {
    const date = new Date(timestamp(value));
    const remainder = date.getUTCMilliseconds();
    return formatter.format(date) + (remainder ? '.' + String(remainder).padStart(3, '0') : '') + ' UTC';
  }

  function durationExact(from, to) {
    const {days, hours, minutes, seconds, milliseconds} = pieces(interval(from, to));
    const parts = [
      days ? days + (days === 1 ? ' Tag' : ' Tage') : '',
      hours ? hours + (hours === 1 ? ' Stunde' : ' Stunden') : '',
      minutes ? minutes + (minutes === 1 ? ' Minute' : ' Minuten') : '',
      seconds ? seconds + (seconds === 1 ? ' Sekunde' : ' Sekunden') : '',
      milliseconds ? milliseconds + (milliseconds === 1 ? ' Millisekunde' : ' Millisekunden') : ''
    ].filter(Boolean);
    return parts.join(' · ') || '0 Sekunden';
  }

  function durationCompact(from, to) {
    const {days, hours, minutes, seconds, milliseconds} = pieces(interval(from, to));
    const parts = [
      days ? days + 'd' : '',
      hours ? hours + 'h' : '',
      minutes ? minutes + 'm' : '',
      seconds ? seconds + 's' : '',
      milliseconds ? milliseconds + 'ms' : ''
    ].filter(Boolean);
    return parts.join(' ') || '0s';
  }

  return Object.freeze({formatUTC, durationExact, durationCompact});
}));
