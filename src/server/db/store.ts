import {
  UserProfile,
  VerificationRecord,
  ConsentRecord,
  MediaAsset,
  AnalysisJob,
  VerificationReport,
  AuditEvent,
  ProvenanceDetails,
  AnalyzerFinding
} from '../types.ts';
import { calculateSha256 } from '../core/forensics.ts';

class DatabaseStore {
  public users: Map<string, UserProfile> = new Map();
  public verifications: Map<string, VerificationRecord> = new Map();
  public consents: Map<string, ConsentRecord> = new Map();
  public mediaAssets: Map<string, MediaAsset> = new Map();
  public mediaBuffers: Map<string, Buffer> = new Map();
  public analysisJobs: Map<string, AnalysisJob> = new Map();
  public reports: Map<string, VerificationReport> = new Map();
  public auditEvents: AuditEvent[] = [];

  constructor() {
    this.seedDefaultState();
  }

  private seedDefaultState() {
    // Primary test user
    const defaultUser: UserProfile = {
      id: 'usr_arjun_9360',
      email: 'arjun936053@gmail.com',
      displayName: 'Arjun R.',
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
      phoneNumber: '+1 (555) 019-2834',
      identityVerified: true,
      identityProvider: 'Persona Sandbox Gov-ID Adapter',
      biometricVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(defaultUser.id, defaultUser);

    // Initial consents
    this.consents.set('cns_1', {
      id: 'cns_1',
      userId: defaultUser.id,
      purpose: 'ai_analysis',
      policyVersion: 'v2.4-2026',
      consentStatus: 'granted',
      grantedAt: new Date(Date.now() - 86400000 * 10).toISOString()
    });

    this.consents.set('cns_2', {
      id: 'cns_2',
      userId: defaultUser.id,
      purpose: 'biometric_verification',
      policyVersion: 'v2.4-2026',
      consentStatus: 'granted',
      grantedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    });

    // Verification records
    this.verifications.set('ver_id_1', {
      id: 'ver_id_1',
      userId: defaultUser.id,
      method: 'government_id',
      status: 'verified',
      provider: 'Stripe/Persona Identity Mock Adapter',
      providerReference: 'sandbox_session_7f9a2c1b',
      verifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      isSandbox: true,
      details: { documentType: 'passport', jurisdiction: 'IN/US', livenessConfidence: 0.98 }
    });

    this.verifications.set('ver_bio_1', {
      id: 'ver_bio_1',
      userId: defaultUser.id,
      method: 'biometric_liveness',
      status: 'verified',
      provider: 'Edge-Face Liveness Engine (Local)',
      providerReference: 'bio_chk_9182a3',
      verifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      isSandbox: true,
      details: { passiveLivenessScore: 0.992, depthCheckPassed: true }
    });

    // Audit logs
    this.logAuditEvent({
      actorId: defaultUser.id,
      actorEmail: defaultUser.email,
      action: 'USER_LOGIN_SESSION_ESTABLISHED',
      resourceType: 'session',
      resourceId: defaultUser.id,
      metadata: { ip: '127.0.0.1', userAgent: 'Chromium/Headless' }
    });

    this.seedBenchmarkSamples(defaultUser.id);
  }

  private seedBenchmarkSamples(userId: string) {
    // 1. Authentic Image with C2PA Credentials (Leica M11-P capture)
    const authenticBuffer = Buffer.from(
      'RIFF-SIM-JPEG-EXIF-IFD0-Make-Leica-Model-M11P-c2pa-jumb-manifest-Leica M11-P Content Credentials-SHA256-verified-contentauthenticity-ok'
    );
    const mediaAuthId = 'med_authentic_c2pa';
    const authSha = calculateSha256(authenticBuffer);
    this.mediaBuffers.set(mediaAuthId, authenticBuffer);
    const authAsset: MediaAsset = {
      id: mediaAuthId,
      ownerId: userId,
      mediaType: 'image',
      storageKey: `uploads/${userId}/leica_raw_capture_2026.jpg`,
      originalFilename: 'leica_m11p_street_scene_c2pa.jpg',
      mimeType: 'image/jpeg',
      fileSize: 4289120,
      sha256: authSha,
      perceptualHash: 'e4a2c10b89f310aa',
      dimensions: { width: 4096, height: 2732 },
      retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      isSampleData: true,
      sampleLabel: 'Authentic Photo (C2PA Valid)'
    };
    this.mediaAssets.set(mediaAuthId, authAsset);

    // Report for Authentic sample
    this.reports.set('rep_authentic_c2pa', {
      id: 'rep_authentic_c2pa',
      mediaId: mediaAuthId,
      jobId: 'job_auth_1',
      ownerId: userId,
      reportVersion: 'v1.4.0',
      generatedAt: new Date(Date.now() - 3600000 * 3.8).toISOString(),
      mediaAsset: authAsset,
      userVerification: {
        accountAuthenticated: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        biometricVerified: true,
        isSandboxVerification: true
      },
      provenance: {
        id: 'prov_auth_1',
        mediaId: mediaAuthId,
        credentialStatus: 'valid',
        claimGenerator: 'Leica M11-P Content Credentials Engine v2.0',
        issuer: 'Leica Camera AG Root Authority',
        signatureStatus: 'Cryptographically Valid (RSA-4096)',
        signingTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        assertions: [
          { label: 'c2pa.actions', description: 'Original camera capture with no destructive edits' },
          { label: 'c2pa.hash.data', description: 'Exact byte binding matches computed SHA-256' },
          { label: 'stds.schema-org.CreativeWork', description: 'Author: Verified Photographer' }
        ],
        referenceHashComparison: {
          suppliedHash: authSha,
          calculatedHash: authSha,
          match: true
        },
        checkedAt: new Date(Date.now() - 3600000 * 3.8).toISOString(),
        notes: 'C2PA JUMBF container signature cryptographically verified against Leica root CA.'
      },
      findings: [
        {
          checkId: 'chk_1',
          analyzerId: 'c2pa_manifest_inspector',
          taskType: 'c2pa_provenance',
          modelName: 'C2PA-RS Verification Core',
          modelVersion: 'v0.38.1',
          provider: 'c2pa_alliance',
          status: 'passed',
          score: 1.0,
          scoreType: 'confidence',
          evidence: ['Valid signature', 'Chain anchored to Leica Trust Anchor', 'No tampering in assertion tree'],
          limitations: ['Valid credential indicates provenance record integrity, not external real-world truth.'],
          processingTimeMs: 42
        },
        {
          checkId: 'chk_2',
          analyzerId: 'noise_ela_variance',
          taskType: 'compression_forensics',
          modelName: 'Laplacian Error Level Profiler',
          modelVersion: 'v2.1',
          provider: 'local_deterministic',
          status: 'passed',
          score: 0.12,
          scoreType: 'anomaly_index',
          evidence: ['Uniform sensor noise distribution', 'Standard JPEG quantization tables'],
          limitations: ['Uniform compression does not guarantee absence of subtle color grading.'],
          processingTimeMs: 88
        }
      ],
      overallStatus: 'Evidence supports recorded provenance',
      assessmentSummary: 'Cryptographic C2PA provenance manifest from Leica Camera AG is valid and intact. No manipulation or synthetic anomalies were identified.',
      uncertaintyNotes: ['Provenance credentials confirm device capture history but cannot verify whether physical staging took place.'],
      unavailableChecks: [],
      recommendedNextSteps: ['Archival preservation of original signed C2PA manifest.'],
      isDemoData: true
    });

    // 2. Synthetic AI-generated image (Midjourney v6 artifact)
    const aiImageBuffer = Buffer.from(
      'RIFF-PNG-Midjourney v6 --ar 16:9 prompt: cinematic cybernetic operative portrait, volumetric lighting, photorealistic parameters: Steps: 30, Sampler: DPM++ 2M Karras'
    );
    const mediaAiId = 'med_ai_midjourney';
    const aiSha = calculateSha256(aiImageBuffer);
    this.mediaBuffers.set(mediaAiId, aiImageBuffer);
    const aiAsset: MediaAsset = {
      id: mediaAiId,
      ownerId: userId,
      mediaType: 'image',
      storageKey: `uploads/${userId}/cyber_operative_midjourney.png`,
      originalFilename: 'cyber_operative_concept_v6.png',
      mimeType: 'image/png',
      fileSize: 3128440,
      sha256: aiSha,
      perceptualHash: 'c7d9e1f2a344901b',
      dimensions: { width: 1792, height: 1024 },
      retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isSampleData: true,
      sampleLabel: 'Synthetic AI Image (Midjourney)'
    };
    this.mediaAssets.set(mediaAiId, aiAsset);

    // Report for AI image
    this.reports.set('rep_ai_midjourney', {
      id: 'rep_ai_midjourney',
      mediaId: mediaAiId,
      jobId: 'job_ai_1',
      ownerId: userId,
      reportVersion: 'v1.4.0',
      generatedAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
      mediaAsset: aiAsset,
      userVerification: {
        accountAuthenticated: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        biometricVerified: true,
        isSandboxVerification: true
      },
      provenance: {
        id: 'prov_ai_1',
        mediaId: mediaAiId,
        credentialStatus: 'missing',
        assertions: [],
        checkedAt: new Date(Date.now() - 3600000 * 1.9).toISOString(),
        notes: 'No C2PA manifest detected in binary streams.'
      },
      findings: [
        {
          checkId: 'chk_ai_meta',
          analyzerId: 'metadata_prompt_detector',
          taskType: 'metadata',
          modelName: 'EXIF/Chunk Text Forensic Extractor',
          modelVersion: 'v1.8',
          provider: 'local_deterministic',
          status: 'findings_detected',
          score: 0.99,
          scoreType: 'confidence',
          evidence: [
            'Detected signature: Midjourney Synthetic Generation Signature',
            'Embedded generation parameters found: "Steps: 30, Sampler: DPM++ 2M Karras"',
            'Text chunk contains generation prompt parameters'
          ],
          limitations: ['Prompt metadata can be stripped or fabricated, though presence indicates synthetic origin.'],
          processingTimeMs: 15
        },
        {
          checkId: 'chk_ai_vit',
          analyzerId: 'synthetic_media_vision_transformer',
          taskType: 'synthetic_detection',
          modelName: 'OpenForensics ViT-H/14-Deepfake',
          modelVersion: 'v3.2.0',
          provider: 'local_deterministic',
          status: 'findings_detected',
          score: 0.942,
          scoreType: 'probability',
          evidence: [
            'High frequency spectral roll-off indicative of diffusion upsampling',
            'Symmetry artifacts in pupil geometry and skin pore micro-texture',
            'Diffusion latent space residual pattern detected'
          ],
          limitations: ['Model trained primarily on public diffusion checkpoints; novel generative models may evade.'],
          processingTimeMs: 240
        }
      ],
      overallStatus: 'Potential manipulation indicators detected',
      assessmentSummary: 'Corroborating indicators of AI synthesis detected: embedded Midjourney workflow metadata and ViT diffusion artifact score of 94.2%.',
      uncertaintyNotes: ['Model classification is probabilistic; uncompressed generation source is required for absolute confirmation.'],
      unavailableChecks: [],
      recommendedNextSteps: ['Treat image as synthetic illustration; do not cite as photographic evidence.'],
      isDemoData: true
    });

    // 3. Synthetic Audio Recording (ElevenLabs Voice Clone)
    const audioBuffer = Buffer.from(
      'RIFF....WAVEfmt ElevenLabs Synthesizer Voice Model v2.5 - Nyquist Cutoff 16000Hz vocoder phase discontinuity'
    );
    const mediaAudioId = 'med_audio_synth';
    const audioSha = calculateSha256(audioBuffer);
    this.mediaBuffers.set(mediaAudioId, audioBuffer);
    const audioAsset: MediaAsset = {
      id: mediaAudioId,
      ownerId: userId,
      mediaType: 'audio',
      storageKey: `uploads/${userId}/audio_voice_clone_clip.wav`,
      originalFilename: 'ceo_urgent_wire_transfer_memo.wav',
      mimeType: 'audio/wav',
      fileSize: 1845200,
      sha256: audioSha,
      durationSeconds: 18.4,
      retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      isSampleData: true,
      sampleLabel: 'Synthetic Speech (Cloned Voice)'
    };
    this.mediaAssets.set(mediaAudioId, audioAsset);

    this.reports.set('rep_audio_synth', {
      id: 'rep_audio_synth',
      mediaId: mediaAudioId,
      jobId: 'job_audio_1',
      ownerId: userId,
      reportVersion: 'v1.4.0',
      generatedAt: new Date(Date.now() - 3600000 * 1.4).toISOString(),
      mediaAsset: audioAsset,
      userVerification: {
        accountAuthenticated: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        biometricVerified: true,
        isSandboxVerification: true
      },
      provenance: {
        id: 'prov_audio_1',
        mediaId: mediaAudioId,
        credentialStatus: 'missing',
        assertions: [],
        checkedAt: new Date(Date.now() - 3600000 * 1.4).toISOString(),
        notes: 'No C2PA audio credentials present.'
      },
      findings: [
        {
          checkId: 'chk_aud_spec',
          analyzerId: 'vocoder_spectral_analyzer',
          taskType: 'audio_spectral',
          modelName: 'AASIST-Spectral-VoiceForensics',
          modelVersion: 'v2.2',
          provider: 'forensic_dsp',
          status: 'findings_detected',
          score: 0.91,
          scoreType: 'probability',
          evidence: [
            'Sharp brickwall low-pass cutoff at 16.0 kHz characteristic of neural vocoders',
            'Unnatural zero-energy silence floor between syllables (missing room acoustic ambience)',
            'Detected signature: ElevenLabs Voice Synthesizer Marker'
          ],
          limitations: ['Heavy MP3 compression can occasionally simulate sharp high-frequency attenuation.'],
          processingTimeMs: 145
        }
      ],
      overallStatus: 'Potential manipulation indicators detected',
      assessmentSummary: 'Audio exhibit displays neural vocoder spectral artifacts and ElevenLabs generation signatures consistent with synthetic voice cloning.',
      uncertaintyNotes: ['Does not identify the specific human identity attempted to be mimicked without a reference voice biometric sample.'],
      unavailableChecks: [],
      recommendedNextSteps: ['Request out-of-band phone/video verification with the claimed speaker.'],
      isDemoData: true
    });

    // 4. Manipulated Video (Face-swap deepfake)
    const videoBuffer = Buffer.from(
      '00000018ftypisom-video-stream-h264-face-boundary-temporal-inconsistency'
    );
    const mediaVideoId = 'med_video_deepfake';
    const videoSha = calculateSha256(videoBuffer);
    this.mediaBuffers.set(mediaVideoId, videoBuffer);
    const videoAsset: MediaAsset = {
      id: mediaVideoId,
      ownerId: userId,
      mediaType: 'video',
      storageKey: `uploads/${userId}/politician_briefing_edit.mp4`,
      originalFilename: 'press_conference_clip_hd.mp4',
      mimeType: 'video/mp4',
      fileSize: 14205100,
      sha256: videoSha,
      dimensions: { width: 1920, height: 1080 },
      durationSeconds: 12.5,
      retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      isSampleData: true,
      sampleLabel: 'Deepfake Video (Face Re-enactment)'
    };
    this.mediaAssets.set(mediaVideoId, videoAsset);

    this.reports.set('rep_video_deepfake', {
      id: 'rep_video_deepfake',
      mediaId: mediaVideoId,
      jobId: 'job_vid_1',
      ownerId: userId,
      reportVersion: 'v1.4.0',
      generatedAt: new Date(Date.now() - 3600000 * 0.9).toISOString(),
      mediaAsset: videoAsset,
      userVerification: {
        accountAuthenticated: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        biometricVerified: true,
        isSandboxVerification: true
      },
      provenance: {
        id: 'prov_vid_1',
        mediaId: mediaVideoId,
        credentialStatus: 'missing',
        assertions: [],
        checkedAt: new Date(Date.now() - 3600000 * 0.9).toISOString(),
        notes: 'No C2PA manifest found in video container.'
      },
      findings: [
        {
          checkId: 'chk_vid_face',
          analyzerId: 'temporal_face_consistency',
          taskType: 'synthetic_detection',
          modelName: 'EfficientNet-B7 FaceForensics++',
          modelVersion: 'v4.1',
          provider: 'local_deterministic',
          status: 'findings_detected',
          score: 0.88,
          scoreType: 'probability',
          evidence: [
            'Inter-frame boundary blurring around jawline at frames 42-88',
            'Blink cadence anomaly (0 blinks in 12.5 seconds)',
            'Discrepancy between ear lighting and cheek specular highlights'
          ],
          limitations: ['Analyzed 30 sampled keyframes; unstamped frames were skipped for latency optimization.'],
          processingTimeMs: 410
        }
      ],
      overallStatus: 'Potential manipulation indicators detected',
      assessmentSummary: 'Keyframe sampling revealed spatial face boundary inconsistencies and unnatural blinking cadence.',
      uncertaintyNotes: ['Frame compression artifacts can occasionally mimic boundary blurring.'],
      unavailableChecks: [],
      recommendedNextSteps: ['Inspect high-bitrate broadcast master recording.'],
      isDemoData: true
    });
  }

  public logAuditEvent(params: {
    actorId: string;
    actorEmail?: string;
    action: string;
    resourceType: 'media' | 'report' | 'verification' | 'consent' | 'session';
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): AuditEvent {
    const event: AuditEvent = {
      id: 'aud_' + Math.random().toString(36).substring(2, 10),
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      createdAt: new Date().toISOString(),
      metadata: params.metadata || {}
    };
    this.auditEvents.unshift(event);
    if (this.auditEvents.length > 500) {
      this.auditEvents.pop();
    }
    return event;
  }

  public deleteMediaAsset(mediaId: string, actorId: string): boolean {
    const asset = this.mediaAssets.get(mediaId);
    if (!asset) return false;

    // Secure cryptographic wipe: overwrite buffer with zeros before deleting
    const buf = this.mediaBuffers.get(mediaId);
    if (buf) {
      buf.fill(0);
      this.mediaBuffers.delete(mediaId);
    }

    asset.deletedAt = new Date().toISOString();
    this.mediaAssets.delete(mediaId);

    // Delete associated reports
    for (const [repId, report] of this.reports.entries()) {
      if (report.mediaId === mediaId) {
        this.reports.delete(repId);
      }
    }

    this.logAuditEvent({
      actorId,
      action: 'MEDIA_ASSET_SECURE_CRYPTOGRAPHIC_DELETION',
      resourceType: 'media',
      resourceId: mediaId,
      metadata: { originalFilename: asset.originalFilename, wipedSha256: asset.sha256 }
    });

    return true;
  }
}

export const db = new DatabaseStore();
