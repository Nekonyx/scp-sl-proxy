import { DataType } from '../Enums/DataType'

/**
 * LiteNetLib.Utils.NetDataReader
 */
export class NetDataReader {
  /**
   * Empty buffer that is used when clearing a NetDataReader or when instantiating a new one.
   */
  private static readonly _emptyBuffer = Buffer.alloc(0)

  private _data: Buffer = NetDataReader._emptyBuffer
  private _dataSize = 0
  private _position = 0

  public get position() {
    return this._position
  }

  public get availableBytes() {
    return this._dataSize - this._position
  }

  public constructor(source?: Buffer) {
    if (source) {
      this.setSource(source)
    }
  }

  public setSource(source: Buffer) {
    this._data = Buffer.from(source)
    this._position = 0
    this._dataSize = this._data.length
  }

  public skipBytes(count: number) {
    this._position += count
  }

  public getByte() {
    if (this.availableBytes < DataType.Byte) {
      return null
    }

    const value = this._data!.readUInt8(this._position)
    this._position += DataType.Byte
    return value
  }

  public clear() {
    this.setSource(NetDataReader._emptyBuffer)
  }
}
