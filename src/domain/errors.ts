export type ValidationCode =
  | 'INVALID_NAME'
  | 'INVALID_CAPACITY'
  | 'INVALID_RESOURCE'
  | 'DUPLICATE_ROOM'
  | 'ROOM_NOT_FOUND'
  | 'INVALID_OWNER'
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'END_BEFORE_START'
  | 'IN_THE_PAST'
  | 'OUTSIDE_BUSINESS_HOURS'
  | 'MAX_DURATION_EXCEEDED'
  | 'TIME_CONFLICT'
  | 'RESERVATION_NOT_FOUND'

export class ValidationError extends Error {
  readonly code: ValidationCode

  constructor(code: ValidationCode, message: string) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
  }
}
