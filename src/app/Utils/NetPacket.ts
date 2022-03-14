import * as autoBind from 'auto-bind'
import { $enum } from 'ts-enum-util'

import { PacketProperty } from '../Enums/PacketProperty'

export class NetPacket {
  public static readonly propertiesCount = $enum(PacketProperty).length

  public static readonly headerSizes: number[] = []

  private static readonly _emptyBuffer = Buffer.alloc(0)

  public data?: Buffer

  public dataSize = 0

  public get property() {
    return this.data![0]! & 31
  }

  public set property(value: PacketProperty) {
    this.data![0] = (this.data![0]! & 224) | value
  }

  public get connectionNumber() {
    return (this.data![0]! & 96) >> 5
  }

  public set connectionNumber(value: number) {
    this.data![0] = (this.data![0]! & 159) | (value << 5)
  }

  public get connectionTime() {
    return this.data!.readBigUInt64LE(5)
  }

  public constructor() {
    autoBind(this)
  }

  public setSource(source: Buffer) {
    this.data = Buffer.from(source)
    this.dataSize = this.data.length
  }

  public verify() {
    const property = this.data![0]! & 0x1f

    if (property >= NetPacket.propertiesCount) {
      return false
    }

    const headerSize = NetPacket.headerSizes[property]!

    const fragmented = (this.data![0]! & 0x80) != 0

    return (
      this.dataSize >= headerSize &&
      (!fragmented || this.dataSize >= headerSize + 6)
    )
  }

  public clear() {
    this.setSource(NetPacket._emptyBuffer)
  }
}

// Инициализация статичных свойств

for (let i = 0; i < NetPacket.propertiesCount; i++) {
  const property = PacketProperty[i]

  if (!property) {
    throw new Error(`Invalid property: ${i}`)
  }

  switch (property as unknown as PacketProperty) {
    case PacketProperty.Channeled:
    case PacketProperty.Ack:
      NetPacket.headerSizes[i] = 4
      break

    case PacketProperty.Ping:
      NetPacket.headerSizes[i] = 3
      break

    case PacketProperty.ConnectRequest:
      NetPacket.headerSizes[i] = 11
      break

    case PacketProperty.ConnectAccept:
      NetPacket.headerSizes[i] = 14
      break

    case PacketProperty.Disconnect:
      NetPacket.headerSizes[i] = 11
      break

    case PacketProperty.Pong:
      NetPacket.headerSizes[i] = 9
      break

    default:
      NetPacket.headerSizes[i] = 1
      break
  }
}
