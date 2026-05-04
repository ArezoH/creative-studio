<template>
  <WidgetsBaseWidget
    :widget="widget"
    :selected="selected"
    @remove="$emit('remove')"
    @delete="$emit('delete')"
  >
    <div class="p-3 h-full flex flex-col overflow-hidden">
      <!-- Header (fixed) -->
      <div class="flex items-center justify-between mb-3 shrink-0">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-chevron-left"
            size="xs"
            variant="ghost"
            :aria-label="$t('calendar.previousMonth')"
            @click="previousMonth"
          />
          <h3 class="text-sm font-medium">
            {{ currentMonthName }} {{ currentYear }}
          </h3>
          <UButton
            icon="i-heroicons-chevron-right"
            size="xs"
            variant="ghost"
            :aria-label="$t('calendar.nextMonth')"
            @click="nextMonth"
          />
        </div>
        <div class="flex items-center gap-1">
          <UButton
            :icon="
              isSyncing ? 'i-heroicons-arrow-path' : 'i-simple-icons-google'
            "
            size="xs"
            :variant="isGoogleSynced ? 'soft' : 'ghost'"
            :color="isGoogleSynced ? 'success' : 'neutral'"
            :loading="isSyncing"
            :aria-label="
              isGoogleSynced
                ? `${$t('calendar.google.synced')} ${lastSyncText}`
                : $t('calendar.google.syncButton')
            "
            @click="syncGoogleCalendar"
          >
            <span v-if="!isSyncing" class="hidden sm:inline text-xs">
              {{
                isGoogleSynced
                  ? $t("calendar.google.synced")
                  : $t("calendar.google.sync")
              }}
            </span>
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            size="xs"
            variant="ghost"
            :aria-label="$t('calendar.addEvent')"
            @click="showEventForm = !showEventForm"
          />
        </div>
      </div>

      <!-- Sync Error (fixed) -->
      <div
        v-if="syncError"
        class="mb-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center gap-2 shrink-0"
        role="alert"
      >
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"
          aria-hidden="true"
        />
        <span class="text-xs text-red-700 dark:text-red-300 flex-1">{{
          syncError
        }}</span>
        <UButton
          size="xs"
          variant="ghost"
          :aria-label="$t('calendar.dismissError')"
          @click="syncError = ''"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" aria-hidden="true" />
        </UButton>
      </div>
      <div
        v-if="showEventForm"
        class="mb-3 p-3 bg-purple-50 dark:bg-purple-900/40 rounded-lg shrink-0"
      >
        <div class="space-y-2">
          <UInput
            v-model="newEvent.title"
            :placeholder="$t('calendar.eventTitlePlaceholder')"
            size="sm"
            :aria-label="$t('calendar.eventTitle')"
          />
          <UInput
            v-model="newEvent.date"
            type="date"
            size="sm"
            :aria-label="$t('calendar.eventDate')"
          />
          <div class="flex gap-2">
            <UButton
              size="xs"
              @click="addEvent"
              :disabled="!newEvent.title || !newEvent.date"
            >
              {{ $t("calendar.add") }}
            </UButton>
            <UButton size="xs" variant="ghost" @click="cancelEvent">
              {{ $t("calendar.cancel") }}
            </UButton>
          </div>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto mb-2">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <!-- MY EVENTS (Local) -->
          <div class="mb-2">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"
                  aria-hidden="true"
                ></span>
                <h4
                  class="text-xs font-semibold text-purple-800 dark:text-purple-200"
                >
                  {{ $t("calendar.myEvents") }}
                </h4>
                <span
                  v-if="activeLocalEvents.length > 0"
                  class="text-xs text-gray-600 dark:text-gray-400"
                >
                  ({{ activeLocalEvents.length }})
                </span>
              </div>
              <UButton
                v-if="completedEvents.length > 0"
                size="xs"
                variant="ghost"
                @click="showCompleted = !showCompleted"
              >
                {{ showCompleted ? $t("calendar.hide") : $t("calendar.show") }}
                {{ $t("calendar.completed") }} ({{ completedEvents.length }})
              </UButton>
            </div>

            <div class="space-y-1">
              <div
                v-for="preview in localDueDatePreviews"
                :key="preview.id"
                :class="[
                  'text-xs p-2 rounded transition-all group',
                  urgencyClass(preview.urgency),
                ]"
              >
                <!-- Edit Mode -->
                <div v-if="editingEvent === preview.id" class="space-y-2">
                  <UInput
                    v-model="editEventData.title"
                    :placeholder="$t('calendar.eventTitlePlaceholder')"
                    size="sm"
                    :aria-label="$t('calendar.eventTitle')"
                  />
                  <UInput
                    v-model="editEventData.date"
                    type="date"
                    size="sm"
                    :aria-label="$t('calendar.eventDate')"
                  />
                  <div class="flex gap-1">
                    <UButton
                      size="xs"
                      @click="saveEventEdit"
                      :disabled="!editEventData.title || !editEventData.date"
                    >
                      {{ $t("calendar.save") }}
                    </UButton>
                    <UButton size="xs" variant="ghost" @click="cancelEventEdit">
                      {{ $t("calendar.cancel") }}
                    </UButton>
                  </div>
                </div>

                <!-- Display Mode -->
                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 flex-1 min-w-0">
                    <span
                      class="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full shrink-0"
                      aria-hidden="true"
                    ></span>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">
                        {{ preview.title }}
                      </div>
                      <div class="text-xs opacity-80">
                        {{ preview.dateText }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                  >
                    <UButton
                      icon="i-heroicons-check"
                      size="xs"
                      variant="ghost"
                      color="success"
                      @click="markEventComplete(preview.id)"
                      :aria-label="$t('calendar.markAsCompleted')"
                    />
                    <UButton
                      icon="i-heroicons-pencil"
                      size="xs"
                      variant="ghost"
                      @click="startEditEvent(preview)"
                      :aria-label="$t('calendar.editEvent')"
                    />
                    <UButton
                      icon="i-heroicons-trash"
                      size="xs"
                      variant="ghost"
                      color="error"
                      @click="deleteEvent(preview.id)"
                      :aria-label="$t('calendar.deleteEvent')"
                    />
                  </div>
                  <UIcon
                    :name="
                      preview.urgency === 'overdue'
                        ? 'i-heroicons-exclamation-triangle'
                        : preview.urgency === 'today'
                          ? 'i-heroicons-clock'
                          : 'i-heroicons-calendar-days'
                    "
                    class="w-3 h-3 ml-1 shrink-0"
                    :aria-label="$t(`calendar.urgency.${preview.urgency}`)"
                    role="img"
                  />
                </div>
              </div>

              <div
                v-if="activeLocalEvents.length === 0"
                class="text-xs text-purple-700 dark:text-purple-300 text-center py-1"
              >
                {{ $t("calendar.noLocalEvents") }}
              </div>
            </div>

            <!-- Completed Events -->
            <div
              v-if="showCompleted && completedEvents.length > 0"
              class="border-t border-purple-300 dark:border-purple-700 pt-2 mt-2"
            >
              <div
                class="text-xs text-gray-700 dark:text-gray-300 mb-1 font-medium"
              >
                {{ $t("calendar.completedEvents") }}
              </div>
              <div class="space-y-1">
                <div
                  v-for="evt in completedEvents"
                  :key="evt.id"
                  class="text-xs p-2 rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 flex-1 min-w-0">
                      <UIcon
                        name="i-heroicons-check-circle"
                        class="w-3 h-3 text-green-600 dark:text-green-400 shrink-0"
                        aria-hidden="true"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium line-through truncate">
                          {{ evt.title }}
                        </div>
                        <div class="text-xs opacity-80">
                          {{ $t("calendar.completedOn") }}
                          {{ formatCompletedDate(evt.completedAt) }}
                        </div>
                      </div>
                    </div>
                    <div
                      class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                    >
                      <UButton
                        icon="i-heroicons-arrow-uturn-left"
                        size="xs"
                        variant="ghost"
                        @click="restoreEvent(evt.id)"
                        :aria-label="$t('calendar.restoreEvent')"
                      />
                      <UButton
                        icon="i-heroicons-trash"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="deleteEvent(evt.id, true)"
                        :aria-label="$t('calendar.deletePermanently')"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="googleEvents.length > 0">
            <div class="border-t border-blue-300 dark:border-blue-700 pt-2">
              <div class="flex items-center gap-1.5 mb-2">
                <UIcon
                  name="i-simple-icons-google"
                  class="w-3 h-3 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <h4
                  class="text-xs font-semibold text-blue-800 dark:text-blue-200"
                >
                  {{ $t("calendar.google.title") }}
                </h4>
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  ({{ googleEvents.length }})
                </span>
              </div>

              <div class="space-y-1">
                <div
                  v-for="preview in googleDueDatePreviews"
                  :key="preview.id"
                  :class="[
                    'text-xs p-2 rounded transition-all group',
                    urgencyClass(preview.urgency),
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 flex-1 min-w-0">
                      <UIcon
                        name="i-simple-icons-google"
                        class="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0"
                        aria-hidden="true"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium truncate">
                          {{ preview.title }}
                        </div>
                        <div class="text-xs opacity-80">
                          {{ preview.dateText }}
                          <span v-if="preview.startTime" class="ml-1">
                            · {{ formatTime(preview.startTime) }}
                          </span>
                          <span v-if="preview.location" class="ml-1">
                            · {{ preview.location }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      v-if="preview.htmlLink"
                      :href="preview.htmlLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 ml-1 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      :aria-label="$t('calendar.google.openInGoogle')"
                    >
                      <UIcon
                        name="i-heroicons-arrow-top-right-on-square"
                        class="w-3 h-3"
                        aria-hidden="true"
                      />
                    </a>
                    <UIcon
                      :name="
                        preview.urgency === 'overdue'
                          ? 'i-heroicons-exclamation-triangle'
                          : preview.urgency === 'today'
                            ? 'i-heroicons-clock'
                            : 'i-heroicons-calendar-days'
                      "
                      class="w-3 h-3 ml-1 shrink-0"
                      :aria-label="$t(`calendar.urgency.${preview.urgency}`)"
                      role="img"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="
              activeLocalEvents.length === 0 &&
              googleEvents.length === 0 &&
              completedEvents.length === 0
            "
            class="text-xs text-purple-700 dark:text-purple-300 text-center py-2"
          >
            {{ $t("calendar.noEvents") }}
          </div>
        </div>
      </div>

      <!-- FIXED BOTTOM: Calendar Grid + Legend + Sync -->
      <div class="shrink-0 pb-1">
        <!-- Calendar Grid with proper ARIA structure -->
        <table
          role="grid"
          :aria-label="$t('calendar.calendarGrid')"
          class="w-full border-collapse"
        >
          <!-- Day headers -->
          <thead>
            <tr role="row">
              <th
                v-for="day in daysOfWeek"
                :key="day"
                role="columnheader"
                scope="col"
                class="text-[10px] font-semibold text-purple-800 dark:text-purple-200 text-center py-0.5"
              >
                {{ day }}
              </th>
            </tr>
          </thead>
          <!-- Date cells grouped into weeks -->
          <tbody>
            <tr
              v-for="(week, weekIndex) in calendarWeeks"
              :key="weekIndex"
              role="row"
            >
              <td
                v-for="date in week"
                :key="`${date.month}-${date.day}`"
                role="gridcell"
                :aria-selected="date.isToday ? true : undefined"
                class="p-0"
              >
                <button
                  type="button"
                  :class="[
                    'w-full relative text-[11px] py-0.5 rounded transition-colors text-center leading-tight',
                    date.isCurrentMonth
                      ? 'hover:bg-purple-100 dark:hover:bg-purple-800 text-gray-900 dark:text-gray-100 cursor-pointer'
                      : 'text-gray-500 dark:text-gray-500 cursor-default',
                    date.isToday
                      ? 'bg-blue-200 dark:bg-blue-800 font-bold text-blue-900 dark:text-blue-100'
                      : '',
                    date.hasEvents ? 'font-semibold' : '',
                  ]"
                  :aria-label="formatDateAriaLabel(date)"
                  :aria-current="date.isToday ? 'date' : undefined"
                  :tabindex="date.isCurrentMonth ? 0 : -1"
                  :disabled="!date.isCurrentMonth"
                  @click="date.isCurrentMonth && selectDate(date)"
                >
                  {{ date.day }}
                  <span
                    v-if="date.hasLocalEvent || date.hasGoogleEvent"
                    class="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-px"
                    aria-hidden="true"
                  >
                    <span
                      v-if="date.hasLocalEvent"
                      class="w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full"
                    ></span>
                    <span
                      v-if="date.hasGoogleEvent"
                      class="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    ></span>
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Footer: Legend + Sync status -->
        <div
          class="flex items-center justify-between mt-2 pt-2 border-t border-gray-300 dark:border-gray-600"
        >
          <div v-if="googleEvents.length > 0" class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <span
                class="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"
                aria-hidden="true"
              ></span>
              <span
                class="text-[10px] text-gray-700 dark:text-gray-300 font-medium"
              >
                {{ $t("calendar.legend.local") }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <span
                class="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                aria-hidden="true"
              ></span>
              <span
                class="text-[10px] text-gray-700 dark:text-gray-300 font-medium"
              >
                {{ $t("calendar.legend.google") }}
              </span>
            </div>
          </div>
          <div v-else></div>
          <span
            v-if="lastSyncTime"
            class="text-[10px] text-gray-600 dark:text-gray-400"
          >
            {{ $t("calendar.google.syncedLabel") }} {{ lastSyncText }}
          </span>
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
  mobile?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  completed?: boolean;
  completedAt?: number;
  source?: "local" | "google";
  startTime?: string | null;
  endTime?: string | null;
  isAllDay?: boolean;
  location?: string;
  htmlLink?: string;
  description?: string;
}

interface CalendarDate {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  hasLocalEvent: boolean;
  hasGoogleEvent: boolean;
  fullDate: string;
}

interface DueDatePreview {
  id: string;
  title: string;
  date: string;
  dateText: string;
  urgency: "overdue" | "today" | "tomorrow" | "upcoming";
  isGoogle: boolean;
  startTime?: string | null;
  location?: string;
  htmlLink?: string;
}

const props = withDefaults(defineProps<Props>(), { mobile: false });
defineEmits<{ remove: []; delete: [] }>();

const dashboardStore = useDashboardStore();
const toast = useToast();
const { t, locale } = useI18n();

// State
const currentDate = ref(new Date());
const events = ref<CalendarEvent[]>([]);
const googleEvents = ref<CalendarEvent[]>([]);
const showEventForm = ref(false);
const showCompleted = ref(false);
const editingEvent = ref<string | null>(null);
const isSyncing = ref(false);
const syncError = ref("");
const lastSyncTime = ref<Date | null>(null);

const newEvent = ref({ title: "", date: "" });
const editEventData = ref({ title: "", date: "" });

// --- Computed ---
const activeLocalEvents = computed(() =>
  events.value.filter((e) => !e.completed),
);
const completedEvents = computed(() => events.value.filter((e) => e.completed));
const isGoogleSynced = computed(
  () => googleEvents.value.length > 0 || lastSyncTime.value !== null,
);

const lastSyncText = computed(() => {
  if (!lastSyncTime.value) return "";
  const diff = Date.now() - lastSyncTime.value.getTime();
  if (diff < 60000) return t("calendar.google.justNow");
  if (diff < 3600000)
    return `${Math.floor(diff / 60000)}${t("calendar.google.mAgo")}`;
  return lastSyncTime.value.toLocaleTimeString();
});

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());
const currentMonthName = computed(() =>
  currentDate.value.toLocaleDateString(locale.value, { month: "long" }),
);

