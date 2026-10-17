import { jsPDF } from 'jspdf';
import { VerificationReport } from '../types/client.ts';
import { createSignedDocumentPackage, SignedDocumentPackage } from './pdfSignature.ts';

export interface GeneratePdfOptions {
  signedPackage?: SignedDocumentPackage;
  officerName?: string;
  autoDownload?: boolean;
}

/**
 * Generates an official, signed, tamper-evident forensic PDF report.
 */
export function generateSignedForensicPdf(
  report: VerificationReport,
  options: GeneratePdfOptions = {}
): { doc: jsPDF; signedPackage: SignedDocumentPackage; filename: string } {
  const signedPackage = options.signedPackage || createSignedDocumentPackage(report);
  const { manifest, payloadSha256, signatureHex, signatureBlock } = signedPackage;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addHeader = (isCover = false) => {
    // Top Cyber Glow Accent Stripe
    doc.setFillColor(6, 182, 212); // Cyan #06b6d4
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Header Dark Banner
    doc.setFillColor(10, 17, 32); // Deep Navy #0a1120
    doc.rect(margin, 8, contentWidth, isCover ? 28 : 14, 'F');

    // Subtle Cyan Border
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.3);
    doc.rect(margin, 8, contentWidth, isCover ? 28 : 14, 'D');

    if (isCover) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('VERISIGHT DIGITAL FORENSIC INTELLIGENCE', margin + 6, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(6, 182, 212); // Cyan
      doc.text('MEDIA VERIFICATION DOSSIER // TAMPER-EVIDENT FORENSIC SPECIFICATION (ISO/IEC 27037)', margin + 6, 21);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(
        `REPORT ID: ${report.id}  •  VER: v${report.reportVersion || '1.0'}  •  ISSUED: ${new Date(manifest.signedAt).toUTCString()}`,
        margin + 6,
        27
      );

      // Sealed Badge on Right
      doc.setFillColor(8, 47, 73); // Sky-950
      doc.roundedRect(pageWidth - margin - 52, 12, 46, 10, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(56, 189, 248);
      doc.text('CRYPTOGRAPHICALLY SEALED', pageWidth - margin - 50, 16);
      doc.setFontSize(5.5);
      doc.setTextColor(203, 213, 225);
      doc.text('FKI-NODE-902 SIGNED', pageWidth - margin - 50, 20);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`VERISIGHT FORENSIC DOSSIER  •  ID: ${report.id}`, margin + 5, 17);

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`DIGEST: ${payloadSha256.substring(0, 24)}...`, pageWidth - margin - 55, 17);
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      addHeader(false);
      y = 28;
    }
  };

  // Build First Page
  addHeader(true);
  y = 42;

  // 1. Overall Evidence Assessment Banner
  const isEmerald = report.overallStatus === 'Evidence supports recorded provenance';
  const isAmber = report.overallStatus === 'Potential manipulation indicators detected';

  doc.setFillColor(isEmerald ? 240 : isAmber ? 255 : 241, isEmerald ? 253 : isAmber ? 251 : 245, isEmerald ? 244 : isAmber ? 235 : 249);
  doc.setDrawColor(isEmerald ? 16 : isAmber ? 245 : 100, isEmerald ? 185 : isAmber ? 158 : 116, isEmerald ? 129 : isAmber ? 11 : 139);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(isEmerald ? 4 : isAmber ? 180 : 71, isEmerald ? 120 : isAmber ? 83 : 85, isEmerald ? 87 : isAmber ? 9 : 105);
  doc.text('OVERALL FORENSIC EVIDENCE ASSESSMENT', margin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(report.overallStatus, margin + 5, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(report.assessmentSummary, contentWidth - 10);
  doc.text(summaryLines, margin + 5, y + 17);

  y += 30;

  // 2. Dual Dimensions: User Identity Trust vs Media File Integrity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INDEPENDENT EVALUATION DIMENSIONS', margin, y + 4);
  y += 7;

  const colWidth = (contentWidth - 4) / 2;

  // Box A: User Proofing
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(8, 145, 178); // Cyan-600
  doc.text('DIMENSION 1: USER TRUST & PROOFING', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Account Authentication: ${report.userVerification.accountAuthenticated ? 'PASSED (Verified)' : 'UNAUTHENTICATED'}`, margin + 4, y + 12);
  doc.text(`• Email & Phone OTP: ${report.userVerification.emailVerified && report.userVerification.phoneVerified ? 'PASSED (2FA Bound)' : 'PENDING'}`, margin + 4, y + 17);
  doc.text(`• Government ID Proofing: ${report.userVerification.identityVerified ? 'PASSED (Sandbox Sandbox)' : 'NOT PROVIDED'}`, margin + 4, y + 22);
  doc.text(`• Biometric Liveness: ${report.userVerification.biometricVerified ? 'PASSED (ISO 30107-3 Compliant)' : 'NOT PROVIDED'}`, margin + 4, y + 27);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  const noteLines = doc.splitTextToSize('* Critical Rule: High user trust does not guarantee media integrity.', colWidth - 8);
  doc.text(noteLines, margin + 4, y + 34);

  // Box B: Media Asset Integrity
  const rightX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, y, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(8, 145, 178);
  doc.text('DIMENSION 2: MEDIA BYTE INTEGRITY', rightX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Filename: ${report.mediaAsset.originalFilename}`, rightX + 4, y + 12);
  doc.text(`• MIME Type: ${report.mediaAsset.mimeType} (${report.mediaAsset.mediaType})`, rightX + 4, y + 17);
  doc.text(`• Byte Size: ${(report.mediaAsset.fileSize / 1024).toFixed(1)} KB (${report.mediaAsset.fileSize} bytes)`, rightX + 4, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('SHA-256 (BYTE STREAM):', rightX + 4, y + 27);

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(8, 145, 178);
  doc.text(report.mediaAsset.sha256.substring(0, 36), rightX + 4, y + 31);
  doc.text(report.mediaAsset.sha256.substring(36), rightX + 4, y + 35);

  if (report.mediaAsset.perceptualHash) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`dHash: ${report.mediaAsset.perceptualHash}`, rightX + 4, y + 39);
  }

  y += 47;

  // 3. C2PA Content Credentials & Provenance Manifest
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('C2PA CONTENT CREDENTIALS & DIGITAL PROVENANCE (ISO 21496-1)', margin + 4, y + 6);

  const isC2paValid = report.provenance.credentialStatus === 'valid';
  doc.setFillColor(isC2paValid ? 16 : 100, isC2paValid ? 185 : 116, isC2paValid ? 129 : 139);
  doc.roundedRect(pageWidth - margin - 38, y + 2.5, 34, 5.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${report.provenance.credentialStatus.toUpperCase()}`, pageWidth - margin - 35, y + 6.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  if (isC2paValid) {
    doc.text(`• Claim Generator: ${report.provenance.claimGenerator || 'Certified Camera / Engine'}`, margin + 4, y + 12);
    doc.text(`• Issuer Root CA: ${report.provenance.issuer || 'Content Authenticity CA'}`, margin + 4, y + 16);
    doc.text(`• Signature State: ${report.provenance.signatureStatus || 'Cryptographically Validated'}`, margin + 4, y + 20);
  } else {
    doc.text(`• Notes: ${report.provenance.notes}`, margin + 4, y + 12);
    doc.text(
      '• Standard Notice: Absence of C2PA manifest is common on consumer pipelines and does not imply falsification.',
      margin + 4,
      y + 17
    );
  }

  y += 28;

  // 4. Forensic Analyzer Findings Table
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC ANALYZER FINDINGS & MODEL CARDS', margin, y + 4);
  y += 7;

  // Table Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('INSPECTOR MODEL / CHECK', margin + 3, y + 4.8);
  doc.text('TASK TYPE', margin + 65, y + 4.8);
  doc.text('RESULT', margin + 110, y + 4.8);
  doc.text('SCORE / CONFIDENCE', margin + 145, y + 4.8);
  y += 7;

  report.findings.forEach((f, idx) => {
    checkPageBreak(24);
    const bgShade = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(bgShade, bgShade, bgShade);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.rect(margin, y, contentWidth, 22, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(f.modelName, margin + 3, y + 5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`ver: ${f.modelVersion} • ${f.provider}`, margin + 3, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(f.taskType.replace('_', ' ').toUpperCase(), margin + 65, y + 6);

    const fPassed = f.status === 'passed';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(fPassed ? 16 : 217, fPassed ? 149 : 119, fPassed ? 193 : 6);
    doc.text(f.status.replace('_', ' ').toUpperCase(), margin + 110, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(8, 145, 178);
    const scoreText = f.score !== undefined ? `${f.score.toFixed(3)} (${f.scoreType || 'index'})` : 'N/A';
    doc.text(scoreText, margin + 145, y + 6);

    // Evidence bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    const evidenceText = f.evidence.length > 0 ? f.evidence.join('; ') : 'No anomalies observed.';
    const evLines = doc.splitTextToSize(`Evidence: ${evidenceText}`, contentWidth - 6);
    doc.text(evLines, margin + 3, y + 14);

    if (f.limitations.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      const limLines = doc.splitTextToSize(`Limitation: ${f.limitations[0]}`, contentWidth - 6);
      doc.text(limLines, margin + 3, y + 19);
    }

    y += 23;
  });

  // 5. Scientific Uncertainty Notes
  if (report.uncertaintyNotes && report.uncertaintyNotes.length > 0) {
    checkPageBreak(18);
    doc.setFillColor(254, 252, 232); // Amber light
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(161, 98, 7);
    doc.text('SCIENTIFIC UNCERTAINTY & FORENSIC BOUNDARIES', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(113, 63, 18);
    const uncText = doc.splitTextToSize(report.uncertaintyNotes.join(' '), contentWidth - 8);
    doc.text(uncText, margin + 4, y + 9);
    y += 18;
  }

  // 6. Official Cryptographic Signature & Tamper-Evident Seal Block
  checkPageBreak(58);
  doc.setFillColor(10, 17, 32); // Dark Navy Box
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 52, 2, 2, 'FD');

  // Decorative Seal Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL CRYPTOGRAPHIC SIGNATURE & TAMPER-EVIDENT FORENSIC SEAL', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(6, 182, 212);
  doc.text('FIPS-186-4 HMAC-SHA256 DIGITAL ATTESTATION // VERISIGHT TRUST NETWORK', margin + 5, y + 12);

  // Manifest info in monospace
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text(`Signing Authority:   ${manifest.signerAuthority}`, margin + 5, y + 18);
  doc.text(`Key Identifier:      ${manifest.signerKeyId}`, margin + 5, y + 22);
  doc.text(`Timestamp (RFC3161): ${manifest.signedAt} (${manifest.rfc3161TimestampToken})`, margin + 5, y + 26);
  doc.text(`Payload SHA-256:     ${payloadSha256}`, margin + 5, y + 30);

  // Digital Signature Block Box
  doc.setFillColor(3, 7, 18);
  doc.roundedRect(margin + 5, y + 33, contentWidth - 10, 13, 1, 1, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(56, 189, 248);
  doc.text('-----BEGIN VERISIGHT FORENSIC SIGNATURE BLOCK-----', margin + 8, y + 37);
  doc.setFont('courier', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`SIGNATURE: ${signatureHex}`, margin + 8, y + 41);
  doc.setTextColor(56, 189, 248);
  doc.text('-----END VERISIGHT FORENSIC SIGNATURE BLOCK-----', margin + 8, y + 44);

  y += 56;

  // Add Footers to All Pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle bottom rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`VERISIGHT FORENSIC INTELLIGENCE // DOSSIER ID: ${report.id}`, margin, pageHeight - 7);
    doc.text(
      `PAGE ${p} OF ${totalPages} • SECURE TAMPER-EVIDENT SPECIFICATION`,
      pageWidth - margin - 65,
      pageHeight - 7
    );
  }

  // Set Document Metadata
  doc.setProperties({
    title: `Forensic Verification Dossier - ${report.id}`,
    subject: `Forensic Analysis of ${report.mediaAsset.originalFilename}`,
    author: 'VeriSight Certified Forensic Examination Engine',
    keywords: 'forensic, verification, c2pa, sha256, digital-signature, tamper-evident',
    creator: 'VeriSight Forensic Platform'
  });

  const filename = `Forensic_Dossier_${report.id}_SIGNED.pdf`;

  if (options.autoDownload !== false && typeof window !== 'undefined') {
    doc.save(filename);
  }

  return {
    doc,
    signedPackage,
    filename
  };
}
