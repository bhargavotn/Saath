export class AppError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export function isStatusError(error: unknown): error is Error & { status: number; code?: string } {
  return error instanceof Error && 'status' in error && typeof (error as { status: unknown }).status === 'number';
}
