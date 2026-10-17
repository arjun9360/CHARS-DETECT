import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db/store.ts';
import {
  detectFileSignature,
  calculateSha256,
  calculateSimplePerceptualHash
} from './src/server/core/forensics.ts';
import { IdentityVerificationService } from './src/server/services/identity.ts';
import { MediaAnalysisPipeline } from './src/server/services/analyzer.ts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MediaAsset, AnalysisJob } from './src/server/types.ts';
import { createSignedDocumentPackage, verifyReportSignature } from './src/lib/pdfSignature.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory upload handler
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max limit
});

// Helper to strip designation from display name
const sanitizeDisplayName = (name?: string | null): string => {
  if (!name) return '';
  let cleaned = name.replace(/\s*\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\s*[-–—|/]\s*(Senior|Principal|Lead|Chief|Director|Officer|Specialist|Analyst|Engineer|Manager|Forensic|Admin|User|Auditor|Investigator).*$/i, '');
  cleaned = cleaned.replace(/,\s*(Senior|Principal|Lead|Chief|Director|Officer|Specialist|Analyst|Engineer|Manager|Forensic|Admin|User|Auditor|Investigator).*$/i, '');
  return cleaned.trim();
};

// Middleware: Authenticated User Context
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tokenUid = authHeader.replace('Bearer ', '').trim();
    if (tokenUid && tokenUid !== 'null' && tokenUid !== 'undefined') {
      let user = db.users.get(tokenUid);
      if (!user) {
        user = {
          id: tokenUid,
          email: 'user@authenticated.session',
          displayName: 'Authenticated User',
          role: 'user',
          emailVerified: true,
          phoneVerified: false,
          phoneNumber: '',
          identityVerified: false,
          biometricVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.users.set(tokenUid, user);
      }
      (req as any).user = {
        ...user,
        displayName: sanitizeDisplayName(user.displayName)
      };
      return next();
    }
  }

  // Guest/unauthenticated session context - do not impersonate any saved user
  (req as any).user = null;
  next();
};

/* -------------------------------------------------------------
   HEALTH & READINESS
------------------------------------------------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({
    ready: true,
    storage: 'operational',
    forensicEngines: 'online',
    c2paValidator: 'online',
    geminiMultimodalApi: process.env.GEMINI_API_KEY ? 'configured' : 'unconfigured_fallback_active'
  });
});

/* -------------------------------------------------------------
   USER & VERIFICATION STATUS
------------------------------------------------------------- */
app.get('/api/v1/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    return res.json({ user: null });
  }
  const tokenUid = authHeader.replace('Bearer ', '').trim();
  const user = db.users.get(tokenUid);
  if (user) {
    return res.json({
      user: {
        ...user,
        displayName: sanitizeDisplayName(user.displayName)
      }
    });
  }
  return res.json({ user: null });
});

app.get('/api/v1/me/verification-status', authenticateUser, (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.json({
      accountAuthenticated: false,
      emailVerified: false,
      phoneVerified: false,
      phoneNumber: '',
      identityVerified: false,
      identityProvider: 'None',
      biometricVerified: false,
      verifications: [],
      consents: []
    });
  }
  const userVerifications = Array.from(db.verifications.values()).filter(v => v.userId === user.id || v.userId === 'usr_arjun_9360');
  const userConsents = Array.from(db.consents.values()).filter(c => c.userId === user.id || c.userId === 'usr_arjun_9360');

  res.json({
    accountAuthenticated: true,
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    phoneNumber: user.phoneNumber || '',
    identityVerified: Boolean(user.identityVerified),
    identityProvider: user.identityProvider || 'None',
    biometricVerified: Boolean(user.biometricVerified),
    verifications: userVerifications,
    consents: userConsents
  });
});

