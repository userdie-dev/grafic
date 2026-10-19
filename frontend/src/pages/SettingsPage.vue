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
        Сервер и данные
      </h2>
      <div class="space-y-3 overflow-hidden rounded-3xl bg-card p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <ConnectionDot />
          <span class="flex-1 text-[15px] font-semibold">{{ label }}</span>
        </div>
        <div class="space-y-3 text-sm text-muted-foreground">
          <div>
            <p class="font-medium text-foreground">Как используется сеть</p>
            <p>
              Приложение хранит ваши смены на сервере, чтобы друзья могли видеть график по коду.
              Запросы идут к серверу графика: загрузка и сохранение смен, подписки на друзей.
              Постоянное соединение (SSE) нужно, чтобы чужие изменения появлялись сразу.
              Раз в запуск приложение также обращается к GitHub, проверяя наличие обновления.
            </p>
          </div>
          <div>
            <p class="font-medium text-foreground">Что хранится на сервере</p>
            <p>
              Анонимный идентификатор устройства, ваш код для друзей, смены (дата, время,
              заметка) и список подписок. Имени, телефона и почты нет — регистрация не нужна.
            </p>
          </div>
          <div>
            <p class="font-medium text-foreground">Что хранится на телефоне</p>
            <p>
              Токен устройства, выбранный месяц, имена друзей (их знаете только вы), скрытые
              в календаре люди, шаблоны смен и тема оформления.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        О приложении
      </h2>
      <div class="overflow-hidden rounded-3xl bg-card p-1.5 shadow-sm">
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
  </div>
</template>

<script setup lang="ts">
import { Check, Info, Moon, Smartphone, Sun } from '@lucide/vue'
import { computed } from 'vue'
import ConnectionDot from '@/components/ConnectionDot.vue'
import { useConnection } from '@/composables/useConnection'
import { useTheme, type Theme } from '@/composables/useTheme'

const version = __APP_VERSION__
const { theme, setTheme } = useTheme()

const connection = useConnection()
const label = computed(
  () => ({ online: 'Подключено к серверу', connecting: 'Подключение…', offline: 'Нет связи с сервером' })[connection.value],
)

const options = [
  { value: 'light', label: 'Светлая', hint: 'Всегда светлое оформление', icon: Sun, tint: 'bg-amber-200 text-amber-800' },
  { value: 'dark', label: 'Тёмная', hint: 'Всегда тёмное оформление', icon: Moon, tint: 'bg-indigo-200 text-indigo-800' },
  { value: 'system', label: 'Системная', hint: 'Как в настройках телефона', icon: Smartphone, tint: 'bg-emerald-200 text-emerald-800' },
] as { value: Theme; label: string; hint: string; icon: unknown; tint: string }[]
</script>
