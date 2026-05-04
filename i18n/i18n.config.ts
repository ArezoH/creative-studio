import es from "./locales/es.json";
import en from "./locales/en.json";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "es",

  messages: {
    es,
    en,
  },
}));
