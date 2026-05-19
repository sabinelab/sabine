export const hydrateData = <T>(data: T) => {
  if (typeof data !== 'object') return data

  const dateFields = new Set([
    'createdAt',
    'dailyTime',
    'claimTime',
    'lastVote',
    'valorantResendTime',
    'lolResendTime',
    'expiresAt'
  ])
  const bigintFields = new Set(['bet', 'poisons'])

  const obj = data as Record<string, unknown>

  for (const key in obj) {
    const value = obj[key]

    if (dateFields.has(key) && typeof value === 'string') {
      obj[key] = new Date(value)
    } else if (bigintFields.has(key) && typeof value === 'string') {
      obj[key] = BigInt(value)
    } else if (typeof value === 'object' && value !== null) {
      obj[key] = hydrateData(value)
    }
  }

  return obj as T
}