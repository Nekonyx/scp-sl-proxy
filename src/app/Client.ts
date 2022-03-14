import * as autoBind from 'auto-bind'
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
  protected readonly server: Server
  protected readonly connectionRequestProcessor: ConnectionRequestProcessor

  public constructor(opts: ClientOptions) {
    autoBind(this)

    this.server = opts.server
    this.ip = opts.ip
    this.port = opts.port

    console.log(`[Client] constructor`, {
      ip: this.ip,
      port: this.port
    })

    this.connectionRequestProcessor = new ConnectionRequestProcessor({
      client: this,
      server: this.server
    })
  }

  public onMessage(msg: Buffer) {
    const packet = NetPacketPool.shared.rent(msg)

    if (!packet.verify()) {
      console.warn('[Client] onMessage: invalid packet', {
        packet
      })

      return
    }

    switch (packet.property) {
      case PacketProperty.ConnectRequest: {
        this.connectionRequestProcessor.process(msg, packet)
        break
      }

      default: {
        this.sendToServer(msg)
        break
      }
    }
  }

  public async sendToServer(msg: Buffer) {
    await this.send(msg, config.targetHost, config.targetPort)
  }

  public async sendToClient(msg: Buffer) {
    await this.send(msg, this.ip, this.port)
  }

  private async send(msg: Buffer, ip: string, port: number) {
    return new Promise((resolve, reject) => {
      this.server.socket.send(msg, 0, msg.length, port, ip, (error, bytes) => {
        if (!error) {
          resolve(bytes)
          return
        }

        reject(error)
        console.log(`[Client] send: error`, {
          ip,
          port,
          msg,
          bytes,
          error
        })
      })
    })
  }
}
