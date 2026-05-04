<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="false"
    :title="$t('shareModal.title')"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-primary/10">
          <UIcon name="i-heroicons-share" class="w-5 h-5 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold truncate">
            {{ sharingStore.shareWidgetName }}
          </h3>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
            <span>{{ $t("shareModal.owner") }}:</span>
            <UBadge
              v-if="sharingStore.isOwner"
              size="xs"
              color="primary"
              variant="subtle"
            >
              {{ $t("shareModal.you") }}
            </UBadge>
            <span v-else class="truncate">
              {{
                sharingStore.shareWidgetOwner?.name ||
                sharingStore.shareWidgetOwner?.email
              }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-1">
        <div
          v-if="!sharingStore.isOwner && sharingStore.currentUserRole"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                :name="sharingStore.getRoleIcon(sharingStore.currentUserRole)"
                class="w-5 h-5 text-gray-500"
              />
              <div>
                <p class="text-sm font-medium">
                  {{ $t("shareModal.yourAccessLevel") }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    sharingStore.currentUserRole === "editor"
                      ? $t("shareModal.canEdit")
                      : $t("shareModal.canOnlyView")
                  }}
                </p>
              </div>
            </div>
            <UBadge
              :color="sharingStore.getRoleColor(sharingStore.currentUserRole)"
              variant="subtle"
            >
              {{ $t(`shareModal.roles.${sharingStore.currentUserRole}`) }}
            </UBadge>
          </div>
        </div>

        <div v-if="sharingStore.isOwner" class="space-y-3">
          <div>
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >
              {{ $t("shareModal.shareWithEmail") }}
            </label>
            <form @submit.prevent="handleShare" class="space-y-2">
              <div class="flex gap-2">
                <UInput
                  v-model="shareEmail"
                  type="email"
                  :placeholder="$t('shareModal.emailPlaceholder')"
                  class="flex-1"
                  size="lg"
                  :disabled="sharingStore.isSharingWithUser"
                >
                  <template #leading>
                    <UIcon
                      name="i-heroicons-envelope"
                      class="w-4 h-4 text-gray-400"
                    />
                  </template>
                </UInput>
                <USelect
                  v-model="selectedShareRole"
                  :items="shareRoleOptions"
                  size="lg"
                  class="w-28"
                  :disabled="sharingStore.isSharingWithUser"
                />
                <UButton
                  type="submit"
                  color="primary"
                  size="lg"
                  icon="i-heroicons-paper-airplane"
                  :loading="sharingStore.isSharingWithUser"
                  :disabled="!shareEmail.trim() || !isValidEmail(shareEmail)"
                >
                  {{ $t("shareModal.shareButton") }}
                </UButton>
              </div>
              <p class="text-xs text-gray-500">
                <UIcon
                  name="i-heroicons-information-circle"
                  class="w-3 h-3 inline"
                />
                {{ $t("shareModal.accessInfo") }}
              </p>
            </form>
          </div>

          <div
            v-if="sharingStore.shareError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-exclamation-circle"
                class="w-5 h-5 text-red-600"
              />
              <p class="text-sm text-red-900 dark:text-red-100">
                {{ sharingStore.shareError }}
              </p>
            </div>
          </div>

          <div
            v-if="sharingStore.shareSuccess"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-green-600"
              />
              <p class="text-sm text-green-900 dark:text-green-100 font-medium">
                {{ sharingStore.shareSuccess }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            {{ $t("shareModal.peopleWithAccess") }}
          </label>

          <div
            v-if="sharingStore.isLoadingCollaborators"
            class="flex justify-center py-4"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-6 h-6 text-gray-400 animate-spin"
            />
          </div>

          <div v-else class="space-y-2 max-h-60 overflow-y-auto">
            <div
              v-if="sharingStore.shareWidgetOwner"
              class="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-600"
                >
                  {{
                    getInitials(
                      sharingStore.shareWidgetOwner.name ||
                        sharingStore.shareWidgetOwner.email,
                    )
                  }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{
                        sharingStore.shareWidgetOwner.name ||
                        sharingStore.shareWidgetOwner.email
                      }}
                    </p>
                    <UBadge
                      v-if="sharingStore.isOwner"
                      size="xs"
                      color="info"
                      variant="subtle"
                    >
                      {{ $t("shareModal.you") }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-500">
                    {{ sharingStore.shareWidgetOwner.email }}
                  </p>
                </div>
              </div>
              <UBadge
                color="primary"
                variant="subtle"
                class="flex items-center gap-1"
              >
                <UIcon name="i-heroicons-key" class="w-3 h-3" />
                {{ $t("shareModal.roles.owner") }}
              </UBadge>
            </div>

            <div
              v-for="collab in registeredCollaborators"
              :key="collab.id"
              :class="[
                'flex items-center justify-between p-3 rounded-lg',
                collab.isCurrentUser
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-800',
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                    collab.role === 'editor'
                      ? 'bg-green-100 dark:bg-green-900 text-green-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600',
                  ]"
                >
                  {{ getInitials(collab.userName || collab.userEmail) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ collab.userName || collab.userEmail }}
                    </p>
                    <UBadge
                      v-if="collab.isCurrentUser"
                      size="xs"
                      color="info"
                      variant="subtle"
                    >
                      {{ $t("shareModal.you") }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-500">{{ collab.userEmail }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <template v-if="sharingStore.isOwner && !collab.isCurrentUser">
                  <USelect
                    :model-value="collab.role"
                    :items="roleOptions"
                    size="sm"
                    class="w-24"
                    @update:model-value="handleRoleChange(collab.id, $event)"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="handleRemoveCollaborator(collab.id)"
                    :title="$t('shareModal.removeAccess')"
                  />
                </template>
                <template v-else>
                  <UBadge
                    :color="sharingStore.getRoleColor(collab.role)"
                    variant="subtle"
                  >
                    <UIcon
                      :name="sharingStore.getRoleIcon(collab.role)"
                      class="w-3 h-3 mr-1"
                    />
                    {{ $t(`shareModal.roles.${collab.role}`) }}
                  </UBadge>
                </template>
              </div>
            </div>

            <div
              v-for="pending in sharingStore.pendingShares"
              :key="pending.id"
              class="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-amber-100 dark:bg-amber-900 text-amber-600"
                >
                  <UIcon name="i-heroicons-clock" class="w-5 h-5" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ pending.email }}
                    </p>
                    <UBadge size="xs" color="warning" variant="subtle">
                      {{ $t("shareModal.pending") }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-amber-600 dark:text-amber-400">
                    {{ $t("shareModal.externalUserAwaiting") }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="subtle">
                  {{ pending.role }}
                </UBadge>
                <UButton
                  v-if="sharingStore.isOwner"
                  icon="i-heroicons-clipboard-document"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="copyPendingLink(pending.linkToken)"
                  :title="$t('shareModal.copyInviteLink')"
                />
                <UButton
                  v-if="sharingStore.isOwner"
                  icon="i-heroicons-trash"
                  size="xs"
                  color="error"
                  variant="ghost"
                  @click="handleRemovePending(pending.id)"
                  :title="$t('shareModal.revokeInvite')"
                />
              </div>
            </div>

            <div
              v-if="
                sharingStore.allCollaborators.length === 0 &&
                !sharingStore.shareWidgetOwner
              "
              class="text-center py-8 text-gray-500"
            >
              <UIcon
                name="i-heroicons-users"
                class="w-8 h-8 mx-auto mb-2 opacity-50"
              />
              <p class="text-sm">{{ $t("shareModal.noCollaborators") }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="!sharingStore.isOwner && sharingStore.currentUserRole"
          class="pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <UButton
            color="error"
            variant="soft"
            block
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="isLeaving"
            @click="handleLeaveWidget"
          >
            {{ $t("shareModal.leaveWidget") }}
          </UButton>
          <p class="text-xs text-gray-500 mt-1 text-center">
            {{ $t("shareModal.leaveWidgetDescription") }}
          </p>
        </div>

        <div
          v-if="linkCopied"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-check-circle"
              class="w-5 h-5 text-green-600"
            />
            <p class="text-sm text-green-900 dark:text-green-100 font-medium">
              {{ $t("shareModal.linkCopied") }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton variant="ghost" @click="handleClose">{{
          $t("shareModal.done")
        }}</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const sharingStore = useSharingStore();
const dashboardStore = useDashboardStore();
const toast = useToast();
const { t } = useI18n();

const shareEmail = ref("");
const linkCopied = ref(false);
const isLeaving = ref(false);

const roleOptions = computed(() => [
  { label: t("shareModal.roles.editor"), value: "editor" },
  { label: t("shareModal.roles.viewer"), value: "viewer" },
]);

const isOpen = computed({
  get: () => sharingStore.shareModalOpen,
  set: (value) => {
    if (!value) {
      sharingStore.closeShareModal();
    }
  },
});

const registeredCollaborators = computed(() => {
  return sharingStore.collaborators.filter((c) => c.role !== "owner");
});

watch(
  () => sharingStore.shareModalOpen,
  (isOpen) => {
    if (isOpen) {
      shareEmail.value = "";
      linkCopied.value = false;
    }
  },
);

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const handleRoleChange = async (permissionId: string, newRole: string) => {
  const result = await sharingStore.updateCollaboratorRole(
    permissionId,
    newRole as "editor" | "viewer",
  );

  if (result.success) {
    toast.add({
      title: t("shareModal.toast.roleUpdated.title"),
      description: t("shareModal.toast.roleUpdated.description", {
        role: newRole,
      }),
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } else {
    toast.add({
      title: t("shareModal.toast.error.title"),
      description: result.error || t("shareModal.toast.error.roleUpdateFailed"),
      color: "error",
    });
  }
};

const handleRemoveCollaborator = async (permissionId: string) => {
  const result = await sharingStore.removeCollaborator(permissionId);

  if (result.success) {
    toast.add({
      title: t("shareModal.toast.accessRemoved.title"),
      description: t("shareModal.toast.accessRemoved.description"),
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } else {
    toast.add({
      title: t("shareModal.toast.error.title"),
      description: result.error || t("shareModal.toast.error.removeFailed"),
      color: "error",
    });
  }
};

const handleRemovePending = async (shareId: string) => {
  const result = await sharingStore.removePendingShare(shareId);

  if (result.success) {
    toast.add({
      title: t("shareModal.toast.invitationRevoked.title"),
      description: t("shareModal.toast.invitationRevoked.description"),
      color: "success",
      icon: "i-heroicons-trash",
    });
  } else {
    toast.add({
      title: t("shareModal.toast.error.title"),
      description: result.error || t("shareModal.toast.error.revokeFailed"),
      color: "error",
    });
  }
};

const copyPendingLink = async (token?: string) => {
  if (!token) return;

  const result = await sharingStore.copyLinkToClipboard(token);
  if (result.success) {
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 3000);

    toast.add({
      title: t("shareModal.toast.copied.title"),
      description: t("shareModal.toast.copied.description"),
      color: "success",
      icon: "i-heroicons-clipboard-document-check",
    });
  }
};

const handleLeaveWidget = async () => {
  isLeaving.value = true;

  try {
    const result = await sharingStore.leaveWidget();

    if (result.success) {
      toast.add({
        title: t("shareModal.toast.widgetRemoved.title"),
        description: t("shareModal.toast.widgetRemoved.description"),
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      sharingStore.closeShareModal();
      await dashboardStore.loadDashboardWidgets();
    } else {
      toast.add({
        title: t("shareModal.toast.error.title"),
        description: result.error || t("shareModal.toast.error.leaveFailed"),
        color: "error",
      });
    }
  } finally {
    isLeaving.value = false;
  }
};

const handleClose = () => {
  sharingStore.closeShareModal();
};

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

//  share dropdown
const selectedShareRole = ref<"editor" | "viewer">("viewer");
const shareRoleOptions = computed(() => [
  { label: t("shareModal.roles.viewer"), value: "viewer" },
  { label: t("shareModal.roles.editor"), value: "editor" },
]);

const handleShare = async () => {
  if (!shareEmail.value.trim() || !isValidEmail(shareEmail.value)) return;

  const result = await sharingStore.shareWithEmail(
    shareEmail.value,
    selectedShareRole.value,
  );

  if (result.success) {
    shareEmail.value = "";
    selectedShareRole.value = "viewer";

    if (result.isRegistered) {
      toast.add({
        title: t("shareModal.toast.sharedSuccess.title"),
        description: t("shareModal.toast.sharedSuccess.description", {
          name: result.user?.name || result.user?.email,
        }),
        color: "success",
        icon: "i-heroicons-user-plus",
      });
    } else {
      toast.add({
        title: t("shareModal.toast.invitationSent.title"),
        description: t("shareModal.toast.invitationSent.description", {
          email: result.email,
        }),
        color: "success",
        icon: "i-heroicons-envelope",
      });
    }
  }
};

// Reset selected role
watch(
  () => sharingStore.shareModalOpen,
  (isOpen) => {
    if (isOpen) {
      shareEmail.value = "";
      selectedShareRole.value = "viewer";
      linkCopied.value = false;
    }
  },
);
</script>
