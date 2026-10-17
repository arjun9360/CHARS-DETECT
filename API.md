# REST API Specification (v1)

Base URL: `http://localhost:3000`

## Health & Probes
- `GET /health` -> Liveness check returning status, timestamp, uptime.
- `GET /ready` -> Readiness probe checking forensic engines, storage, and C2PA validator.

## User & Verification Status
- `GET /api/v1/me` -> Authenticated user profile.
- `GET /api/v1/me/verification-status` -> Returns multi-tier verification status and consent history.
- `POST /api/v1/verifications` -> Initiates identity (`government_id`) or biometric (`biometric_liveness`) verification session.
- `POST /api/v1/verifications/webhook/:provider` -> Provider callback simulation (approves or rejects sandbox session).
- `POST /api/v1/verifications/otp` -> Validates 6-digit email or SMS OTP.
- `POST /api/v1/consent` -> Grants purpose-specific consent.
- `DELETE /api/v1/consent/:purpose` -> Withdraws consent.

## Media Management
- `POST /api/v1/media` -> Accepts `multipart/form-data` with `file`. Performs magic-byte inspection, calculates byte SHA-256 and perceptual dHash. Returns `MediaAsset`.
- `GET /api/v1/media` -> Lists all non-deleted media assets for current user.
- `GET /api/v1/media/:id` -> Retrieves specific media asset metadata.
- `DELETE /api/v1/media/:id` -> Cryptographically zero-fills media byte buffer, unlinks reports, and writes immutable audit event.

## Forensic Analysis & Jobs
- `POST /api/v1/media/:id/analyze` -> Dispatches asynchronous analysis job with `requestedChecks`. Returns `{ jobId, status: "queued" }`.
- `GET /api/v1/jobs/:id` -> Polls job status (`queued`, `validating`, `processing`, `completed`, `failed`), step logs, and progress percentage.
- `POST /api/v1/jobs/:id/cancel` -> Cancels queued or processing job.

## Reports & Provenance
- `GET /api/v1/reports` -> Lists all verification reports for user.
- `GET /api/v1/reports/:id` -> Retrieves complete verification dossier.
- `GET /api/v1/media/:id/report` -> Retrieves report by media ID.
- `GET /api/v1/media/:id/provenance` -> Retrieves C2PA manifest assertions and signature verification status.

## Audit Logs & System Health
- `GET /api/v1/audit-events` -> Retrieves immutable audit events.
- `GET /api/v1/system/status` -> Retrieves analyzer registry, model cards, and provider status.
