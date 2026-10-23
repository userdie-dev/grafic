// blue toggle buttons: solid when selected, pale otherwise
export const tone = (active: boolean) =>
  active
    ? 'bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-500 dark:hover:bg-blue-500/90'
    : 'bg-blue-100 text-blue-900 hover:bg-blue-100/80 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-950/80'

export const PRIMARY_BLUE = tone(true)
