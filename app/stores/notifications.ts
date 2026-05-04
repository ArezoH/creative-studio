import { defineStore } from "pinia";
import { ref, computed, readonly, nextTick } from "vue";

export interface Notification {
  id: string;
  userId: string;
  type:
    | "widget_shared"
    | "role_changed"
    | "access_removed"
    | "widget_updated"
    | "widget_deleted"
    | "collaborator_left"
    | "general";
  title: string;
  message: string;
  widgetId?: string;
  widgetName?: string;
  fromUserId?: string;
  fromUserName?: string;
  token?: string;
  read: boolean;
  createdAt: string;
}

export const useNotificationStore = defineStore("notifications", () => {
  const { $pb } = useNuxtApp();
  const { user } = useAuth();
  const { t } = useI18n();

  // State
  const notifications = ref<Notification[]>([]);
  const isLoading = ref(false);
  const unsubscribe = ref<(() => void) | null>(null);

  // Popover open state
  const isPopoverOpen = ref(false);

  const closePopover = () => {
    isPopoverOpen.value = false;
  };

  // Computed
  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read).length;
  });

  const hasUnread = computed(() => unreadCount.value > 0);

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  const recentNotifications = computed(() => {
    return sortedNotifications.value.slice(0, 10);
  });

  // actions
  const loadNotifications = async () => {
    if (!user.value?.id) return;

    isLoading.value = true;

    try {
      const records = await $pb.collection("notifications").getFullList({
        filter: `user="${user.value.id}"`,
        sort: "-created",
        expand: "from_user",
      });

      notifications.value = records.map(mapRecordToNotification);
    } catch (e) {
      console.error("[Notifications] Failed to load:", e);
      notifications.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const subscribeToNotifications = async () => {
    if (!user.value?.id) return;

    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }

    try {
      await $pb.collection("notifications").subscribe("*", (e) => {
        if (e.record.user !== user.value?.id) return;

        if (e.action === "create") {
          // Prevent duplicate notifications
          const exists = notifications.value.some((n) => n.id === e.record.id);
          if (exists) return;

          const notification = mapRecordToNotification(e.record);
          notifications.value.unshift(notification);
          showNotificationToast(notification);
        } else if (e.action === "update") {
          const index = notifications.value.findIndex(
            (n) => n.id === e.record.id,
          );
          if (index !== -1) {
            notifications.value[index] = mapRecordToNotification(e.record);
          }
        } else if (e.action === "delete") {
          notifications.value = notifications.value.filter(
            (n) => n.id !== e.record.id,
          );
        }
      });

      unsubscribe.value = () => {
        $pb.collection("notifications").unsubscribe("*");
      };
    } catch (e) {
      console.error("[Notifications] Failed to subscribe:", e);
    }
  };

  const createNotification = async (data: {
    userId: string;
    type: Notification["type"];
    title: string;
    message: string;
    widgetId?: string;
    widgetName?: string;
    fromUserId?: string;
    fromUserName?: string;
    token?: string;
  }) => {
    try {
      const record = await $pb.collection("notifications").create({
        user: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        widget: data.widgetId || null,
        widget_name: data.widgetName || null,
        from_user: data.fromUserId || null,
        from_user_name: data.fromUserName || null,
        token: data.token || null,
        read: false,
      });

      return { success: true, id: record.id };
    } catch (e: any) {
      console.error("[Notifications] Failed to create:", e);
      return { success: false, error: e.message };
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await $pb.collection("notifications").update(notificationId, {
        read: true,
      });

      const notification = notifications.value.find(
        (n) => n.id === notificationId,
      );
      if (notification) {
        notification.read = true;
      }

      return { success: true };
    } catch (e: any) {
      console.error("[Notifications] Failed to mark as read:", e);
      return { success: false, error: e.message };
    }
  };

  const markAllAsRead = async () => {
    if (!user.value?.id) return { success: false };

    try {
      const unreadIds = notifications.value
        .filter((n) => !n.read)
        .map((n) => n.id);

      await Promise.all(
        unreadIds.map((id) =>
          $pb.collection("notifications").update(id, { read: true }),
        ),
      );

      notifications.value.forEach((n) => {
        n.read = true;
      });

      return { success: true };
    } catch (e: any) {
      console.error("[Notifications] Failed to mark all as read:", e);
      return { success: false, error: e.message };
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await $pb.collection("notifications").delete(notificationId);
      notifications.value = notifications.value.filter(
        (n) => n.id !== notificationId,
      );
      return { success: true };
    } catch (e: any) {
      console.error("[Notifications] Failed to delete:", e);
      return { success: false, error: e.message };
    }
  };

  const clearAllNotifications = async () => {
    if (!user.value?.id) return { success: false };

    try {
      const ids = notifications.value.map((n) => n.id);
      await Promise.all(
        ids.map((id) => $pb.collection("notifications").delete(id)),
      );
      notifications.value = [];
      return { success: true };
    } catch (e: any) {
      console.error("[Notifications] Failed to clear all:", e);
      return { success: false, error: e.message };
    }
  };

  const notifyWidgetShared = async (
    targetUserId: string,
    widgetId: string,
    widgetName: string,
    role: "editor" | "viewer",
    fromUser: { id: string; name?: string; email: string },
    token?: string,
  ) => {
    const fromName = fromUser.name || fromUser.email;
    const translatedRole = t(`notifications.roles.${role}`);

    return createNotification({
      userId: targetUserId,
      type: "widget_shared",
      title: t("notifications.types.widgetShared.title"),
      message: t("notifications.types.widgetShared.message", {
        user: fromName,
        widget: widgetName,
        role: translatedRole,
      }),
      widgetId,
      widgetName,
      fromUserId: fromUser.id,
      fromUserName: fromName,
      token,
    });
  };

  const notifyRoleChanged = async (
    targetUserId: string,
    widgetId: string,
    widgetName: string,
    newRole: "editor" | "viewer",
    fromUser: { id: string; name?: string; email: string },
  ) => {
    const fromName = fromUser.name || fromUser.email;
    const translatedRole = t(`notifications.roles.${newRole}`);

    return createNotification({
      userId: targetUserId,
      type: "role_changed",
      title: t("notifications.types.roleChanged.title"),
      message: t("notifications.types.roleChanged.message", {
        widget: widgetName,
        role: translatedRole,
        user: fromName,
      }),
      widgetId,
      widgetName,
      fromUserId: fromUser.id,
      fromUserName: fromName,
    });
  };

  const notifyAccessRemoved = async (
    targetUserId: string,
    widgetId: string,
    widgetName: string,
    fromUser: { id: string; name?: string; email: string },
  ) => {
    const fromName = fromUser.name || fromUser.email;

    return createNotification({
      userId: targetUserId,
      type: "access_removed",
      title: t("notifications.types.accessRemoved.title"),
      message: t("notifications.types.accessRemoved.message", {
        user: fromName,
        widget: widgetName,
      }),
      widgetId,
      widgetName,
      fromUserId: fromUser.id,
      fromUserName: fromName,
    });
  };

  const notifyWidgetUpdated = async (
    targetUserId: string,
    widgetId: string,
    widgetName: string,
    fromUser: { id: string; name?: string; email: string },
  ) => {
    const fromName = fromUser.name || fromUser.email;

    return createNotification({
      userId: targetUserId,
      type: "widget_updated",
      title: t("notifications.types.widgetUpdated.title"),
      message: t("notifications.types.widgetUpdated.message", {
        user: fromName,
        widget: widgetName,
      }),
      widgetId,
      widgetName,
      fromUserId: fromUser.id,
      fromUserName: fromName,
    });
  };

  const notifyWidgetDeleted = async (
    targetUserId: string,
    widgetName: string,
    fromUser: { id: string; name?: string; email: string },
  ) => {
    const fromName = fromUser.name || fromUser.email;

    return createNotification({
      userId: targetUserId,
      type: "widget_deleted",
      title: t("notifications.types.widgetDeleted.title"),
      message: t("notifications.types.widgetDeleted.message", {
        user: fromName,
        widget: widgetName,
      }),
      widgetName,
      fromUserId: fromUser.id,
      fromUserName: fromName,
    });
  };

  const notifyCollaboratorLeft = async (
    ownerId: string,
    widgetId: string,
    widgetName: string,
    leftUser: { id: string; name?: string; email: string },
  ) => {
    const leftName = leftUser.name || leftUser.email;

    return createNotification({
      userId: ownerId,
      type: "collaborator_left",
      title: t("notifications.types.collaboratorLeft.title"),
      message: t("notifications.types.collaboratorLeft.message", {
        user: leftName,
        widget: widgetName,
      }),
      widgetId,
      widgetName,
      fromUserId: leftUser.id,
      fromUserName: leftName,
    });
  };

  const mapRecordToNotification = (record: any): Notification => ({
    id: record.id,
    userId: record.user,
    type: record.type || "general",
    title: record.title,
    message: record.message,
    widgetId: record.widget,
    widgetName: record.widget_name,
    fromUserId: record.from_user,
    fromUserName: record.from_user_name || record.expand?.from_user?.name,
    token: record.token,
    read: record.read || false,
    createdAt: record.created,
  });

  const showNotificationToast = (notification: Notification) => {
    const toast = useToast();

    const iconMap: Record<string, string> = {
      widget_shared: "i-heroicons-share",
      role_changed: "i-heroicons-arrow-path",
      access_removed: "i-heroicons-x-circle",
      widget_updated: "i-heroicons-pencil-square",
      widget_deleted: "i-heroicons-trash",
      collaborator_left: "i-heroicons-user-minus",
      general: "i-heroicons-bell",
    };

    const colorMap: Record<string, string> = {
      widget_shared: "success",
      role_changed: "info",
      access_removed: "warning",
      widget_updated: "info",
      widget_deleted: "error",
      collaborator_left: "warning",
      general: "neutral",
    };

    toast.add({
      title: notification.title,
      description: notification.message,
      icon: iconMap[notification.type] || "i-heroicons-bell",
      color: (colorMap[notification.type] as any) || "neutral",
      timeout: 12000,
    });
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconMap: Record<string, string> = {
      widget_shared: "i-heroicons-share",
      role_changed: "i-heroicons-arrow-path",
      access_removed: "i-heroicons-x-circle",
      widget_updated: "i-heroicons-pencil-square",
      widget_deleted: "i-heroicons-trash",
      collaborator_left: "i-heroicons-user-minus",
      general: "i-heroicons-bell",
    };
    return iconMap[type] || "i-heroicons-bell";
  };

  const getNotificationColor = (type: Notification["type"]) => {
    const colorMap: Record<string, string> = {
      widget_shared: "success",
      role_changed: "info",
      access_removed: "error",
      widget_updated: "primary",
      widget_deleted: "error",
      collaborator_left: "warning",
      general: "neutral",
    };
    return colorMap[type] || "neutral";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t("notifications.timeAgo.justNow");
    if (minutes < 60) return t("notifications.timeAgo.minutesAgo", { minutes });
    if (hours < 24) return t("notifications.timeAgo.hoursAgo", { hours });
    if (days < 7) return t("notifications.timeAgo.daysAgo", { days });
    return date.toLocaleDateString();
  };

  const cleanup = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  };

  return {
    notifications: readonly(notifications),
    isLoading: readonly(isLoading),

    // Computed
    unreadCount,
    hasUnread,
    sortedNotifications,
    recentNotifications,

    // Actions
    loadNotifications,
    subscribeToNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    cleanup,

    // Popover control
    isPopoverOpen,
    closePopover,

    // Notification creators
    notifyWidgetShared,
    notifyRoleChanged,
    notifyAccessRemoved,
    notifyWidgetUpdated,
    notifyWidgetDeleted,
    notifyCollaboratorLeft,

    // Helpers
    getNotificationIcon,
    getNotificationColor,
    formatTimeAgo,
  };
});
