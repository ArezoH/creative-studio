<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    :style="{ minHeight: '400px' }"
  >
    <div
      class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div
          :class="[
            'p-1.5 rounded-lg bg-gradient-to-br text-white flex-shrink-0',
            widgetTypeInfo?.color || 'from-gray-500 to-gray-600',
          ]"
        >
          <UIcon
            :name="widgetTypeInfo?.icon || 'i-heroicons-cube'"
            class="w-4 h-4"
          />
        </div>
        <span
          class="font-medium text-sm text-gray-700 dark:text-gray-300 truncate"
        >
          {{
            widget.name || widgetTypeInfo?.name || $t("widgetPreview.widget")
          }}
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UBadge
          :color="role === 'editor' ? 'success' : 'neutral'"
          variant="subtle"
          size="sm"
        >
          <UIcon
            :name="
              role === 'editor'
                ? 'i-heroicons-pencil-square'
                : 'i-heroicons-eye'
            "
            class="w-3 h-3 mr-1"
          />
          {{
            role === "editor"
              ? $t("widgetPreview.roles.editor")
              : $t("widgetPreview.roles.viewer")
          }}
        </UBadge>
        <UBadge v-if="readonly" color="warning" variant="subtle" size="sm">
          <UIcon name="i-heroicons-lock-closed" class="w-3 h-3 mr-1" />
          {{ $t("widgetPreview.preview") }}
        </UBadge>
      </div>
    </div>
    <div
      class="widget-content p-4"
      :style="{ height: 'calc(100% - 60px)', minHeight: '340px' }"
    >
      <div
        v-if="
          widget.type === 'content-editor' || widget.type === 'notes-widget'
        "
        class="h-full"
      >
        <div v-if="readonly" class="h-full overflow-y-auto">
          <div
            v-if="widget.data?.content"
            v-html="widget.data.content"
            class="prose dark:prose-invert max-w-none text-sm"
          ></div>
          <div
            v-else
            class="flex items-center justify-center h-full text-gray-400"
          >
            <div class="text-center">
              <UIcon
                name="i-heroicons-document-text"
                class="w-12 h-12 mx-auto mb-2 opacity-50"
              />
              <p>{{ $t("widgetPreview.emptyStates.noContent") }}</p>
            </div>
          </div>
        </div>
        <RichTextEditor v-else v-model="localContent" class="h-full" />
      </div>

      <div
        v-else-if="widget.type === 'todo-list'"
        class="h-full overflow-y-auto"
      >
        <div v-if="widget.data?.todos?.length" class="space-y-2">
          <div
            v-for="todo in widget.data.todos"
            :key="todo.id"
            class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
          >
            <UIcon
              :name="
                todo.completed
                  ? 'i-heroicons-check-circle-solid'
                  : 'i-heroicons-circle'
              "
              :class="todo.completed ? 'text-green-500' : 'text-gray-400'"
              class="w-5 h-5 flex-shrink-0"
            />
            <span
              :class="[
                'text-sm flex-1',
                todo.completed ? 'line-through text-gray-400' : '',
              ]"
            >
              {{ todo.text }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="flex items-center justify-center h-full text-gray-400"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-check-circle"
              class="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p>{{ $t("widgetPreview.emptyStates.noTasks") }}</p>
          </div>
        </div>
      </div>

      <div
        v-else-if="widget.type === 'calendar-widget'"
        class="h-full overflow-y-auto"
      >
        <div v-if="widget.data?.events?.length" class="space-y-2">
          <div
            v-for="event in sortedEvents"
            :key="event.id"
            :class="[
              'flex items-start gap-3 p-3 rounded-lg',
              getEventUrgencyClass(event),
            ]"
          >
            <div class="flex-shrink-0">
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm">{{ event.title }}</p>
              <p class="text-xs opacity-75">
                {{ formatEventDate(event.date) }}
              </p>
            </div>
            <UBadge
              v-if="event.completed"
              color="success"
              variant="subtle"
              size="xs"
            >
              {{ $t("widgetPreview.done") }}
            </UBadge>
          </div>
        </div>
        <div
          v-else
          class="flex items-center justify-center h-full text-gray-400"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-calendar-days"
              class="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p>{{ $t("widgetPreview.emptyStates.noEvents") }}</p>
          </div>
        </div>
      </div>

      <div
        v-else-if="widget.type === 'image-gallery'"
        class="h-full overflow-y-auto"
      >
        <div
          v-if="widget.data?.images?.length"
          class="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          <div
            v-for="img in widget.data.images"
            :key="img.id"
            class="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            @click="openImagePreview(img)"
          >
            <img
              :src="img.url"
              :alt="img.fileName"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
        <div
          v-else
          class="flex items-center justify-center h-full text-gray-400"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-photo"
              class="w-12 h-12 mx-auto mb-2 opacity-50"
            />
            <p>{{ $t("widgetPreview.emptyStates.noImages") }}</p>
          </div>
        </div>
      </div>

      <div v-else class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <UIcon
            name="i-heroicons-cube"
            class="w-12 h-12 mx-auto mb-2 opacity-50"
          />
          <p>{{ $t("widgetPreview.widgetPreview") }}</p>
          <p class="text-xs mt-1">
            {{ $t("widgetPreview.type") }}: {{ widget.type }}
          </p>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="imagePreviewOpen"
      :title="$t('widgetPreview.imagePreview')"
    >
      <template #body>
        <div v-if="selectedImage" class="p-4">
          <img
            :src="selectedImage.url"
            :alt="selectedImage.fileName"
            class="w-full max-h-[70vh] object-contain rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface WidgetData {
  id: string;
  type: string;
  name: string;
  data: Record<string, any>;
  owner?: string;
  ownerName?: string;
  ownerEmail?: string;
}

