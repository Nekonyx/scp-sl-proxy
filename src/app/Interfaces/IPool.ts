/**
 * Pool interface
 */
export interface IPool<T> {
  /**
   * Return an object from the pool.
   */
  rent(): T

  /**
   * Return an object to the pool.
   * @param item - The object to return to the pool.
   */
  return(item: T): void
}
