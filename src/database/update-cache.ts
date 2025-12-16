export const voidCatch = () => {}

export const updateCache = async(key: string, data: unknown, ignoreNull?: boolean) => {
  const value = await Bun.redis.get(key)

  if(!value && ignoreNull) return

  Bun.redis.set(key,
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    ),
    'EX', 300
  )
  .catch(voidCatch)
}