// src/website/data/eventsData.ts
// localStorage-based events store with bilingual support

export interface CompetitionEvent {
  id: string;
  title: { en: string; lv: string };
  description: { en: string; lv: string };
  date: string;
  endDate?: string;
  location: { en: string; lv: string };
  registrationUrl?: string;
  status: "upcoming" | "ongoing" | "completed";
}

const STORAGE_KEY = "ees_events";

const SEED_EVENTS: CompetitionEvent[] = [
  {
    id: "evt-1",
    title: {
      en: "Energy Efficiency Competition 2026",
      lv: "Energo Efektivitātes Sacensības 2026",
    },
    description: {
      en: "The grand finale! Features the Efficiency Race, Drag Race, Shuttle Run, Figure Driving, Braking Efficiency test, and the Final Race. Awards ceremony follows the last race.",
      lv: "Lielais fināls! Ietver Efektivitātes braucienu, Dragreisu, Atspoli, Figūru izbraukšanu, Bremzēšanas efektivitātes testu un Fināla braucienu. Apbalvošanas ceremonija notiek pēc pēdējā brauciena.",
    },
    date: "2026-06-06",
    endDate: "2026-06-06",
    location: {
      en: "Zemgale Sports and Recreation Complex (Jelgava Ice Hall), Rīgas iela 11, Jelgava.",
      lv: "Sporta un atpūtas kompleksa\n“Zemgale” (Jelgavas ledus halle) teritorijā, Rīgas iela 11, Jelgavā.",
    },
    registrationUrl: "",
    status: "upcoming",
  },
];

function loadEvents(): CompetitionEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CompetitionEvent[];
  } catch {
    console.warn("Failed to parse events from localStorage");
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_EVENTS));
  return [...SEED_EVENTS];
}

function saveEvents(events: CompetitionEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function getEvents(statusFilter?: CompetitionEvent["status"]): CompetitionEvent[] {
  const all = loadEvents();
  const sorted = all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return statusFilter ? sorted.filter((e) => e.status === statusFilter) : sorted;
}

export function getEvent(id: string): CompetitionEvent | undefined {
  return loadEvents().find((e) => e.id === id);
}

export function addEvent(data: Omit<CompetitionEvent, "id">): CompetitionEvent {
  const events = loadEvents();
  const event: CompetitionEvent = { ...data, id: `evt-${Date.now()}` };
  events.push(event);
  saveEvents(events);
  return event;
}

export function updateEvent(id: string, data: Partial<CompetitionEvent>): CompetitionEvent | null {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...data, id };
  saveEvents(events);
  return events[idx];
}

export function deleteEvent(id: string): boolean {
  const events = loadEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return false;
  saveEvents(filtered);
  return true;
}
