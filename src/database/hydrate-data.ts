export const hydrateData = <T>(data: T) => {
  if(typeof data !== 'object') return data

  const dateFields = ['created_at',
    'daily_time',
    'claim_time',
    'last_vote',
    'valorant_resend_time',
    'lol_resend_time'
  ]
  const bigintFields = ['coins', 'bet']

  const obj = data as Record<string, unknown>

  for(const key in obj) {
    const value = obj[key]

    if(dateFields.includes(key) && typeof value === 'string') {
      obj[key] = new Date(value)
    }
    else if(bigintFields.includes(key) && typeof value === 'string') {
      obj[key] = BigInt(value)
    }
    else if(typeof value === 'object' && value !== null) {
      obj[key] = hydrateData(value)
    }
  }

  return obj as T
}