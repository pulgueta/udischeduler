export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE';

export type ErrorMetadata = Record<string, unknown>;

export type ErrorSource = {
  file: string;
  method: string;
  line?: number;
};

export class AppError extends Error {
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly code: ErrorCode;
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly statusCode: number;
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly timestamp: Date;
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly metadata?: ErrorMetadata;
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly source?: ErrorSource;
  // biome-ignore lint/nursery/useConsistentMemberAccessibility: public is consistent with the rest of the class
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode = 500,
    metadata?: ErrorMetadata,
    source?: ErrorSource,
    // biome-ignore lint: automatically set to true, can be false
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.metadata = metadata;
    this.source = source;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      metadata: this.metadata,
      source: this.source,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  static fromError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return new AppError(
      message,
      'INTERNAL_ERROR',
      500,
      undefined,
      undefined,
      false
    );
  }

  static validation(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'VALIDATION_ERROR', 400, metadata);
  }

  static notFound(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'NOT_FOUND', 404, metadata);
  }

  static unauthorized(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'UNAUTHORIZED', 401, metadata);
  }

  static forbidden(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'FORBIDDEN', 403, metadata);
  }

  static conflict(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'CONFLICT', 409, metadata);
  }

  static badRequest(message: string, metadata?: ErrorMetadata): AppError {
    return new AppError(message, 'BAD_REQUEST', 400, metadata);
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: this class is used as a utility
export class ErrorHandler {
  static handle(error: unknown) {
    const appError = AppError.fromError(error);

    // TODO: Replace with Sentry
    // console.error({
    //   message: appError.message,
    //   code: appError.code,
    //   metadata: appError.metadata,
    //   source: appError.source,
    //   stack: appError.stack,
    // });

    return appError;
  }

  static handleKnown(
    message: string,
    code?: AppError['code'],
    metadata?: AppError
  ) {
    const appError = AppError.fromError({
      ...metadata,
      message,
      code,
    });

    // TODO: Replace with Sentry
    // console.error({
    //   message: appError.message,
    //   code: appError.code,
    //   metadata: appError.metadata,
    //   source: appError.source,
    //   stack: appError.stack,
    // });

    return appError;
  }
}
