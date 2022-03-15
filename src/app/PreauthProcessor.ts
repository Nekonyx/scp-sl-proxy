import { Dictionary } from 'typescript-collections'

import { config } from '../config'
import { Client } from './Client'
import { ConnectionRequestProcessor } from './ConnectionRequestProcessor'
import { PreauthResult } from './Enums/PreauthResult'
import { RejectionReason } from './Enums/RejectionReason'
import { PreauthChallengeItem } from './PreauthChallengeItem'
import { Server } from './Server'
import { NetDataReader } from './Utils/NetDataReader'
import { NetPacket } from './Utils/NetPacket'
import { RandomGenerator } from './Utils/RandomGenerator'

export type PreauthProcessorOptions = {
  client: Client
  server: Server
  connectionRequestProccesor: ConnectionRequestProcessor
}

export type PreauthAcceptResponse = {
  result: PreauthResult.Accept
}

export type PreauthRejectResponse = {
  result: PreauthResult.Reject
  reason: RejectionReason
}

export type PreauthResponse = PreauthAcceptResponse | PreauthRejectResponse

export class PreauthProcessor {
  private static readonly _challenges = new Dictionary<
    string,
    PreauthChallengeItem
  >()

  protected readonly client: Client
  protected readonly server: Server
  protected readonly connectionRequestProccesor: ConnectionRequestProcessor

  public constructor(opts: PreauthProcessorOptions) {
    this.client = opts.client
    this.server = opts.server
    this.connectionRequestProccesor = opts.connectionRequestProccesor
  }

  public async process(reader: NetDataReader): Promise<PreauthResponse> {
    //#region Unknown
    const b = reader.tryGetByte()

    if (b === null || b >= 2) {
      return {
        result: PreauthResult.Reject,
        reason: RejectionReason.InvalidToken
      }
    }

    if (b === 1) {
      return {
        result: PreauthResult.Accept
      }
    }
    //#endregion

    const version = this.readVersion(reader)

    if (!version.success) {
      return {
        result: PreauthResult.Reject,
        reason: RejectionReason.VersionMismatch
      }
    }

    const challenge = this.readChallenge(reader)

    if (!challenge.success) {
      return {
        result: PreauthResult.Reject,
        reason: RejectionReason.InvalidChallenge
      }
    }

    if (config.useChallenge) {
      if (
        challenge.num == 0 ||
        challenge.array == null ||
        challenge.array.length == 0
      ) {
        let num2 = 0
        let key = ''

        for (let b2 = 0; b2 < 3; b2++) {
          num2 = RandomGenerator.getInt32(false)

          if (num2 === 0) {
            num2 = 1
          }

          key = `${this.client.address}-${num2}`

          if (PreauthProcessor._challenges.containsKey(key)) {
            break
          }

          if (b2 === 2) {
            console.warn(
              `[server] ${this.client.address} can't generate challenge id`
            )

            return {
              result: PreauthResult.Reject,
              reason: RejectionReason.Error
            }
          }
        }
      }
    }

    //#region UserID
    const text = reader.tryGetString()

    if (text === null || text === '') {
      return {
        result: PreauthResult.Reject,
        reason: RejectionReason.AuthenticationRequired
      }
    }
    //#endregion

    //#region Expiration
    const num3 = reader.tryGetLong()
    const b3 = reader.tryGetByte()
    const text2 = reader.tryGetString()
    const signature = reader.tryGetBytesWithLength()

    if (num3 === null || b3 === null || text2 === null || signature === null) {
      return {
        result: PreauthResult.Reject,
        reason: RejectionReason.Error
      }
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
        version,
        challenge,
        userId: text,
        num3,
        b3,
        text2,
        signature
      }
    )

    return {
      result: PreauthResult.Accept
    }
  }

  private readVersion(reader: NetDataReader) {
    const major = reader.tryGetByte()
    const minor = reader.tryGetByte()
    const revision = reader.tryGetByte()
    const flag = reader.tryGetBool()
    const backwardRevision = flag && reader.tryGetByte()

    return {
      success:
        major !== null &&
        minor === null &&
        revision !== null &&
        flag !== null &&
        (flag ? backwardRevision !== null : true),

      major,
      minor,
      revision,
      flag,
      backwardRevision
    }
  }

  private readChallenge(reader: NetDataReader) {
    const num = reader.tryGetInt()
    const array = reader.tryGetBytesWithLength()
    const flag2 = array === null || num === null

    return {
      success: !flag2,
      num,
      array,
      flag2
    }
  }
}
