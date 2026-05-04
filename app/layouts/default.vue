<template>
  <main
    role="main"
    class="min-h-screen relative"
    :class="{ 'pt-12': isDashboardRoutes }"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>

    <header
      role="banner"
      class="fixed top-0 left-0 right-0 z-50 flex flex-row justify-between items-center px-3 sm:px-4 md:px-6 py-1 bg-gradient-to-r from-purple-800/90 to-indigo-800/90 backdrop-blur-sm shadow-lg h-14 sm:h-16"
    >
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <div class="relative flex-shrink-0">
          <div class="absolute -inset-1 rounded-full blur opacity-75"></div>
          <UIcon
            name="i-heroicons-sparkles"
            class="w-6 h-6 sm:w-8 sm:h-8 text-pink-300"
            aria-hidden="true"
          />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-white text-base sm:text-xl font-bold truncate">
            {{ $t("layout.header.title") }}
          </span>
          <span
            class="hidden md:block text-xs text-secondary-300/80 font-medium tracking-wider truncate"
          >
            {{ $t("layout.header.tagline") }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        <span
          v-if="loggedIn && !isAuthRoute"
          class="hidden lg:block text-white font-medium text-sm truncate max-w-[150px]"
        >
          {{ user?.name || user?.email }}
        </span>

        <UDropdownMenu v-if="loggedIn || isAuthRoute" :items="languageItems">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            class="text-white hover:bg-white/10"
            aria-label="Change language"
          >
            <span class="text-xs sm:text-sm">{{ currentLanguageLabel }}</span>
          </UButton>
        </UDropdownMenu>
        <Notificationbell v-if="isDashboardRoutes" />
        <UButton
          v-if="loggedIn && !isAuthRoute"
          color="primary"
          variant="solid"
          icon="i-heroicons-arrow-right-on-rectangle"
          size="sm"
          class="hidden sm:flex"
          aria-label="Logout"
          @click="handleLogout"
        >
          <span class="hidden md:inline">{{ $t("layout.header.logout") }}</span>
        </UButton>
        <UButton
          v-if="loggedIn && !isAuthRoute"
          variant="solid"
          icon="i-heroicons-arrow-right-on-rectangle"
          size="xs"
          class="sm:hidden"
          aria-label="Logout"
          @click="handleLogout"
        />
      </div>
    </header>

    <nav
      v-if="isDashboardRoutes"
      role="navigation"
      aria-label="Dashboard navigation"
      class="fixed top-14 sm:top-16 left-0 right-0 z-40 flex flex-row justify-between items-center px-2 sm:px-4 bg-white dark:bg-neutral-900 dark:border-neutral-900 h-10 sm:h-12"
    >
      <div class="flex items-center min-w-0">
        <slot name="nav-left"></slot>
      </div>
      <div class="flex-1 min-w-0"></div>
      <div
        class="flex items-center gap-1 sm:gap-2 md:gap-3 pr-2 sm:pr-4 min-w-0"
      >
        <slot name="nav-right"></slot>
      </div>
    </nav>

    <section
      id="main-content"
      class="relative pt-10 sm:pt-12"
      aria-label="Main content"
    >
      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession();
const router = useRouter();
const route = useRoute();
const { locale, setLocale, t } = useI18n();

const isDashboardRoutes = computed(() => {
  return route.path.includes("/dashboard");
});

const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  router.push("/login");
  window.location.reload();
};

const isAuthRoute = computed(() => {
  return route.path === "/login" || route.path === "/register";
});

const languages = [
  { code: "en", label: t("layout.languages.english"), flag: "🇺🇸" },
  { code: "es", label: t("layout.languages.spanish"), flag: "🇪🇸" },
];

const currentLanguageLabel = computed(() => {
  const lang = languages.find((l) => l.code === locale.value);
  return lang ? `${lang.flag} ${lang.code.toUpperCase()}` : "EN";
});

const languageItems = computed(() => [
  languages.map((lang) => ({
    label: `${lang.flag} ${lang.label}`,
    icon: locale.value === lang.code ? "i-heroicons-check" : undefined,
    onSelect: () => setLocale(lang.code),
  })),
]);
</script>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus,
.focus\:not-sr-only:focus {
  position: absolute;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
</style>
