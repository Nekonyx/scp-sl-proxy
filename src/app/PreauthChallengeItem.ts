export class PreauthChallengeItem {
  public added: number
  public validResponse: Buffer

  public constructor(response: Buffer) {
    this.added = Date.now()
    this.validResponse = response
  }
}
