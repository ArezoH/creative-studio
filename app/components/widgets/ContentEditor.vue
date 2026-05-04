<template>
  <WidgetsBaseWidget
    :widget="widget"
    :selected="selected"
    :readonly="readonly"
    @remove="$emit('remove')"
    @delete="$emit('delete')"
  >
    <div class="h-full flex flex-col">
      <RichTextEditor
        v-model="content"
        class="flex-1 min-h-0"
        :readonly="readonly"
      />
    </div>
  </WidgetsBaseWidget>
</template>

<script setup lang="ts">
import type { DashboardWidget } from "~/stores/dashboard";

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

defineEmits<{
  remove: [];
  delete: [];
}>();

const dashboardStore = useDashboardStore();

const content = ref(props.widget.widget.data?.content || "");

watch(
  () => props.widget.widget.data?.content,
  (newContent) => {
    if (newContent !== undefined && newContent !== content.value) {
      content.value = newContent;
    }
  }
);

watch(content, (newContent) => {
  if (props.readonly) return;

  dashboardStore.updateWidgetContent(props.widget.widgetId, {
    data: { ...props.widget.widget.data, content: newContent },
  });
});
</script>
