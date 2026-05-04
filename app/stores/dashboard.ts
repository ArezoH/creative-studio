import { defineStore } from "pinia";
import { ref, computed, readonly, nextTick, watch } from "vue";
import type { WidgetType, DragPreview } from "@/types/dashboard";
import { useDebounceFn } from "@vueuse/core";

export interface Dashboard {
  id: string;
  title: string;
  owner: string;
  created: string;
  updated: string;
}

export interface Widget {
  id: string;
  type: string;
  name: string;
  data: Record<string, any>;
  owner: string;
  ownerName?: string;
  ownerEmail?: string;
  created: string;
  updated: string;
}

export interface WidgetPermission {
  id: string;
  widgetId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: "owner" | "editor" | "viewer";
  grantedBy: string;
  grantedByName?: string;
  created: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  widget: Widget;
  permission: WidgetPermission | null;
  myRole: "owner" | "editor" | "viewer";
}

export const useDashboardStore = defineStore("dashboard", () => {
  const { $pb } = useNuxtApp();
  const { user } = useAuth();

  // State
  const dashboards = ref<Dashboard[]>([]);
  const currentDashboardId = ref<string | null>(null);
  const isLoadingDashboards = ref(false);

  const dashboardWidgets = ref<DashboardWidget[]>([]);

  // UI State
  const selectedWidgetId = ref<string | null>(null);
  const editingWidgetName = ref<string | null>(null);
  const gridSize = ref(40);
  const isLoaded = ref(false);
  const isLoadingLayout = ref(false);
  const loadingProgress = ref(0);
  const MIN_HEIGHT = 400;

  // Collaboration: Debounced notifications
  const pendingNotifications = ref<Map<string, NodeJS.Timeout>>(new Map());

  const dragPreview = ref<DragPreview>({
    type: "",
    x: 0,
    y: 0,
    width: 400,
    height: MIN_HEIGHT,
    isVisible: false,
  });

  const widgetTypes: WidgetType[] = [
    {
      id: "content-editor",
      name: "Content Editor",
      icon: "i-heroicons-pencil",
      color: "from-blue-500 to-purple-600",
      defaultSize: { width: 400, height: 400 },
    },
    {
      id: "todo-list",
      name: "Todo List",
      icon: "i-heroicons-check-circle",
      color: "from-orange-500 to-red-600",
      defaultSize: { width: 400, height: 400 },
    },
    {
      id: "calendar-widget",
      name: "Calendar",
      icon: "i-heroicons-calendar-days",
      color: "from-purple-500 to-pink-600",
      defaultSize: { width: 400, height: 400 },
    },
    {
      id: "image-gallery",
      name: "Image Gallery",
      icon: "i-heroicons-photo",
      color: "from-cyan-500 to-blue-600",
      defaultSize: { width: 400, height: 400 },
    },
    {
      id: "notes-widget",
      name: "Quick Notes",
      icon: "i-heroicons-document-text",
      color: "from-gray-500 to-gray-600",
      defaultSize: { width: 400, height: 400 },
    },
  ];

  // Computed
  const currentDashboard = computed(() => {
    return (
      dashboards.value.find((d) => d.id === currentDashboardId.value) || null
    );
  });

  const selectedWidget = computed(() => {
    if (!selectedWidgetId.value) return null;
    return (
      dashboardWidgets.value.find(
        (dw) => dw.widgetId === selectedWidgetId.value,
      ) || null
    );
  });

  // === COLLABORATION: Notification helpers ===

  const notifyCollaboratorsOfUpdate = (
    widgetId: string,
    widgetName: string,
  ) => {
    const existingTimeout = pendingNotifications.value.get(widgetId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
      await sendUpdateNotifications(widgetId, widgetName);
      pendingNotifications.value.delete(widgetId);
    }, 500);

    pendingNotifications.value.set(widgetId, timeout);
  };

  const sendUpdateNotifications = async (
    widgetId: string,
    widgetName: string,
  ) => {
    if (!user.value?.id) return;

    try {
      const widget = await $pb.collection("widgets").getOne(widgetId);
      const permissions = await $pb
        .collection("widget_permissions")
        .getFullList({
          filter: `widget="${widgetId}"`,
        });

      // Use Set to prevent duplicate user IDs
      const userIdsToNotify = new Set<string>();

      // Add owner
      if (widget.owner && widget.owner !== user.value.id) {
        userIdsToNotify.add(widget.owner);
      }

      // Add collaborators
      for (const perm of permissions) {
        if (perm.user && perm.user !== user.value.id) {
          userIdsToNotify.add(perm.user);
        }
      }

      if (userIdsToNotify.size === 0) return;

      const notificationStore = useNotificationStore();

      for (const userId of userIdsToNotify) {
        try {
          await notificationStore.notifyWidgetUpdated(
            userId,
            widgetId,
            widgetName || "Unnamed Widget",
            {
              id: user.value.id,
              name: user.value.name,
              email: user.value.email,
            },
          );
        } catch (e) {
          console.error("[Dashboard] Failed to notify user:", userId, e);
        }
      }
    } catch (e) {
      console.error("[Dashboard] Failed to send update notifications:", e);
    }
  };

  // Dashboard Actions
  const loadDashboards = async () => {
    if (!user.value?.id) return;
    isLoadingDashboards.value = true;

    try {
      const records = await $pb.collection("dashboards").getFullList({
        filter: `owner="${user.value.id}"`,
        sort: "-created",
      });

      dashboards.value = records.map((r: any) => ({
        id: r.id,
        title: r.title,
        owner: r.owner,
        created: r.created,
        updated: r.updated,
      }));
    } catch (e) {
      console.error("Failed to load dashboards:", e);
    } finally {
      isLoadingDashboards.value = false;
    }
  };

  const createDashboard = async (title: string) => {
    if (!user.value?.id || !title.trim()) return null;

    try {
      const record = await $pb.collection("dashboards").create({
        owner: user.value.id,
        title: title.trim(),
      });

      const newDashboard: Dashboard = {
        id: record.id,
        title: record.title,
        owner: record.owner,
        created: record.created,
        updated: record.updated,
      };

      dashboards.value.unshift(newDashboard);
      return newDashboard;
    } catch (e) {
      console.error("Failed to create dashboard:", e);
      return null;
    }
  };

  const deleteDashboard = async (id: string) => {
    try {
      const dwRecords = await $pb.collection("dashboard_widgets").getFullList({
        filter: `dashboard="${id}"`,
      });

      for (const dw of dwRecords) {
        await $pb.collection("dashboard_widgets").delete(dw.id);
      }

      await $pb.collection("dashboards").delete(id);
      dashboards.value = dashboards.value.filter((d) => d.id !== id);

      if (currentDashboardId.value === id) {
        currentDashboardId.value = null;
        dashboardWidgets.value = [];
      }

      return true;
    } catch (e) {
      console.error("Failed to delete dashboard:", e);
      return false;
    }
  };

  const updateDashboardTitle = async (id: string, title: string) => {
    try {
      await $pb.collection("dashboards").update(id, { title: title.trim() });
      const dashboard = dashboards.value.find((d) => d.id === id);
      if (dashboard) {
        dashboard.title = title.trim();
      }
      return true;
    } catch (e) {
      console.error("Failed to update dashboard title:", e);
      return false;
    }
  };

  const subscribeToPermissionChanges = () => {
    if (!process.client) return;
    if (!user.value?.id) return;

    try {
      $pb.collection("widget_permissions").unsubscribe();
    } catch (e) {}

    $pb.collection("widget_permissions").subscribe("*", (e: any) => {
      if (e.record.user !== user.value?.id) return;

      const widgetId = e.record.widget;
      const dw = dashboardWidgets.value.find((w) => w.widgetId === widgetId);

      if (!dw) return;

      if (e.action === "update") {
        const newRole = e.record.role as "owner" | "editor" | "viewer";
        const oldRole = dw.myRole;

        if (oldRole !== newRole) {
          dw.myRole = newRole;

          if (dw.permission) {
            dw.permission.role = newRole;
          }
        }
      } else if (e.action === "delete") {
        dashboardWidgets.value = dashboardWidgets.value.filter(
          (w) => w.widgetId !== widgetId,
        );

        if (selectedWidgetId.value === widgetId) {
          selectedWidgetId.value = null;
        }
      }
    });
  };
  const selectDashboard = async (id: string) => {
    isLoadingLayout.value = true;
    loadingProgress.value = 10;

    try {
      let dashboard = dashboards.value.find((d) => d.id === id);

      if (!dashboard) {
        const record = await $pb.collection("dashboards").getOne(id);
        dashboard = {
          id: record.id,
          title: record.title,
          owner: record.owner,
          created: record.created,
          updated: record.updated,
        };

        if (!dashboards.value.find((d) => d.id === id)) {
          dashboards.value.push(dashboard);
        }
      }

      currentDashboardId.value = id;
      loadingProgress.value = 50;

      await loadDashboardWidgets();
      subscribeToWidgetChanges();
      subscribeToPermissionChanges();

      loadingProgress.value = 100;
    } catch (e) {
      console.error("Failed to select dashboard:", e);
      throw e;
    } finally {
      setTimeout(() => {
        isLoaded.value = true;
        isLoadingLayout.value = false;
        loadingProgress.value = 0;
      }, 300);
    }
  };

  const loadDashboardWidgets = async () => {
    if (!currentDashboardId.value || !user.value?.id) return;

    try {
      const dwRecords = await $pb.collection("dashboard_widgets").getFullList({
        filter: `dashboard="${currentDashboardId.value}"`,
        expand: "widget,widget.owner",
        sort: "created",
      });

      const results: DashboardWidget[] = [];

      for (const dw of dwRecords) {
        const widgetRecord = dw.expand?.widget;
        if (!widgetRecord) continue;

        let permission: WidgetPermission | null = null;
        let myRole: "owner" | "editor" | "viewer" = "viewer";

        if (widgetRecord.owner === user.value.id) {
          myRole = "owner";
        } else {
          try {
            const permRecord = await $pb
              .collection("widget_permissions")
              .getFirstListItem(
                `widget="${widgetRecord.id}" && user="${user.value.id}"`,
                { expand: "granted_by" },
              );

            permission = {
              id: permRecord.id,
              widgetId: permRecord.widget,
              userId: permRecord.user,
              role: permRecord.role,
              grantedBy: permRecord.granted_by,
              grantedByName: permRecord.expand?.granted_by?.name,
              created: permRecord.created,
            };
            myRole = permRecord.role;
          } catch (e) {}
        }

        results.push({
          id: dw.id,
          dashboardId: dw.dashboard,
          widgetId: widgetRecord.id,
          x: dw.x,
          y: dw.y,
          width: dw.width,
          height: dw.height,
          zIndex: dw.zIndex || 1,
          widget: {
            id: widgetRecord.id,
            type: widgetRecord.type,
            name: widgetRecord.name,
            data: widgetRecord.data || {},
            owner: widgetRecord.owner,
            ownerName: widgetRecord.expand?.owner?.name,
            ownerEmail: widgetRecord.expand?.owner?.email,
            created: widgetRecord.created,
            updated: widgetRecord.updated,
          },
          permission,
          myRole,
        });
      }

      dashboardWidgets.value = results;
    } catch (e) {
      console.error("Failed to load dashboard widgets:", e);
      dashboardWidgets.value = [];
    }
  };

  const addWidget = async (
    type: string,
    x: number,
    y: number,
    size?: { width: number; height: number },
  ) => {
    if (!currentDashboardId.value || !user.value?.id) {
      console.error("Cannot add widget: No dashboard selected");
      return;
    }

    const widgetType = widgetTypes.find((wt) => wt.id === type);
    if (!widgetType) {
      console.error("Cannot add widget: Unknown widget type", type);
      return;
    }

    try {
      const widgetRecord = await $pb.collection("widgets").create({
        type,
        name: widgetType.name,
        data: {},
        owner: user.value.id,
      });

      await $pb.collection("widget_permissions").create({
        widget: widgetRecord.id,
        user: user.value.id,
        role: "owner",
        granted_by: user.value.id,
      });

      const layoutRecord = await $pb.collection("dashboard_widgets").create({
        dashboard: currentDashboardId.value,
        widget: widgetRecord.id,
        x: Math.round(x / gridSize.value) * gridSize.value,
        y: Math.round(y / gridSize.value) * gridSize.value,
        width: size?.width ?? widgetType.defaultSize.width,
        height: Math.max(
          MIN_HEIGHT,
          size?.height ?? widgetType.defaultSize.height,
        ),
        zIndex:
          Math.max(0, ...dashboardWidgets.value.map((dw) => dw.zIndex), 0) + 1,
      });

      const newDashboardWidget: DashboardWidget = {
        id: layoutRecord.id,
        dashboardId: currentDashboardId.value,
        widgetId: widgetRecord.id,
        x: layoutRecord.x,
        y: layoutRecord.y,
        width: layoutRecord.width,
        height: layoutRecord.height,
        zIndex: layoutRecord.zIndex,
        widget: {
          id: widgetRecord.id,
          type: widgetRecord.type,
          name: widgetRecord.name,
          data: widgetRecord.data || {},
          owner: widgetRecord.owner,
          ownerName: user.value.name,
          ownerEmail: user.value.email,
          created: widgetRecord.created,
          updated: widgetRecord.updated,
        },
        permission: null,
        myRole: "owner",
      };

      dashboardWidgets.value.push(newDashboardWidget);

      nextTick(() => {
        editingWidgetName.value = widgetRecord.id;
      });

      return widgetRecord.id;
    } catch (e) {
      console.error("Failed to create widget:", e);
    }
  };
  const debouncedLayoutUpdate = useDebounceFn(
    async (
      dashboardWidgetId: string,
      updates: Partial<{
        x: number;
        y: number;
        width: number;
        height: number;
        zIndex: number;
      }>,
    ) => {
      try {
        await $pb
          .collection("dashboard_widgets")
          .update(dashboardWidgetId, updates);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("Failed to persist layout:", e);
      }
    },
    250,
  );

  const updateWidgetLayout = (
    widgetId: string,
    updates: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
    }>,
  ) => {
    const dw = dashboardWidgets.value.find((w) => w.widgetId === widgetId);
    if (!dw) return;

    if (typeof updates.height === "number") {
      updates.height = Math.max(MIN_HEIGHT, updates.height);
    }

    Object.assign(dw, updates);

    debouncedLayoutUpdate(dw.id, updates);
  };

  const updateWidgetContent = async (
    widgetId: string,
    updates: Partial<{ name: string; data: Record<string, any> }>,
  ) => {
    const dw = dashboardWidgets.value.find((w) => w.widgetId === widgetId);
    if (!dw) return;

    if (dw.myRole === "viewer") {
      console.error("Cannot update: viewer access only");
      return {
        success: false,
        error: "You only have viewer access to this widget",
      };
    }

    Object.assign(dw.widget, updates);

    try {
      await $pb.collection("widgets").update(widgetId, updates);

      if (updates.data) {
        notifyCollaboratorsOfUpdate(widgetId, dw.widget.name);
      }

      return { success: true };
    } catch (e: any) {
      console.error("Failed to update widget content:", e);
      return { success: false, error: e.message };
    }
  };

  const removeWidgetFromDashboard = async (widgetId: string) => {
    const dw = dashboardWidgets.value.find((w) => w.widgetId === widgetId);
    if (!dw) return;

    dashboardWidgets.value = dashboardWidgets.value.filter(
      (w) => w.widgetId !== widgetId,
    );

    try {
      await $pb.collection("dashboard_widgets").delete(dw.id);
    } catch (e) {
      console.error("Failed to remove widget:", e);
      await loadDashboardWidgets();
    }
  };

  const deleteWidget = async (widgetId: string) => {
    const dw = dashboardWidgets.value.find((w) => w.widgetId === widgetId);
    if (!dw || dw.myRole !== "owner") {
      console.error("Only owner can delete widget");
      return false;
    }

    const timeout = pendingNotifications.value.get(widgetId);
    if (timeout) {
      clearTimeout(timeout);
      pendingNotifications.value.delete(widgetId);
    }

    try {
      const allPerms = await $pb.collection("widget_permissions").getFullList({
        filter: `widget="${widgetId}"`,
      });

      const widgetName = dw.widget.name || "Unnamed Widget";

      if (user.value?.id) {
        const collaboratorIds = allPerms
          .filter((perm) => perm.user && perm.user !== user.value!.id)
          .map((perm) => perm.user);

        if (collaboratorIds.length > 0) {
          const notificationStore = useNotificationStore();

          for (const collaboratorId of collaboratorIds) {
            try {
              await notificationStore.notifyWidgetDeleted(
                collaboratorId,
                widgetName,
                {
                  id: user.value.id,
                  name: user.value.name,
                  email: user.value.email,
                },
              );
            } catch (notifError) {
              console.error(
                "[Dashboard] Failed to notify collaborator:",
                collaboratorId,
                notifError,
              );
            }
          }
        }
      }

      const allDwRecords = await $pb
        .collection("dashboard_widgets")
        .getFullList({
          filter: `widget="${widgetId}"`,
        });
      for (const record of allDwRecords) {
        await $pb.collection("dashboard_widgets").delete(record.id);
      }

      for (const perm of allPerms) {
        await $pb.collection("widget_permissions").delete(perm.id);
      }

      try {
        const shareLinks = await $pb
          .collection("widget_share_links")
          .getFullList({
            filter: `widget="${widgetId}"`,
          });
        for (const link of shareLinks) {
          await $pb.collection("widget_share_links").delete(link.id);
        }
      } catch (e) {
        console.error("[Dashboard] Error cleaning up share links:", e);
      }

      await $pb.collection("widgets").delete(widgetId);

      dashboardWidgets.value = dashboardWidgets.value.filter(
        (w) => w.widgetId !== widgetId,
      );

      return true;
    } catch (e) {
      console.error("Failed to delete widget:", e);
      return false;
    }
  };

  const subscribeToWidgetChanges = () => {
    if (!process.client) return;

    if (!user.value?.id) return;

    try {
      $pb.collection("widgets").unsubscribe();
    } catch (e) {}

    const widgetIds = dashboardWidgets.value.map((dw) => dw.widgetId);
    if (widgetIds.length === 0) return;

    $pb.collection("widgets").subscribe("*", (e: any) => {
      if (!widgetIds.includes(e.record.id)) return;

      if (e.action === "update") {
        const dw = dashboardWidgets.value.find(
          (w) => w.widgetId === e.record.id,
        );
        if (dw) {
          dw.widget.name = e.record.name;
          dw.widget.data = e.record.data || {};
          dw.widget.updated = e.record.updated;
        }
      } else if (e.action === "delete") {
        dashboardWidgets.value = dashboardWidgets.value.filter(
          (w) => w.widgetId !== e.record.id,
        );
      }
    });
  };

  const bringToFront = (widgetId: string) => {
    const maxZ = Math.max(0, ...dashboardWidgets.value.map((dw) => dw.zIndex));
    updateWidgetLayout(widgetId, { zIndex: maxZ + 1 });
  };

  const showDragPreview = (type: string, x: number, y: number) => {
    const widgetType = widgetTypes.find((wt) => wt.id === type);
    if (widgetType) {
      dragPreview.value = {
        type,
        x: Math.round(x / gridSize.value) * gridSize.value,
        y: Math.round(y / gridSize.value) * gridSize.value,
        width: widgetType.defaultSize.width,
        height: Math.max(MIN_HEIGHT, widgetType.defaultSize.height),
        isVisible: true,
      };
    }
  };

  const updateDragPreview = (x: number, y: number) => {
    if (dragPreview.value.isVisible) {
      dragPreview.value.x = Math.round(x / gridSize.value) * gridSize.value;
      dragPreview.value.y = Math.round(y / gridSize.value) * gridSize.value;
    }
  };

  const hideDragPreview = () => {
    dragPreview.value.isVisible = false;
  };

  const resetState = () => {
    dashboards.value = [];
    dashboardWidgets.value = [];
    currentDashboardId.value = null;
    isLoaded.value = false;
    try {
      $pb.collection("widgets").unsubscribe();
      $pb.collection("widget_permissions").unsubscribe();
    } catch (e) {}
  };

  watch(
    () => user.value?.id,
    (newId) => {
      if (!newId) resetState();
    },
  );

  return {
    dashboards: readonly(dashboards),
    dashboardWidgets: readonly(dashboardWidgets),
    currentDashboardId: readonly(currentDashboardId),
    currentDashboard,
    selectedWidget,
    isLoadingDashboards: readonly(isLoadingDashboards),
    selectedWidgetId,
    editingWidgetName,
    gridSize,
    dragPreview,
    widgetTypes,
    isLoaded: readonly(isLoaded),
    isLoadingLayout: readonly(isLoadingLayout),
    loadingProgress: readonly(loadingProgress),

    loadDashboards,
    createDashboard,
    deleteDashboard,
    updateDashboardTitle,
    selectDashboard,

    addWidget,
    updateWidgetLayout,
    updateWidgetContent,
    subscribeToPermissionChanges,
    removeWidgetFromDashboard,
    deleteWidget,
    loadDashboardWidgets,

    bringToFront,
    showDragPreview,
    updateDragPreview,
    hideDragPreview,
    startEditingWidgetName: (id: string) => {
      editingWidgetName.value = id;
    },
    stopEditingWidgetName: () => {
      editingWidgetName.value = null;
    },
  };
});
