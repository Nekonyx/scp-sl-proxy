export class FastBitConverter {
  // public static void GetBytes(byte[] bytes, int startIndex, long value)
  public static GetBytes(bytes: Buffer, startIndex: number, value: bigint) {
    FastBitConverter.WriteLittleEndian(bytes, startIndex, value)
  }

  //private static void WriteLittleEndian(byte[] buffer, int offset, ulong data)
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

    // buffer[offset] = data
    // buffer[offset + 1] = data >> 8
    // buffer[offset + 2] = data >> 16
    // buffer[offset + 3] = data >> 24
    // buffer[offset + 4] = data >> 32
    // buffer[offset + 5] = data >> 40
    // buffer[offset + 6] = data >> 48
    // buffer[offset + 7] = data >> 56
  }
}
