import { computed, inject, provide, ref, type InjectionKey } from 'vue'
import { useSchedule } from '@/composables/useSchedule'

/** State and actions of the friend editor drawer, shared between the page and the drawer. */
function createFriendEditor() {
  const s = useSchedule()
  const friendId = ref<string | null>(null)

  const friend = computed(() => s.people.find((p) => p.id === friendId.value))
  const hidden = computed(() => !!friend.value && s.hidden.includes(friend.value.id))
  // demo friends have no subscription to drop
  const removable = computed(() => !!friend.value?.subId)

  return {
    friend,
    hidden,
    removable,
    open: (id: string) => (friendId.value = id),
    close: () => (friendId.value = null),
    save(name: string, color: string) {
      if (!friend.value) return
      s.rename(friend.value.id, name)
      s.setColor(friend.value.id, color)
    },
    toggle: () => friend.value && s.toggle(friend.value.id),
    remove: () => friend.value && s.removeFriend(friend.value.subId),
  }
}

export type FriendEditor = ReturnType<typeof createFriendEditor>
export const FRIEND_EDITOR_KEY: InjectionKey<FriendEditor> = Symbol('friendEditor')

export function provideFriendEditor() {
  const editor = createFriendEditor()
  provide(FRIEND_EDITOR_KEY, editor)
  return editor
}

export function useFriendEditor() {
  const editor = inject(FRIEND_EDITOR_KEY)
  if (!editor) throw new Error('useFriendEditor() needs provideFriendEditor() in an ancestor')
  return editor
}
