export class ControllerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ControllerError';
    this.error = message;
  }
}