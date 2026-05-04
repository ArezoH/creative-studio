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
const { locale } = useI18n();

// Default content with HTML
const defaultContentEN = `
  <h1>Quick Notes</h1>
  <p>Welcome! Here are a few examples of things you can do with this editor:</p>

  <h2>Lists</h2>
  <ul>
    <li>Create bullet points for ideas.</li>
    <li>Use numbered lists for step-by-step instructions.</li>
  </ul>

  <h2>Text Formatting</h2>
  <p>
    You can make text <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.
    You can also <mark>highlight important information</mark> to make it stand out.
  </p>
`;

const defaultContentES = `
  <h1>Notas Rápidas</h1>
  <p>¡Bienvenido! Aquí hay algunos ejemplos de cosas que puedes hacer con este editor:</p>

  <h2>Listas</h2>
  <ul>
    <li>Crea viñetas para ideas.</li>
    <li>Usa listas numeradas para instrucciones paso a paso.</li>
  </ul>

  <h2>Formato de Texto</h2>
  <p>
    Puedes hacer texto en <strong>negrita</strong>, <em>cursiva</em>, o <u>subrayado</u>.
    También puedes <mark>resaltar información importante</mark> para que destaque.
  </p>
`;

const defaultContent = computed(() => {
  return locale.value === "es" ? defaultContentES : defaultContentEN;
});

const content = ref(props.widget.widget.data?.content || defaultContent.value);

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
