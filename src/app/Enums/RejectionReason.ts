/**
 * Connection request rejection reason
 */
export enum RejectionReason {
  NotSpecified,
  ServerFull,
  InvalidToken,
  VersionMismatch,
  Error,
  AuthenticationRequired,
  Banned,
  NotWhitelisted,
  GloballyBanned,
  Geoblocked,
  Custom,
  ExpiredAuth,
  RateLimit,
  Challenge,
  InvalidChallengeKey,
  InvalidChallenge,
  Redirect,
  Delay,
  VerificationAccepted,
  VerificationRejected,
  CentralServerAuthRejected
}
