<template>
  <div
    ref="outerRef"
    class="w-full mt-4 pt-4 h-auto flex-1 overflow-auto relative min-h-0 outline-none"
    data-canvas="true"
    :style="gridStyle"
    role="region"
    aria-label="Dashboard canvas - drag and drop widgets here"
    tabindex="0"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @click="clearSelection"
  >
    <div
      v-if="isMobile"
      class="p-4 grid gap-4 grid-cols-1 z-0"
      data-mobile="true"
      role="list"
      style="min-height: max-content"
      aria-label="Widgets list"
    >
      <div
        v-for="(dw, index) in visibleWidgets"
        key="dw.id"
        role="listitem"
        :aria-label="`Widget ${index + 1}: ${
          dw.widget?.name || dw.widget?.type || 'Unnamed widget'
        }`"
        :aria-posinset="index + 1"
        :aria-setsize="visibleWidgets.length"
        class="w-full h-auto relative lg:px-4"
        :class="!isMatched(dw.widgetId) ? 'widget-dim' : ''"
        :data-widget-id="dw.widgetId"
      >
        <component
          :is="compMap[dw.widget.type]"
          :widget="gridAdjust(dw)"
          :mobile="true"
          :selected="dashboardStore.selectedWidgetId === dw.widgetId"
          :readonly="dw.myRole === 'viewer'"
          @remove="handleRemoveWidget(dw)"
          @delete="handleDeleteWidget(dw)"
          @click.stop="selectWidget(dw.widgetId)"
        />
      </div>
    </div>

    <div
      v-else-if="isTablet"
      role="list"
      aria-label="Widgets list"
      class="p-4 grid gap-4 z-0"
      :class="isLandscape ? 'grid-cols-2' : 'grid-cols-1'"
      style="min-height: max-content"
      data-mobile="true"
      ref="canvasRef"
    >
      <div
        v-for="(dw, index) in visibleWidgets"
        :key="dw.id"
        role="listitem"
        :aria-label="`Widget ${index + 1}: ${
          dw.widget?.name || dw.widget?.type || 'Unnamed widget'
        }`"
        :aria-posinset="index + 1"
        :aria-setsize="visibleWidgets.length"
        class="w-full relative"
        :class="!isMatched(dw.widgetId) ? 'widget-dim' : ''"
        :data-widget-id="dw.widgetId"
      >
        <component
          :is="compMap[dw.widget.type]"
          :widget="gridAdjust(dw)"
          :mobile="true"
          :selected="dashboardStore.selectedWidgetId === dw.widgetId"
          :readonly="dw.myRole === 'viewer'"
          @remove="handleRemoveWidget(dw)"
          @delete="handleDeleteWidget(dw)"
          @click.stop="selectWidget(dw.widgetId)"
        />
      </div>
    </div>

    <div
      v-else
      ref="canvasRef"
      class="z-0 mx-2 relative"
      :style="innerStyle"
      data-desktop="true"
      role="application"
      aria-label="Desktop canvas - widgets can be freely positioned"
    >
      <component
        v-for="dw in visibleWidgets"
        :key="dw.id"
        :is="compMap[dw.widget.type]"
        :widget="dw"
        :selected="dashboardStore.selectedWidgetId === dw.widgetId"
        :readonly="dw.myRole === 'viewer'"
        :class="!isMatched(dw.widgetId) ? 'widget-dim' : ''"
        @remove="handleRemoveWidget(dw)"
        @delete="handleDeleteWidget(dw)"
        @click.stop="selectWidget(dw.widgetId)"
        :data-widget-id="dw.widgetId"
      />
    </div>

    <div
      v-if="
        visibleWidgets.length === 0 &&
        !props.searchRef?.searchQuery &&
        !dashboardStore.isLoadingLayout
      "
      class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6"
      role="status"
      aria-live="polite"
    >
      <div class="text-center">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        >
          <UIcon
            name="i-heroicons-squares-plus"
            class="w-6 h-6 text-gray-400"
          />
        </div>
        <h3 class="text-lg font-medium mb-2">
          {{ $t("canvas.emptyState.title") }}
        </h3>
        <p class="text-gray-500 mb-4">
          {{ $t("canvas.emptyState.description") }}
        </p>
      </div>
    </div>

    <div
      v-if="dashboardStore.isLoadingLayout"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
      class="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-10000 flex flex-col items-center justify-center gap-6"
    >
      <div class="text-center space-y-4 px-4">
        <UIcon
          name="i-heroicons-squares-2x2"
          class="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto animate-pulse"
        />
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t("canvas.loading.title") }}
        </h2>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {{ $t("canvas.loading.description") }}
        </p>
      </div>

      <div class="w-full max-w-md px-4">
        <UProgress
          :value="dashboardStore.loadingProgress"
          :max="100"
          size="md"
          color="primary"
          animation="carousel"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dashboardStore = useDashboardStore();
const toast = useToast();
const outerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const { t } = useI18n();
const route = useRoute();
const props = defineProps({
  searchRef: {
    type: Object,
    default: null,
  },
});

import {
  useBreakpoints,
  breakpointsTailwind,
  useMediaQuery,
  useWindowSize,
} from "@vueuse/core";

const { width: screenW, height: screenH } = useWindowSize();

const bp = useBreakpoints(breakpointsTailwind);
const isMobile = bp.smaller("md");
const isTablet = computed(
  () => bp.greaterOrEqual("md").value && bp.smaller("xl").value
);
const isDesktop = bp.greaterOrEqual("xl");
const isLandscape = useMediaQuery("(orientation: landscape)");

const BASE_WIDTH = computed(() => {
  if (isDesktop.value) {
    return screenW.value >= 1920 ? 1600 : 1280;
  }

  if (isTablet.value) return 1024;

  return screenW.value;
});

const scale = computed(() => {
  if (!isDesktop.value) return 1;
  return Math.min(1, screenW.value / BASE_WIDTH.value);
});

const containerW = ref(0);

const visibleWidgets = computed(() => dashboardStore.dashboardWidgets);

const isMatched = (widgetId: string) => {
  const q = props.searchRef?.searchQuery?.trim();
  if (!q) return true;
  return props.searchRef?.matchingWidgetIds?.has(widgetId);
};

const colorMode = useColorMode();
const gridStyle = computed(() => {
  const size = Number(dashboardStore.gridSize) || 16;
  const isDark = colorMode.value === "dark";
  const dot = isDark
    ? "var(--grid-dot, rgba(255,255,255,0.08))"
    : "var(--grid-dot, rgba(0,0,0,0.06))";
  return {
    backgroundImage: `radial-gradient(circle, ${dot} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: "0 0",
  };
});

