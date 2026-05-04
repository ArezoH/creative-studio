<template>
  <div
    class="h-full flex flex-col p-2 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
  >
    <div
      v-if="editor && !readonly"
      class="flex items-center gap-1 p-2 bg-white dark:bg-gray-700 rounded-lg mb-3 flex-wrap shadow-sm"
    >
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-bold"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{ 'bg-gray-200 dark:bg-gray-600': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          :title="$t('editor.toolbar.bold')"
          :aria-label="$t('editor.toolbar.bold')"
        />
        <UButton
          icon="i-heroicons-italic"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('italic'),
          }"
          @click="editor.chain().focus().toggleItalic().run()"
          :title="$t('editor.toolbar.italic')"
          :aria-label="$t('editor.toolbar.italic')"
        />
        <UButton
          icon="i-heroicons-underline"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('underline'),
          }"
          @click="editor.chain().focus().toggleUnderline().run()"
          :title="$t('editor.toolbar.underline')"
          :aria-label="$t('editor.toolbar.underline')"
        />
        <UButton
          icon="i-heroicons-pencil"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('highlight'),
          }"
          @click="editor.chain().focus().toggleHighlight().run()"
          :title="$t('editor.toolbar.highlight')"
          :aria-label="$t('editor.toolbar.highlight')"
        />
      </div>

      <div
        class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"
        aria-hidden="true"
      ></div>

      <div class="flex items-center gap-1">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', {
              level: 1,
            }),
          }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :title="$t('editor.toolbar.heading1')"
        >
          H1
        </UButton>
        <UButton
          size="xs"
          variant="ghost"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', {
              level: 2,
            }),
          }"
          color="neutral"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :title="$t('editor.toolbar.heading2')"
        >
          H2
        </UButton>
        <UButton
          size="xs"
          variant="ghost"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('heading', {
              level: 3,
            }),
          }"
          color="neutral"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :title="$t('editor.toolbar.heading3')"
        >
          H3
        </UButton>
      </div>

      <div
        class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"
        aria-hidden="true"
      ></div>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-list-bullet"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('bulletList'),
          }"
          @click="editor.chain().focus().toggleBulletList().run()"
          :title="$t('editor.toolbar.bulletList')"
          :aria-label="$t('editor.toolbar.bulletList')"
        />
        <UButton
          icon="i-heroicons-numbered-list"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive('orderedList'),
          }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :title="$t('editor.toolbar.numberedList')"
          :aria-label="$t('editor.toolbar.numberedList')"
        />
      </div>

      <div
        class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"
        aria-hidden="true"
      ></div>

      <div class="hidden md:flex items-center gap-1">
        <UButton
          icon="i-heroicons-bars-3-bottom-left"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive({
              textAlign: 'left',
            }),
          }"
          @click="editor.chain().focus().setTextAlign('left').run()"
          :title="$t('editor.toolbar.alignLeft')"
          :aria-label="$t('editor.toolbar.alignLeft')"
        />
        <UButton
          icon="i-heroicons-bars-3"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive({
              textAlign: 'center',
            }),
          }"
          @click="editor.chain().focus().setTextAlign('center').run()"
          :title="$t('editor.toolbar.alignCenter')"
          :aria-label="$t('editor.toolbar.alignCenter')"
        />
        <UButton
          icon="i-heroicons-bars-3-bottom-right"
          size="xs"
          variant="ghost"
          color="neutral"
          :class="{
            'bg-gray-200 dark:bg-gray-600': editor.isActive({
              textAlign: 'right',
            }),
          }"
          @click="editor.chain().focus().setTextAlign('right').run()"
          :title="$t('editor.toolbar.alignRight')"
          :aria-label="$t('editor.toolbar.alignRight')"
        />
      </div>

      <div
        class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"
        aria-hidden="true"
      ></div>

      <div
        class="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"
        aria-hidden="true"
      ></div>

      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-arrow-uturn-left"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          :title="$t('editor.toolbar.undo')"
          :aria-label="$t('editor.toolbar.undo')"
        />
        <UButton
          icon="i-heroicons-arrow-uturn-right"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          :title="$t('editor.toolbar.redo')"
          :aria-label="$t('editor.toolbar.redo')"
        />
      </div>
      <div class="ml-auto flex items-center gap-1">
        <UButton
          icon="i-heroicons-document-duplicate"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="copyContent"
          :disabled="!editor?.getText().trim()"
          :title="$t('editor.toolbar.copyContent')"
          :aria-label="$t('editor.toolbar.copyContent')"
        />
        <UButton
          icon="i-heroicons-arrow-down-tray"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="downloadContent"
          :disabled="!editor?.getText().trim()"
          :title="$t('editor.toolbar.exportHtml')"
          :aria-label="$t('editor.toolbar.exportHtml')"
        />
      </div>
    </div>
    <div class="flex-1 relative min-h-0">
      <EditorContent
        :editor="editor"
        :class="[
          'h-full overflow-y-auto p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm',
          readonly ? 'cursor-default' : 'cursor-text',
        ]"
      />
    </div>

    <div
      v-if="!readonly"
      class="mt-3 flex flex-row items-center justify-between gap-2 text-xs text-gray-500"
    >
      <div class="flex items-center gap-4 text-gray-700 dark:text-gray-200">
        <span v-if="editor">
          {{ editor.storage.characterCount.characters() }}
          {{ $t("editor.stats.characters") }}
        </span>
        <span v-if="editor">
          {{ editor.storage.characterCount.words() }}
          {{ $t("editor.stats.words") }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="lastSaved"
          class="flex items-center gap-1 text-gray-700 dark:text-gray-200"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="w-3 h-3 text-green-600"
            aria-hidden="true"
          />
          <span>{{ lastSavedText }}</span>
        </div>
        <div
          v-else-if="editor?.getText().trim()"
          class="flex items-center gap-1 text-gray-700 dark:text-gray-200"
        >
          <UIcon
            name="i-heroicons-clock"
            class="w-3 h-3 text-gray-700 dark:text-gray-200"
            aria-hidden="true"
          />
          <span>{{ $t("editor.status.saving") }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const toast = useToast();
const { t } = useI18n();

const editor = ref<Editor>();
const lastSaved = ref<Date | null>(null);
const saveTimeout = ref<NodeJS.Timeout>();

const lastSavedText = computed(() => {
  if (!lastSaved.value) return t("editor.status.notSaved");
  const now = new Date();
  const diff = now.getTime() - lastSaved.value.getTime();
  if (diff < 30000) return t("editor.status.saved");
  if (diff < 60000) return t("editor.status.savedJustNow");
  if (diff < 3600000)
    return t("editor.status.savedMinutesAgo", {
      minutes: Math.floor(diff / 60000),
    });
  return t("editor.status.savedAt", {
    time: lastSaved.value.toLocaleTimeString(),
  });
});

// Methods
const debouncedSave = () => {
  if (props.readonly) return;
  if (saveTimeout.value) clearTimeout(saveTimeout.value);
  lastSaved.value = null;
  saveTimeout.value = setTimeout(() => {
    if (editor.value) {
      emit("update:modelValue", editor.value.getHTML());
      lastSaved.value = new Date();
    }
  }, 1000);
};

const copyContent = async () => {
  if (editor.value) {
    try {
      const html = editor.value.getHTML();
      const text = editor.value.getText();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.add({
        title: t("editor.toast.copied.title"),
        description: t("editor.toast.copied.description"),
        color: "success",
        icon: "i-heroicons-clipboard-document-check",
      });
    } catch (err) {
      console.error("Failed to copy content:", err);
      toast.add({
        title: t("editor.toast.error.title"),
        description: t("editor.toast.error.copyFailed"),
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    }
  }
};

const downloadContent = () => {
  if (editor.value) {
    const html = editor.value.getHTML();
    const title = "Content";
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${new Date().toLocaleDateString()}</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333;
        }
        h1 { font-size: 2.25rem; font-weight: 700; margin: 2rem 0 1rem 0; }
        h2 { font-size: 1.875rem; font-weight: 600; margin: 1.75rem 0 0.75rem 0; }
        h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.5rem 0; }
        ul, ol { padding-left: 2rem; margin: 1rem 0; }
        li { margin: 0.25rem 0; }
        p { margin: 1rem 0; }
        mark { background-color: #fef3c7; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.add({
      title: t("editor.toast.downloaded.title"),
      description: t("editor.toast.downloaded.description"),
      color: "success",
      icon: "i-heroicons-arrow-down-tray",
    });
  }
};

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      CharacterCount.configure({
        limit: null,
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content: props.modelValue || `<p>${t("editor.placeholder")}</p>`,
    editable: !props.readonly,
    onUpdate: ({ editor }) => {
      if (!props.readonly) {
        debouncedSave();
      }
    },
    onCreate: ({ editor }) => {
      if (
        !props.readonly &&
        (!props.modelValue || props.modelValue.trim() === "")
      ) {
        editor.commands.focus();
      }
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] focus:outline-none prose prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-inherit prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6 prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5 prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4",
        spellcheck: "true",
      },
    },
  });
});

