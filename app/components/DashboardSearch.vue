<template>
  <div
    class="dashboard-search-wrapper"
    role="search"
    :aria-label="$t('search.ariaLabel')"
  >
    <div class="flex items-center gap-2">
      <UInput
        v-model="searchQuery"
        :placeholder="$t('search.placeholder')"
        prepend-icon="i-heroicons-magnifying-glass"
        class="flex-1 min-w-[120px] sm:min-w-[200px]"
        :aria-label="$t('search.ariaLabel')"
        aria-describedby="search-results-status"
        @keydown.enter="goToNextMatch"
        @keydown.up.prevent="goToPreviousMatch"
        @keydown.down.prevent="goToNextMatch"
        @keydown.escape="clearSearch"
      >
        <template #trailing>
          <div class="flex items-center gap-1">
            <UButton
              v-if="searchQuery && filteredWidgets.length > 0"
              icon="i-heroicons-chevron-up"
              size="xs"
              color="secondary"
              variant="ghost"
              :padded="false"
              :aria-label="$t('search.previousMatch')"
              @click="goToPreviousMatch"
            />
            <UButton
              v-if="searchQuery && filteredWidgets.length > 0"
              icon="i-heroicons-chevron-down"
              size="xs"
              color="secondary"
              variant="ghost"
              :padded="false"
              :aria-label="$t('search.nextMatch')"
              @click="goToNextMatch"
            />
            <UButton
              v-if="searchQuery"
              icon="i-heroicons-x-mark"
              size="xs"
              color="secondary"
              variant="ghost"
              :padded="false"
              :aria-label="$t('search.clearSearch')"
              @click="clearSearch"
            />
          </div>
        </template>
      </UInput>

      <div
        id="search-results-status"
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        <template v-if="searchQuery && filteredWidgets.length > 0">
          {{
            $t("search.resultsStatus", {
              current: currentMatchIndex + 1,
              total: filteredWidgets.length,
            })
          }}
        </template>
        <template v-else-if="searchQuery && filteredWidgets.length === 0">
          {{ $t("search.noWidgetsFound") }}
        </template>
      </div>

      <!-- Visual counter -->
      <div
        v-if="searchQuery && filteredWidgets.length > 0"
        class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap min-w-fit px-1 sm:px-2"
        aria-hidden="true"
      >
        {{ currentMatchIndex + 1 }}/{{ filteredWidgets.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dashboardStore = useDashboardStore();
const searchQuery = ref("");
const currentMatchIndex = ref(0);

const extractWidgetText = (dashboardWidget: DashboardWidget) => {
  const widget = dashboardWidget.widget;
  const parts: string[] = [];

  // basic widget metadata
  if (widget.name) parts.push(widget.name);
  if (widget.type) parts.push(widget.type);

  const d = widget.data;

  switch (widget.type) {
    case "content-editor":
    case "notes-widget":
      if (d?.content && typeof d.content === "string") parts.push(d.content);
      if (Array.isArray(d?.blocks))
        parts.push(d.blocks.map((b: any) => b?.text || "").join(" "));
      break;

    case "todo-list":
      if (Array.isArray(d?.items))
        parts.push(
          d.items
            .map((it: any) => `${it?.title || ""} ${it?.description || ""}`)
            .join(" ")
        );
      break;

    case "calendar-widget":
      if (Array.isArray(d?.events))
        parts.push(
          d.events
            .map(
              (ev: any) =>
                `${ev?.title || ""} ${ev?.description || ""} ${
                  ev?.location || ""
                } ${ev?.start || ""} ${ev?.end || ""}`
            )
            .join(" ")
        );
      break;
  }

  if (widget.ownerName) parts.push(widget.ownerName);
  if (widget.ownerEmail) parts.push(widget.ownerEmail);

  if (typeof d === "string") parts.push(d);
  else if (d) parts.push(JSON.stringify(d));

  return parts.join(" ");
};

const matchingWidgetIds = computed<Set<string>>(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return new Set();
  const ids = new Set<string>();

  for (const dw of dashboardStore.dashboardWidgets) {
    const hay = extractWidgetText(dw).toLowerCase();
    if (hay.includes(q)) ids.add(dw.widgetId);
  }
  return ids;
});

const filteredWidgets = computed(() => {
  if (!searchQuery.value.trim()) return dashboardStore.dashboardWidgets;
  return dashboardStore.dashboardWidgets.filter((dw) =>
    matchingWidgetIds.value.has(dw.widgetId)
  );
});

const totalWidgets = computed(() => dashboardStore.dashboardWidgets.length);

const currentMatchedWidget = computed(() => {
  if (filteredWidgets.value.length === 0) return null;
  return filteredWidgets.value[currentMatchIndex.value];
});

const goToNextMatch = () => {
  if (filteredWidgets.value.length === 0) return;
  currentMatchIndex.value =
    (currentMatchIndex.value + 1) % filteredWidgets.value.length;
  selectCurrentMatch();
};

const goToPreviousMatch = () => {
  if (filteredWidgets.value.length === 0) return;
  currentMatchIndex.value =
    (currentMatchIndex.value - 1 + filteredWidgets.value.length) %
    filteredWidgets.value.length;
  selectCurrentMatch();
};

const selectCurrentMatch = () => {
  const widget = currentMatchedWidget.value;
  if (widget) {
    dashboardStore.selectedWidgetId = widget.widgetId;
    scrollToWidget(widget.widgetId);
  }
};

const scrollToWidget = (widgetId: string) => {
  nextTick(() => {
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
};

const clearSearch = () => {
  searchQuery.value = "";
  currentMatchIndex.value = 0;
};

watch(searchQuery, () => {
  currentMatchIndex.value = 0;
});

defineExpose({
  filteredWidgets,
  searchQuery,
  matchingWidgetIds,
  currentMatchedWidget,
});
</script>
