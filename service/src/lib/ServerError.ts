export class ServerError extends Error {
  public code: number

  constructor(code: number, message: string) {
    super(message)

    this.code = code ?? 500
    this.message = message
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}
