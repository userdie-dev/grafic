import { afterEach, vi } from 'vitest'

// happy-dom has no canvas, so ECharts cannot render here. The stub keeps the option
// observable in unit tests; the real chart is verified in the browser.
vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    props: {
      option: { type: Object, default: null },
      autoresize: { type: Boolean, default: false },
    },
    template: '<div data-vchart />',
  },
}))

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})
