import { API_URL, http, setToken } from "@/app/config/axios";
import type { Device, Shift, ShiftInput, Subscription } from "./dto";

export { setToken };

const get = <T>(url: string) => http.get<T>(url).then((r) => r.data);
const send = <T>(
  method: "post" | "put" | "delete",
  url: string,
  data?: unknown,
) => http.request<T>({ method, url, data }).then((r) => r.data);

export const registerDevice = () => send<Device>("post", "/devices");

const range = (from?: string, to?: string) =>
  from && to ? `?from=${from}&to=${to}` : "";

export const api = {
  myShifts: (from?: string, to?: string) =>
    get<Shift[]>(`/me/shifts${range(from, to)}`),

  saveShifts: (shifts: ShiftInput[]) =>
    send<Shift[]>("put", "/me/shifts", { shifts }),

  deleteShift: (id: string) =>
    send<{ deleted: boolean }>("delete", `/me/shifts/${id}`),

  regenerateCode: () =>
    send<{ shareCode: string }>("post", "/me/share-code/regenerate"),

  subscriptions: () => get<Subscription[]>("/subscriptions"),

  subscribe: (code: string) =>
    send<Subscription>("post", "/subscriptions", { code }),

  unsubscribe: (id: string) =>
    send<{ deleted: boolean }>("delete", `/subscriptions/${id}`),

  friendShifts: (ownerId: string, from?: string, to?: string) =>
    get<Shift[]>(`/friends/${ownerId}/shifts${range(from, to)}`),
};

/** SSE endpoint; EventSource cannot set headers, so the token goes in the query. */
export const eventsUrl = (deviceToken: string) =>
  `${API_URL}/events?token=${encodeURIComponent(deviceToken)}`;
