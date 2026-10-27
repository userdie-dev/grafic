<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      class="fixed inset-0 z-50 flex flex-col bg-background pb-[max(1rem,env(safe-area-inset-bottom))] pt-[calc(1rem+max(env(safe-area-inset-top),var(--safe-area-inset-top,0px)))]"
    >
      <div class="flex justify-end px-4">
        <Button variant="ghost" size="sm" @click="finish">Пропустить</Button>
      </div>

      <div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6">
        <img :src="slide.image" alt="" class="w-full rounded-3xl" />
        <div class="space-y-2 text-center">
          <h2 id="onboarding-title" class="text-xl font-bold">{{ slide.title }}</h2>
          <p class="text-sm text-muted-foreground">{{ slide.text }}</p>
        </div>
      </div>

      <div class="mx-auto w-full max-w-md space-y-4 px-6 pt-4">
        <div class="flex justify-center gap-2" aria-hidden="true">
          <span v-for="(_, i) in SLIDES" :key="i" class="h-2 rounded-full transition-all" :class="i === index ? 'w-6 bg-primary' : 'w-2 bg-muted'" />
        </div>
        <div class="flex gap-3">
          <Button v-if="index > 0" variant="outline" size="lg" class="h-11 flex-1" @click="index--">Назад</Button>
          <Button size="lg" class="h-11 flex-1" @click="next">{{ last ? 'Начать' : 'Далее' }}</Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/composables/useOnboarding'
import calendar from '@/assets/onboarding/calendar.svg'
import shift from '@/assets/onboarding/shift.svg'
import share from '@/assets/onboarding/share.svg'
import friends from '@/assets/onboarding/friends.svg'

const SLIDES = [
  { image: calendar, title: 'Ваш график', text: 'Нажмите на день в календаре, чтобы добавить или изменить смену. Дни со сменами подсвечиваются.' },
  { image: shift, title: 'Выберите смену', text: 'Возьмите готовый шаблон — день или ночь — или задайте своё время. Шаблоны можно создавать самим.' },
  { image: share, title: 'Поделитесь кодом', text: 'На вкладке «Поделиться» лежит ваш код. Отправьте его другу, чтобы он видел ваш график.' },
  { image: friends, title: 'Добавьте друзей', text: 'Введите код друга и имя — его смены появятся в вашем календаре, а общие выходные подсветятся зелёным.' },
]

const { open, finish } = useOnboarding()
const index = ref(0)
const slide = computed(() => SLIDES[index.value]!)
const last = computed(() => index.value === SLIDES.length - 1)
const next = () => (last.value ? finish() : index.value++)

// a replay from settings always starts from the first slide
watch(open, (v) => v && (index.value = 0))
</script>
