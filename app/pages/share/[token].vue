<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
  >
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-12 h-12 text-primary animate-spin mx-auto mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t("sharePage.loading") }}
        </p>
      </div>
    </div>
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen p-4"
    >
      <UCard class="max-w-md w-full">
        <div class="text-center py-8">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-8 h-8 text-red-600"
            />
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {{ error.title }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ error.message }}
          </p>
          <UButton to="/" color="primary">{{
            $t("sharePage.goToHome")
          }}</UButton>
        </div>
      </UCard>
    </div>

    <div v-else class="container mx-auto px-4 py-4 max-w-4xl">
      <div class="text-center mb-4">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-1"
        >
          <UIcon name="i-heroicons-share" class="w-5 h-5 text-primary-600" />
          <span
            class="text-sm font-medium text-primary-700 dark:text-primary-300"
          >
            {{ $t("sharePage.sharedWidget") }}
          </span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ shareLink?.widgetName || $t("sharePage.sharedWidget") }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t("sharePage.sharedBy") }}
          {{
            shareLink?.ownerName ||
            shareLink?.ownerEmail ||
            $t("sharePage.unknown")
          }}
        </p>
      </div>
      <UCard>
        <div v-if="shareLink?.expiresAt" class="text-center mb-2">
          <UBadge color="neutral" variant="subtle" size="lg">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 mr-1" />
            {{ $t("sharePage.linkExpires") }}:
            {{ formatExpiration(shareLink?.expiresAt) }}
          </UBadge>
        </div>
        <div v-if="!loggedIn" class="text-center py-2">
          <UIcon
            name="i-heroicons-lock-closed"
            class="w-12 h-12 text-gray-400 mx-auto mb-4"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t("sharePage.signInToAdd") }}
          </h3>
          <div class="mb-6">
            <WidgetPreview
              v-if="widget"
              :widget="widget"
              :role="shareLink?.role || 'viewer'"
              :readonly="true"
            />
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ $t("sharePage.createAccountOrSignIn") }}
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <UButton
              :to="`/login?redirect=/share/${token}`"
              color="primary"
              size="lg"
              icon="i-heroicons-arrow-right-on-rectangle"
            >
              {{ $t("sharePage.signIn") }}
            </UButton>
            <UButton
              :to="`/register?redirect=/share/${token}`"
              variant="outline"
              size="lg"
              icon="i-heroicons-user-plus"
            >
              {{ $t("sharePage.createAccount") }}
            </UButton>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            {{ $t("sharePage.redirectNote") }}
          </p>
        </div>
        <div v-else-if="hasWidgetInDashboard" class="text-center py-6">
          <UIcon
            name="i-heroicons-check-circle"
            class="w-12 h-12 text-green-500 mx-auto mb-4"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t("sharePage.widgetAlreadyInDashboard") }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ $t("sharePage.widgetAlreadyInDashboardDescription") }}
          </p>
        </div>
        <div v-else-if="hasPermission" class="py-2">
          <div class="text-center mb-4">
            <div class="mb-2">
              <WidgetPreview
                v-if="widget"
                :widget="widget"
                :role="shareLink?.role || 'viewer'"
                :readonly="true"
              />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("sharePage.addToYourDashboard") }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ $t("sharePage.selectDashboardDescription") }}
            </p>
          </div>
          <div class="mb-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >
              {{ $t("sharePage.selectDashboard") }}
            </label>

            <div v-if="isLoadingDashboards" class="flex justify-center py-4">
              <UIcon
                name="i-heroicons-arrow-path"
                class="w-6 h-6 text-gray-400 animate-spin"
              />
            </div>

            <div v-else-if="dashboards.length === 0" class="text-center py-4">
              <p class="text-gray-500 mb-3">
                {{ $t("sharePage.noDashboardsYet") }}
              </p>
              <UButton
                @click="showCreateDashboard = true"
                color="primary"
                variant="soft"
                icon="i-heroicons-plus"
              >
                {{ $t("sharePage.createDashboard") }}
              </UButton>
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="dashboard in dashboards"
                :key="dashboard.id"
                :class="[
                  'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                  selectedDashboardId === dashboard.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
                @click="selectedDashboardId = dashboard.id"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-squares-2x2"
                    class="w-5 h-5 text-gray-500"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ dashboard.title }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ $t("sharePage.created") }}
                      {{ formatDate(dashboard.created) }}
                    </p>
                  </div>
                </div>
                <UIcon
                  v-if="selectedDashboardId === dashboard.id"
                  name="i-heroicons-check-circle-solid"
                  class="w-6 h-6 text-primary-500"
                />
              </div>
            </div>

            <div
              class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <UButton
                @click="showCreateDashboard = true"
                variant="ghost"
                block
                icon="i-heroicons-plus"
                :disabled="showCreateDashboard"
              >
                {{ $t("sharePage.createNewDashboard") }}
              </UButton>

              <div
                v-if="showCreateDashboard"
                class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <form @submit.prevent="createNewDashboard" class="flex gap-2">
                  <UInput
                    v-model="newDashboardName"
                    :placeholder="$t('sharePage.dashboardNamePlaceholder')"
                    class="flex-1"
                    autofocus
                  />
                  <UButton
                    type="submit"
                    color="primary"
                    :disabled="!newDashboardName.trim()"
                  >
                    {{ $t("sharePage.create") }}
                  </UButton>
                  <UButton
                    type="button"
                    variant="ghost"
                    @click="showCreateDashboard = false"
                  >
                    {{ $t("sharePage.cancel") }}
                  </UButton>
                </form>
              </div>
            </div>
          </div>
          <UButton
            @click="addWidgetToDashboard"
            color="primary"
            size="lg"
            block
            icon="i-heroicons-plus-circle"
            :loading="isAdding"
            :disabled="!selectedDashboardId || isAdding"
          >
            {{ $t("sharePage.addWidgetToDashboard") }}
          </UButton>
        </div>
        <div v-else class="py-4">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center"
          >
            {{ $t("sharePage.addToDashboard") }}
          </h3>
          <div class="mb-6">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >
              {{ $t("sharePage.selectDashboard") }}
            </label>

            <div v-if="isLoadingDashboards" class="flex justify-center py-4">
              <UIcon
                name="i-heroicons-arrow-path"
                class="w-6 h-6 text-gray-400 animate-spin"
              />
            </div>

            <div v-else-if="dashboards.length === 0" class="text-center py-4">
              <p class="text-gray-500 mb-3">
                {{ $t("sharePage.noDashboardsYet") }}
              </p>
              <UButton
                @click="showCreateDashboard = true"
                color="primary"
                variant="soft"
                icon="i-heroicons-plus"
              >
                {{ $t("sharePage.createDashboard") }}
              </UButton>
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="dashboard in dashboards"
                :key="dashboard.id"
                :class="[
                  'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                  selectedDashboardId === dashboard.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                ]"
                @click="selectedDashboardId = dashboard.id"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-heroicons-squares-2x2"
                    class="w-5 h-5 text-gray-500"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ dashboard.title }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ $t("sharePage.created") }}
                      {{ formatDate(dashboard.created) }}
                    </p>
                  </div>
                </div>
                <UIcon
                  v-if="selectedDashboardId === dashboard.id"
                  name="i-heroicons-check-circle-solid"
                  class="w-6 h-6 text-primary-500"
                />
              </div>
            </div>
            <div
              class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <UButton
                @click="showCreateDashboard = true"
                variant="ghost"
                block
                icon="i-heroicons-plus"
                :disabled="showCreateDashboard"
              >
                {{ $t("sharePage.createNewDashboard") }}
              </UButton>

              <div
                v-if="showCreateDashboard"
                class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <form @submit.prevent="createNewDashboard" class="flex gap-2">
                  <UInput
                    v-model="newDashboardName"
                    :placeholder="$t('sharePage.dashboardNamePlaceholder')"
                    class="flex-1"
                    autofocus
                  />
                  <UButton
                    type="submit"
                    color="primary"
                    :disabled="!newDashboardName.trim()"
                  >
                    {{ $t("sharePage.create") }}
                  </UButton>
                  <UButton
                    type="button"
                    variant="ghost"
                    @click="showCreateDashboard = false"
                  >
                    {{ $t("sharePage.cancel") }}
                  </UButton>
                </form>
              </div>
            </div>
          </div>
          <UButton
            @click="redeemShareLink"
            color="primary"
            size="lg"
            block
            icon="i-heroicons-plus-circle"
            :loading="isRedeeming"
            :disabled="!selectedDashboardId || isRedeeming"
          >
            {{ $t("sharePage.addWidgetToDashboard") }}
          </UButton>

          <p class="text-xs text-gray-500 text-center mt-3">
            {{
              $t("sharePage.youllGetAccess", {
                role: shareLink?.role || "viewer",
              })
            }}
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const route = useRoute();
const router = useRouter();
const { $pb } = useNuxtApp();
const { user, loggedIn } = useAuth();
const toast = useToast();
const { t, locale } = useI18n();

