<template>
  <div
    :class="[
      'absolute bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      'hover:shadow-xl transition-all duration-200',
      selected ? 'ring-2 ring-primary-500' : '',
    ]"
    :style="widgetStyle"
    role="region"
    :aria-label="$t('widget.ariaLabel')"
    :tabindex="canEdit ? 0 : -1"
    @mousedown="handleMouseDown"
  >
    <div
      class="widget-header flex items-center justify-between px-3 py-2 cursor-move border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      @mousedown="startDrag"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div
          :class="[
            'p-1.5 rounded-lg bg-gradient-to-br text-white flex-shrink-0',
            widgetTypeInfo?.color || 'from-pink-500 to-purple-600',
          ]"
        >
          <UIcon
            :name="widgetTypeInfo?.icon || 'i-heroicons-cube'"
            class="w-4 h-4"
          />
        </div>

        <UInput
          v-if="isEditingName && canEdit"
          ref="nameInput"
          v-model="editableName"
          type="text"
          size="sm"
          variant="none"
          :ui="{
            base: 'border border-primary-500 dark:border-primary-400 rounded-md',
          }"
          class="flex-1 min-w-0 font-medium text-sm"
          @blur="handleNameBlur"
          @keydown.enter="handleNameBlur"
          @keydown.esc="handleNameCancel"
          @mousedown.stop
          @click.stop
        />
        <span
          v-else
          :class="[
            'font-medium text-sm text-gray-700 dark:text-gray-300 select-none',
            'transition-colors truncate flex-1 min-w-0 px-1 py-0.5',
            canEdit
              ? 'cursor-text hover:text-primary-600 dark:hover:text-primary-100'
              : '',
          ]"
          @click.stop="canEdit && startEditingName()"
          :title="displayName"
        >
          {{ displayName }}
        </span>
      </div>

      <div
        :aria-label="$t('widget.accessLevel', { role: props.widget.myRole })"
        :data-access-level="props.widget.myRole"
        class="flex items-center gap-1 shrink-0"
      >
        <div
          v-if="isCollaborative"
          class="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-1"
          :title="$t('widget.sharedWidget')"
        >
          <UIcon
            name="i-heroicons-user-group"
            class="w-3 h-3 text-purple-600 dark:text-purple-400"
          />
        </div>
        <UButton
          v-if="isOwner || !isCollaborative"
          :icon="
            isCollaborative ? 'i-heroicons-user-plus' : 'i-heroicons-share'
          "
          size="xs"
          variant="ghost"
          :color="isCollaborative ? 'secondary' : 'primary'"
          @click.stop="handleShare"
          aria-label="sharing"
          :title="
            isCollaborative
              ? $t('widget.manageCollaborators')
              : $t('widget.shareWidget')
          "
        />

        <UButton
          v-if="isCollaborative && !isOwner"
          icon="i-heroicons-users"
          size="xs"
          variant="ghost"
          color="secondary"
          @click.stop="handleShare"
          :title="$t('widget.viewCollaborators')"
          aria-label="Share"
        />

        <UButton
          :icon="isOwner ? 'i-heroicons-trash' : ''"
          size="xs"
          variant="ghost"
          color="error"
          aria-label="delete"
          @click.stop="openConfirmationModal"
          :title="
            isOwner
              ? $t('widget.deleteWidget')
              : $t('widget.removeFromDashboard')
          "
        />
      </div>
    </div>
    <div
      v-if="showOwnerBar"
      class="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
      <span>
        {{ $t("widget.owner") }}:
        <strong class="text-gray-700 dark:text-gray-300">{{
          ownerDisplayName
        }}</strong>
      </span>
    </div>

    <div
      class="widget-content overflow-hidden relative"
      :style="{ height: contentHeight }"
    >
      <slot />
    </div>
    <div
      v-if="selected"
      class="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 cursor-se-resize opacity-75 hover:opacity-100 hidden xl:block z-10"
      @mousedown.stop="startResize"
    >
      <div class="w-1.5 h-1.5 bg-white rounded-full m-auto mt-1"></div>
    </div>
    <div
      v-if="isViewOnly"
      class="absolute bottom-2 right-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10"
    >
      <UIcon name="i-heroicons-eye" class="w-3 h-3" aria-hidden="true" />
      {{ $t("widget.viewOnly") }}
    </div>
    <UiConfirmationModal
      v-model="deleteModalOpen"
      :title="$t('widget.deleteModal.title')"
      :message="$t('widget.deleteModal.message', { name: displayName })"
      :confirm-text="$t('widget.deleteModal.confirm')"
      :cancel-text="$t('widget.deleteModal.cancel')"
      :loading="isDeleting"
      variant="danger"
      confirm-color="error"
      icon="i-heroicons-trash"
      @confirm="confirmDelete"
    >
      <template #extra-content>
        <div
          v-if="isCollaborative"
          class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
        >
          <p class="text-sm text-red-700 dark:text-red-300 font-medium">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-4 h-4 inline mr-1"
            />
            {{ $t("widget.deleteModal.warning") }}
          </p>
        </div>
      </template>
    </UiConfirmationModal>
  </div>
</template>

<script setup lang="ts">
import type { DashboardWidget } from "@/stores/dashboard";

interface Props {
  widget: DashboardWidget;
  selected: boolean;
  readonly?: boolean;
  mobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  mobile: false,
});

const emit = defineEmits<{
  remove: [];
  delete: [];
}>();

