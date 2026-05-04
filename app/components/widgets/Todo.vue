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
        <h3 class="text-sm font-medium">{{ $t("todo.title") }}</h3>
        <UButton
          v-if="!readonly"
          icon="i-heroicons-plus"
          size="xs"
          variant="ghost"
          @click="addTodo"
          aria-label="add todo"
        />
      </div>

      <div v-if="!readonly" class="mb-3">
        <UInput
          v-model="newTodo"
          :placeholder="$t('todo.addNewTaskPlaceholder')"
          size="sm"
          @keyup.enter="addTodo"
        />
      </div>

      <div class="flex-1 overflow-y-auto space-y-2">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <input
            type="checkbox"
            class="h-4 w-4 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            :checked="todo.completed"
            :disabled="readonly"
            @change="
              updateTodoStatus(
                todo.id,
                ($event.target as HTMLInputElement).checked,
              )
            "
            aria-label="todo checklist"
          />

          <span
            :class="[
              'text-sm flex-1',
              todo.completed ? 'line-through text-gray-500' : '',
            ]"
          >
            {{ todo.text }}
          </span>
          <UButton
            v-if="!readonly"
            icon="i-heroicons-trash"
            size="xs"
            variant="ghost"
            color="error"
            @click="removeTodo(todo.id)"
            aria-label="remove"
          />
        </div>

        <div v-if="todos.length === 0" class="text-center py-8">
          <UIcon
            name="i-heroicons-check-circle"
            class="w-8 h-8 mx-auto mb-2 text-gray-400"
          />
          <p class="text-sm text-gray-900 dark:text-gray-300">
            {{ $t("todo.noTasksYet") }}
          </p>
        </div>
      </div>
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

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  mobile: false,
});

const emit = defineEmits<{
  remove: [];
  delete: [];
}>();

const dashboardStore = useDashboardStore();

const newTodo = ref("");
const todos = ref<Todo[]>([]);

onMounted(() => {
  loadTodos();
});

watch(
  () => props.widget.widget.data,
  (newData) => {
    if (newData?.todos) {
      const currentIds = todos.value
        .map((t) => t.id)
        .sort()
        .join(",");
      const newIds = newData.todos
        .map((t: Todo) => t.id)
        .sort()
        .join(",");

      if (
        currentIds !== newIds ||
        JSON.stringify(todos.value) !== JSON.stringify(newData.todos)
      ) {
        todos.value = [...newData.todos];
      }
    }
  },
  { deep: true },
);

const loadTodos = () => {
  const widgetData = props.widget.widget.data;
  if (widgetData?.todos && Array.isArray(widgetData.todos)) {
    todos.value = [...widgetData.todos];
  } else {
    todos.value = [];
  }
};

const saveTodos = () => {
  if (props.readonly) return;

  dashboardStore.updateWidgetContent(props.widget.widgetId, {
    data: { todos: [...todos.value] },
  });
};

const addTodo = () => {
  if (props.readonly) return;
  if (!newTodo.value.trim()) return;

  todos.value.push({
    id: Date.now().toString(),
    text: newTodo.value.trim(),
    completed: false,
  });
  newTodo.value = "";
  saveTodos();
};

const removeTodo = (id: string) => {
  if (props.readonly) return;

  todos.value = todos.value.filter((todo) => todo.id !== id);
  saveTodos();
};

const updateTodoStatus = (id: string, completed: boolean) => {
  if (props.readonly) return;

  todos.value = todos.value.map((todo) =>
    todo.id === id ? { ...todo, completed } : todo,
  );

  saveTodos();
};
</script>