const token = computed(() => route.params.token as string);

// State
const isLoading = ref(true);
const error = ref<{ title: string; message: string } | null>(null);
const shareLink = ref<any>(null);
const widget = ref<any>(null);

// Permission state
const hasPermission = ref(false);
const existingPermission = ref<any>(null);
const hasWidgetInDashboard = ref(false);

// Dashboard state
const dashboards = ref<any[]>([]);
const isLoadingDashboards = ref(false);
const selectedDashboardId = ref<string | null>(null);
const showCreateDashboard = ref(false);
const newDashboardName = ref("");
const isRedeeming = ref(false);
const isAdding = ref(false);

const loadShareData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    let linkRecord;
    try {
      linkRecord = await $pb
        .collection("widget_share_links")
        .getFirstListItem(`token="${token.value}"`, {
          expand: "widget,widget.owner,created_by",
        });
    } catch (e) {
      error.value = {
        title: t("sharePage.errors.linkNotFound.title"),
        message: t("sharePage.errors.linkNotFound.message"),
      };
      return;
    }

    const expiresAt = linkRecord.expiresAt || linkRecord.expires_at;
    if (new Date(expiresAt) < new Date()) {
      error.value = {
        title: t("sharePage.errors.linkExpired.title"),
        message: t("sharePage.errors.linkExpired.message"),
      };
      return;
    }

    shareLink.value = {
      id: linkRecord.id,
      token: linkRecord.token,
      role: linkRecord.role || "viewer",
      expiresAt: expiresAt,
      recipientEmail: linkRecord.recipient_email,
      widgetId: linkRecord.widget,
      widgetName: linkRecord.expand?.widget?.name,
      ownerName: linkRecord.expand?.widget?.expand?.owner?.name,
      ownerEmail: linkRecord.expand?.widget?.expand?.owner?.email,
      forRegisteredUser: linkRecord.for_registered_user,
    };

    const widgetRecord = linkRecord.expand?.widget;
    widget.value = {
      id: widgetRecord?.id,
      type: widgetRecord?.type,
      name: widgetRecord?.name,
      data: widgetRecord?.data || {},
      owner: widgetRecord?.owner,
      ownerName: widgetRecord?.expand?.owner?.name,
      ownerEmail: widgetRecord?.expand?.owner?.email,
    };

    if (loggedIn.value && user.value?.id) {
      await checkUserAccess();

      if (!hasWidgetInDashboard.value) {
        await loadDashboards();
      }
    }
  } catch (e: any) {
    console.error("Error loading share data:", e);
    error.value = {
      title: t("sharePage.errors.generic.title"),
      message: e.message || t("sharePage.errors.generic.message"),
    };
  } finally {
    isLoading.value = false;
  }
};

