<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="p-2 rounded-lg"
          :class="iconBackgroundClass"
          aria-hidden="true"
        >
          <UIcon :name="icon" class="w-5 h-5" :class="iconColorClass" />
        </div>
        <h3 class="text-lg font-semibold">
          {{ title }}
        </h3>
      </div>
    </template>

    <template #body>
      <div class="p-4">
        <p class="text-gray-600 dark:text-gray-300">
          {{ message }}
        </p>
        <slot name="extra-content" />
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <UButton
          variant="ghost"
          class="w-full sm:w-auto justify-center"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UButton>
        <UButton
          :color="confirmColor"
          class="w-full sm:w-auto justify-center"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  icon?: string;
  variant?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: "i-heroicons-exclamation-triangle",
  variant: "danger",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmColor: "error",
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const variantStyles = {
  danger: {
    background: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    background: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    background: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  success: {
    background: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
};

const iconBackgroundClass = computed(
  () => variantStyles[props.variant].background
);

const iconColorClass = computed(() => variantStyles[props.variant].iconColor);

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  isOpen.value = false;
  emit("cancel");
};
</script>
