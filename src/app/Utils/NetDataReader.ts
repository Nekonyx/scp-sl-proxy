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

  public clear() {
    this.setSource(NetDataReader._emptyBuffer)
  }

  public peekInt() {
    return this._data.readInt32LE(this._position)
  }

  public getByte() {
    const result = this._data.readUint8(this._position)
    this._position += DataType.Byte
    return result
  }

  public getBool() {
    const result = this._data.readUint8(this._position) > 0
    this._position += DataType.Bool
    return result
  }

  public getInt() {
    const result = this._data.readInt32LE(this._position)
    this._position += DataType.Int
    return result
  }

  public getBytesWithLength() {
    const int = this.getInt()
    const array = Buffer.alloc(int)
    this._data.copy(array, 0, this._position, this._position + int)
    this._position += int
    return array
  }

  public getString() {
    const int = this.getInt()

    if (int <= 0) {
      return ''
    }

    const array = Buffer.alloc(int)
    this._data.copy(array, 0, this._position, this._position + int)
    this._position += int
    return array.toString('utf8')
  }

  public getLong() {
    const result = this._data.readBigInt64LE(this._position)
    this._position += DataType.Long
    return result
  }

  public tryGetByte() {
    if (this.availableBytes >= DataType.Byte) {
      return this.getByte()
    }

    return null
  }

  public tryGetBool() {
    if (this.availableBytes >= DataType.Bool) {
      return this.getBool()
    }

    return null
  }

  public tryGetInt() {
    if (this.availableBytes >= DataType.Int) {
      return this.getInt()
    }

    return null
  }

  public tryGetBytesWithLength() {
    if (this.availableBytes >= DataType.Int) {
      const num = this.peekInt()

      if (num >= 0 && this.availableBytes >= num + DataType.Int) {
        return this.getBytesWithLength()
      }
    }

    return null
  }

  public tryGetString() {
    if (this.availableBytes >= DataType.Int) {
      const num = this.peekInt()

      if (this.availableBytes >= num + DataType.Int) {
        return this.getString()
      }
    }

    return null
  }

  public tryGetLong() {
    if (this.availableBytes >= DataType.Long) {
      return this.getLong()
    }

    return null
  }
}
