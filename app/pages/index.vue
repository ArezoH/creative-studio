<template>
  <NuxtLayout>
    <main
      role="main"
      class="flex flex-col min-h-screen bg-gradient-to-br from-pink-100 via-purple-200 to-slate-600 relative"
    >
      <a
        href="#dashboards-section"
        class="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md"
      >
        Skip to dashboards
      </a>

      <section
        class="flex-1 relative px-4 sm:px-6 py-12 sm:py-20"
        aria-labelledby="main-heading"
      >
        <div class="max-w-7xl mx-auto text-center">
          <div
            class="absolute inset-0 overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div
              class="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
            ></div>
            <div
              class="absolute bottom-1/4 right-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"
            ></div>
          </div>

          <div class="relative z-10">
            <h1
              id="main-heading"
              class="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-purple-900"
            >
              {{ $t("home.createContentWith") }}
              <span
                class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                {{ $t("home.aiMagic") }}
              </span>
            </h1>
            <p
              class="text-base sm:text-xl text-purple-800 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2"
            >
              {{ $t("home.tagline") }}
            </p>
            <div
              class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-16"
            >
              <ClientOnly>
                <template v-if="loggedIn">
                  <div class="flex flex-col items-center gap-3">
                    <p
                      class="text-sm font-medium text-purple-800 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                      ✨
                      {{
                        $t("home.welcomeBack", {
                          name: user?.name || $t("home.creator"),
                        })
                      }}
                    </p>
                  </div>
                </template>
              </ClientOnly>
            </div>
            <section
              v-if="loggedIn"
              id="dashboards-section"
              class="mt-6 sm:mt-8 mb-12 sm:mb-16 text-left"
              aria-labelledby="dashboards-heading"
            >
              <div
                class="mb-4 sm:mb-6 p-4 sm:p-6 bg-white/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/50 shadow-lg"
              >
                <h2
                  id="dashboards-heading"
                  class="text-lg sm:text-xl font-bold text-purple-900 mb-3 sm:mb-4"
                >
                  {{ $t("home.createDashboard.title") }}
                </h2>
                <form
                  @submit.prevent="handleCreateDashboard"
                  class="flex flex-col sm:flex-row gap-2 sm:gap-3"
                >
                  <UInput
                    v-model="newDashboardTitle"
                    :placeholder="$t('home.createDashboard.placeholder')"
                    size="lg"
                    color="neutral"
                    variant="outlined"
                    class="flex-1"
                    :disabled="isCreating"
                    aria-label="New dashboard name"
                  />
                  <UButton
                    type="submit"
                    color="primary"
                    size="lg"
                    icon="i-heroicons-plus"
                    :loading="isCreating"
                    :disabled="!newDashboardTitle.trim() || isCreating"
                    class="w-full sm:w-auto justify-center"
                  >
                    <span class="sm:inline">{{
                      $t("home.createDashboard.createButton")
                    }}</span>
                  </UButton>
                </form>
              </div>

              <div
                v-if="dashboardStore.isLoadingDashboards"
                role="status"
                aria-live="polite"
              >
                <div>
                  <div class="flex items-center justify-center py-2 sm:py-8">
                    <UIcon
                      name="i-heroicons-arrow-path"
                      class="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 animate-spin mx-auto mb-2 sm:mb-3"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <div v-else-if="dashboardStore.dashboards.length > 0">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                  <h3
                    class="text-base sm:text-lg font-semibold text-purple-900"
                  >
                    {{
                      $t("home.yourDashboards", {
                        count: dashboardStore.dashboards.length,
                      })
                    }}
                  </h3>
                </div>

                <div
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                  role="list"
                  aria-label="Your dashboards"
                >
                  <article
                    v-for="dashboard in dashboardStore.dashboards"
                    :key="dashboard.id"
                    class="group relative bg-white/50 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/70 hover:shadow-xl transition-all duration-300"
                    role="listitem"
                  >
                    <NuxtLink
                      :to="`/dashboard/${dashboard.id}`"
                      class="block p-4 sm:p-5"
                      :aria-label="`Open dashboard: ${dashboard.title}`"
                    >
                      <div class="flex items-start gap-3">
                        <div
                          class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0"
                          aria-hidden="true"
                        >
                          <UIcon
                            name="i-heroicons-squares-2x2"
                            class="w-5 h-5 sm:w-6 sm:h-6 text-white"
                          />
                        </div>
                        <div class="min-w-0 flex-1 pr-2">
                          <h4
                            class="text-base sm:text-lg font-semibold text-purple-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1"
                          >
                            {{ dashboard.title }}
                          </h4>
                          <p class="text-xs sm:text-sm text-purple-600">
                            {{ $t("home.created") }}
                            {{ formatDate(dashboard.created) }}
                          </p>
                        </div>
                      </div>
                    </NuxtLink>

                    <div
                      class="flex items-center justify-end gap-2 px-4 pb-3 sm:absolute sm:top-4 sm:right-4 sm:p-0"
                      role="group"
                      :aria-label="`Actions for ${dashboard.title}`"
                    >
                      <UButton
                        icon="i-heroicons-pencil"
                        size="xs"
                        color="secondary"
                        variant="soft"
                        :aria-label="`Edit ${dashboard.title}`"
                        @click.prevent.stop="openEditModal(dashboard)"
                      />
                      <UButton
                        icon="i-heroicons-trash"
                        size="xs"
                        color="error"
                        variant="soft"
                        :aria-label="`Delete ${dashboard.title}`"
                        @click.prevent.stop="openDeleteModal(dashboard)"
                      />
                    </div>
                  </article>
                </div>
              </div>

              <div
                v-else
                class="text-center py-8 sm:py-12 bg-white/30 rounded-xl sm:rounded-2xl border border-white/40 backdrop-blur-sm"
                role="status"
              >
                <div
                  class="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  aria-hidden="true"
                >
                  <UIcon
                    name="i-heroicons-squares-2x2"
                    class="w-6 h-6 sm:w-8 sm:h-8 text-purple-500"
                  />
                </div>
                <h3
                  class="text-base sm:text-lg font-semibold text-purple-900 mb-2"
                >
                  {{ $t("home.createDashboard.emptyState.title") }}
                </h3>
                <p class="text-sm sm:text-base text-purple-700 px-4">
                  {{ $t("home.createDashboard.emptyState.description") }}
                </p>
              </div>
            </section>

            <!-- Features Section -->
            <section
              id="features"
              aria-labelledby="features-heading"
              class="mt-12 sm:mt-16"
            >
              <h2
                id="features-heading"
                class="text-2xl sm:text-3xl font-bold text-purple-900 mb-8 sm:mb-12"
              >
                {{ $t("home.features.heading") }}
              </h2>
              <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8"
              >
                <article
                  v-for="(feature, index) in features"
                  :key="feature.icon"
                  class="p-4 sm:p-6 bg-white/30 rounded-xl border border-white/40 hover:bg-white/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  <div
                    class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto shadow-md"
                    aria-hidden="true"
                  >
                    <UIcon
                      :name="feature.icon"
                      class="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    />
                  </div>
                  <h3
                    class="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-purple-900"
                  >
                    {{ $t(`home.features.items[${index}].title`) }}
                  </h3>
                  <p class="text-sm sm:text-base text-purple-800">
                    {{ $t(`home.features.items[${index}].description`) }}
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </section>

      <footer
        class="bg-purple-900/90 text-white py-8 sm:py-12 px-4 sm:px-6 backdrop-blur-md"
        role="contentinfo"
      >
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col items-center justify-center space-y-2 mb-4">
            <UIcon
              name="i-heroicons-sparkles"
              class="w-6 h-6 sm:w-8 sm:h-8 text-pink-300"
              aria-hidden="true"
            />
            <span class="text-lg sm:text-xl font-bold">{{
              $t("home.footer.title")
            }}</span>
            <p class="text-sm sm:text-base text-purple-200 text-center px-4">
              {{ $t("home.footer.tagline") }}
            </p>
          </div>
          <div
            class="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-purple-700 text-center text-purple-300 text-sm"
          >
            <p>{{ $t("home.footer.copyright") }}</p>
          </div>
        </div>
      </footer>

      <!-- Edit Dashboard Modal -->
      <UModal v-model:open="editModalOpen">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-purple-100" aria-hidden="true">
              <UIcon
                name="i-heroicons-pencil"
                class="w-5 h-5 text-purple-600"
              />
            </div>
            <h3 class="text-lg font-semibold" id="edit-modal-title">
              {{ $t("home.modals.editDashboard.title") }}
            </h3>
          </div>
        </template>
        <template #body>
          <div class="p-4">
            <label
              for="edit-dashboard-input"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ $t("home.modals.editDashboard.label") }}
            </label>
            <UInput
              id="edit-dashboard-input"
              v-model="editingTitle"
              :placeholder="$t('home.createDashboard.placeholder')"
              size="lg"
              autofocus
              @keydown.enter="handleUpdateTitle"
            />
          </div>
        </template>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <UButton
              variant="ghost"
              class="w-full sm:w-auto justify-center"
              @click="editModalOpen = false"
            >
              {{ $t("home.modals.editDashboard.cancelButton") }}
            </UButton>
            <UButton
              color="primary"
              class="w-full sm:w-auto justify-center"
              :loading="isUpdating"
              :disabled="!editingTitle.trim()"
              @click="handleUpdateTitle"
            >
              {{ $t("home.modals.editDashboard.saveButton") }}
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UiConfirmationModal
        v-model="deleteModalOpen"
        :title="$t('home.modals.deleteDashboard.title')"
        :message="
          $t('home.modals.deleteDashboard.confirmMessage', {
            title: dashboardToDelete?.title,
          })
        "
        :confirm-text="$t('home.modals.deleteDashboard.deleteButton')"
        :cancel-text="$t('home.modals.deleteDashboard.cancelButton')"
        :loading="isDeleting"
        variant="danger"
        confirm-color="error"
        icon="i-heroicons-exclamation-triangle"
        @confirm="handleDeleteDashboard"
        @cancel="deleteModalOpen = false"
      />
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Dashboard } from "~/stores/dashboard";