const checkUserAccess = async () => {
  if (!user.value?.id || !widget.value?.id) return;

  if (widget.value.owner === user.value.id) {
    hasPermission.value = true;
    existingPermission.value = { role: "owner" };
  } else {
    try {
      const perm = await $pb
        .collection("widget_permissions")
        .getFirstListItem(
          `widget="${widget.value.id}" && user="${user.value.id}"`,
        );
      hasPermission.value = true;
      existingPermission.value = perm;
    } catch {
      hasPermission.value = false;
      existingPermission.value = null;
    }
  }

  if (hasPermission.value) {
    try {
      await $pb
        .collection("dashboard_widgets")
        .getFirstListItem(
          `widget="${widget.value.id}" && dashboard.owner="${user.value.id}"`,
        );
      hasWidgetInDashboard.value = true;
    } catch {
      hasWidgetInDashboard.value = false;
    }
  }
};

const loadDashboards = async () => {
  if (!user.value?.id) return;

  isLoadingDashboards.value = true;

  try {
    const records = await $pb.collection("dashboards").getFullList({
      filter: `owner="${user.value.id}"`,
      sort: "-created",
    });

    dashboards.value = records.map((r) => ({
      id: r.id,
      title: r.title,
      owner: r.owner,
      created: r.created,
    }));

    if (dashboards.value.length > 0) {
      selectedDashboardId.value = dashboards.value[0].id;
    }
  } catch (e) {
    console.error("Failed to load dashboards:", e);
  } finally {
    isLoadingDashboards.value = false;
  }
};

