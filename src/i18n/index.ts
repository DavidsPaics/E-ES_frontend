import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import lv from "./lv.json";
import en from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      lv: { translation: lv },
      en: { translation: en },
    },
    fallbackLng: "lv",
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "htmlTag"],
      caches: ["localStorage"],
    },
    lng: "lv",
  });

export default i18n;
