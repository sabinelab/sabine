export default function (length: number) {
  const min = 1.1
  const max = 2
  const curve = (length - 1) / 50
  const odd = min + (max - min) * Math.exp(-curve)

  if (length <= 1) return max

  return parseFloat(odd.toFixed(2))
}