const daysOfWeek = computed(() => [
  t("calendar.days.su"),
  t("calendar.days.mo"),
  t("calendar.days.tu"),
  t("calendar.days.we"),
  t("calendar.days.th"),
  t("calendar.days.fr"),
  t("calendar.days.sa"),
]);

// WCAG AA compliant color classes
const urgencyClass = (urgency: string) => {
  switch (urgency) {
    case "overdue":
      return "bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100";
    case "today":
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100";
    case "tomorrow":
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-100";
    default:
      return "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100";
  }
};

const buildPreviews = (
  eventList: CalendarEvent[],
  isGoogle: boolean,
): DueDatePreview[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return eventList
    .map((event) => {
      const eventDate = new Date(event.date);
      const timeDiff = eventDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let urgency: DueDatePreview["urgency"] = "upcoming";
      let dateText = "";

      if (daysDiff < 0) {
        urgency = "overdue";
        dateText = t("calendar.daysOverdue", { days: Math.abs(daysDiff) });
      } else if (event.date === todayStr) {
        urgency = "today";
        dateText = t("calendar.today");
      } else if (event.date === tomorrowStr) {
        urgency = "tomorrow";
        dateText = t("calendar.tomorrow");
      } else if (daysDiff <= 7) {
        dateText = t("calendar.inDays", { days: daysDiff });
      } else {
        dateText = eventDate.toLocaleDateString(locale.value, {
          month: "short",
          day: "numeric",
        });
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        dateText,
        urgency,
        isGoogle,
        startTime: event.startTime,
        location: event.location,
        htmlLink: event.htmlLink,
      };
    })
    .filter((p) => {
      const daysDiff = Math.ceil(
        (new Date(p.date).getTime() - today.getTime()) / (1000 * 3600 * 24),
      );
      return daysDiff <= 30;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const localDueDatePreviews = computed(() =>
  buildPreviews(activeLocalEvents.value, false),
);
const googleDueDatePreviews = computed(() =>
  buildPreviews(googleEvents.value, true),
);

const calendarDates = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const dates: CalendarDate[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Use 35 cells (5 rows) if possible, else 42 (6 rows)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay();
  const totalCells = startDay + daysInMonth > 35 ? 42 : 35;

  for (let i = 0; i < totalCells; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const hasLocalEvent = activeLocalEvents.value.some(
      (e) => e.date === dateStr,
    );
    const hasGoogleEvent = googleEvents.value.some((e) => e.date === dateStr);

    dates.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateStr === todayStr,
      hasEvents: hasLocalEvent || hasGoogleEvent,
      hasLocalEvent,
      hasGoogleEvent,
      fullDate: dateStr,
    });
  }
  return dates;
});