const { t } = useI18n();
const { loggedIn, user } = useUserSession();
const dashboardStore = useDashboardStore();
const toast = useToast();

// Create dashboard state
const newDashboardTitle = ref("");
const isCreating = ref(false);

// Edit modal state
const editModalOpen = ref(false);
const editingDashboard = ref<Dashboard | null>(null);
const editingTitle = ref("");
const isUpdating = ref(false);

// Delete modal state
const deleteModalOpen = ref(false);
const dashboardToDelete = ref<Dashboard | null>(null);
const isDeleting = ref(false);

// Features
const features = [
  { icon: "i-heroicons-cursor-arrow-rays" },
  { icon: "i-heroicons-sparkles" },
  { icon: "i-heroicons-users" },
];

// Load dashboards when user is logged in
watch(
  loggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      await dashboardStore.loadDashboards();
    }
  },
  { immediate: true },
);

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("home.dates.today");
  if (diffDays === 1) return t("home.dates.yesterday");
  if (diffDays < 7) return t("home.dates.daysAgo", { days: diffDays });

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

useHead({
  title: "home",
});
// Create dashboard handler
const handleCreateDashboard = async () => {
  if (!newDashboardTitle.value.trim()) return;

  isCreating.value = true;
  try {
    const dashboard = await dashboardStore.createDashboard(
      newDashboardTitle.value,
    );
    if (dashboard) {
      toast.add({
        title: t("home.toast.dashboardCreated.title"),
        description: t("home.toast.dashboardCreated.description", {
          title: dashboard.title,
        }),
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      newDashboardTitle.value = "";
      navigateTo(`/dashboard/${dashboard.id}`);
    }
  } catch (error) {
    toast.add({
      title: t("home.toast.errors.createDashboard.title"),
      description: t("home.toast.errors.createDashboard.description"),
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isCreating.value = false;
  }
};

// Edit modal handlers
const openEditModal = (dashboard: Dashboard) => {
  editingDashboard.value = dashboard;
  editingTitle.value = dashboard.title;
  editModalOpen.value = true;
};

const handleUpdateTitle = async () => {
  if (!editingDashboard.value || !editingTitle.value.trim()) return;

  isUpdating.value = true;
  try {
    const success = await dashboardStore.updateDashboardTitle(
      editingDashboard.value.id,
      editingTitle.value,
    );
    if (success) {
      toast.add({
        title: t("home.toast.dashboardUpdated.title"),
        description: t("home.toast.dashboardUpdated.description"),
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      editModalOpen.value = false;
    }
  } catch (error) {
    toast.add({
      title: t("home.toast.errors.updateDashboard.title"),
      description: t("home.toast.errors.updateDashboard.description"),
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Delete modal handlers
const openDeleteModal = (dashboard: Dashboard) => {
  dashboardToDelete.value = dashboard;
  deleteModalOpen.value = true;
};

const handleDeleteDashboard = async () => {
  if (!dashboardToDelete.value) return;

  isDeleting.value = true;
  try {
    const success = await dashboardStore.deleteDashboard(
      dashboardToDelete.value.id,
    );
    if (success) {
      toast.add({
        title: t("home.toast.dashboardDeleted.title"),
        description: t("home.toast.dashboardDeleted.description"),
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      deleteModalOpen.value = false;
    }
  } catch (error) {
    toast.add({
      title: t("home.toast.errors.deleteDashboard.title"),
      description: t("home.toast.errors.deleteDashboard.description"),
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    isDeleting.value = false;
  }
};
</script>
<style scoped>
/* Screen reader only utility */
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