onBeforeUnmount(() => {
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }
  editor.value?.destroy();
});

watch(
  () => props.readonly,
  (newReadonly) => {
    if (editor.value) {
      editor.value.setEditable(!newReadonly);
    }
  },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue);
    }
  },
);
</script>

<style scoped>
:deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
  padding: 0.5rem;
}

:deep(.ProseMirror h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 1.5rem 0 1rem 0;
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem 0;
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  line-height: 1.4;
}

:deep(.ProseMirror p) {
  line-height: 1.2;
}

:deep(.ProseMirror ul) {
  padding-left: 1.5rem;
  margin: 1rem 0;
  list-style-type: disc;
}

:deep(.ProseMirror ol) {
  padding-left: 1rem;
  margin: 1rem 0;
  list-style-type: decimal;
}

:deep(.ProseMirror li) {
  margin: 0.25rem 0;
}

:deep(.ProseMirror mark) {
  background-color: #fef5e7;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

@media (max-width: 640px) {
  :deep(.ProseMirror) {
    padding: 0.75rem;
    min-height: 150px;
  }

  :deep(.ProseMirror h1) {
    font-size: 1.5rem;
    margin: 1rem 0 0.75rem 0;
  }

  :deep(.ProseMirror h2) {
    font-size: 1.25rem;
    margin: 0.875rem 0 0.5rem 0;
  }

  :deep(.ProseMirror h3) {
    font-size: 1.125rem;
    margin: 0.75rem 0 0.5rem 0;
  }
}
</style>