// Group calendar dates into weeks for proper grid structure
const calendarWeeks = computed(() => {
  const weeks: CalendarDate[][] = [];
  const dates = calendarDates.value;

  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return weeks;
});

// --- Helper for aria-label ---
const formatDateAriaLabel = (date: CalendarDate): string => {
  const fullDate = new Date(date.year, date.month, date.day);
  const formattedDate = fullDate.toLocaleDateString(locale.value, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (date.hasEvents) {
    return `${formattedDate}, ${t("calendar.hasEvents")}`;
  }
  return formattedDate;
};

// --- Google Calendar Sync ---
const syncGoogleCalendar = async () => {
  isSyncing.value = true;
  syncError.value = "";

  try {
    const data = await $fetch<{
      success: boolean;
      events: any[];
      syncedAt: string;
    }>("/api/google-calendar");

    googleEvents.value = data.events.map((e: any) => ({
      id: `google-${e.id}`,
      title: e.title,
      date: e.date,
      timestamp: new Date(e.date).getTime(),
      source: "google" as const,
      startTime: e.startTime,
      endTime: e.endTime,
      isAllDay: e.isAllDay,
      location: e.location,
      htmlLink: e.htmlLink,
      description: e.description,
    }));

    lastSyncTime.value = new Date();

    dashboardStore.updateWidgetContent(props.widget.widgetId, {
      data: {
        events: events.value.filter((e) => e.source !== "google"),
        showCompleted: showCompleted.value,
        googleEvents: googleEvents.value,
        lastGoogleSync: lastSyncTime.value.toISOString(),
      },
    });

    toast.add({
      title: t("calendar.google.toast.synced.title"),
      description: t("calendar.google.toast.synced.description", {
        count: data.events.length,
      }),
      color: "success",
      icon: "i-simple-icons-google",
    });
  } catch (err: any) {
    const message =
      err?.data?.statusMessage ||
      err?.message ||
      t("calendar.google.toast.failed.description");
    syncError.value = message;

    if (err?.statusCode === 404) {
      toast.add({
        title: t("calendar.google.toast.notLinked.title"),
        description: t("calendar.google.toast.notLinked.description"),
        color: "warning",
        icon: "i-heroicons-exclamation-triangle",
      });
    } else {
      toast.add({
        title: t("calendar.google.toast.failed.title"),
        description: message,
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    }
  } finally {
    isSyncing.value = false;
  }
};

const formatTime = (dateTimeStr: string) => {
  try {
    return new Date(dateTimeStr).toLocaleTimeString(locale.value, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

// --- Local Event Methods ---
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
  );
};

const addEvent = () => {
  if (newEvent.value.title && newEvent.value.date) {
    events.value.push({
      id: Date.now().toString(),
      title: newEvent.value.title,
      date: newEvent.value.date,
      timestamp: new Date(newEvent.value.date).getTime(),
      completed: false,
      source: "local",
    });
    toast.add({
      title: t("calendar.toast.eventAdded.title"),
      description: t("calendar.toast.eventAdded.description", {
        title: newEvent.value.title,
      }),
      color: "success",
      icon: "i-heroicons-plus",
    });
    newEvent.value = { title: "", date: "" };
    showEventForm.value = false;
    saveEvents();
  }
};

const cancelEvent = () => {
  newEvent.value = { title: "", date: "" };
  showEventForm.value = false;
};

const selectDate = (date: CalendarDate) => {
  if (date.isCurrentMonth) {
    newEvent.value.date = date.fullDate;
    showEventForm.value = true;
  }
};

const markEventComplete = (eventId: string) => {
  const event = events.value.find((e) => e.id === eventId);
  if (event) {
    event.completed = true;
    event.completedAt = Date.now();
    saveEvents();
    toast.add({
      title: t("calendar.toast.eventCompleted.title"),
      description: t("calendar.toast.eventCompleted.description", {
        title: event.title,
      }),
      color: "success",
      icon: "i-heroicons-check",
    });
  }
};

const restoreEvent = (eventId: string) => {
  const event = events.value.find((e) => e.id === eventId);
  if (event) {
    event.completed = false;
    delete event.completedAt;
    saveEvents();
    toast.add({
      title: t("calendar.toast.eventRestored.title"),
      description: t("calendar.toast.eventRestored.description", {
        title: event.title,
      }),
      color: "primary",
      icon: "i-heroicons-arrow-uturn-left",
    });
  }
};

const deleteEvent = (eventId: string, permanent = false) => {
  const event = events.value.find((e) => e.id === eventId);
  if (!event) return;
  if (permanent || confirm(t("calendar.confirmDelete"))) {
    events.value = events.value.filter((e) => e.id !== eventId);
    saveEvents();
    toast.add({
      title: t("calendar.toast.eventDeleted.title"),
      description: t("calendar.toast.eventDeleted.description", {
        title: event.title,
      }),
      color: "error",
      icon: "i-heroicons-trash",
    });
  }
};

const startEditEvent = (preview: DueDatePreview) => {
  if (preview.isGoogle) return;
  const event = events.value.find((e) => e.id === preview.id);
  if (event) {
    editingEvent.value = preview.id;
    editEventData.value = { title: event.title, date: event.date };
  }
};

const saveEventEdit = () => {
  const event = events.value.find((e) => e.id === editingEvent.value);
  if (event && editEventData.value.title && editEventData.value.date) {
    event.title = editEventData.value.title;
    event.date = editEventData.value.date;
    event.timestamp = new Date(editEventData.value.date).getTime();
    toast.add({
      title: t("calendar.toast.eventUpdated.title"),
      description: t("calendar.toast.eventUpdated.description", {
        title: event.title,
      }),
      color: "success",
      icon: "i-heroicons-pencil",
    });
    editingEvent.value = null;
    editEventData.value = { title: "", date: "" };
    saveEvents();
  }
};

const cancelEventEdit = () => {
  editingEvent.value = null;
  editEventData.value = { title: "", date: "" };
};

const formatCompletedDate = (timestamp?: number) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(locale.value, {
    month: "short",
    day: "numeric",
  });
};

const saveEvents = () => {
  dashboardStore.updateWidgetContent(props.widget.widgetId, {
    data: {
      events: events.value.filter((e) => e.source !== "google"),
      showCompleted: showCompleted.value,
      googleEvents: googleEvents.value,
      lastGoogleSync: lastSyncTime.value?.toISOString() || null,
    },
  });
};

// Initialize
onMounted(() => {
  const widgetData = props.widget.widget?.data;
  if (widgetData?.events) {
    events.value = widgetData.events;
  }
  if (widgetData?.showCompleted !== undefined) {
    showCompleted.value = widgetData.showCompleted;
  }
  if (widgetData?.googleEvents) {
    googleEvents.value = widgetData.googleEvents;
  }
  if (widgetData?.lastGoogleSync) {
    lastSyncTime.value = new Date(widgetData.lastGoogleSync);
  }

  if (lastSyncTime.value) {
    const timeSinceSync = Date.now() - lastSyncTime.value.getTime();
    if (timeSinceSync > 15 * 60 * 1000) {
      syncGoogleCalendar();
    }
  }
});
</script>