interface Props {
  widget: WidgetData;
  role?: "owner" | "editor" | "viewer";
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  role: "viewer",
  readonly: true,
});

const emit = defineEmits<{
  "update:content": [value: string];
}>();

const { t, locale } = useI18n();

// Widget type info - using computed for translations
const widgetTypes = computed(() => [
  {
    id: "content-editor",
    name: t("widgetPreview.widgetTypes.contentEditor"),
    icon: "i-heroicons-pencil",
    color: "from-blue-500 to-purple-600",
  },
  {
    id: "todo-list",
    name: t("widgetPreview.widgetTypes.todoList"),
    icon: "i-heroicons-check-circle",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "calendar-widget",
    name: t("widgetPreview.widgetTypes.calendar"),
    icon: "i-heroicons-calendar-days",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "image-gallery",
    name: t("widgetPreview.widgetTypes.imageGallery"),
    icon: "i-heroicons-photo",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "notes-widget",
    name: t("widgetPreview.widgetTypes.quickNotes"),
    icon: "i-heroicons-document-text",
    color: "from-gray-500 to-gray-600",
  },
]);

const widgetTypeInfo = computed(() => {
  return widgetTypes.value.find((wt) => wt.id === props.widget.type);
});

const localContent = ref(props.widget.data?.content || "");

watch(localContent, (newContent) => {
  emit("update:content", newContent);
});

const sortedEvents = computed(() => {
  if (!props.widget.data?.events) return [];
  return [...props.widget.data.events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
});

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (dateString === todayStr) return t("widgetPreview.dates.today");
  if (dateString === tomorrowStr) return t("widgetPreview.dates.tomorrow");

  return date.toLocaleDateString(locale.value, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getEventUrgencyClass = (event: any) => {
  if (event.completed) {
    return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
  }

  const today = new Date();
  const eventDate = new Date(event.date);
  const diff = eventDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(diff / (1000 * 3600 * 24));

  if (daysDiff < 0) {
    return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
  }
  if (daysDiff === 0) {
    return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300";
  }
  if (daysDiff === 1) {
    return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300";
  }
  return "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
};

const imagePreviewOpen = ref(false);
const selectedImage = ref<{ url: string; fileName: string } | null>(null);

const openImagePreview = (img: { url: string; fileName: string }) => {
  selectedImage.value = img;
  imagePreviewOpen.value = true;
};
</script>

<style scoped>
.prose :deep(h1) {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.prose :deep(h2) {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.prose :deep(h3) {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.prose :deep(p) {
  margin-bottom: 0.5rem;
}
.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
.prose :deep(li) {
  margin-bottom: 0.25rem;
}
</style>
