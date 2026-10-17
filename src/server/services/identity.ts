import { db } from '../db/store.ts';
import { VerificationRecord, VerificationMethod, VerificationState } from '../types.ts';

export interface VerificationSessionResponse {
  sessionId: string;
  provider: string;
  redirectUrl?: string;
  status: VerificationState;
  method: VerificationMethod;
  isSandbox: boolean;
  expiresAt: string;
  instructions: string;
}

export class IdentityVerificationService {
  /**
   * Start a real-world identity verification session
   */
  public static initiateIdentitySession(userId: string): VerificationSessionResponse {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    const sessionId = 'id_sess_' + Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + 1800000).toISOString(); // 30 min expiration

    const record: VerificationRecord = {
      id: 'ver_id_' + Math.random().toString(36).substring(2, 9),
      userId,
      method: 'government_id',
      status: 'pending',
      provider: 'Persona / Stripe Identity Adapter (Sandbox)',
      providerReference: sessionId,
      createdAt: new Date().toISOString(),
      expiresAt,
      isSandbox: true,
      details: {
        sessionType: 'document_and_selfie',
        supportedDocuments: ['passport', 'national_id', 'drivers_license'],
        environment: 'sandbox'
      }
    };

    db.verifications.set(record.id, record);
    db.logAuditEvent({
      actorId: userId,
      action: 'IDENTITY_VERIFICATION_SESSION_INITIATED',
      resourceType: 'verification',
      resourceId: record.id,
      metadata: { sessionId, provider: record.provider, isSandbox: true }
    });

    return {
      sessionId,
      provider: record.provider,
      status: record.status,
      method: record.method,
      isSandbox: true,
      expiresAt,
      instructions: 'Complete document capture in sandbox interface. No real identity documents are uploaded or stored.'
    };
  }

  /**
   * Complete or simulate callback webhook from identity provider
   */
  public static completeIdentitySession(sessionId: string, outcome: 'approve' | 'reject'): VerificationRecord {
    let foundRecord: VerificationRecord | undefined;
    for (const record of db.verifications.values()) {
      if (record.providerReference === sessionId) {
        foundRecord = record;
        break;
      }
    }

    if (!foundRecord) {
      throw new Error('Verification session reference not found');
    }

    if (outcome === 'approve') {
      foundRecord.status = 'verified';
      foundRecord.verifiedAt = new Date().toISOString();
      const user = db.users.get(foundRecord.userId);
      if (user) {
        user.identityVerified = true;
        user.identityProvider = foundRecord.provider;
        user.updatedAt = new Date().toISOString();
      }
    } else {
      foundRecord.status = 'rejected';
      const user = db.users.get(foundRecord.userId);
      if (user) {
        user.identityVerified = false;
        user.updatedAt = new Date().toISOString();
      }
    }

    db.logAuditEvent({
      actorId: foundRecord.userId,
      action: `IDENTITY_VERIFICATION_${foundRecord.status.toUpperCase()}`,
      resourceType: 'verification',
      resourceId: foundRecord.id,
      metadata: { outcome, isSandbox: foundRecord.isSandbox }
    });

    return foundRecord;
  }

  /**
   * Perform consent-checked biometric liveness check
   */
  public static performBiometricVerification(params: {
    userId: string;
    hasConsent: boolean;
    livenessScore?: number;
  }): VerificationRecord {
    const { userId, hasConsent, livenessScore = 0.985 } = params;
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    if (!hasConsent) {
      throw new Error('Explicit consent is legally required before processing biometric telemetry.');
    }

    // Record consent
    const consentRecord = {
      id: 'cns_bio_' + Math.random().toString(36).substring(2, 8),
      userId,
      purpose: 'biometric_verification' as const,
      policyVersion: 'v2.4-2026',
      consentStatus: 'granted' as const,
      grantedAt: new Date().toISOString()
    };
    db.consents.set(consentRecord.id, consentRecord);

    const record: VerificationRecord = {
      id: 'ver_bio_' + Math.random().toString(36).substring(2, 9),
      userId,
      method: 'biometric_liveness',
      status: livenessScore > 0.85 ? 'verified' : 'rejected',
      provider: 'Privacy-Preserving Edge Liveness Engine',
      providerReference: 'bio_' + Math.random().toString(36).substring(2, 10),
      consentRecordId: consentRecord.id,
      verifiedAt: livenessScore > 0.85 ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      isSandbox: true,
      details: {
        livenessScore,
        rawBiometricsRetained: false, // Critical privacy requirement
        antiSpoofingChallenge: 'head_nod_and_blink_cadence'
      }
    };

    db.verifications.set(record.id, record);
    if (record.status === 'verified') {
      user.biometricVerified = true;
      user.updatedAt = new Date().toISOString();
    }

    db.logAuditEvent({
      actorId: userId,
      action: 'BIOMETRIC_VERIFICATION_COMPLETED',
      resourceType: 'verification',
      resourceId: record.id,
      metadata: { status: record.status, livenessScore, rawBiometricsRetained: false }
    });

    return record;
  }

  /**
   * Email/Phone OTP Verification Simulator
   */
  public static verifyContactOtp(params: {
    userId: string;
    type: 'email' | 'phone';
    code: string;
  }): { success: boolean; message: string } {
    const { userId, type, code } = params;
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    // For test purposes, any 6-digit code or "123456" completes verification
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return { success: false, message: 'Invalid OTP format. Must be 6 numerical digits.' };
    }

    if (type === 'email') {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }
    user.updatedAt = new Date().toISOString();

    db.logAuditEvent({
      actorId: userId,
      action: `CONTACT_${type.toUpperCase()}_OTP_VERIFIED`,
      resourceType: 'session',
      resourceId: userId,
      metadata: { type }
    });

    return { success: true, message: `${type === 'email' ? 'Email address' : 'Phone number'} successfully verified.` };
  }
}