const innerHeight = computed(() => {
  if (!visibleWidgets.value.length) return 720;
  const maxBottom = Math.max(
    ...visibleWidgets.value.map((dw) => dw.y + dw.height)
  );
  return maxBottom + 80;
});

const innerStyle = computed(() => ({
  width: `${BASE_WIDTH.value}px`,
  height: `${innerHeight.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: "top left",
}));

const compMap: Record<string, any> = {
  "content-editor": resolveComponent("WidgetsContentEditor"),
  "todo-list": resolveComponent("WidgetsTodo"),
  "calendar-widget": resolveComponent("WidgetsCalendar"),
  "notes-widget": resolveComponent("WidgetsQuickNotes"),
  "image-gallery": resolveComponent("WidgetsImages"),
};

// === HANDLERS ===

const selectWidget = (widgetId: string) => {
  dashboardStore.selectedWidgetId = widgetId;
};

const MIN_GRID_HEIGHT = 500;
const gridAdjust = (dw: DashboardWidget) => {
  if (isDesktop.value) return dw;
  const container = containerW.value || window.innerWidth;
  const cols = isTablet.value && isLandscape.value ? 2 : 1;
  const gap = 16;
  const paddingX = 32;
  const usable = Math.max(240, container - paddingX - (cols - 1) * gap);
  const colW = Math.floor(usable / cols);
  return { ...dw, width: colW, height: Math.max(MIN_GRID_HEIGHT, dw.height) };
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  try {
    const data = JSON.parse(e.dataTransfer.getData("application/json"));
    if (data.type === "widget" && data.widgetType) {
      if (isMobile.value || isTablet.value) {
        dashboardStore.addWidget(data.widgetType, 0, 0);
        return;
      }
      if (canvasRef.value) {
        const rect = canvasRef.value.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale.value;
        const y = (e.clientY - rect.top) / scale.value;
        dashboardStore.addWidget(
          data.widgetType,
          Math.max(0, x),
          Math.max(0, y)
        );
      }
    }
  } catch (err) {
    console.error("Error handling drop:", err);
  }
};

const clearSelection = () => {
  dashboardStore.selectedWidgetId = null;
};

const handleRemoveWidget = async (dw: DashboardWidget) => {
  await dashboardStore.removeWidgetFromDashboard(dw.widgetId);

  toast.add({
    title: t("canvas.toast.widgetRemoved.title"),
    description: t("canvas.toast.widgetRemoved.description"),
    color: "success",
    icon: "i-heroicons-check-circle",
  });
};

const handleDeleteWidget = async (dw: DashboardWidget) => {
  if (dw.myRole !== "owner") {
    toast.add({
      title: t("canvas.toast.cannotDelete.title"),
      description: t("canvas.toast.cannotDelete.description"),
      color: "error",
    });
    return;
  }

  const success = await dashboardStore.deleteWidget(dw.widgetId);

  if (success) {
    toast.add({
      title: t("canvas.toast.widgetDeleted.title"),
      description: t("canvas.toast.widgetDeleted.description"),
      color: "success",
      icon: "i-heroicons-trash",
    });
  } else {
    toast.add({
      title: t("canvas.toast.error.title"),
      description: t("canvas.toast.error.description"),
      color: "error",
    });
  }
};

watch(
  () => route.query.widget,
  (widgetId) => {
    if (widgetId && typeof widgetId === "string") {
      const targetWidget = dashboardStore.dashboardWidgets.find(
        (w) => w.widgetId === widgetId
      );

      if (targetWidget) {
        dashboardStore.selectedWidgetId = widgetId;

        nextTick(() => {
          const widgetElement = document.querySelector(
            `[data-widget-id="${widgetId}"]`
          );
          widgetElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
    }
  },
  { immediate: true }
);

</script>

<style>
[data-mobile="true"] .absolute,
[data-mobile="true"] *[style*="position: absolute"],
.grid .absolute,
.grid *[style*="position: absolute"] {
  position: static !important;
  inset: auto !important;
}
.widget-dim {
  filter: grayscale(50%);
  opacity: 0.5;
}
</style>
