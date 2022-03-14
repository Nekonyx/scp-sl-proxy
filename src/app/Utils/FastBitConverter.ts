/**
 * LiteNetLib.Utils.FastBitConverter
 */
export class FastBitConverter {
  /**
   * Writes a bigint to a buffer at a given index.
   * LiteNetLib.Utils.FastBitConverter.GetBytes(byte[] bytes, int startIndex, long value)
   *
   * @param {Buffer} bytes - The buffer to write the bytes to.
   * @param {number} startIndex - The index of the first byte to write.
   * @param {bigint} value - The value to write.
   */
  public static GetBytes(bytes: Buffer, startIndex: number, value: bigint) {
    FastBitConverter.WriteLittleEndian(bytes, startIndex, value)
  }

  /**
   * Writes a bigint to a buffer in little endian format.
   * LiteNetLib.Utils.FastBitConverter.WriteLittleEndian(byte[] buffer, int offset, ulong data)
   *
   * @param {Buffer} buffer - The buffer to write to.
   * @param {number} offset - The offset in the buffer where the data should be written.
   * @param {bigint} data - The data to be written.
   */
  private static WriteLittleEndian(
    buffer: Buffer,
    offset: number,
    data: bigint
  ) {
    buffer.writeBigUInt64LE(data, offset)
    buffer.writeBigUInt64LE(data >> 8n, offset + 1)
    buffer.writeBigUInt64LE(data >> 16n, offset + 2)
    buffer.writeBigUInt64LE(data >> 24n, offset + 3)
    buffer.writeBigUInt64LE(data >> 32n, offset + 4)
    buffer.writeBigUInt64LE(data >> 40n, offset + 5)
    buffer.writeBigUInt64LE(data >> 48n, offset + 6)
    buffer.writeBigUInt64LE(data >> 56n, offset + 7)
  }
}
