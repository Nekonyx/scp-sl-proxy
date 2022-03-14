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
  protected readonly socket: Socket
  protected readonly server: Server
  protected readonly connectionRequestProcessor: ConnectionRequestProcessor

  public constructor(opts: ClientOptions) {
    autoBind(this)

    this.server = opts.server
    this.ip = opts.ip
    this.port = opts.port
    this.connectionRequestProcessor = new ConnectionRequestProcessor({
      client: this,
      server: this.server
    })

    this.socket = createSocket('udp4').on('message', this.onMessageFromServer)
  }

  public onMessageFromServer(msg: Buffer) {
    this.sendToClient(msg)
  }

  public onMessageFromClient(msg: Buffer) {
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
    return new Promise((resolve, reject) => {
      this.socket.send(
        msg,
        config.targetPort,
        config.targetHost,
        (error, bytes) => {
          if (error) {
            reject(error)
            return
          }

          resolve(bytes)
        }
      )
    })
  }

  public async sendToClient(msg: Buffer) {
    return new Promise((resolve, reject) => {
      this.server.socket.send(msg, this.port, this.ip, (error, bytes) => {
        if (error) {
          reject(error)
          return
        }

        resolve(bytes)
      })
    })
  }
}
