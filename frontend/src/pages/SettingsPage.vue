<template>
  <div class="space-y-5">
    <section>
      <h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Оформление
      </h2>
      <div class="divide-y divide-border/60 overflow-hidden rounded-3xl bg-card p-1.5 shadow-sm">
        <button
          v-for="o in options"
          :key="o.value"
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted"
          @click="setTheme(o.value)"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="o.tint"
          >
            <component :is="o.icon" class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold leading-tight">{{ o.label }}</span>
            <span class="block text-xs text-muted-foreground">{{ o.hint }}</span>
          </span>
          <span
            class="flex size-6 items-center justify-center rounded-full border-2 transition-colors"
            :class="
              theme === o.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30'
            "
          >
            <Check v-if="theme === o.value" class="size-3.5" :stroke-width="3" />
          </span>
        </button>
      </div>
    </section>

    <section>
      <h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Уведомления
      </h2>
      <div class="overflow-hidden rounded-3xl bg-card p-1.5 shadow-sm">
        <button
          type="button"
          role="switch"
          :aria-checked="store.state.notifyCommonOff"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted"
          @click="toggleNotify"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
            <Bell class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold leading-tight">Общий выходной</span>
            <span class="block text-xs text-muted-foreground">
              {{ notifyHint || 'Напомнить вечером накануне дня, когда выходной у вас и у всех друзей' }}
            </span>
          </span>
          <span
            class="flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors"
            :class="store.state.notifyCommonOff ? 'bg-primary' : 'bg-muted-foreground/30'"
          >
            <span
              class="size-5 rounded-full bg-white shadow transition-transform"
              :class="store.state.notifyCommonOff ? 'translate-x-4' : ''"
            />
          </span>
        </button>
      </div>
    </section>

    <section>
      <h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        О приложении
      </h2>
      <div class="divide-y divide-border/60 overflow-hidden rounded-3xl bg-card p-1.5 shadow-sm">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted"
          @click="infoOpen = true"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-200 text-sky-800">
            <Wifi class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold leading-tight">Интернет и данные</span>
            <span class="block text-xs text-muted-foreground">{{ label }}</span>
          </span>
          <ChevronRight class="size-5 text-muted-foreground" />
        </button>
        <div class="flex items-center gap-3 rounded-2xl px-3 py-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <Info class="size-5" />
          </span>
          <span class="flex-1 text-[15px] font-semibold">Версия приложения</span>
          <span class="text-sm text-muted-foreground">{{ version }}</span>
        </div>
      </div>
    </section>

    <Drawer :open="infoOpen" @update:open="(v: boolean) => (infoOpen = v)">
      <DrawerContent class="h-auto max-h-[80dvh] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DrawerTitle class="px-1 pb-3 pt-2 text-lg">Интернет и данные</DrawerTitle>
        <DrawerDescription class="sr-only">Зачем приложению нужен интернет и какие данные оно хранит</DrawerDescription>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1 text-sm text-muted-foreground">
          <div>
            <p class="mb-1 text-[15px] font-semibold text-foreground">Зачем нужен интернет</p>
            <p>
              Чтобы вы и ваши друзья видели актуальные графики друг друга. Когда кто-то меняет
              смену, у остальных она обновляется сама. Без интернета приложение работает, но
              показывает последний сохранённый график — он может устареть.
            </p>
          </div>
          <div>
            <p class="mb-1 text-[15px] font-semibold text-foreground">Что мы храним</p>
            <p>
              Только ваши смены (дата, время и заметка) и список друзей, на которых вы подписаны.
              Ни имени, ни телефона, ни почты мы не спрашиваем — регистрация не нужна.
            </p>
          </div>
          <div>
            <p class="mb-1 text-[15px] font-semibold text-foreground">Что остаётся на телефоне</p>
            <p>
              Последний загруженный график, ваши шаблоны смен, имена друзей (их видите только
              вы) и тема оформления. Это помогает открывать приложение без ожидания.
            </p>
          </div>
          <div>
            <p class="mb-1 text-[15px] font-semibold text-foreground">Обновления</p>
            <p>При запуске приложение проверяет, вышла ли новая версия, и обновляется само.</p>
          </div>
          <p class="rounded-2xl bg-secondary p-3 text-foreground">Сейчас: {{ label }}</p>
        </div>
      </DrawerContent>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { Bell, Check, ChevronRight, Info, Moon, Smartphone, Sun, Wifi } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useConnection } from '@/composables/useConnection'
import { notificationsSupported, requestNotifyPermission } from '@/composables/useCommonOffNotify'
import { useTheme, type Theme } from '@/composables/useTheme'
import { useScheduleStore } from '@/stores/schedule'

const version = __APP_VERSION__
const { theme, setTheme } = useTheme()

const store = useScheduleStore()
const notifyHint = ref('')
async function toggleNotify() {
  notifyHint.value = ''
  if (store.state.notifyCommonOff) {
    store.state.notifyCommonOff = false
    return
  }
  if (!notificationsSupported()) {
    notifyHint.value = 'Уведомления работают только в приложении на телефоне'
    return
  }
  if (await requestNotifyPermission()) store.state.notifyCommonOff = true
  else notifyHint.value = 'Разрешите уведомления для приложения в настройках телефона'
}

const infoOpen = ref(false)
const connection = useConnection()
const label = computed(
  () => ({ online: 'Есть связь с сервером', connecting: 'Подключение…', offline: 'Нет связи — график может быть неактуальным' })[connection.value],
)

const options = [
  { value: 'light', label: 'Светлая', hint: 'Всегда светлое оформление', icon: Sun, tint: 'bg-amber-200 text-amber-800' },
  { value: 'dark', label: 'Тёмная', hint: 'Всегда тёмное оформление', icon: Moon, tint: 'bg-indigo-200 text-indigo-800' },
  { value: 'system', label: 'Системная', hint: 'Как в настройках телефона', icon: Smartphone, tint: 'bg-emerald-200 text-emerald-800' },
] as { value: Theme; label: string; hint: string; icon: unknown; tint: string }[]
</script>
