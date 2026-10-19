import type { VueQueryPluginOptions } from '@tanstack/vue-query'

export const vueQueryOptions: VueQueryPluginOptions = {
  queryClientConfig: { defaultOptions: { queries: { retry: 1 } } },
}
