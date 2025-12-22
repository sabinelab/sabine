import createListener from '../structures/app/createListener'
import Logger from '../util/Logger'

export default createListener({
  name: 'error',
  async run(client, error) {
    new Logger(client).error(error, client.shard?.ids[0])
  }
})
