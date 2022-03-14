import * as autoBind from 'auto-bind'
import { createSocket, RemoteInfo, Socket } from 'dgram'

import { config } from '../config'
import { Client } from './Client'

export class Server {
  public readonly socket: Socket
  public readonly clients: Record<string, Client> = {}

  public constructor() {
    autoBind(this)
    setInterval(this.cleanup, 1000)

    this.socket = createSocket('udp4')
      .on('error', this.onError)
      .on('listening', this.onListening)
      .on('message', this.onMessage)
  }

  public async start() {
    return new Promise((resolve, reject) => {
      this.socket.once('error', (error) => {
        reject(error)
      })

      this.socket.bind(config.port, config.host, () => {
        resolve(undefined)
      })
    })
  }

  private cleanup() {
    const now = Date.now()

    for (const client of Object.values(this.clients)) {
      if (client.lastPingAt + config.maxIdleTime < now) {
        console.log(`[server] killing ${client.address}`)

        delete this.clients[client.address]
      }
    }
  }

  private onError(error: Error) {
    console.error('[server] error:', error)
  }

  private onListening() {
    console.log('[server] listening')
  }

  private onMessage(msg: Buffer, rinfo: RemoteInfo) {
    const address = `${rinfo.address}:${rinfo.port}`

    if (!(address in this.clients)) {
      this.clients[address] = new Client({
        server: this,
        ip: rinfo.address,
        port: rinfo.port
      })
    }

    this.clients[address]!.onMessageFromClient(msg)
  }
}
