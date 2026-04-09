import dayjs from 'dayjs';

// ── Tolerance system ─────────────────────────────────────────────────────
// Every hub rendez-vous has a reference time with a +/- 10 minute window.
// -10 min → preparation phase (early arrival encouraged)
//   0 min → exact reference time (responsibility starts)
// +10 min → tolerance (transporter MUST stay available)

export const TOLERANCE_MINUTES = 10;

export type ToleranceWindow = {
  start: Date;
  referenceTime: Date;
  end: Date;
};

export type ToleranceStatus =
  | 'early'        // before -10
  | 'preparation'  // -10 to 0
  | 'on_time'      // exactly at reference (within ~30s)
  | 'tolerance'    // 0 to +10
  | 'late';        // after +10

export function getToleranceWindow(referenceTime: Date): ToleranceWindow {
  const ref = dayjs(referenceTime);
  return {
    start: ref.subtract(TOLERANCE_MINUTES, 'minute').toDate(),
    referenceTime,
    end: ref.add(TOLERANCE_MINUTES, 'minute').toDate(),
  };
}

export function getToleranceStatus(referenceTime: Date, now: Date = new Date()): ToleranceStatus {
  const window = getToleranceWindow(referenceTime);
  const nowMs = now.getTime();

  if (nowMs < window.start.getTime()) return 'early';
  if (nowMs < window.referenceTime.getTime()) return 'preparation';
  if (nowMs <= window.end.getTime()) return 'tolerance';
  return 'late';
}

export function getToleranceMessage(status: ToleranceStatus): string {
  switch (status) {
    case 'early':
      return 'Votre rendez-vous n\'a pas encore commencé.';
    case 'preparation':
      return 'Prenez votre temps, vous êtes dans la fenêtre prévue.';
    case 'on_time':
      return 'C\'est l\'heure ! Merci pour votre ponctualité.';
    case 'tolerance':
      return 'Un léger décalage peut arriver, merci pour votre patience.';
    case 'late':
      return 'La fenêtre est dépassée.';
  }
}

export function formatToleranceTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function getToleranceProgress(referenceTime: Date, now: Date = new Date()): number {
  const window = getToleranceWindow(referenceTime);
  const totalMs = window.end.getTime() - window.start.getTime();
  const elapsedMs = now.getTime() - window.start.getTime();
  return Math.max(0, Math.min(1, elapsedMs / totalMs));
}

// ── Mock notification helpers ────────────────────────────────────────────

export type ToleranceNotification = {
  id: string;
  triggerAt: Date;
  title: string;
  body: string;
  fired: boolean;
};

export function buildToleranceNotifications(
  referenceTime: Date,
  hubName: string,
): ToleranceNotification[] {
  const ref = dayjs(referenceTime);
  return [
    {
      id: 'tol-10',
      triggerAt: ref.subtract(10, 'minute').toDate(),
      title: 'Rendez-vous dans 10 minutes',
      body: `Votre rendez-vous approche. Préparez-vous.`,
      fired: false,
    },
    {
      id: 'tol-5',
      triggerAt: ref.subtract(5, 'minute').toDate(),
      title: 'Rendez-vous dans 5 minutes',
      body: `Plus que 5 minutes avant votre rendez-vous au hub ${hubName}.`,
      fired: false,
    },
    {
      id: 'tol-0',
      triggerAt: ref.toDate(),
      title: 'C\'est l\'heure !',
      body: `C'est l'heure ! Rendez-vous au hub ${hubName}.`,
      fired: false,
    },
  ];
}
