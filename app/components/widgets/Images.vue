<template>
  <WidgetsBaseWidget
    :widget="widget"
    :selected="selected"
    :readonly="readonly"
    @remove="$emit('remove')"
    @delete="$emit('delete')"
  >
    <div class="p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium">{{ $t("imageGallery.title") }}</h3>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-arrow-path"
            size="xs"
            variant="ghost"
            @click="refreshFromPB"
            :loading="loading"
            class="bg-none dark:bg-primary-600 dark:text-white hover:bg-primary-400 hover:text-gray-900"
          >
            {{ $t("imageGallery.reload") }}
          </UButton>
          <UButton
            v-if="!readonly"
            icon="i-heroicons-plus"
            size="xs"
            variant="ghost"
            @click="showAddForm = !showAddForm"
            :aria-label="$t('imageGallery.addImages')"
          />
        </div>
      </div>

      <div
        v-if="showAddForm && !readonly"
        class="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="block w-full text-sm text-gray-900 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-500 file:text-secondary-700 hover:file:bg-purple-300 dark:text-secondary-200 dark:file:bg-cyan-900/40 dark:file:text-purple-200 hover:file:text-purple-500"
              @change="onFileChange"
            />
            <UButton
              size="xs"
              :disabled="!selectedFiles.length"
              @click="uploadToPB"
            >
              {{ $t("imageGallery.upload") }}
            </UButton>
            <UButton size="xs" variant="ghost" @click="cancelAdd">
              {{ $t("imageGallery.cancel") }}
            </UButton>
          </div>
          <p v-if="uploadError" class="text-xs text-red-600 dark:text-red-400">
            {{ uploadError }}
          </p>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="images.length > 0" class="grid grid-cols-2 gap-2">
          <div
            v-for="image in images"
            :key="image.id"
            class="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
            @click="openModal(image)"
          >
            <img
              :src="image.url"
              :alt="image.fileName"
              class="w-full h-full object-cover"
              @error="handleImageError($event, image.id)"
            />
            <button
              v-if="!readonly"
              @click.stop="confirmDelete(image)"
              class="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              :aria-label="$t('imageGallery.deleteImage')"
            >
              <UIcon
                name="i-heroicons-x-mark"
                class="w-4 h-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-center"
        >
          <div
            class="w-16 h-16 bg-secondary-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <UIcon
              name="i-heroicons-photo"
              class="w-8 h-8 text-secondary-600 dark:text-secondary-400"
              aria-hidden="true"
            />
          </div>
          <h4 class="text-sm font-medium mb-2">
            {{ $t("imageGallery.noImagesYet") }}
          </h4>
          <p class="text-xs text-gray-700 dark:text-gray-300">
            {{
              readonly
                ? $t("imageGallery.noImagesInGallery")
                : $t("imageGallery.uploadToGetStarted")
            }}
          </p>
        </div>
      </div>
      <div class="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
        {{ $t("imageGallery.imageCount", { count: images.length }) }}
      </div>
    </div>
    <UModal v-model:open="open" :title="$t('imageGallery.imagePreview')">
      <template #body>
        <div v-if="selectedImage" class="p-6">
          <img
            :src="selectedImage.url"
            :alt="selectedImage.fileName"
            class="w-full max-h-96 object-contain rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        </div>
      </template>
      <template #footer>
        <UButton
          v-if="!readonly"
          icon="i-heroicons-trash"
          size="xs"
          variant="solid"
          color="error"
          @click.stop="confirmDelete(selectedImage)"
        >
          {{ $t("imageGallery.delete") }}
        </UButton>
      </template>
    </UModal>
    <UModal
      v-model:open="showDeleteConfirm"
      :title="$t('imageGallery.deleteImage')"
    >
      <template #body>
        <div class="p-6">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ $t("imageGallery.deleteConfirmMessage") }}
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <UButton variant="outline" @click="showDeleteConfirm = false">
            {{ $t("imageGallery.cancel") }}
          </UButton>
          <UButton color="error" variant="solid" @click="deleteImage">
            {{ $t("imageGallery.delete") }}
          </UButton>
        </div>
      </template>
    </UModal>
  </WidgetsBaseWidget>
