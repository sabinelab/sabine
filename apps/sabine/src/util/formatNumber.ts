export const formatNumber = (n: number) => {
  if (n < 1_000) {
    return n.toString()
  }

  const units = ['K', 'M', 'B'] as const
  let unitIndex = -1
  let num = n

  while (num >= 1_000 && unitIndex < units.length - 1) {
    num /= 1_000
    unitIndex++
  }

  return `${num.toFixed(2).replace(/\.?0+$/, '')}${units[unitIndex]}`
}
