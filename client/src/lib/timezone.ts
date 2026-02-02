/**
 * Georgia Timezone Utilities
 * Georgia is UTC+4 year-round (no daylight saving)
 */

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Convert a Georgia-time datetime-local (YYYY-MM-DDTHH:mm) into UTC ISO string.
 */
export function georgiaLocalToUtcIso(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  // Georgia -> UTC (minus 4 hours)
  const utc = new Date(Date.UTC(y, m - 1, d, hh - 4, mm, 0));
  return utc.toISOString();
}

/**
 * Convert a UTC ISO string to Georgia local datetime-local input format.
 */
export function utcIsoToGeorgiaLocalInput(utcIso: string): string {
  const dt = new Date(utcIso);
  const ge = new Date(dt.getTime() + 4 * 60 * 60 * 1000); // UTC -> Georgia (+4h)
  return `${ge.getUTCFullYear()}-${pad(ge.getUTCMonth() + 1)}-${pad(
    ge.getUTCDate()
  )}T${pad(ge.getUTCHours())}:${pad(ge.getUTCMinutes())}`;
}

/**
 * Format a UTC ISO string to a readable Georgia time string.
 */
export function formatGeorgiaDateTime(utcIso: string): string {
  const dt = new Date(utcIso);
  const ge = new Date(dt.getTime() + 4 * 60 * 60 * 1000);
  return `${ge.getUTCFullYear()}-${pad(ge.getUTCMonth() + 1)}-${pad(
    ge.getUTCDate()
  )} ${pad(ge.getUTCHours())}:${pad(ge.getUTCMinutes())}`;
}

/**
 * Get next Saturday date parts for default tournament scheduling.
 */
export function getNextSaturdayDefaults(): {
  regOpen: string;
  regClose: string;
  start: string;
  end: string;
} {
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7 || 7; // next Saturday (not today)
  const nextSat = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilSat
  );

  const yyyy = nextSat.getFullYear();
  const mm = pad(nextSat.getMonth() + 1);
  const dd = pad(nextSat.getDate());

  return {
    regOpen: `${yyyy}-${mm}-${dd}T20:30`,
    regClose: `${yyyy}-${mm}-${dd}T20:55`,
    start: `${yyyy}-${mm}-${dd}T21:00`,
    end: `${yyyy}-${mm}-${dd}T21:30`,
  };
}
