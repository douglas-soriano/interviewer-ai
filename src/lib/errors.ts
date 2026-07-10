export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Resource not found") {
    super(message, "not_found", 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Invalid input") {
    super(message, "validation_error", 400);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflicting state") {
    super(message, "conflict", 409);
  }
}

export class ProviderError extends DomainError {
  constructor(message = "Upstream provider failed") {
    super(message, "provider_error", 502);
  }
}
