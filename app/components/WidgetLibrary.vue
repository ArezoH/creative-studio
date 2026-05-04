<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800">
    <div
      class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800"
    >
      <h2
        class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100"
      >
        {{ $t("widgetLibrary.title") }}
      </h2>
      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        :size="isHandheld ? 'xs' : 'sm'"
        @click="$emit('close')"
        color="neutral"
        class="shrink-0"
      />
    </div>
    <div class="flex-1 p-3 sm:p-4 overflow-y-auto">
      <div class="space-y-2 sm:space-y-3">
        <div
          v-for="widgetType in dashboardStore.widgetTypes"
          :key="widgetType.id"
          ref="widgetItems"
          :class="widgetItemClasses"
          :draggable="!isHandheld"
          @dragstart="handleDragStart($event, widgetType.id)"
          @mousedown="!isHandheld && handleMouseDown($event, widgetType)"
          @touchstart="isHandheld && handleTouchStart($event, widgetType)"
          @click="isHandheld && handleMobileClick(widgetType)"
          :data-widget-type="widgetType.id"
        >
          <div class="flex items-center gap-2 sm:gap-3 pointer-events-none">
            <div
              :class="[
                'p-2 sm:p-3 rounded-lg bg-gradient-to-br text-white shrink-0',
                widgetType.color,
              ]"
            >
              <UIcon :name="widgetType.icon" :class="iconSizeClass" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-xs sm:text-sm truncate">
                {{ $t(`widgetLibrary.widgets.${widgetType.id}.name`) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <span v-if="isHandheld">{{
                  $t("widgetLibrary.tapToAdd")
                }}</span>
                <span v-else class="hidden sm:inline">{{
                  $t("widgetLibrary.dragToCanvas")
                }}</span>
              </div>
            </div>
            <UButton
              v-if="isHandheld"
              icon="i-heroicons-plus"
              size="xs"
              variant="ghost"
              color="primary"
              class="shrink-0"
              @click.stop="addWidgetMobile(widgetType)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800">
      <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div class="sm:hidden space-y-1">
          <p>{{ $t("widgetLibrary.hints.mobile.tap") }}</p>
          <p>{{ $t("widgetLibrary.hints.mobile.quickAdd") }}</p>
          <p class="flex items-center gap-1">
            {{ $t("widgetLibrary.hints.mobile.press") }}
            <kbd
              class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs"
              >Esc</kbd
            >
            {{ $t("widgetLibrary.hints.mobile.toClose") }}
          </p>
        </div>
        <div class="hidden sm:block space-y-1">
          <p>{{ $t("widgetLibrary.hints.desktop.drag") }}</p>
          <p class="flex items-center gap-1">
            {{ $t("widgetLibrary.hints.desktop.press") }}
            <kbd
              class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs"
              >Esc</kbd
            >
            {{ $t("widgetLibrary.hints.desktop.toClose") }}
          </p>
          <p class="flex items-center gap-1">
            {{ $t("widgetLibrary.hints.desktop.use") }}
            <kbd
              class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs"
              >Ctrl+B</kbd
            >
            {{ $t("widgetLibrary.hints.desktop.toToggle") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dashboardStore = useDashboardStore();
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const currentWidgetType = ref<WidgetType | null>(null);

const emit = defineEmits<{
  close: [];
}>();

import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

const bp = useBreakpoints(breakpointsTailwind);

// Base responsive flags
const isHandheld = bp.smaller("lg");

const widgetItemClasses = computed(() => [
  "widget-item rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600",
  "hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200",
  "bg-gray-50 dark:bg-gray-800/50 select-none",
  "p-2 sm:p-4",
  isHandheld.value
    ? "active:scale-95 active:bg-gray-100 dark:active:bg-gray-700"
    : "cursor-move hover:scale-105 hover:shadow-lg",
]);

const iconSizeClass = computed(() =>
  isHandheld.value ? "w-3 h-3" : "w-4 h-4",
);

const handleDragStart = (event: DragEvent, widgetTypeId: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "widget",
        widgetType: widgetTypeId,
      }),
    );
    event.dataTransfer.effectAllowed = "copy";
  }
};

const handleMouseDown = (event: MouseEvent, widgetType: WidgetType) => {
  if (isHandheld.value) return;
  event.preventDefault();
  isDragging.value = true;
  currentWidgetType.value = widgetType;

  const rect = (event.target as HTMLElement).getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  };

  dashboardStore.showDragPreview(
    widgetType.id,
    event.clientX - dragOffset.value.x,
    event.clientY - dragOffset.value.y,
  );

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.body.style.cursor = "grabbing";
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  dashboardStore.updateDragPreview(
    event.clientX - dragOffset.value.x,
    event.clientY - dragOffset.value.y,
  );
};

const handleMouseUp = (event: MouseEvent) => {
  if (!isDragging.value || !currentWidgetType.value) return;

  const canvasElement = document.querySelector('[data-canvas="true"]');
  if (canvasElement) {
    const canvasRect = canvasElement.getBoundingClientRect();
    const isOverCanvas =
      event.clientX >= canvasRect.left &&
      event.clientX <= canvasRect.right &&
      event.clientY >= canvasRect.top &&
      event.clientY <= canvasRect.bottom;

    if (isOverCanvas) {
      const x = event.clientX - canvasRect.left - dragOffset.value.x;
      const y = event.clientY - canvasRect.top - dragOffset.value.y;

      dashboardStore.addWidget(
        currentWidgetType.value.id,
        Math.max(0, x),
        Math.max(0, y),
      );
    }
  }

  isDragging.value = false;
  currentWidgetType.value = null;
  dashboardStore.hideDragPreview();
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.body.style.cursor = "";
};

const handleTouchStart = (event: TouchEvent, widgetType: WidgetType) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(10);
  }
};

const handleMobileClick = (widgetType: WidgetType) => {
  addWidgetMobile(widgetType);
};

const addWidgetMobile = (widgetType: WidgetType) => {
  if (!process.client) return;
  const canvasElement = document.querySelector('[data-canvas="true"]');
  if (canvasElement) {
    const canvasRect = canvasElement.getBoundingClientRect();

    const centerX = Math.max(20, canvasRect.width / 2 - 150);
    const centerY = Math.max(20, canvasRect.height / 2 - 100);

    dashboardStore.addWidget(widgetType.id, centerX, centerY);
    emit("close");
    nextTick(() => {
      const newWidget =
        dashboardStore.widgets[dashboardStore.widgets.length - 1];
      if (newWidget) {
        dashboardStore.selectedWidget = newWidget.id;
      }
    });
  }
};

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.body.style.cursor = "";

  if (!process.client) return;
});
</script>