</template>

<script setup lang="ts">
import PocketBase from "pocketbase";
import type { DashboardWidget } from "~/stores/dashboard";

interface Props {
  widget: DashboardWidget;
  selected: boolean;
  readonly?: boolean;
  mobile?: boolean;
}

interface ImageItem {
  id: string;
  url: string;
  fileName: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  mobile: false,
});

defineEmits<{
  remove: [];
  delete: [];
}>();

const dashboardStore = useDashboardStore();
const toast = useToast();
const { t } = useI18n();

const pb = new PocketBase("http://127.0.0.1:8090");

const images = ref<ImageItem[]>([]);
const loading = ref(false);
const showAddForm = ref(false);
const selectedFiles = ref<File[]>([]);
const uploadError = ref("");
const open = ref(false);
const selectedImage = ref<ImageItem | null>(null);
const showDeleteConfirm = ref(false);
const imageToDelete = ref<ImageItem | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const pbRecordId = ref<string | null>(null);

watch(
  () => props.widget.widget.data,
  (newData) => {
    if (newData?.images) {
      images.value = [...newData.images];
    }
    if (newData?.pbRecordId) {
      pbRecordId.value = newData.pbRecordId;
    }
  },
  { deep: true },
);

const ensureWidgetRecord = async (): Promise<string> => {
  try {
    const existingRecords = await pb.collection("images").getFullList({
      filter: `widgetId = "${props.widget.widgetId}"`,
    });

    if (existingRecords.length > 0) {
      pbRecordId.value = existingRecords[0].id;
      return existingRecords[0].id;
    }

    // No record exists, create one
    const newRecord = await pb.collection("images").create({
      widgetId: props.widget.widgetId,
      images: [],
    });

    pbRecordId.value = newRecord.id;

    toast.add({
      title: t("imageGallery.toast.galleryInitialized.title"),
      description: t("imageGallery.toast.galleryInitialized.description"),
      icon: "i-heroicons-photo",
      color: "primary",
    });

    return newRecord.id;
  } catch (error: any) {
    console.error("Failed to ensure widget record:", error);

    toast.add({
      title: t("imageGallery.toast.connectionFailed.title"),
      description:
        error?.message || t("imageGallery.toast.connectionFailed.description"),
      icon: "i-heroicons-exclamation-triangle",
      color: "error",
    });

    throw error;
  }
};

