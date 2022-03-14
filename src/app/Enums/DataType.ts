/**
 * Data type size in bytes.
 */
export enum DataType {
  Byte = 1,

  Bool = DataType.Byte,

  Short = DataType.Byte * 2,

  Int = DataType.Short * 4,

  Long = DataType.Int * 8,

  Float = DataType.Byte * 4,

  Double = DataType.Byte * 8,

  Decimal = DataType.Byte * 16,

  Char = DataType.Byte * 2
}
