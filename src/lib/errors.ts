export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Known error codes:
// WORKSPACE_NOT_FOUND         – no workspace with given id exists (or soft-deleted)
// PARTICIPANT_ALREADY_EXISTS  – userId is already a participant of the workspace
// LAST_OWNER_CANNOT_BE_REMOVED – removing/demoting this user would leave no owner
// UNAUTHORIZED                – caller lacks permission for the requested operation