const refreshFromPB = async () => {
  loading.value = true;
  uploadError.value = "";

  try {
    const recordId = await ensureWidgetRecord();
    const record = await pb.collection("images").getOne(recordId);

    const files: string[] = Array.isArray(record.images)
      ? record.images
      : record.images
        ? [record.images]
        : [];

    images.value = files.map((fileName) => ({
      id: fileName,
      url: pb.files.getUrl(record, fileName),
      fileName,
    }));

    saveToWidgetData();
  } catch (error: any) {
    uploadError.value =
      error?.message || t("imageGallery.toast.loadFailed.description");
    console.error("Refresh error:", error);

    toast.add({
      title: t("imageGallery.toast.loadFailed.title"),
      description: uploadError.value,
      icon: "i-heroicons-exclamation-circle",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const saveToWidgetData = () => {
  if (props.readonly) return;

  dashboardStore.updateWidgetContent(props.widget.widgetId, {
    data: {
      images: images.value,
      pbRecordId: pbRecordId.value,
    },
  });
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  selectedFiles.value = Array.from(target.files || []);
};

const uploadToPB = async () => {
  if (props.readonly) return;
  if (!selectedFiles.value.length) return;

  uploadError.value = "";
  loading.value = true;

  try {
    const recordId = await ensureWidgetRecord();
    const formData = new FormData();

    for (const file of selectedFiles.value) {
      formData.append("images", file);
    }

    const updatedRecord = await pb
      .collection("images")
      .update(recordId, formData);

    const files: string[] = Array.isArray(updatedRecord.images)
      ? updatedRecord.images
      : [updatedRecord.images].filter(Boolean);

    images.value = files.map((fileName) => ({
      id: fileName,
      url: pb.files.getUrl(updatedRecord, fileName),
      fileName,
    }));

    toast.add({
      title: t("imageGallery.toast.uploadSuccess.title"),
      description: t("imageGallery.toast.uploadSuccess.description", {
        count: selectedFiles.value.length,
      }),
      icon: "i-heroicons-cloud-arrow-up",
      color: "success",
    });

    // Clear form
    selectedFiles.value = [];
    if (fileInput.value) fileInput.value.value = "";
    showAddForm.value = false;

    // Sync to widget data
    saveToWidgetData();
  } catch (error: any) {
    uploadError.value =
      error?.message || t("imageGallery.toast.uploadFailed.description");
    console.error("Upload error:", error);

    toast.add({
      title: t("imageGallery.toast.uploadFailed.title"),
      description: uploadError.value,
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (image: ImageItem | null) => {
  if (props.readonly) return;
  if (!image) return;
  imageToDelete.value = image;
  showDeleteConfirm.value = true;
};

/**
 * Delete a single image from the record
 */
const deleteImage = async () => {
  if (props.readonly) return;
  if (!imageToDelete.value || !pbRecordId.value) return;

  const imageFileName = imageToDelete.value.fileName;

  try {
    const formData = new FormData();
    formData.append("images-", imageFileName);

    await pb.collection("images").update(pbRecordId.value, formData);

    // Update local state
    images.value = images.value.filter((img) => img.fileName !== imageFileName);

    toast.add({
      title: t("imageGallery.toast.imageDeleted.title"),
      description: t("imageGallery.toast.imageDeleted.description"),
      icon: "i-heroicons-trash",
      color: "warning",
    });

    saveToWidgetData();

    showDeleteConfirm.value = false;
    imageToDelete.value = null;
    open.value = false;
  } catch (error: any) {
    uploadError.value =
      error?.message || t("imageGallery.toast.deleteFailed.description");
    console.error("Delete error:", error);

    toast.add({
      title: t("imageGallery.toast.deleteFailed.title"),
      description: uploadError.value,
      icon: "i-heroicons-exclamation-triangle",
      color: "error",
    });
  }
};

const openModal = (image: ImageItem) => {
  selectedImage.value = image;
  open.value = true;
};

const handleImageError = (event: Event, _imageId: string) => {
  const img = event.target as HTMLImageElement;
  img.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkMxOC44OTU0IDI2IDE4IDI1LjEwNDYgMTggMjRWMTZDMTggMTQuODk1NCAxOC44OTU0IDE0IDIwIDE0QzIxLjEwNDYgMTQgMjIgMTQuODk1NCAyMiAxNlYyNEMyMiAyNS4xMDQ2IDIxLjEwNDYgMjYgMjAgMjZaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCAzMkMxOC44OTU0IDMyIDE4IDMxLjEwNDYgMTggMzBDMTggMjguODk1NCAxOC44OTU0IDI4IDIwIDI4QzIxLjEwNDYgMjggMjIgMjguODk1NCAyMiAzMEMyMiAzMS4xMDQ2IDIxLjEwNDYgMzIgMjAgMzJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=";
};

const cancelAdd = () => {
  selectedFiles.value = [];
  uploadError.value = "";
  showAddForm.value = false;
  if (fileInput.value) fileInput.value.value = "";
};

onMounted(async () => {
  // Load from widget data first
  const widgetData = props.widget.widget.data;
  if (widgetData?.pbRecordId) {
    pbRecordId.value = widgetData.pbRecordId;
  }
  if (widgetData?.images?.length) {
    images.value = widgetData.images;
  }

  await refreshFromPB();
});
</script>