const { t } = useI18n();
const sharingStore = useSharingStore();
const dashboardStore = useDashboardStore();
const { user } = useUserSession();

const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const nameInput = ref<HTMLInputElement | null>(null);
const editableName = ref("");

// Modal state
const deleteModalOpen = ref(false);
const isDeleting = ref(false);

const HEADER_HEIGHT = 44;
const OWNER_BAR_HEIGHT = 32;

const widgetStyle = computed(() => {
  if (props.mobile) {
    return {
      position: "relative" as const,
      width: "100%",
      height: `${props.widget.height}px`,
      zIndex: props.widget.zIndex,
    };
  }

  return {
    left: `${props.widget.x}px`,
    top: `${props.widget.y}px`,
    width: `${props.widget.width}px`,
    height: `${props.widget.height}px`,
    zIndex: props.widget.zIndex,
  };
});

const widgetTypeInfo = computed(() => {
  return dashboardStore.widgetTypes.find(
    (wt) => wt.id === props.widget.widget?.type,
  );
});

const displayName = computed(() => {
  const type = props.widget.widget?.type;
  const translationKey = {
    "content-editor": "widgetPreview.widgetTypes.contentEditor",
    "todo-list": "widgetPreview.widgetTypes.todoList",
    "calendar-widget": "widgetPreview.widgetTypes.calendar",
    "image-gallery": "widgetPreview.widgetTypes.imageGallery",
    "notes-widget": "widgetPreview.widgetTypes.quickNotes",
  }[type || ""];

  return translationKey
    ? t(translationKey)
    : props.widget.widget?.name || t("widget.unknownWidget");
});

const isEditingName = computed(() => {
  return dashboardStore.editingWidgetName === props.widget.widgetId;
});

const isOwner = computed(() => props.widget.myRole === "owner");
const isEditor = computed(() => props.widget.myRole === "editor");
const isViewer = computed(() => props.widget.myRole === "viewer");
const canEdit = computed(() => isOwner.value || isEditor.value);
const isViewOnly = computed(() => props.readonly || isViewer.value);

const isCollaborative = computed(() => {
  if (!isOwner.value && props.widget.permission) return true;
  if (props.widget.widget?.owner !== user.value?.id) return true;
  return false;
});

const showOwnerBar = computed(() => {
  return isCollaborative.value && !isOwner.value && ownerDisplayName.value;
});

const ownerDisplayName = computed(() => {
  return (
    props.widget.widget?.ownerName || props.widget.widget?.ownerEmail || ""
  );
});

const contentHeight = computed(() => {
  const ownerBarHeight = showOwnerBar.value ? OWNER_BAR_HEIGHT : 0;
  const totalHeaderHeight = HEADER_HEIGHT + ownerBarHeight;
  return `calc(100% - ${totalHeaderHeight}px)`;
});

watch(isEditingName, async (isEditing) => {
  if (isEditing) {
    editableName.value = displayName.value;
    await nextTick();
    const el = nameInput.value?.$el?.querySelector(
      "input",
    ) as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }
});

const startEditingName = () => {
  if (canEdit.value) {
    dashboardStore.startEditingWidgetName(props.widget.widgetId);
  }
};

const handleNameBlur = () => {
  const trimmedName = editableName.value.trim();
  if (trimmedName && trimmedName !== displayName.value) {
    dashboardStore.updateWidgetContent(props.widget.widgetId, {
      name: trimmedName,
    });
  }
  dashboardStore.stopEditingWidgetName();
};

const handleNameCancel = () => {
  editableName.value = displayName.value;
  dashboardStore.stopEditingWidgetName();
};

const handleMouseDown = () => {
  dashboardStore.bringToFront(props.widget.widgetId);
  dashboardStore.selectedWidgetId = props.widget.widgetId;
};

const startDrag = (event: MouseEvent) => {
  if (props.mobile) return;
  event.preventDefault();
  isDragging.value = true;

  dragOffset.value = {
    x: event.clientX - props.widget.x,
    y: event.clientY - props.widget.y,
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;

    const newX = e.clientX - dragOffset.value.x;
    const newY = e.clientY - dragOffset.value.y;

    const snappedX =
      Math.round(newX / dashboardStore.gridSize) * dashboardStore.gridSize;
    const snappedY =
      Math.round(newY / dashboardStore.gridSize) * dashboardStore.gridSize;

    dashboardStore.updateWidgetLayout(props.widget.widgetId, {
      x: Math.max(0, snappedX),
      y: Math.max(0, snappedY),
    });
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
  };

  document.body.style.cursor = "grabbing";
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const startResize = (event: MouseEvent) => {
  if (props.mobile) return;
  event.preventDefault();

  const startWidth = props.widget.width;
  const startHeight = props.widget.height;
  const startX = event.clientX;
  const startY = event.clientY;

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = Math.max(250, startWidth + (e.clientX - startX));
    const newHeight = Math.max(300, startHeight + (e.clientY - startY));

    dashboardStore.updateWidgetLayout(props.widget.widgetId, {
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
  };

  document.body.style.cursor = "se-resize";
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const handleShare = () => {
  sharingStore.openShareModal(props.widget.widgetId, displayName.value);
};

const openConfirmationModal = () => {
  if (isOwner.value) {
    deleteModalOpen.value = true;
  }
};

const confirmDelete = async () => {
  isDeleting.value = true;

  try {
    emit("delete");
    deleteModalOpen.value = false;
  } catch (error) {
    console.error("Failed to delete widget:", error);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.widget-content {
  overflow: hidden;
}
</style>
