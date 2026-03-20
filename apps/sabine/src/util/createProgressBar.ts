export const createProgressBar = (progress: number, size = 10) => {
  const paddedLength = Math.round(size * progress)
  const emptyLength = size - paddedLength
  const padding = '█'.repeat(paddedLength)
  const empty = '░'.repeat(emptyLength)

  return padding + empty
}
