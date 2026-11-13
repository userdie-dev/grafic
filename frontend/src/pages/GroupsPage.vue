<template>
  <section class="space-y-3">
    <div class="rounded-[1.75rem] bg-card px-4 pb-4 pt-4">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold">Группы</h1>
        <Button
          size="icon-lg"
          class="rounded-full"
          aria-label="Создать группу"
          @click="showCreateDialog = true"
        >
          <RiAddLine class="size-5" />
        </Button>
      </div>

      <p class="mb-4 text-sm text-muted-foreground">
        Создавайте группы и добавляйте в них друзей. Члены группы не будут отображаться отдельно в календаре.
      </p>

      <div v-if="store.state.groups.length" class="space-y-3">
        <div
          v-for="group in store.state.groups"
          :key="group.id"
          class="rounded-2xl bg-secondary p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <span
                class="size-4 shrink-0 rounded-full"
                :style="{ background: group.color }"
              />
              <h3 class="truncate font-semibold">{{ group.name }}</h3>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-medium text-muted-foreground">Участники:</p>
            <div v-if="group.memberIds.length" class="flex flex-wrap gap-2">
              <div
                v-for="memberId in group.memberIds"
                :key="memberId"
                class="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm"
              >
                <span
                  class="size-2 shrink-0 rounded-full"
                  :style="{ background: getMemberColor(memberId) }"
                />
                <span>{{ getMemberName(memberId) }}</span>
                <button
                  type="button"
                  class="ml-1 text-muted-foreground hover:text-foreground"
                  @click="store.removeGroupMember(group.id, memberId)"
                >
                  <RiCloseLine class="size-4" />
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">Нет участников</p>

            <div class="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                class="flex-1 min-w-[120px] rounded-full"
                @click="addMember(group)"
              >
                <RiAddLine class="size-4 mr-1" />
                Добавить
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="flex-1 min-w-[120px] rounded-full"
                @click="editGroup(group)"
              >
                <RiEditLine class="size-4 mr-1" />
                Изменить
              </Button>
              <Button
                size="sm"
                variant="destructive"
                class="flex-1 min-w-[120px] rounded-full"
                @click="store.removeGroup(group.id)"
              >
                <RiDeleteBinLine class="size-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        Нет групп. Создайте первую группу!
      </div>
    </div>

    <!-- Create/Edit Group Dialog -->
    <Drawer v-model:open="showCreateDialog">
      <DrawerContent>
        <DrawerTitle class="px-4 pt-4">{{ editingGroup ? 'Редактировать группу' : 'Создать группу' }}</DrawerTitle>
        <DrawerDescription class="sr-only">Форма создания группы</DrawerDescription>
        
        <form class="space-y-4 p-4" @submit.prevent="saveGroup">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Название группы</label>
            <Input v-model="groupForm.name" placeholder="Например: Работа, Семья" required />
          </div>
          
          <div class="space-y-2">
            <label class="block text-sm font-medium">Цвет</label>
            <div class="flex flex-wrap justify-center gap-3 pt-2">
              <button
                v-for="color in COLORS"
                :key="color"
                type="button"
                class="size-12 rounded-full transition-transform active:scale-90"
                :class="groupForm.color === color ? 'ring-2 ring-primary ring-offset-2' : ''"
                :style="{ background: color }"
                @click="groupForm.color = color"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <Button type="submit" size="lg" class="flex-1 rounded-full">
              {{ editingGroup ? 'Сохранить' : 'Создать' }}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              class="rounded-full"
              @click="cancelEdit"
            >
              Отмена
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>

    <!-- Add Member Dialog -->
    <Drawer v-model:open="showAddMemberDialog">
      <DrawerContent>
        <DrawerTitle class="px-4 pt-4">Добавить участника</DrawerTitle>
        <DrawerDescription class="sr-only">Выберите участника для добавления в группу</DrawerDescription>
        
        <div class="space-y-2 p-4">
          <button
            v-for="person in availablePeople"
            :key="person.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-left transition-colors active:bg-muted"
            @click="confirmAddMember(person.id)"
          >
            <span
              class="size-3 shrink-0 rounded-full"
              :style="{ background: person.color }"
            />
            <span class="font-medium">{{ person.name }}</span>
          </button>
          
          <p v-if="!availablePeople.length" class="py-4 text-center text-sm text-muted-foreground">
            Все друзья уже добавлены в эту группу
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiEditLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useScheduleStore, type Group } from '@/stores/schedule'
import { useSchedule } from '@/composables/useSchedule'
import { COLORS } from '@/composables/useSchedule'

const store = useScheduleStore()
const s = useSchedule()

const showCreateDialog = ref(false)
const showAddMemberDialog = ref(false)
const editingGroup = ref<Group | null>(null)
const selectedGroupForMember = ref<Group | null>(null)

const groupForm = ref({
  name: '',
  color: COLORS[0]!,
})

const availablePeople = computed(() => {
  if (!selectedGroupForMember.value) return []
  const group = selectedGroupForMember.value
  return s.people.filter(p => p.id !== 'me' && !group.memberIds.includes(p.id))
})

function getMemberName(id: string) {
  return s.people.find(p => p.id === id)?.name ?? 'Неизвестный'
}

function getMemberColor(id: string) {
  return s.people.find(p => p.id === id)?.color ?? '#999'
}

function editGroup(group: Group) {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    color: group.color,
  }
  showCreateDialog.value = true
}

function saveGroup() {
  if (!groupForm.value.name.trim()) return

  if (editingGroup.value) {
    store.updateGroup(editingGroup.value.id, {
      name: groupForm.value.name,
      color: groupForm.value.color,
    })
  } else {
    store.addGroup(groupForm.value.name, groupForm.value.color)
  }

  cancelEdit()
}

function cancelEdit() {
  showCreateDialog.value = false
  editingGroup.value = null
  groupForm.value = {
    name: '',
    color: COLORS[0]!,
  }
}

function addMember(group: Group) {
  selectedGroupForMember.value = group
  showAddMemberDialog.value = true
}

function confirmAddMember(memberId: string) {
  if (selectedGroupForMember.value) {
    store.addGroupMember(selectedGroupForMember.value.id, memberId)
  }
  showAddMemberDialog.value = false
  selectedGroupForMember.value = null
}
</script>
