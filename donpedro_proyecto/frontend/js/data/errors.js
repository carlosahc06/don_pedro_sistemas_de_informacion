export class StoreError extends Error {
  constructor(message, code = "validation_error") {
    super(message);
    this.code = code;
  }
}

