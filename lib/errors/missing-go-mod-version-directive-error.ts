export class MissingGoModVersionDirectiveError extends Error {
  public code = 422;
  public name = 'MissingGoModVersionDirectiveError';

  constructor(...args: any) {
    super(...args);
    Error.captureStackTrace(this, MissingGoModVersionDirectiveError);
  }
}
