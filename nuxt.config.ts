export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "nuxt-auth-utils",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/i18n",
  ],

  runtimeConfig: {
    session: {
      password:
        process.env.NUXT_SESSION_PASSWORD || "8bd0938d3c7741ffade548aa168c9d4a",
      name: "nuxt-session",
      cookie: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pbAdminEmail: process.env.PB_ADMIN_EMAIL,
    pbAdminPassword: process.env.PB_ADMIN_PASSWORD,
    pocketbaseUrl: process.env.POCKETBASE_URL || "http://127.0.0.1:8090",

    public: {
      pocketbaseUrl: process.env.POCKETBASE_URL || "http://127.0.0.1:8090",
    },
  },

  routeRules: {
    "/dashboard/**": { ssr: true },
  },

  ui: {
    theme: {
      colors: [
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "neutral",
      ],
    },
  },

  css: ["~/assets/main.css"],
  ssr: false,
  i18n: {
    strategy: "no_prefix",
    defaultLocale: "es",
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "es", name: "Español", file: "es.json" },
    ],
    vueI18n: "./i18n.config.ts",
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "es-ES",
      },
    },
  },
});
