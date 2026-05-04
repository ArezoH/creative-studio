<template>
  <Teleport to="body">
    <div
      v-if="dashboardStore.dragPreview.isVisible && currentWidgetType"
      class="fixed pointer-events-none z-50"
      :style="{
        left: `${dashboardStore.dragPreview.x}px`,
        top: `${dashboardStore.dragPreview.y}px`,
        width: `${dashboardStore.dragPreview.width}px`,
        height: `${dashboardStore.dragPreview.height}px`,
      }"
    >
      <div
        class="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-dashed opacity-90"
        :class="borderColorClass"
      >
        <div
          class="flex items-center justify-between p-3 border-b"
          :class="borderColorClass"
        >
          <div class="flex items-center gap-2">
            <div
              :class="[
                'p-2 rounded-lg bg-gradient-to-br text-white',
                currentWidgetType.color,
              ]"
            >
              <UIcon :name="currentWidgetType.icon" class="w-4 h-4" />
            </div>
            <span class="font-medium text-sm text-gray-700 dark:text-gray-300">
              {{ translatedName }}
            </span>
          </div>
        </div>

        <div
          class="p-4 h-full flex items-center justify-center"
          style="height: calc(100% - 60px)"
        >
          <div class="text-center" :class="textColorClass">
            <UIcon
              :name="currentWidgetType.icon"
              class="w-8 h-8 mx-auto mb-2 opacity-50"
            />
            <div class="text-sm font-medium">{{ translatedName }}</div>
            <div class="text-xs opacity-75 mt-1">
              {{ $t("widgetLibrary.dragToCanvas") }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const dashboardStore = useDashboardStore();
const { t, locale } = useI18n();

const WIDGET_TYPE_TRANSLATION_MAP: Record<string, string> = {
  "content-editor": "widgetPreview.widgetTypes.contentEditor",
  "todo-list": "widgetPreview.widgetTypes.todoList",
  "calendar-widget": "widgetPreview.widgetTypes.calendar",
  "image-gallery": "widgetPreview.widgetTypes.imageGallery",
  "notes-widget": "widgetPreview.widgetTypes.quickNotes",
};

const currentWidgetType = computed(() => {
  return dashboardStore.widgetTypes.find(
    (wt) => wt.id === dashboardStore.dragPreview.type,
  );
});

const translatedName = computed(() => {
  const _locale = locale.value;
  const type = dashboardStore.dragPreview.type;
  const translationKey = WIDGET_TYPE_TRANSLATION_MAP[type || ""];
  return translationKey
    ? t(translationKey)
    : currentWidgetType.value?.name || "";
});

const borderColorClass = computed(() => {
  if (!currentWidgetType.value)
    return "border-blue-400 border-blue-200 dark:border-blue-700";

  const colorMap: Record<string, string> = {
    "content-editor": "border-blue-400 border-blue-200 dark:border-blue-700",
    "todo-list": "border-orange-400 border-orange-200 dark:border-orange-700",
    "calendar-widget":
      "border-purple-400 border-purple-200 dark:border-purple-700",
    "image-gallery": "border-cyan-400 border-cyan-200 dark:border-cyan-700",
    "notes-widget":
      "border-indigo-400 border-indigo-200 dark:border-indigo-700",
  };

  return (
    colorMap[currentWidgetType.value.id] ||
    "border-blue-400 border-blue-200 dark:border-blue-700"
  );
});

const textColorClass = computed(() => {
  if (!currentWidgetType.value) return "text-blue-600 dark:text-blue-400";

  const colorMap: Record<string, string> = {
    "content-editor": "text-blue-600 dark:text-blue-400",
    "todo-list": "text-orange-600 dark:text-orange-400",
    "calendar-widget": "text-purple-600 dark:text-purple-400",
    "image-gallery": "text-cyan-600 dark:text-cyan-400",
    "notes-widget": "text-indigo-600 dark:text-indigo-400",
  };

  return (
    colorMap[currentWidgetType.value.id] || "text-blue-600 dark:text-blue-400"
  );
});
</script>
