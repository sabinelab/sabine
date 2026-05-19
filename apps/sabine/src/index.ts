import { app } from './structures/app/App'

await app.redis.connect()
await app.connect()