import * as autoBind from 'auto-bind'

import { config } from '../config'
import { Client } from './Client'
import { PacketProperty } from './Enums/PacketProperty'
import { RejectionReason } from './Enums/RejectionReason'
import { NetDataReaderPool } from './Pools/NetDataReaderPool'
import { NetPacketPool } from './Pools/NetPacketPool'
import { PreauthChallengeItem } from './PreauthChallengeItem'
import { Server } from './Server'
import { FastBitConverter } from './Utils/FastBitConverter'
import { NetPacket } from './Utils/NetPacket'
import { RandomGenerator } from './Utils/RandomGenerator'

export type ConnectionRequestProcessorOptions = {
  client: Client
  server: Server
}

export class ConnectionRequestProcessor {
  private static readonly _challenges: Record<string, PreauthChallengeItem> = {}

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
      //#region Unknown
      const b = reader.tryGetByte()

      if (b === null || b >= 2) {
        return this.reject(packet, RejectionReason.InvalidToken)
      }

      if (b === 1) {
        return this.accept(message)
      }
      //#endregion

      //#region Version
      const major = reader.tryGetByte()
      const minor = reader.tryGetByte()
      const revision = reader.tryGetByte()
      const flag = reader.tryGetBool()
      const backwardRevision = flag && reader.tryGetByte()

      if (
        major === null ||
        minor === null ||
        revision === null ||
        flag === null ||
        (flag && backwardRevision === null)
      ) {
        return this.reject(packet, RejectionReason.VersionMismatch)
      }
      //#endregion

      //#region Challenge
      const num = reader.tryGetInt()
      const array = reader.tryGetBytesWithLength()
      const flag2 = array === null || num === null

      if (!flag2) {
        return this.reject(packet, RejectionReason.InvalidChallenge)
      }

      if (config.useChallenge) {
        if (num == 0 || array == null || array.length == 0) {
          let num2 = 0
          let key = ''

          for (let b2 = 0; b2 < 3; b2++) {
            num2 = RandomGenerator.getInt32(false)

            if (num2 === 0) {
              num2 = 1
            }

            key = `${this.client.address}-${num2}`

            if (key in ConnectionRequestProcessor._challenges) {
              break
            }

            if (b2 === 2) {
              console.warn(
                `[server] ${this.client.address} can't generate challenge id`
              )

              return this.reject(packet, RejectionReason.Error)
            }
          }
        }
      }
      //#endregion

      //#region UserID
      const text = reader.tryGetString()

      if (text === null || text === '') {
        return this.reject(packet, RejectionReason.AuthenticationRequired)
      }
      //#endregion

      //#region Expiration
      const num3 = reader.tryGetLong()
      const b3 = reader.tryGetByte()
      const text2 = reader.tryGetString()
      const signature = reader.tryGetBytesWithLength()

      if (
        num3 === null ||
        b3 === null ||
        text2 === null ||
        signature === null
      ) {
        return this.reject(packet, RejectionReason.Error)
      }
      //#endregion

      //#region Unknown
      //#endregion
      //#region Country
      //#endregion
      //#region Signature
      //#endregion

      console.log(
        `[server] ${this.client.address} connection request is accepted`,
        {
          version: `${major}.${minor}.${revision} (backward revision: ${backwardRevision})`,
          challengeId: num,
          challengeKey: array?.toString('hex'),
          userId: text,
          num3,
          b3,
          text2,
          signature
        }
      )
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

  private async reject(packet: NetPacket, reason: RejectionReason) {
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
