export const ZONA_HORARIA_BUENOS_AIRES = 'America/Argentina/Buenos_Aires';
const FECHA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const buenosAiresDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA_HORARIA_BUENOS_AIRES,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getBuenosAiresDateTimeParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    buenosAiresDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

export function toBuenosAiresInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = getBuenosAiresDateTimeParts(date);
  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
}

export function fromBuenosAiresInput(value: string): Date {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desiredWallTime;

  for (let attempt = 0; attempt < 3; attempt++) {
    const represented = getBuenosAiresDateTimeParts(new Date(instant));
    const representedWallTime = Date.UTC(
      Number(represented['year']),
      Number(represented['month']) - 1,
      Number(represented['day']),
      Number(represented['hour']),
      Number(represented['minute']),
    );
    const adjustment = desiredWallTime - representedWallTime;
    instant += adjustment;
    if (adjustment === 0) {
      break;
    }
  }

  return new Date(instant);
}

export function isValidBuenosAiresDateTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const instant = fromBuenosAiresInput(value);
  return !Number.isNaN(instant.getTime()) && toBuenosAiresInput(instant.toISOString()) === value;
}

export function isValidBuenosAiresDate(value: unknown): value is string {
  if (typeof value !== 'string' || !FECHA_PATTERN.test(value)) {
    return false;
  }

  const date = dateInputToUtc(value);
  return date !== null;
}

export function addBuenosAiresDays(value: string, days: number): string {
  const date = dateInputToUtc(value);
  if (!date) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + days);
  return formatDateInput(date);
}

export function diasEntreFechasBuenosAires(desde: string, hasta: string): number {
  const inicio = dateInputToUtc(desde);
  const fin = dateInputToUtc(hasta);
  if (!inicio || !fin) {
    return 0;
  }

  return Math.floor((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1_000)) + 1;
}

export function getTodayBuenosAires(): string {
  return toBuenosAiresInput(new Date().toISOString()).slice(0, 10);
}

function dateInputToUtc(value: string): Date | null {
  if (!FECHA_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
}

function formatDateInput(date: Date): string {
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map((part, index) => index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0'))
    .join('-');
}
