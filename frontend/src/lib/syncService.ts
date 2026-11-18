import { Capacitor, registerPlugin } from '@capacitor/core'
import { API_URL } from '@/app/config/axios'
import type { Device, Shift, ShiftInput } from './dto'

export interface ShiftKey {
  date: string
  start: string
  serverId?: string
}

export interface ShiftChange {
  items: ShiftInput[]
  remove: ShiftKey[]
}

export interface ShiftJournal {
  overrides: Record<string, Shift | null>
  pending: ShiftChange[]
}

export interface ShiftCache {
  owner: string
  shifts: Shift[]
}

export const shiftKey = ({ date, start }: ShiftKey) => `${date}|${start}`
export const isAndroid = Capacitor.getPlatform() === 'android'
const mobile = registerPlugin<{
  open(options: { url: string; device: Device | null; legacyCache?: ShiftCache }): Promise<{
    overrides: ShiftJournal['overrides']
    cache: ShiftCache | null
  }>
  append(options: { change: ShiftChange; overrides: ShiftJournal['overrides'] }): Promise<void>
  cacheShifts(cache: ShiftCache): Promise<void>
  device(options: { url: string; device: Device | null; rejectedToken?: string }): Promise<Device>
}>('ShiftSync')

const apiUrl = () => new URL(API_URL, window.location.origin).href
export const openNativeJournal = (device: Device | null, legacyCache?: ShiftCache) =>
  Capacitor.isPluginAvailable('ShiftSync')
    ? mobile.open({ url: apiUrl(), device, legacyCache })
    : Promise.reject(new Error('Для локального хранения графика установите новую версию приложения Android.'))
export const appendNativeChange = (change: ShiftChange, overrides: ShiftJournal['overrides']) =>
  mobile.append({ change, overrides })
export const cacheNativeShifts = (cache: ShiftCache) => mobile.cacheShifts(cache)
export const nativeDevice = (device: Device | null, rejectedToken?: string) =>
  mobile.device({ url: apiUrl(), device, rejectedToken })
