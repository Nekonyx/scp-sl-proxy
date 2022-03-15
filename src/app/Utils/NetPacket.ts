import autoBind from 'auto-bind'
import { $enum } from 'ts-enum-util'

import { PacketProperty } from '../Enums/PacketProperty'

/**
 * LiteNetLib.NetPacket
 */
export class NetPacket {
  /**
   * LiteNetLib.NetPacket.LastProperty
   */
  public static readonly propertiesCount = $enum(PacketProperty).length

  /**
   * LiteNetLib.NetPacket.HeaderSizes
   */
  public static readonly headerSizes: number[] = []

  /**
   * Empty buffer that is used when clearing a NetPacket or when instantiating a new one.
   */
  private static readonly _emptyBuffer = Buffer.alloc(0)

  /**
   * Data in the packet.
   */
  public data: Buffer = NetPacket._emptyBuffer

  /**
   * Return the length of the data array.
   */
  public get dataSize(): number {
    return this.data.length
  }

  /**
   * Get the property of the packet.
   * LiteNetLib.NetPacket.Property
   */
  public get property(): PacketProperty {
    return this.data![0]! & 31
  }

  /**
   * It sets the first byte of the packet to the specified property.
   * LiteNetLib.NetPacket.Property
   * @param {PacketProperty} value - The value to set the property to.
   */
  public set property(value: PacketProperty) {
    this.data![0] = (this.data![0]! & 224) | value
  }

  /**
   * Get the connection number from the first byte of the data.
   * LiteNetLib.NetPacket.ConnectionNumber
   * @returns The connection number.
   */
  public get connectionNumber(): number {
    return (this.data![0]! & 96) >> 5
  }

  /**
   * Set the value of the connectionNumber property to the value of the parameter.
   * LiteNetLib.NetPacket.ConnectionNumber
   */
  public set connectionNumber(value: number) {
    this.data![0] = (this.data![0]! & 159) | (value << 5)
  }

  /**
   * The time that the connection was made.
   * @returns The connection time in seconds.
   */
  public get connectionTime() {
    return this.data!.readBigUInt64LE(5)
  }

  /**
   * Instantiates a new NetPacket
   */
  public constructor() {
    autoBind(this)
  }

  /**
   * Sets the source of the data.
   * @param source - The buffer to be used as the source.
   */
  public setSource(source: Buffer) {
    this.data = Buffer.from(source)
  }

  /**
   * Clears data for reuse
   */
  public clear() {
    this.setSource(NetPacket._emptyBuffer)
  }

  /**
   * LiteNetLib.NetPacket.Verify
   * public bool Verify()
   */
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
}

/**
 * LiteNetLib.NetPacket
 * static NetPacket()
 */
for (let i = 0; i < NetPacket.propertiesCount; i++) {
  const property = PacketProperty[i]

  if (!property) {
    throw new Error(`Invalid property: ${i}`)
  }

  switch (property as any as PacketProperty) {
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
