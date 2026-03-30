// src/website/data/newsStore.ts
// localStorage-based news CRUD with bilingual support

export interface NewsArticle {
  id: string;
  title: { en: string; lv: string };
  summary: { en: string; lv: string };
  content: { en: string; lv: string };
  author: string;
  date: string;
  image: string;
  tags: string[];
  published: boolean;
  attachments?: { name: string; type: string; dataUrl: string }[];
}

const STORAGE_KEY = "ees_news_articles";

const SEED_ARTICLES: NewsArticle[] = [
  {
    id: "seed-1",
    title: {
      en: "2026 Championship Season Officially Announced",
      lv: "2026. gada čempionāta sezona oficiāli paziņota",
    },
    summary: {
      en: "The E-ES Electric Vehicle Racing Championship returns for its 2026 season with new challenges and exciting updates.",
      lv: "E-ES Elektroauto Sacensības atgriežas 2026. gada sezonā ar jauniem izaicinājumiem un aizraujošiem jaunumiem.",
    },
    content: {
      en: "We are thrilled to announce the 2026 E-ES Electric Vehicle Racing Championship! This year brings several improvements to the competition format.\n\nThe season will feature five stages: Qualification, Efficiency Race, Technical Design Solutions, Automotive Knowledge Test, and the Final Race.\n\nTeams from schools across Latvia are invited to register their electric vehicles and compete for the championship title. New this year: updated scoring criteria for Technical Design, emphasizing innovation and sustainability.\n\nRegistration opens on March 1, 2026. Don't miss your chance to participate!",
      lv: "Ar prieku paziņojam par 2026. gada E-ES Elektroauto Sacensību čempionātu! Šogad sacensību formātā ir vairāki uzlabojumi.\n\nSezona ietvers piecus posmus: Kvalifikāciju, Efektivitātes braucienu, Tehnisko dizainu risinājumus, Autobūves zināšanu pārbaudi un Fināla braucienu.\n\nKomandas no Latvijas skolām tiek aicinātas reģistrēt savus elektromobiļus un sacensties par čempiona titulu. Jaunums šogad: atjaunoti Tehniskā dizaina vērtēšanas kritēriji, uzsverot inovāciju un ilgtspējību.\n\nReģistrācija sākas 2026. gada 1. martā. Nepalaidiet garām iespēju piedalīties!",
    },
    author: "E-ES Team",
    date: "2026-01-15",
    image: "",
    tags: ["announcement", "2026", "championship"],
    published: true,
  },
  {
    id: "seed-2",
    title: {
      en: "Updated Competition Rules for 2026",
      lv: "Atjaunoti sacensību noteikumi 2026. gadam",
    },
    summary: {
      en: "Review the updated rules and regulations for the 2026 competition season, including changes to the scoring system.",
      lv: "Iepazīstieties ar atjaunotajiem noteikumiem 2026. gada sacensību sezonai, tostarp izmaiņām vērtēšanas sistēmā.",
    },
    content: {
      en: "The competition committee has finalized the rules for the 2026 season. Key changes include:\n\n• Technical Design scoring now uses three criteria: Design (40%), Team (30%), and Additional Solutions (30%)\n• Each criterion is scored 0–10 by the jury\n• Efficiency Race coefficient increased to 3x\n• New Shuttle Run distance requirements\n• Updated safety inspection checklist\n\nAll participants must review the full rules document available on the Rules page before registering.",
      lv: "Sacensību komiteja ir apstiprinājusi 2026. gada sezonas noteikumus. Galvenās izmaiņas:\n\n• Tehniskā dizaina vērtēšana tagad izmanto trīs kritērijus: Dizains (40%), Komanda (30%) un Papildu risinājumi (30%)\n• Katru kritēriju žūrija vērtē no 0 līdz 10\n• Efektivitātes brauciena koeficients palielināts līdz 3x\n• Jauni Atspoles distances prasības\n• Atjaunots drošības pārbaudes kontrolsaraksts\n\nVisiem dalībniekiem pirms reģistrācijas jāiepazīstas ar pilnu noteikumu dokumentu Noteikumu lapā.",
    },
    author: "Competition Committee",
    date: "2026-01-20",
    image: "",
    tags: ["rules", "2026", "update"],
    published: true,
  },
  {
    id: "seed-3",
    title: {
      en: "Pre-Season Technical Workshop Schedule",
      lv: "Pirmssezonas tehnisko darbnīcu grafiks",
    },
    summary: {
      en: "Join our free technical workshops to prepare your team and vehicle for the 2026 championship.",
      lv: "Piedalieties mūsu bezmaksas tehniskajās darbnīcās, lai sagatavotu savu komandu un transportlīdzekli 2026. gada čempionātam.",
    },
    content: {
      en: "We're organizing a series of free workshops to help teams prepare for the competition:\n\n📅 February 15 – Vehicle Design Fundamentals\n📅 February 22 – Electrical Systems & Safety\n📅 March 1 – Efficiency Optimization Techniques\n📅 March 8 – Race Strategy & Team Communication\n\nAll workshops take place at the RTU Faculty of Engineering, Building 1, Room 202.\n\nWorkshops are open to all registered and prospective teams. No prior experience required!",
      lv: "Mēs organizējam bezmaksas darbnīcu sēriju, lai palīdzētu komandām sagatavoties sacensībām:\n\n📅 15. februāris – Transportlīdzekļa dizaina pamati\n📅 22. februāris – Elektriskie sistēmas un drošība\n📅 1. marts – Efektivitātes optimizācijas tehnikas\n📅 8. marts – Sacensību stratēģija un komandas komunikācija\n\nVisas darbnīcas notiek RTU Inženierzinātņu fakultātē, 1. ēkā, 202. telpā.\n\nDarbnīcas ir atvērtas visām reģistrētām un potenciālajām komandām. Iepriekšēja pieredze nav nepieciešama!",
    },
    author: "E-ES Team",
    date: "2026-02-01",
    image: "",
    tags: ["workshop", "training", "preparation"],
    published: true,
  },
];

function loadArticles(): NewsArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NewsArticle[];
  } catch {
    console.warn("Failed to parse news from localStorage");
  }
  // Seed on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES));
  return [...SEED_ARTICLES];
}

function saveArticles(articles: NewsArticle[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

export function getArticles(publishedOnly = false): NewsArticle[] {
  const all = loadArticles();
  const sorted = all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return publishedOnly ? sorted.filter((a) => a.published) : sorted;
}

export function getArticle(id: string): NewsArticle | undefined {
  return loadArticles().find((a) => a.id === id);
}

export function addArticle(data: Omit<NewsArticle, "id">): NewsArticle {
  const articles = loadArticles();
  const article: NewsArticle = { ...data, id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  articles.push(article);
  saveArticles(articles);
  return article;
}

export function updateArticle(id: string, data: Partial<NewsArticle>): NewsArticle | null {
  const articles = loadArticles();
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  articles[idx] = { ...articles[idx], ...data, id };
  saveArticles(articles);
  return articles[idx];
}

export function deleteArticle(id: string): boolean {
  const articles = loadArticles();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) return false;
  saveArticles(filtered);
  return true;
}
