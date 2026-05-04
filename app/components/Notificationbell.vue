<template>
  <UPopover v-model:open="notificationStore.isPopoverOpen">
    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      class="relative"
      aria-label="Notifications"
    >
      <UIcon name="i-heroicons-bell" class="w-5 h-5" />
      <span
        v-if="notificationStore.hasUnread"
        class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
      >
        {{
          notificationStore.unreadCount > 99
            ? "99+"
            : notificationStore.unreadCount
        }}
      </span>
    </UButton>

    <template #content>
      <div class="w-80 sm:w-96 max-h-[70vh] flex flex-col">
        <div
          class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700"
        >
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t("notifications.title") }}
          </h3>
          <div class="flex items-center gap-2">
            <UButton
              v-if="notificationStore.hasUnread"
              size="xs"
              variant="ghost"
              @click="handleMarkAllRead"
            >
              {{ $t("notifications.markAllRead") }}
            </UButton>
          </div>
        </div>

        <div
          v-if="notificationStore.isLoading"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-6 h-6 text-gray-400 animate-spin"
          />
        </div>
        <div
          v-else-if="notificationStore.recentNotifications.length > 0"
          class="flex-1 overflow-y-auto"
        >
          <div
            v-for="notification in notificationStore.recentNotifications"
            :key="notification.id"
            :class="[
              'relative p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
              !notification.read && 'bg-primary-50 dark:bg-primary-900/20',
            ]"
          >
            <div class="flex gap-3">
              <div
                :class="[
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  getIconBgClass(notification.type),
                ]"
              >
                <UIcon
                  :name="
                    notificationStore.getNotificationIcon(notification.type)
                  "
                  :class="['w-5 h-5', getIconColorClass(notification.type)]"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p
                    :class="[
                      'text-sm font-medium',
                      !notification.read
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400',
                    ]"
                  >
                    {{ notification.title }}
                  </p>

                  <!-- Delete button for read notifications (top right) -->
                  <UButton
                    v-if="notification.read"
                    icon="i-heroicons-trash"
                    size="xs"
                    variant="ghost"
                    color="error"
                    class="flex-shrink-0 -mt-1 -mr-1"
                    @click="handleDelete(notification.id)"
                  />
                  <!-- Unread indicator -->
                  <div v-else class="flex-shrink-0 mt-1">
                    <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                </div>
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5"
                >
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ notificationStore.formatTimeAgo(notification.createdAt) }}
                </p>

                <!-- Action buttons - only show for unread -->
                <div v-if="!notification.read" class="flex gap-2 mt-2">
                  <!-- Widget Shared -->
                  <template v-if="notification.type === 'widget_shared'">
                    <UButton
                      v-if="notification.token"
                      size="xs"
                      color="primary"
                      @click="handleAddToDashboard(notification)"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.addToDashboard") }}
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      {{ $t("notifications.actions.dismiss") }}
                    </UButton>
                  </template>

                  <!-- Role Changed -->
                  <template v-else-if="notification.type === 'role_changed'">
                    <UButton
                      v-if="notification.widgetId"
                      size="xs"
                      color="info"
                      variant="soft"
                      @click="handleViewWidget(notification)"
                    >
                      <UIcon name="i-heroicons-eye" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.viewWidget") }}
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      {{ $t("notifications.actions.ok") }}
                    </UButton>
                  </template>

                  <!-- Access Removed -->
                  <template v-else-if="notification.type === 'access_removed'">
                    <UButton
                      size="xs"
                      variant="soft"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.gotIt") }}
                    </UButton>
                  </template>

                  <!-- Widget Updated -->
                  <template v-else-if="notification.type === 'widget_updated'">
                    <UButton
                      v-if="notification.widgetId"
                      size="xs"
                      color="primary"
                      variant="soft"
                      @click="handleViewWidget(notification)"
                    >
                      <UIcon name="i-heroicons-eye" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.viewChanges") }}
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      {{ $t("notifications.actions.dismiss") }}
                    </UButton>
                  </template>

                  <!-- Widget Deleted -->
                  <template v-else-if="notification.type === 'widget_deleted'">
                    <UButton
                      size="xs"
                      variant="soft"
                      color="error"
                      @click="handleMarkRead(notification)"
                    >
                      <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.gotIt") }}
                    </UButton>
                  </template>

                  <!-- Collaborator Left -->
                  <template
                    v-else-if="notification.type === 'collaborator_left'"
                  >
                    <UButton
                      v-if="notification.widgetId"
                      size="xs"
                      color="warning"
                      variant="soft"
                      @click="handleViewWidget(notification)"
                    >
                      <UIcon name="i-heroicons-users" class="w-3 h-3 mr-1" />
                      {{ $t("notifications.actions.viewWidget") }}
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      {{ $t("notifications.actions.ok") }}
                    </UButton>
                  </template>

                  <!-- Fallback / General -->
                  <template v-else>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="handleMarkRead(notification)"
                    >
                      {{ $t("notifications.actions.dismiss") }}
                    </UButton>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center">
          <UIcon
            name="i-heroicons-bell-slash"
            class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t("notifications.noNotificationsYet") }}
          </p>
        </div>

        <div
          v-if="notificationStore.notifications.length > 0"
          class="p-2 border-t border-gray-200 dark:border-gray-700"
        >
          <UButton
            variant="ghost"
            color="error"
            block
            size="sm"
            @click="handleClearAll"
          >
            {{ $t("notifications.clearAll") }}
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const notificationStore = useNotificationStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  await notificationStore.loadNotifications();
  await notificationStore.subscribeToNotifications();
});

onUnmounted(() => {
  notificationStore.cleanup();
});

const handleAddToDashboard = async (notification: any) => {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id);
  }
  notificationStore.closePopover();

  if (notification.token) {
    router.push(`/share/${notification.token}`);
  }
};

const handleViewWidget = async (notification: any) => {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id);
  }
  notificationStore.closePopover();

  if (notification.widgetId) {
    router.push({
      path: `/dashboard/${route.params.id}`,
      query: {
        widget: notification.widgetId,
      },
    });
  }
};

const handleMarkRead = async (notification: any) => {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id);
  }
};

const handleDelete = async (id: string) => {
  await notificationStore.deleteNotification(id);
};

const handleMarkAllRead = async () => {
  await notificationStore.markAllAsRead();
};

const handleClearAll = async () => {
  await notificationStore.clearAllNotifications();
};

const getIconBgClass = (type: string) => {
  const classes: Record<string, string> = {
    widget_shared: "bg-green-100 dark:bg-green-900/30",
    role_changed: "bg-blue-100 dark:bg-blue-900/30",
    access_removed: "bg-red-100 dark:bg-red-900/30",
    widget_updated: "bg-purple-100 dark:bg-purple-900/30",
    widget_deleted: "bg-red-100 dark:bg-red-900/30",
    collaborator_left: "bg-orange-100 dark:bg-orange-900/30",
    general: "bg-gray-100 dark:bg-gray-800",
  };
  return classes[type] || classes.general;
};

const getIconColorClass = (type: string) => {
  const classes: Record<string, string> = {
    widget_shared: "text-green-600 dark:text-green-400",
    role_changed: "text-blue-600 dark:text-blue-400",
    access_removed: "text-red-600 dark:text-red-400",
    widget_updated: "text-purple-600 dark:text-purple-400",
    widget_deleted: "text-red-600 dark:text-red-400",
    collaborator_left: "text-orange-600 dark:text-orange-400",
    general: "text-gray-600 dark:text-gray-400",
  };
  return classes[type] || classes.general;
};
</script>