import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSignedDocumentPackage,
  verifyReportSignature,
  buildCanonicalManifest
} from '../lib/pdfSignature.ts';
import { VerificationReport } from '../types/client.ts';

const mockReport: VerificationReport = {
  id: 'rep_test_1001',
  mediaId: 'med_test_2002',
  jobId: 'job_test_3003',
  ownerId: 'usr_analyst_1',
  reportVersion: '1.4',
  generatedAt: '2026-10-17T06:00:00.000Z',
  mediaAsset: {
    id: 'med_test_2002',
    ownerId: 'usr_analyst_1',
    mediaType: 'image',
    storageKey: 'uploads/usr_analyst_1/sample.jpg',
    originalFilename: 'evidence_camera_capture.jpg',
    mimeType: 'image/jpeg',
    fileSize: 2048576,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    perceptualHash: '1100110010101010',
    retentionUntil: '2026-11-17T06:00:00.000Z',
    createdAt: '2026-10-17T05:50:00.000Z'
  },
  userVerification: {
    accountAuthenticated: true,
    emailVerified: true,
    phoneVerified: true,
    identityVerified: true,
    biometricVerified: true,
    isSandboxVerification: false
  },
  provenance: {
    id: 'prov_test_1',
    mediaId: 'med_test_2002',
    credentialStatus: 'valid',
    claimGenerator: 'Leica C2PA Engine',
    issuer: 'Content Authenticity CA',
    signatureStatus: 'Cryptographically Valid',
    assertions: [
      { label: 'c2pa.actions', description: 'Captured with Leica M11-P' }
    ],
    checkedAt: '2026-10-17T06:00:00.000Z',
    notes: 'Valid ISO 21496-1 manifest'
  },
  findings: [
    {
      checkId: 'c2pa_check',
      analyzerId: 'c2pa_inspector',
      taskType: 'c2pa_provenance',
      modelName: 'C2PA-RS Core Engine',
      modelVersion: '0.38.1',
      provider: 'c2pa_alliance',
      status: 'passed',
      score: 1.0,
      evidence: ['Valid signature found'],
      limitations: ['Proves provenance origin, not depiction truth'],
      processingTimeMs: 45
    },
    {
      checkId: 'ela_check',
      analyzerId: 'ela_profiler',
      taskType: 'compression_forensics',
      modelName: 'Laplacian ELA Analyzer',
      modelVersion: '2.1',
      provider: 'forensic_dsp',
      status: 'passed',
      score: 0.12,
      evidence: ['Homogeneous compression profile'],
      limitations: ['Recompression can mask localized splices'],
      processingTimeMs: 80
    }
  ],
  overallStatus: 'Evidence supports recorded provenance',
  assessmentSummary: 'Multi-layer forensic analysis indicates high provenance integrity.',
  uncertaintyNotes: ['Absence of manipulation indicators does not guarantee real-world event authenticity.'],
  unavailableChecks: [],
  recommendedNextSteps: ['Archive with cryptographic timestamp token.'],
  isDemoData: false
};

test('buildCanonicalManifest creates stable manifest with cryptographic tokens', () => {
  const manifest = buildCanonicalManifest(mockReport, '2026-10-17T06:30:00.000Z');
  assert.equal(manifest.reportId, 'rep_test_1001');
  assert.equal(manifest.mediaSha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(manifest.overallStatus, 'Evidence supports recorded provenance');
  assert.ok(manifest.rfc3161TimestampToken.startsWith('RFC3161-TST-'));
  assert.ok(manifest.findingsFingerprint.includes('c2pa_check:passed:1.0000'));
});

test('createSignedDocumentPackage generates valid signature block', () => {
  const pkg = createSignedDocumentPackage(mockReport, '2026-10-17T06:30:00.000Z');
  assert.ok(pkg.payloadSha256.length === 64);
  assert.ok(pkg.signatureHex.length === 64);
  assert.ok(pkg.signatureBlock.includes('-----BEGIN VERISIGHT FORENSIC SIGNATURE BLOCK-----'));
  assert.ok(pkg.signatureBlock.includes(`Payload-Digest: ${pkg.payloadSha256}`));
  assert.ok(pkg.signatureBlock.includes(`Signature: ${pkg.signatureHex}`));

  const verification = verifyReportSignature(pkg.manifest, pkg.signatureHex, pkg.payloadSha256);
  assert.equal(verification.isValid, true);
  assert.equal(verification.computedHash, pkg.payloadSha256);
  assert.equal(verification.tamperedFields.length, 0);
});

test('verifyReportSignature detects tampering if assessment status or file hash is modified', () => {
  const pkg = createSignedDocumentPackage(mockReport, '2026-10-17T06:30:00.000Z');

  // Case 1: Tampering with overall status
  const tamperedManifest1 = {
    ...pkg.manifest,
    overallStatus: 'Potential manipulation indicators detected'
  };
  const result1 = verifyReportSignature(tamperedManifest1, pkg.signatureHex, pkg.payloadSha256);
  assert.equal(result1.isValid, false);
  assert.ok(result1.tamperedFields.includes('PayloadDigest'));

  // Case 2: Tampering with media SHA-256 hash
  const tamperedManifest2 = {
    ...pkg.manifest,
    mediaSha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  };
  const result2 = verifyReportSignature(tamperedManifest2, pkg.signatureHex, pkg.payloadSha256);
  assert.equal(result2.isValid, false);

  // Case 3: Tampering with C2PA credential status
  const tamperedManifest3 = {
    ...pkg.manifest,
    c2paCredentialStatus: 'missing'
  };
  const result3 = verifyReportSignature(tamperedManifest3, pkg.signatureHex, pkg.payloadSha256);
  assert.equal(result3.isValid, false);
});

test('generateSignedForensicPdf builds multi-page PDF document buffer without error', async () => {
  const { generateSignedForensicPdf } = await import('../lib/exportSignedPdf.ts');
  const result = generateSignedForensicPdf(mockReport, { autoDownload: false });
  assert.ok(result.doc);
  assert.ok(result.filename.startsWith('Forensic_Dossier_rep_test_1001_SIGNED.pdf'));
  assert.equal(result.signedPackage.manifest.reportId, 'rep_test_1001');

  const pdfArrayBuffer = result.doc.output('arraybuffer');
  assert.ok(pdfArrayBuffer.byteLength > 1000);
});
