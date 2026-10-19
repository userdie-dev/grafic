import { readonly, ref } from 'vue'

export type ConnectionState = 'connecting' | 'online' | 'offline'

const state = ref<ConnectionState>('connecting')

/** Backend connection state, driven by the live events stream (see useScheduleSync). */
export const setConnection = (s: ConnectionState) => (state.value = s)

export const useConnection = () => readonly(state)
