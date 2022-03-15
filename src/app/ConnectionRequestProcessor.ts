import autoBind from 'auto-bind'

import { Client } from './Client'
import { PacketProperty } from './Enums/PacketProperty'
import { PreauthResult } from './Enums/PreauthResult'
import { RejectionReason } from './Enums/RejectionReason'
import { NetDataReaderPool } from './Pools/NetDataReaderPool'
import { NetPacketPool } from './Pools/NetPacketPool'
import { PreauthProcessor } from './PreauthProcessor'
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
  protected readonly preauthProcessor: PreauthProcessor

  public constructor(opts: ConnectionRequestProcessorOptions) {
    autoBind(this)

    this.client = opts.client
    this.server = opts.server
    this.preauthProcessor = new PreauthProcessor({
      server: this.server,
      client: this.client,
      connectionRequestProccesor: this
    })
  }

  public async process(message: Buffer, packet: NetPacket) {
    const reader = this.getReader(packet)

    if (!reader) {
      return
    }

    try {
      const response = await this.preauthProcessor.process(reader)
      console.log(`[server] ${this.client.address} preauth response:`, {
        response
      })

      switch (response.result) {
        case PreauthResult.Accept:
          await this.accept(message)
          break

        case PreauthResult.Reject:
          await this.reject(packet, response.reason)
          break

        default:
          console.warn(`[server] unknown preauth result:`, {
            packet,
            response
          })

          await this.reject(packet, RejectionReason.Error)
          break
      }
    } finally {
      NetDataReaderPool.shared.return(reader)
    }
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

  public async accept(msg: Buffer) {
    // prettier-ignore
    console.log(`[server] ${this.client.address} connection request is accepted`)

    await this.client.sendToServer(msg)
  }

  public async reject(packet: NetPacket, reason: RejectionReason) {
    // prettier-ignore
    console.log(`[server] ${this.client.address} connection request is rejected: ${reason}`)

    const data = Buffer.from([reason])
    const response = NetPacketPool.shared.rent(Buffer.alloc(64))

    response.property = PacketProperty.Disconnect
    response.connectionNumber = packet.connectionNumber

    FastBitConverter.GetBytes(response.data!, 1, packet.connectionTime)

    data.copy(response.data!, 9, 0, data.length)

    response.setSource(response.data!.slice(0, response.data!.indexOf(0x00)))

    await this.client.sendToClient(response.data!)
    NetPacketPool.shared.return(response)
  }
}
