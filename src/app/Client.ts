import autoBind from 'auto-bind'
import { createSocket, Socket } from 'dgram'

import { config } from '../config'
import { ConnectionRequestProcessor } from './ConnectionRequestProcessor'
import { PacketProperty } from './Enums/PacketProperty'
import { NetPacketPool } from './Pools/NetPacketPool'

import type { Server } from './Server'

export type ClientOptions = {
  server: Server
  ip: string
  port: number
}

export class Client {
  public readonly ip: string
  public readonly port: number
  public lastPingAt = Date.now()

  protected readonly server: Server
  protected readonly socket: Socket
  protected readonly connectionRequestProcessor: ConnectionRequestProcessor

  public get address() {
    return `${this.ip}:${this.port}`
  }

  public constructor(opts: ClientOptions) {
    autoBind(this)

    this.ip = opts.ip
    this.port = opts.port
    this.server = opts.server
    this.socket = createSocket('udp4')
      .on('error', this.onError)
      .on('message', this.onMessageFromServer)

    this.connectionRequestProcessor = new ConnectionRequestProcessor({
      client: this,
      server: this.server
    })
  }

  public async onMessageFromServer(message: Buffer) {
    await this.sendToClient(message)
  }

  public async onMessageFromClient(message: Buffer): Promise<any> {
    const packet = NetPacketPool.shared.rent(message)

    try {
      if (!packet.verify()) {
        return
      }

      switch (packet.property) {
        case PacketProperty.ConnectRequest: {
          return this.connectionRequestProcessor.process(message, packet)
        }

        default: {
          if (packet.property === PacketProperty.Ping) {
            this.lastPingAt = Date.now()
          }

          return this.sendToServer(message)
        }
      }
    } finally {
      NetPacketPool.shared.return(packet)
    }
  }

  public async sendToServer(msg: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      this.socket.send(
        msg,
        config.serverPort,
        config.serverHost,
        (error, bytes) => {
          if (error) {
            reject(error)
          } else {
            resolve(bytes)
          }
        }
      )
    })
  }

  public async sendToClient(msg: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server.socket.send(msg, this.port, this.ip, (error, bytes) => {
        if (error) {
          reject(error)
        } else {
          resolve(bytes)
        }
      })
    })
  }

  private onError(error: Error) {
    console.error(`[client] ${this.address} error:`, error)
  }
}
