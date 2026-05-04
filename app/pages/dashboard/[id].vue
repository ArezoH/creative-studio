<template>
  <NuxtLayout>
    <template #nav-left>
      <UButton
        v-if="!isLibraryOpen"
        icon="i-heroicons-bars-3"
        variant="solid"
        size="sm"
        @click="toggleLibrary"
        aria-label="Open widget library"
        aria-expanded="false"
        aria-controls="widget-library"
        class="fixed top-14 sm:top-16 left-2 sm:left-4 z-50 shadow-lg transition-colors mt-1 sm:mt-2.5"
      />
    </template>

    <template #nav-right>
      <DashboardSearch ref="searchComponentRef" />
    </template>
    <div
      v-if="error"
      role="alert"
      class="h-[calc(100vh-6rem)] flex items-center justify-center px-4"
    >
      <div class="text-center p-4 sm:p-8 max-w-md">
        <div
          class="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-8 h-8 sm:w-10 sm:h-10 text-red-500"
            aria-hidden="true"
          />
        </div>
        <h2
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {{ $t("dashboard.error.notFound", "Dashboard Not Found") }}
        </h2>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
          {{ error }}
        </p>
        <UButton color="primary" to="/" icon="i-heroicons-home">
          {{ $t("dashboard.error.backHome", "Back to Home") }}
        </UButton>
      </div>
    </div>

    <div
      v-else
      class="h-[calc(100vh-8rem)]relative overflow-y-auto scroll-smooth"
    >
      <div class="min-h-full w-full">
        <DashboardCanvas
          ref="canvasRef"
          :search-ref="searchComponentRef"
          class="w-full h-full"
        />
        <WidgetsShareModal />
      </div>
      <Transition name="slide-overlay">
        <aside
          v-if="isLibraryOpen"
          id="widget-library"
          role="dialog"
          aria-modal="true"
          aria-label="Widget library"
          class="fixed top-14 sm:top-16 bottom-0 left-0 w-full sm:w-80 shadow-2xl z-50 bg-white dark:bg-gray-800"
        >
          <WidgetLibrary @close="closeLibrary" />
        </aside>
      </Transition>
      <Transition name="fade">
        <div
          v-if="isLibraryOpen"
          class="fixed inset-0 bg-black/50 z-40 sm:hidden"
          aria-hidden="true"
          @click="closeLibrary"
        ></div>
      </Transition>

      <DragPreview />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute();
const dashboardStore = useDashboardStore();

const searchComponentRef = ref(null);
const canvasRef = ref(null);

const isLibraryOpen = ref(false);
const error = ref<string | null>(null);

// Get dashboard ID from route
const dashboardId = computed(() => route.params.id as string);

useHead({
  title: computed(() =>
    dashboardStore.currentDashboard?.title
      ? `${dashboardStore.currentDashboard.title} - Dashboard`
      : "Dashboard"
  ),
  meta: [{ name: "description", content: "Content management dashboard" }],
});

// Load dashboard on mount and when ID changes
watch(
  dashboardId,
  async (newId) => {
    if (newId) {
      await dashboardStore.selectDashboard(dashboardId.value);
    }
  },
  { immediate: true }
);

const closeLibrary = () => {
  isLibraryOpen.value = false;
};

const toggleLibrary = () => {
  isLibraryOpen.value = !isLibraryOpen.value;
};

let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

onMounted(() => {
  keydownHandler = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleLibrary();
    }
    if (event.key === "Escape" && isLibraryOpen.value) {
      closeLibrary();
    }
  };

  document.addEventListener("keydown", keydownHandler);
});

onBeforeUnmount(() => {
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }
});
</script>

<style scoped>
.slide-overlay-enter-active,
.slide-overlay-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-overlay-enter-from,
.slide-overlay-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scroll-smooth {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
