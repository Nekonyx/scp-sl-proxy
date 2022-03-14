import * as autoBind from 'auto-bind'

import { Client } from './Client'
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

  public async process(message: Buffer, packet: NetPacket) {
    const reader = this.getReader(packet)

    if (!reader) {
      return
    }

    try {
      const b = reader.getByte()

      if (b === null || b >= 2) {
        return this.reject(packet, RejectionReason.InvalidToken)
      }

      if (b === 1) {
        return this.accept(message)
      }
    } finally {
      NetDataReaderPool.shared.return(reader)
    }

    return this.accept(message)
  }

  private getReader(packet: NetPacket) {
    if (!packet.data || packet.connectionNumber >= 4) {
      return null
    }

    const addrSize = packet.data[13]!

    if (addrSize !== 16 && addrSize !== 28) {
      return null
    }

    return addrSize !== 16 && addrSize !== 28
      ? null
      : NetDataReaderPool.shared.rent(
          packet.data.slice(14 + addrSize, packet.dataSize)
        )
  }

  private async accept(msg: Buffer) {
    // prettier-ignore
    console.log(`[server] ${this.client.address} connection request is accepted`)

    await this.client.sendToServer(msg)
  }

  private async reject(request: NetPacket, reason: RejectionReason) {
    // prettier-ignore
    console.log(`[server] ${this.client.address} connection request is rejected: ${reason}`)

    const data = Buffer.from([reason])
    const response = NetPacketPool.shared.rent(Buffer.alloc(64))

    response.property = PacketProperty.Disconnect
    response.connectionNumber = request.connectionNumber

    FastBitConverter.GetBytes(response.data!, 1, request.connectionTime)

    data.copy(response.data!, 9, 0, data.length)

    response.setSource(response.data!.slice(0, response.data!.indexOf(0x00)))

    await this.client.sendToClient(response.data!)
    NetPacketPool.shared.return(response)
  }
}
