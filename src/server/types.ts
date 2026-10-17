import { MediaType, OverallAssessmentStatus } from './core/forensics.ts';

export type JobStatus =
  | 'queued'
  | 'validating'
  | 'processing'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'cancelled';

export type CheckStatus =
  | 'passed'
  | 'findings_detected'
  | 'inconclusive'
  | 'not_evaluated'
  | 'unavailable'
  | 'failed';

export type VerificationMethod =
  | 'email_otp'
  | 'phone_otp'
  | 'government_id'
  | 'biometric_liveness'
  | 'biometric_voice';

export type VerificationState =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'unavailable';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'operator';
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  identityVerified: boolean;
  identityProvider?: string;
  biometricVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRecord {
  id: string;
  userId: string;
  method: VerificationMethod;
  status: VerificationState;
  provider: string;
  providerReference: string;
  consentRecordId?: string;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
  isSandbox: boolean;
  details?: Record<string, unknown>;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: 'ai_analysis' | 'biometric_verification' | 'identity_verification' | 'telemetry_retention';
  policyVersion: string;
  consentStatus: 'granted' | 'withdrawn';
  grantedAt: string;
  withdrawnAt?: string;
}

export interface MediaAsset {
  id: string;
  ownerId: string;
  mediaType: MediaType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  perceptualHash?: string;
  dimensions?: { width: number; height: number };
  durationSeconds?: number;
  retentionUntil: string;
  createdAt: string;
  deletedAt?: string;
  isSampleData?: boolean;
  sampleLabel?: string;
}

export interface AnalysisJob {
  id: string;
  mediaId: string;
  ownerId: string;
  status: JobStatus;
  progressPercent: number;
  currentStep: string;
  requestedChecks: string[];
  startedAt: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface AnalyzerFinding {
  checkId: string;
  analyzerId: string;
  taskType: 'metadata' | 'c2pa_provenance' | 'synthetic_detection' | 'compression_forensics' | 'multimodal_ai' | 'audio_spectral';
  modelName: string;
  modelVersion: string;
  provider: 'local_deterministic' | 'google_genai' | 'c2pa_alliance' | 'forensic_dsp';
  status: CheckStatus;
  score?: number;
  scoreType?: 'probability' | 'similarity' | 'anomaly_index' | 'confidence';
  evidence: string[];
  limitations: string[];
  processingTimeMs: number;
}

export interface ProvenanceDetails {
  id: string;
  mediaId: string;
  credentialStatus: 'valid' | 'invalid' | 'missing' | 'unverifiable' | 'unsupported';
  claimGenerator?: string;
  issuer?: string;
  signatureStatus?: string;
  signingTime?: string;
  assertions: Array<{ label: string; description: string }>;
  referenceHashComparison?: {
    suppliedHash?: string;
    calculatedHash: string;
    match: boolean;
  };
  checkedAt: string;
  notes: string;
}

export interface VerificationReport {
  id: string;
  mediaId: string;
  jobId: string;
  ownerId: string;
  reportVersion: string;
  generatedAt: string;
  mediaAsset: MediaAsset;
  userVerification: {
    accountAuthenticated: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    biometricVerified: boolean;
    isSandboxVerification: boolean;
  };
  provenance: ProvenanceDetails;
  findings: AnalyzerFinding[];
  overallStatus: OverallAssessmentStatus;
  assessmentSummary: string;
  uncertaintyNotes: string[];
  unavailableChecks: string[];
  recommendedNextSteps: string[];
  isDemoData: boolean;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  resourceType: 'media' | 'report' | 'verification' | 'consent' | 'session';
  resourceId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}
