/**
 * Data type size in bytes.
 */
export enum DataType {
  /**
   * 1 byte
   */
  Byte = 1,

  /**
   * 1 byte
   */
  Bool = DataType.Byte,

  /**
   * 2 bytes
   */
  Short = DataType.Byte * 2,

  /**
   * 4 bytes
   */
  Int = DataType.Short * 4,

  /**
   * 8 bytes
   */
  Long = DataType.Int * 8,

  /**
   * 4 bytes
   */
  Float = DataType.Byte * 4,

  /**
   * 8 bytes
   */
  Double = DataType.Byte * 8,

  /**
   * 16 bytes
   */
  Decimal = DataType.Byte * 16,

  /**
   * 2 bytes
   */
  Char = DataType.Byte * 2
}
