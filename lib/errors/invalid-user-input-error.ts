export class InvalidUserInputError extends Error {
  public code = 422;
  public name = 'InvalidUserInputError';

  constructor(...args: any) {
    super(...args);
    Error.captureStackTrace(this, InvalidUserInputError);
  }
}