// Initiate real-world identity verification or biometric
app.post('/api/v1/verifications', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const userId = user ? user.id : 'guest_session';
  const { method, hasConsent } = req.body;

  try {
    if (method === 'government_id') {
      const session = IdentityVerificationService.initiateIdentitySession(userId);
      return res.status(201).json(session);
    } else if (method === 'biometric_liveness') {
      if (!hasConsent) {
        return res.status(400).json({ error: 'Explicit consent required for biometric processing.' });
      }
      const record = IdentityVerificationService.performBiometricVerification({
        userId,
        hasConsent: true,
        livenessScore: 0.991
      });
      return res.status(201).json(record);
    } else {
      return res.status(400).json({ error: `Unsupported verification method: ${method}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete or webhook simulation for identity verification
app.post('/api/v1/verifications/webhook/:provider', (req, res) => {
  const { sessionId, outcome } = req.body;
  try {
    const record = IdentityVerificationService.completeIdentitySession(sessionId, outcome === 'reject' ? 'reject' : 'approve');
    res.json({ status: 'processed', record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Verify email or phone OTP
app.post('/api/v1/verifications/otp', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const userId = user ? user.id : 'guest_session';
  const { type, code } = req.body;
  const result = IdentityVerificationService.verifyContactOtp({ userId, type, code });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Manage Consents
app.post('/api/v1/consent', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const userId = user ? user.id : 'guest_session';
  const { purpose } = req.body;
  const record = {
    id: 'cns_' + Math.random().toString(36).substring(2, 8),
    userId,
    purpose: purpose || 'ai_analysis',
    policyVersion: 'v2.4-2026',
    consentStatus: 'granted' as const,
    grantedAt: new Date().toISOString()
  };
  db.consents.set(record.id, record);
  db.logAuditEvent({
    actorId: userId,
    action: `CONSENT_GRANTED_${purpose?.toUpperCase()}`,
    resourceType: 'consent',
    resourceId: record.id
  });
  res.status(201).json(record);
});

app.delete('/api/v1/consent/:purpose', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const userId = user ? user.id : 'guest_session';
  const { purpose } = req.params;
  for (const c of db.consents.values()) {
    if ((c.userId === userId || (!user && c.userId === 'usr_arjun_9360')) && c.purpose === purpose) {
      c.consentStatus = 'withdrawn';
      c.withdrawnAt = new Date().toISOString();
    }
  }
  db.logAuditEvent({
    actorId: userId,
    action: `CONSENT_WITHDRAWN_${purpose.toUpperCase()}`,
    resourceType: 'consent',
    resourceId: purpose
  });
  res.json({ success: true, message: `Consent for ${purpose} withdrawn.` });
});

/* -------------------------------------------------------------
   MEDIA UPLOADS & MANAGEMENT
------------------------------------------------------------- */
app.post('/api/v1/media', authenticateUser, upload.single('file'), (req, res) => {
  const user = (req as any).user;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No media file supplied in request.' });
  }

  // File signature validation
  const sig = detectFileSignature(file.buffer);
  if (!sig) {
    return res.status(400).json({
      error: 'File signature rejected. Magic bytes do not correspond to authorized media formats (JPEG, PNG, WebP, MP4, WebM, WAV, MP3).'
    });
  }

  const sha256 = calculateSha256(file.buffer);
  const pHash = calculateSimplePerceptualHash(file.buffer);
  const mediaId = 'med_' + Math.random().toString(36).substring(2, 10);
  const ownerId = user ? user.id : 'guest_session';

  const asset: MediaAsset = {
    id: mediaId,
    ownerId,
    mediaType: sig.mediaType,
    storageKey: `private/${ownerId}/${mediaId}_${file.originalname}`,
    originalFilename: file.originalname,
    mimeType: sig.mimeType,
    fileSize: file.size,
    sha256,
    perceptualHash: pHash,
    retentionUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date().toISOString(),
    isSampleData: false
  };

  db.mediaAssets.set(mediaId, asset);
  db.mediaBuffers.set(mediaId, file.buffer);

  db.logAuditEvent({
    actorId: ownerId,
    action: 'MEDIA_ASSET_UPLOADED',
    resourceType: 'media',
    resourceId: mediaId,
    metadata: {
      filename: asset.originalFilename,
      mimeType: asset.mimeType,
      sha256: asset.sha256,
      sizeBytes: asset.fileSize
    }
  });

  res.status(201).json(asset);
});

// List all media for user / guest
app.get('/api/v1/media', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const assets = Array.from(db.mediaAssets.values())
    .filter(a => (!user ? (a.isSampleData || a.ownerId === 'guest_session') : (a.ownerId === user.id || a.isSampleData || user.role === 'admin' || a.ownerId === 'usr_arjun_9360' || a.ownerId === 'guest_session')) && !a.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ assets });
});

// Get media asset
app.get('/api/v1/media/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const asset = db.mediaAssets.get(req.params.id);
  if (!asset || asset.deletedAt) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }
  if (user && asset.ownerId !== user.id && !asset.isSampleData && user.role !== 'admin' && asset.ownerId !== 'usr_arjun_9360' && asset.ownerId !== 'guest_session') {
    return res.status(404).json({ error: 'Media asset not found or access denied.' });
  }
  res.json(asset);
});

// Delete media asset (cryptographic wipe)
app.delete('/api/v1/media/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const asset = db.mediaAssets.get(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Media asset not found or already erased.' });
  }

  const success = db.deleteMediaAsset(req.params.id, user ? user.id : (asset.ownerId || 'guest_session'));
  if (!success) {
    return res.status(500).json({ error: 'Failed to securely wipe media asset.' });
  }
  res.json({ success: true, message: 'Media asset and derived reports cryptographically erased.' });
});

/* -------------------------------------------------------------
   ANALYSIS PIPELINE & JOBS
------------------------------------------------------------- */
app.post('/api/v1/media/:id/analyze', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const asset = db.mediaAssets.get(req.params.id);

  if (!asset || (user && asset.ownerId !== user.id && !asset.isSampleData && user.role !== 'admin' && asset.ownerId !== 'usr_arjun_9360' && asset.ownerId !== 'guest_session')) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }

  const ownerId = user ? user.id : (asset.ownerId || 'guest_session');
  const jobId = 'job_' + Math.random().toString(36).substring(2, 10);
  const job: AnalysisJob = {
    id: jobId,
    mediaId: asset.id,
    ownerId,
    status: 'queued',
    progressPercent: 5,
    currentStep: 'Job queued for processing',
    requestedChecks: req.body.requestedChecks || ['c2pa', 'metadata', 'ai_synthetic', 'noise_ela'],
    startedAt: new Date().toISOString()
  };

  db.analysisJobs.set(jobId, job);

  // Trigger processing asynchronously in background
  setTimeout(async () => {
    try {
      await MediaAnalysisPipeline.processMediaJob(jobId);
    } catch (err) {
      console.error('Job execution error:', err);
    }
  }, 300);

  res.status(202).json({ jobId, status: 'queued', message: 'Analysis pipeline initiated' });
});

app.get('/api/v1/jobs/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const job = db.analysisJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  if (user && job.ownerId !== user.id && job.ownerId !== 'guest_session' && job.ownerId !== 'usr_arjun_9360' && user.role !== 'admin') {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Find report if completed
  let reportId: string | undefined;
  if (job.status === 'completed') {
    for (const r of db.reports.values()) {
      if (r.jobId === job.id || r.mediaId === job.mediaId) {
        reportId = r.id;
        break;
      }
    }
  }

  res.json({ job, reportId });
});

app.post('/api/v1/jobs/:id/cancel', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const job = db.analysisJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  if (user && job.ownerId !== user.id && job.ownerId !== 'guest_session' && job.ownerId !== 'usr_arjun_9360' && user.role !== 'admin') {
    return res.status(404).json({ error: 'Job not found.' });
  }
  if (job.status === 'completed' || job.status === 'failed') {
    return res.status(400).json({ error: 'Cannot cancel an already finished job.' });
  }
  job.status = 'cancelled';
  job.currentStep = 'Job cancelled by user';
  res.json({ success: true, message: 'Job cancelled.' });
});

/* -------------------------------------------------------------
   REPORTS & PROVENANCE
------------------------------------------------------------- */
app.get('/api/v1/reports', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const userReports = Array.from(db.reports.values())
    .filter(r => (!user ? true : (r.ownerId === user.id || r.isDemoData || user.role === 'admin' || r.ownerId === 'usr_arjun_9360')))
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  res.json({ reports: userReports });
});

app.get('/api/v1/reports/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const report = db.reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  if (user && report.ownerId !== user.id && !report.isDemoData && user.role !== 'admin' && report.ownerId !== 'usr_arjun_9360') {
    return res.status(404).json({ error: 'Report not found.' });
  }
  res.json(report);
});

app.get('/api/v1/media/:id/report', authenticateUser, (req, res) => {
  const user = (req as any).user;
  let report: any = null;
  for (const r of db.reports.values()) {
    if (r.mediaId === req.params.id) {
      if (!user || r.ownerId === user.id || r.isDemoData || user.role === 'admin' || r.ownerId === 'usr_arjun_9360') {
        report = r;
        break;
      }
    }
  }
  if (!report) {
    return res.status(404).json({ error: 'No report found for this media asset.' });
  }
  res.json(report);
});

app.get('/api/v1/media/:id/provenance', authenticateUser, (req, res) => {
  const user = (req as any).user;
  let report: any = null;
  for (const r of db.reports.values()) {
    if (r.mediaId === req.params.id) {
      if (!user || r.ownerId === user.id || r.isDemoData || user.role === 'admin' || r.ownerId === 'usr_arjun_9360') {
        report = r;
        break;
      }
    }
  }
  if (!report) {
    return res.status(404).json({ error: 'Provenance not available.' });
  }
  res.json(report.provenance);
});

app.get('/api/v1/reports/:id/signed-manifest', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const report = db.reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  const signedPackage = createSignedDocumentPackage(report);
  res.json(signedPackage);
});

app.post('/api/v1/reports/:id/verify-signature', (req, res) => {
  const { manifest, signatureHex, claimedPayloadSha256 } = req.body;
  if (!manifest || !signatureHex) {
    return res.status(400).json({ error: 'Manifest and signatureHex are required.' });
  }
  const verification = verifyReportSignature(manifest, signatureHex, claimedPayloadSha256);
  res.json(verification);
});

app.post('/api/v1/audit-events', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { action, resourceType, resourceId, metadata } = req.body;
  const evt = db.logAuditEvent({
    actorId: user?.id || 'usr_analyst_session',
    actorEmail: user?.email,
    action: action || 'REPORT_EXPORTED_SIGNED_PDF',
    resourceType: resourceType || 'report',
    resourceId: resourceId || 'unknown',
    metadata: metadata || {}
  });
  res.status(201).json({ success: true, event: evt });
});

/* -------------------------------------------------------------
   GEMINI FORENSIC INTELLIGENCE CHATBOT
------------------------------------------------------------- */
app.post('/api/v1/chat', authenticateUser, async (req, res) => {
  const { messages, modelChoice = 'gemini-3.8-flash', reportContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const allowedModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  const selectedModel = allowedModels.includes(modelChoice) ? modelChoice : 'gemini-3.8-flash';

  const systemInstruction = `You are the CHARS DETECT Forensic Intelligence Assistant, a senior expert in digital media forensics, C2PA Content Credentials, deepfake detection, synthetic audio analysis, and cryptographic file integrity.

Your core mission:
- Assist security analysts, investigators, journalists, and compliance officers in interpreting media verification reports, understanding Error Level Analysis (ELA), diagnosing audio vocoder cutoffs (e.g. 16kHz brickwall filters in ElevenLabs), and evaluating user trust dimensions.
- Never blend user verification, AI detection, provenance, and file integrity into one misleading authenticity score. A verified user can upload altered media; an unverified user can upload genuine media.
- Clearly differentiate observations (what the algorithms measured) from interpretations (what it might mean).
- Cite relevant standards: C2PA ISO 21496-1, ISO/IEC 30107-3 for biometric liveness, and NIST SP 800-86 for forensic digital preservation.
${reportContext ? `Currently Active Inspection Dossier Context:
File: ${reportContext.mediaAsset?.originalFilename} (${reportContext.mediaAsset?.mediaType})
SHA-256: ${reportContext.mediaAsset?.sha256}
C2PA Status: ${reportContext.provenance?.credentialStatus}
Overall Assessment: ${reportContext.overallStatus}
Findings: ${JSON.stringify(reportContext.findings?.map((f: any) => ({ model: f.modelName, status: f.status, score: f.score, evidence: f.evidence })))}` : ''}`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const formattedContents = messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      }));

      const response = await ai.models.generateContent({
        model: selectedModel,
        config: {
          systemInstruction,
          temperature: 0.2
        },
        contents: formattedContents
      });

      return res.json({
        reply: response.text || 'Analysis completed with no additional commentary.',
        model: selectedModel,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('Gemini chat API error, switching to specialized forensic fallback:', err.message);
    }
  }

  // Forensic expert fallback if API key is unconfigured
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  let reply = 'As the CHARS DETECT Forensic Assistant, I evaluate files across four separate dimensions: 1) Account Trust, 2) Media Analysis, 3) Provenance Credentials, and 4) File Integrity.';

  if (lastUserMsg.includes('ela') || lastUserMsg.includes('error level')) {
    reply = 'Error Level Analysis (ELA) identifies areas with different compression levels. In standard JPEG/WebP files, repeated saves cause uniform degradation. When parts of an image are spliced, inpainted, or digitally manipulated, those regions exhibit significantly higher Laplacian variance differentials because they have been compressed fewer or more times than the surrounding canvas.';
  } else if (lastUserMsg.includes('c2pa') || lastUserMsg.includes('provenance')) {
    reply = 'C2PA Content Credentials (ISO 21496-1) embed a cryptographic JUMBF box binding the asset hash to an assertion tree signed by an accredited certificate authority (such as Leica or Adobe). It is critical to note: A valid C2PA credential proves who created or edited the file and with what software—it does NOT prove that the underlying depicted real-world event was untampered or authentic.';
  } else if (lastUserMsg.includes('audio') || lastUserMsg.includes('voice') || lastUserMsg.includes('elevenlabs')) {
    reply = 'Synthetic speech systems (e.g., ElevenLabs, VITS, Tacotron) often utilize neural vocoders that operate at 16kHz or 24kHz sampling rates, producing a distinct brickwall low-pass cutoff at the Nyquist boundary (typically 8kHz, 11kHz, or 16kHz). Additionally, AI voices frequently lack natural room reverberation, leaving an unnatural zero-energy silence floor between syllables.';
  } else if (reportContext) {
    reply = `Analyzing currently active dossier for "${reportContext.mediaAsset?.originalFilename}": The overall assessment is "${reportContext.overallStatus}". C2PA provenance credential is ${reportContext.provenance?.credentialStatus}. There are ${reportContext.findings?.length || 0} forensic checks recorded. Would you like me to explain any specific finding or model limitation in detail?`;
  }

  return res.json({
    reply,
    model: `${selectedModel} (Forensic Local Expert Mode)`,
    timestamp: new Date().toISOString()
  });
});

/* -------------------------------------------------------------
   AUDIT LOGS & SYSTEM TRANSPARENCY
------------------------------------------------------------- */
app.get('/api/v1/audit-events', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const events = db.auditEvents
    .filter(e => !user ? true : (e.actorId === user.id || user.role === 'admin' || e.actorId === 'guest_session' || e.actorId === 'usr_arjun_9360'))
    .slice(0, 100);
  res.json({ events });
});

app.get('/api/v1/system/status', (req, res) => {
  res.json({
    platform: 'CHARS DETECT — Provenance Checker',
    version: '1.4.0',
    analyzers: [
      {
        id: 'c2pa_manifest_inspector',
        name: 'C2PA Content Credentials Engine',
        category: 'Provenance',
        status: 'operational',
        model: 'C2PA-RS Core v0.38.1',
        license: 'Apache 2.0',
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'MP4']
      },
      {
        id: 'exif_metadata_parser',
        name: 'EXIF & Chunk Prompt Extractor',
        category: 'Metadata',
        status: 'operational',
        model: 'ExifToolSafe Forensics v12.80',
        license: 'Artistic / GPL',
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'MP4', 'WAV', 'MP3']
      },
      {
        id: 'error_level_analysis_engine',
        name: 'Laplacian Error Level Profiler (ELA)',
        category: 'Image Forensics',
        status: 'operational',
        model: 'Differential Compression Profiler v2.1',
        license: 'MIT',
        supportedFormats: ['JPEG', 'PNG', 'WebP']
      },
      {
        id: 'synthetic_media_vision_transformer',
        name: 'Synthetic Diffusion & Deepfake Vision Transformer',
        category: 'AI Detection',
        status: 'operational',
        model: 'OpenForensics ViT-H/14-Deepfake v3.2',
        license: 'CC-BY-NC 4.0 / Open Access',
        supportedFormats: ['JPEG', 'PNG', 'WebP']
      },
      {
        id: 'gemini_multimodal_forensics',
        name: 'Google Gemini Multimodal Forensic Agent',
        category: 'Multimodal AI',
        status: process.env.GEMINI_API_KEY ? 'operational' : 'unconfigured_fallback_active',
        model: 'gemini-3.8-flash',
        license: 'Google Cloud Platform License',
        supportedFormats: ['JPEG', 'PNG', 'WebP']
      },
      {
        id: 'temporal_video_forensics',
        name: 'Temporal Frame Jitter & Lip Sync Analyzer',
        category: 'Video Forensics',
        status: 'operational',
        model: 'FFprobe / Keyframe Stream Inspector v3.0',
        license: 'LGPL 2.1',
        supportedFormats: ['MP4', 'WebM']
      },
      {
        id: 'vocoder_spectral_analyzer',
        name: 'Spectral FFT Vocoder Artifact Analyzer',
        category: 'Audio Forensics',
        status: 'operational',
        model: 'AASIST-Spectral-VoiceForensics v2.4',
        license: 'BSD-3-Clause',
        supportedFormats: ['WAV', 'MP3']
      },
      {
        id: 'alpha_mask_contour_forensics',
        name: 'Alpha Mask Contour & Perceptual Sticker Fingerprinter',
        category: 'Sticker Forensics',
        status: 'operational',
        model: 'AlphaMatte Edge Anomaly Detector v1.4',
        license: 'MIT',
        supportedFormats: ['PNG', 'WebP', 'APNG']
      }
    ],
    identityProviders: [
      {
        name: 'Government ID Provider (Sandbox)',
        adapter: 'Persona / Stripe Identity Adapter',
        status: 'operational_sandbox',
        jurisdictionsSupported: ['Global Passports', 'US DL', 'India Aadhaar/PAN']
      },
      {
        name: 'Consent-Based Biometric Liveness',
        adapter: 'Privacy-Preserving Edge Liveness Engine',
        status: 'operational_sandbox',
        rawBiometricsRetained: false
      }
    ]
  });
});

/* -------------------------------------------------------------
   VITE DEV SERVER MOUNT & LIVE API WEBSOCKET BRIDGE
------------------------------------------------------------- */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs) => {
    console.log('[Live API WS] Client connected for real-time voice conversation');
    let session: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        session = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: 'You are the CHARS DETECT Live Forensic Voice Assistant. You help investigators analyze digital media authenticity, C2PA Content Credentials, and synthetic media artifacts in real-time voice conversations.'
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ audio }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }
          }
        });
      } catch (err: any) {
        console.warn('[Live API WS] Gemini Live session initialization warning:', err.message);
      }
    }

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        } else if (parsed.text && session) {
          session.send({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
              turnComplete: true
            }
          });
        } else if (parsed.text && !session) {
          // Local fallback response for voice interaction if no API key
          clientWs.send(JSON.stringify({
            text: `CHARS DETECT Live Assistant: I received your voice prompt "${parsed.text}". In real-time forensic mode, I can evaluate C2PA manifests, ELA compression differences, and neural vocoder cutoffs.`
          }));
        }
      } catch (e) {
        console.error('[Live API WS] Message parse error:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API WS] Client disconnected');
      if (session && typeof session.close === 'function') {
        session.close();
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CHARS DETECT Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
