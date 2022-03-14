import * as autoBind from 'auto-bind'

import { IPool } from '../Interfaces/IPool'
import { NetDataReader } from '../Utils/NetDataReader'

/**
 * Returns pooled NetDataReader.
 */
export class NetDataReaderPool implements IPool<NetDataReader> {
  /**
   * Shared pool
   */
  public static shared = new NetDataReaderPool()

  private _pool: NetDataReader[] = []

  public constructor() {
    autoBind(this)
  }

  /**
   * Return a NetDataReader from the pool, or create a new one if the pool is empty.
   * @param {Buffer} [source] - The source buffer to read from.
   * @returns NetDataReader.
   */
  public rent(source?: Buffer): NetDataReader {
    const reader = this._pool.pop() ?? new NetDataReader()

    if (source) {
      reader.setSource(source)
    }

    return reader
  }

  /**
   * Return NetDataReader to the pool.
   * @param {NetDataReader} reader - NetDataReader - The NetDataReader object to return to the pool.
   */
  public return(reader: NetDataReader): void {
    reader.clear()
    this._pool.push(reader)
  }
}
