import { getPlayers } from '@sabinelab/players'
import { Elysia } from 'elysia'

export const players = new Elysia().get('/players', async ({ set }) => {
  set.status = 'OK'

  return getPlayers()
})
