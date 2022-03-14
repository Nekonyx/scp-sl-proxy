import * as autoBind from 'auto-bind'

import { config } from '../config'
import { Client } from './Client'
import { ConnectionRequestResult } from './Enums/ConnectionRequestResult'
import { PacketProperty } from './Enums/PacketProperty'
import { RejectionReason } from './Enums/RejectionReason'
import { NetDataReaderPool } from './Pools/NetDataReaderPool'
import { NetPacketPool } from './Pools/NetPacketPool'
import { Server } from './Server'
import { FastBitConverter } from './Utils/FastBitConverter'
import { NetPacket } from './Utils/NetPacket'

export type ConnectionRequestProcessorOptions = {
  client: Client
  server: Server
}

export class ConnectionRequestProcessor {
  protected readonly client: Client
  protected readonly server: Server

  public constructor(opts: ConnectionRequestProcessorOptions) {
    autoBind(this)

    this.client = opts.client
    this.server = opts.server
  }

  public process(msg: Buffer, packet: NetPacket) {
    const reader = this.getReader(packet)

    if (!reader) {
      console.warn(`[ConnectionRequestProcessor] can't get reader`, {
        packet
      })

      return
    }

    const b = reader.getByte()

    if (b === null || b >= 2) {
      return this.reject(packet, RejectionReason.InvalidToken)
    }

    if (b === 1) {
      return this.accept(msg)
    }

    return this.accept(msg)
    // return this.reject(packet, RejectionReason.ExpiredAuth)
  }

  private getReader(packet: NetPacket) {
    if (!packet.data || packet.connectionNumber >= 4) {
      return null
    }

    const addrSize = packet.data[13]!

    if (addrSize !== 16 && addrSize !== 28) {
      return null
    }

    return NetDataReaderPool.shared.rent(
      packet.data.slice(14 + addrSize, packet.dataSize)
    )
  }

  private async accept(msg: Buffer) {
    await this.client.sendToServer(msg)
  }

  private async reject(request: NetPacket, reason: RejectionReason) {
    // const property = PacketProperty.Disconnect
    const data = Buffer.from([reason])

    const response = NetPacketPool.shared.rent(
      // Buffer.alloc(NetPacket.headerSizes[property]!)
      Buffer.alloc(64)
    )

    // console.log('just allocated:', response)

    response.property = PacketProperty.Disconnect

    // console.log('property set:', response)

    response.connectionNumber = request.connectionNumber

    FastBitConverter.GetBytes(response.data!, 1, request.connectionTime)

    // console.log('connection number set:', response)

    data.copy(response.data!, 9, 0, data.length)

    response.setSource(response.data!.slice(0, response.data!.indexOf(0x00)))

    // console.log('data copied:', data)

    await this.client.sendToClient(response.data!)
    NetPacketPool.shared.return(response)

    // this.server.socket.send(
    //   response.data!,
    //   0,
    //   response.dataSize,
    //   this.client.port,
    //   this.client.ip,
    //   (error, bytes) => {
    //     console.log({
    //       error,
    //       bytes,
    //       data,
    //       response,
    //       responseData: response.data?.toString('hex')
    //     })

    //     NetPacketPool.shared.return(response)
    //   }
    // )
  }
}
