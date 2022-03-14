import * as autoBind from 'auto-bind'

import { PacketProperty } from '../Enums/PacketProperty'
import { IPool } from '../Interfaces/IPool'
import { NetPacket } from '../Utils/NetPacket'

export class NetPacketPool implements IPool<NetPacket> {
  /**
   * Shared pool
   */
  public static shared = new NetPacketPool()

  private _pool: NetPacket[] = []

  public constructor() {
    autoBind(this)
  }

  public rent(source?: Buffer): NetPacket {
    const packet = this._pool.shift() ?? new NetPacket()

    if (source) {
      packet.setSource(source)
    }

    return packet
  }

  public return(packet: NetPacket): void {
    packet.clear()
    this._pool.push(packet)
  }
}