const createNewDashboard = async () => {
  if (!user.value?.id) return;

  const name =
    newDashboardName.value.trim() || t("sharePage.defaultDashboardName");

  try {
    const record = await $pb.collection("dashboards").create({
      owner: user.value.id,
      title: name,
    });

    dashboards.value.unshift({
      id: record.id,
      title: record.title,
      owner: record.owner,
      created: record.created,
    });

    selectedDashboardId.value = record.id;
    newDashboardName.value = "";
    showCreateDashboard.value = false;

    toast.add({
      title: t("sharePage.toast.dashboardCreated.title"),
      description: t("sharePage.toast.dashboardCreated.description", { name }),
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: t("sharePage.toast.error.title"),
      description:
        e.message || t("sharePage.toast.error.createDashboardFailed"),
      color: "error",
    });
  }
};

const addWidgetToDashboard = async () => {
  if (!selectedDashboardId.value || !widget.value?.id || !user.value?.id)
    return;

  isAdding.value = true;

  try {
    await $pb.collection("dashboard_widgets").create({
      dashboard: selectedDashboardId.value,
      widget: widget.value.id,
      x: 40,
      y: 40,
      width: 400,
      height: 400,
      zIndex: 1,
    });

    if (shareLink.value?.id) {
      await $pb.collection("widget_share_links").update(shareLink.value.id, {
        redeemed_by: user.value.id,
        redeemed_at: new Date().toISOString(),
      });
    }

    toast.add({
      title: t("sharePage.toast.widgetAdded.title"),
      description: t("sharePage.toast.widgetAdded.description"),
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    router.push(`/dashboard/${selectedDashboardId.value}`);
  } catch (e: any) {
    console.error("Failed to add widget:", e);
    toast.add({
      title: t("sharePage.toast.error.title"),
      description: e.message || t("sharePage.toast.error.addWidgetFailed"),
      color: "error",
    });
  } finally {
    isAdding.value = false;
  }
};

const redeemShareLink = async () => {
  if (!selectedDashboardId.value || !shareLink.value || !user.value?.id) return;

  isRedeeming.value = true;

  try {
    try {
      await $pb.collection("widget_permissions").create({
        widget: shareLink.value.widgetId,
        user: user.value.id,
        role: "editor",
        granted_by: widget.value?.owner,
      });
    } catch (e: any) {
      if (!e.message?.includes("unique")) {
        throw e;
      }
    }

    await $pb.collection("dashboard_widgets").create({
      dashboard: selectedDashboardId.value,
      widget: shareLink.value.widgetId,
      x: 40,
      y: 40,
      width: 400,
      height: 400,
      zIndex: 1,
    });

    await $pb.collection("widget_share_links").update(shareLink.value.id, {
      redeemed_by: user.value.id,
      redeemed_at: new Date().toISOString(),
    });

    toast.add({
      title: t("sharePage.toast.widgetAdded.title"),
      description: t("sharePage.toast.widgetAdded.description"),
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    router.push(`/dashboard/${selectedDashboardId.value}`);
  } catch (e: any) {
    console.error("Failed to redeem share link:", e);
    toast.add({
      title: t("sharePage.toast.error.title"),
      description: e.message || t("sharePage.toast.error.addWidgetFailed"),
      color: "error",
    });
  } finally {
    isRedeeming.value = false;
  }
};

// Helpers
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(locale.value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatExpiration = (dateString: string) => {
  if (!dateString) return t("sharePage.expiration.unknown");
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return t("sharePage.expiration.expired");

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return t("sharePage.expiration.daysLeft", { days });
  if (hours > 0) return t("sharePage.expiration.hoursLeft", { hours });
  return t("sharePage.expiration.lessThanHour");
};

// Watch for auth changes
watch(
  () => loggedIn.value,
  async (logged) => {
    if (logged && shareLink.value) {
      await checkUserAccess();
      if (!hasWidgetInDashboard.value) {
        await loadDashboards();
      }
    }
  },
);

// Initial load
onMounted(() => {
  loadShareData();
});
</script>
