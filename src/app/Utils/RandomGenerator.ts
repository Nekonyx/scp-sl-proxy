import { pseudoRandomBytes, randomBytes } from 'crypto'

export class RandomGenerator {
  public static getInt32(secure: boolean): number {
    return secure ? this.getInt32Secure() : this.getInt32Unsecure()
  }

  private static getInt32Secure(): number {
    return randomBytes(4).readInt32LE()
  }

  private static getInt32Unsecure(): number {
    return pseudoRandomBytes(4).readInt32LE()
  }
}
