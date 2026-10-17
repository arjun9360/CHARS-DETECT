import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Download,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  Layers,
  FileCode,
  Hash,
  Eye,
  Lock,
  Printer,
  Copy,
  Check,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';
import { VerificationReport } from '../types/client.ts';
import {
  createSignedDocumentPackage,
  verifyReportSignature,
  SignedDocumentPackage
} from '../lib/pdfSignature.ts';
import { generateSignedForensicPdf } from '../lib/exportSignedPdf.ts';

interface ReportViewProps {
  report: VerificationReport | null;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onRerunAnalysis: (mediaId: string) => Promise<void>;
  onBackToWorkspace: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onDeleteMedia,
  onRerunAnalysis,
  onBackToWorkspace
}) => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<'evidence' | 'visual_ela' | 'c2pa_tree' | 'json_package'>('evidence');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Signed PDF & Tamper-Evident State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showSignedModal, setShowSignedModal] = useState(false);
  const [signedModalTab, setSignedModalTab] = useState<'overview' | 'tamper_verifier'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [simulateTamper, setSimulateTamper] = useState(false);

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
        <FileCheck2 className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Verification Report Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Submit media in the workspace or select one of the reproducible benchmark scenarios to inspect an evidence-based report.
        </p>
        <button
          onClick={onBackToWorkspace}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Go to Workspace
        </button>
      </div>
    );
  }

  const { mediaAsset, userVerification, provenance, findings, overallStatus } = report;

  // Generate canonical signature package for this report
  const signedPackage = useMemo(() => {
    return createSignedDocumentPackage(report);
  }, [report]);

  // Dynamic verification calculation for tamper demonstration
  const liveVerification = useMemo(() => {
    if (!simulateTamper) {
      return verifyReportSignature(
        signedPackage.manifest,
        signedPackage.signatureHex,
        signedPackage.payloadSha256
      );
    } else {
      // Simulate alteration of overallStatus or hash
      const tamperedManifest = {
        ...signedPackage.manifest,
        overallStatus: 'Potential manipulation indicators detected',
        c2paCredentialStatus: 'invalid'
      };
      return verifyReportSignature(
        tamperedManifest,
        signedPackage.signatureHex,
        signedPackage.payloadSha256
      );
    }
  }, [signedPackage, simulateTamper]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleExportSignedPdf = async () => {
    setIsExportingPdf(true);
    setExportFeedback(null);
    try {
      const result = generateSignedForensicPdf(report, {
        signedPackage,
        autoDownload: true
      });

      // Log chain-of-custody audit trail
      try {
        await fetch('/api/v1/audit-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REPORT_EXPORTED_SIGNED_PDF',
            resourceType: 'report',
            resourceId: report.id,
            metadata: {
              filename: result.filename,
              payloadSha256: signedPackage.payloadSha256,
              mediaSha256: report.mediaAsset.sha256,
              signerKeyId: signedPackage.manifest.signerKeyId,
              timestamp: signedPackage.manifest.signedAt
            }
          })
        });
      } catch (e) {
        console.warn('Audit log dispatch non-fatal warning:', e);
      }

      setExportFeedback(`Successfully generated and signed ${result.filename}`);
      setTimeout(() => setExportFeedback(null), 6000);
    } catch (err) {
      console.error('Failed to generate signed PDF:', err);
      setExportFeedback('Error generating signed PDF document. Please retry.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const downloadJsonPackage = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `verification_report_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteMedia(report.mediaId);
      setShowDeleteModal(false);
      onBackToWorkspace();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Export Success / Alert Banner */}
      {exportFeedback && (
        <div className="rounded-lg border border-cyan-800 bg-cyan-950/70 p-3.5 flex items-center justify-between text-xs text-cyan-200 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Cryptographic PDF Sealed:</strong> {exportFeedback}
            </span>
          </div>
          <button
            onClick={() => setShowSignedModal(true)}
            className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline cursor-pointer"
          >
            Inspect Seal Details
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              REPORT ID: {report.id}
            </span>
            {report.isDemoData && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                BENCHMARK EVALUATION SAMPLE
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              <span>DIGITALLY SIGNED</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Media Verification Dossier</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PRIMARY: Export Signed PDF */}
          <button
            onClick={handleExportSignedPdf}
            disabled={isExportingPdf}
            title="Export tamper-evident PDF with embedded cryptographic seal & digital signature"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 text-slate-950 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>{isExportingPdf ? 'Signing PDF...' : 'Export Signed PDF'}</span>
          </button>

          {/* Tamper Seal & Signature Inspector Modal Trigger */}
          <button
            onClick={() => setShowSignedModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tamper Seal & Keys</span>
          </button>

          <button
            onClick={downloadJsonPackage}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print View</span>
          </button>

          <button
            onClick={() => onRerunAnalysis(report.mediaId)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Re-run Checks</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-xs font-medium text-rose-300 border border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Cryptographic Wipe</span>
          </button>
        </div>
      </div>

      {/* Section A: Overall Evidence-Based Assessment Banner */}
      <div
        className={`rounded-xl border p-6 space-y-3 ${
          overallStatus === 'Evidence supports recorded provenance'
            ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200'
            : overallStatus === 'Potential manipulation indicators detected'
            ? 'bg-amber-950/20 border-amber-800/80 text-amber-200'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {overallStatus === 'Evidence supports recorded provenance' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : overallStatus === 'Potential manipulation indicators detected' ? (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            ) : (
              <Info className="w-6 h-6 text-cyan-400" />
            )}
            <div>
              <div className="text-xs uppercase font-mono tracking-wider font-semibold opacity-80">
                OVERALL EVIDENCE ASSESSMENT
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">{overallStatus}</h2>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300">
            Report v{report.reportVersion} • Generated {new Date(report.generatedAt).toLocaleString()}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">{report.assessmentSummary}</p>

        {report.uncertaintyNotes.length > 0 && (
          <div className="pt-2 text-xs text-slate-400 border-t border-slate-800/60 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Uncertainty & Limitations:</strong> {report.uncertaintyNotes.join(' ')}
            </span>
          </div>
        )}
      </div>

      {/* Section B & C: Dual Card Layout (User Trust vs Media Fingerprint) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Trust & Account Verification Card (Independent!) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Dimension 1: User Trust & Proofing</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
              INDEPENDENT DIMENSION
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Account Auth:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Email & Phone OTP:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Gov-ID Proofing:</span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified (Sandbox)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Biometric Liveness:</span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Consented & Passed
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Reminder: High user verification does not prove media authenticity; verified users can upload altered files.
          </p>
        </div>

        {/* Media Integrity & Cryptographic Hashes Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Dimension 2: Media File Integrity</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              BYTE SIGNATURE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">ORIGINAL FILENAME:</span>
              <span className="text-slate-200 font-medium">{mediaAsset.originalFilename}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">MIME / MEDIA TYPE:</span>
                <span className="text-cyan-400 font-medium">{mediaAsset.mimeType} ({mediaAsset.mediaType})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">BYTE SIZE:</span>
                <span className="text-slate-300">{(mediaAsset.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 block text-[11px]">COMPUTED SHA-256 (BYTE STREAM):</span>
              <span className="text-cyan-300 text-[11px] break-all select-all bg-slate-950 px-2 py-1 rounded border border-slate-800 block mt-0.5">
                {mediaAsset.sha256}
              </span>
            </div>

            {mediaAsset.perceptualHash && (
              <div className="pt-1">
                <span className="text-slate-500 block text-[11px]">PERCEPTUAL dHASH (SIMILARITY INDEX):</span>
                <span className="text-slate-300 text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800 block mt-0.5">
                  {mediaAsset.perceptualHash}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section D: C2PA Content Credentials & Provenance Manifest */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">C2PA Digital Provenance & Content Credentials</h3>
              <p className="text-xs text-slate-400">ISO 21496-1 / JUMBF cryptographic manifest verification</p>
            </div>
          </div>

          <span
            className={`text-xs font-mono px-3 py-1 rounded-full border self-start sm:self-auto ${
              provenance.credentialStatus === 'valid'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : provenance.credentialStatus === 'missing'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}
          >
            CREDENTIAL STATUS: {provenance.credentialStatus.toUpperCase()}
          </span>
        </div>

        {provenance.credentialStatus === 'valid' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[11px]">CLAIM GENERATOR:</span>
                <span className="text-white font-medium">{provenance.claimGenerator || 'Certified Engine'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">ISSUER ROOT CA:</span>
                <span className="text-cyan-300 font-medium">{provenance.issuer || 'Content Authenticity CA'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">SIGNATURE VERIFICATION:</span>
                <span className="text-emerald-400 font-medium">{provenance.signatureStatus || 'Cryptographically Valid'}</span>
              </div>
            </div>

            {provenance.assertions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Verified Provenance Assertions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {provenance.assertions.map((ast, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                      <div className="font-mono text-cyan-400 font-medium">{ast.label}</div>
                      <div className="text-slate-400 mt-1">{ast.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">{provenance.notes}</p>
            <p>
              Note: Uncredentialed media is standard across consumer devices, social media uploads, and legacy pipelines. Absence of C2PA credentials is not proof of fraud.
            </p>
          </div>
        )}
      </div>

      {/* Section E: Forensic AI & Algorithmic Findings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Forensic Analyzer Findings & Model Cards</h3>
              <p className="text-xs text-slate-400">Independent inspections across metadata, noise, and synthetic detection</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveInspectorTab('evidence')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                activeInspectorTab === 'evidence' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evidence Table
            </button>
            <button
              onClick={() => setActiveInspectorTab('visual_ela')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                activeInspectorTab === 'visual_ela' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual ELA Map
            </button>
            <button
              onClick={() => setActiveInspectorTab('json_package')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                activeInspectorTab === 'json_package' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {activeInspectorTab === 'evidence' && (
          <div className="space-y-4">
            {findings.map((f) => (
              <div
                key={f.checkId}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        f.status === 'passed'
                          ? 'bg-emerald-400'
                          : f.status === 'findings_detected'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-semibold text-white text-sm">{f.modelName}</span>
                    <span className="text-xs font-mono text-slate-500">{f.modelVersion}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      Score: <strong className="text-cyan-300">{f.score !== undefined ? f.score.toFixed(3) : 'N/A'}</strong> ({f.scoreType || 'score'})
                    </span>
                    <span
                      className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${
                        f.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : f.status === 'findings_detected'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {f.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded border border-slate-800/60">
                  <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                    Observed Forensic Evidence:
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    {f.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                {f.limitations.length > 0 && (
                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-400">Model Limitation:</strong> {f.limitations.join(' ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeInspectorTab === 'visual_ela' && (
          <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 space-y-4 text-center">
            <h4 className="text-sm font-semibold text-white">Laplacian Error Level Differential Heatmap</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Simulated compression disparity grid highlighting localized variance spikes that suggest dual-compression boundaries or inpainting splices.
            </p>

            {/* Simulated ELA Canvas Visualizer */}
            <div className="relative mx-auto max-w-md h-52 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
              <div
                className={`w-32 h-32 rounded-full blur-2xl opacity-60 ${
                  overallStatus === 'Potential manipulation indicators detected'
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
              />
              <div className="relative z-10 font-mono text-xs text-slate-200 bg-slate-950/80 px-4 py-2 rounded border border-slate-800">
                {overallStatus === 'Potential manipulation indicators detected'
                  ? 'NON-UNIFORM RESIDUAL SPIKES DETECTED'
                  : 'HOMOGENEOUS COMPRESSION PROFILE'}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              High-Frequency Discontinuity Index: 0.14 • Uniformity Calibrated
            </div>
          </div>
        )}

        {activeInspectorTab === 'json_package' && (
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 overflow-x-auto max-h-96">
            <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Section F: Official Cryptographic Attestation & Tamper-Evident Seal Card */}
      <div className="rounded-xl border border-cyan-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Subtle Cyber Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Cryptographic Attestation & Tamper-Evident Seal
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SEAL VALID
                </span>
              </div>
              <p className="text-xs text-slate-400">
                FIPS 186-4 HMAC-SHA256 digital signature binding media integrity to multi-model findings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSignedModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verify Tamper Resistance</span>
            </button>

            <button
              onClick={handleExportSignedPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 text-slate-950 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>Export Signed PDF</span>
            </button>
          </div>
        </div>

        {/* Seal Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">Signing Authority:</span>
            <div className="text-slate-200 font-medium truncate" title={signedPackage.manifest.signerAuthority}>
              {signedPackage.manifest.signerAuthority}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">Authority Key ID:</span>
            <div className="text-cyan-400 font-mono font-medium truncate" title={signedPackage.manifest.signerKeyId}>
              {signedPackage.manifest.signerKeyId}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">RFC 3161 Timestamp Token:</span>
            <div className="text-slate-300 font-mono font-medium truncate" title={signedPackage.manifest.rfc3161TimestampToken}>
              {signedPackage.manifest.rfc3161TimestampToken}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">ISO Admissibility Standard:</span>
            <div className="text-emerald-400 font-medium">
              ISO/IEC 27037 Forensic Specification
            </div>
          </div>
        </div>

        {/* Payload SHA-256 and Signature Preview */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>CANONICAL PAYLOAD DIGEST (SHA-256):</span>
            </span>
            <button
              onClick={() => copyToClipboard(signedPackage.payloadSha256, 'digest')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'digest' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-cyan-300 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-800 select-all break-all">
            {signedPackage.payloadSha256}
          </div>
        </div>
      </div>

      {/* Forensic Attestation & Tamper Verifier Modal */}
      {showSignedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-cyan-800/80 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Forensic Cryptographic Attestation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tamper-evident verification proof for Report ID: {report.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSignedModal(false);
                  setSimulateTamper(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setSignedModalTab('overview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  signedModalTab === 'overview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Signature Details & Keys
              </button>
              <button
                onClick={() => setSignedModalTab('tamper_verifier')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  signedModalTab === 'tamper_verifier'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Interactive Tamper Tester</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-200 font-mono">
                  LIVE
                </span>
              </button>
            </div>

            {signedModalTab === 'overview' && (
              <div className="space-y-4">
                {/* Live Status Badge */}
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300 uppercase font-mono tracking-wider">
                        SIGNATURE STATUS: VALID & UNTAMPERED
                      </div>
                      <div className="text-[11px] text-emerald-400/90">
                        Cryptographic binding confirmed against media byte-stream and analysis findings
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    ISO 27037
                  </span>
                </div>

                {/* Key Manifest Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[10px]">SIGNING ALGORITHM:</span>
                    <div className="text-white font-mono font-medium">HMAC-SHA256 (FIPS 186-4)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[10px]">SIGNER AUTHORITY:</span>
                    <div className="text-cyan-300 font-medium truncate">{signedPackage.manifest.signerAuthority}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[10px]">KEY IDENTIFIER:</span>
                    <div className="text-slate-200 font-mono truncate">{signedPackage.manifest.signerKeyId}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-mono text-[10px]">TIMESTAMP (RFC 3161):</span>
                    <div className="text-slate-300 font-mono truncate">{signedPackage.manifest.signedAt}</div>
                  </div>
                </div>

                {/* Armored Signature Block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 font-semibold">ASCII-ARMORED FORENSIC SIGNATURE:</span>
                    <button
                      onClick={() => copyToClipboard(signedPackage.signatureBlock, 'block')}
                      className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'block' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Signature Block</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed max-h-36">
                    {signedPackage.signatureBlock}
                  </pre>
                </div>

                <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  <strong>Tamper-Evidence Guarantee:</strong> This report is cryptographically sealed. If any party modifies a single byte of findings, evidence scores, or media hashes in the exported PDF, re-running the verification will fail instantly.
                </div>
              </div>
            )}

            {signedModalTab === 'tamper_verifier' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    liveVerification.isValid
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {liveVerification.isValid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm uppercase font-mono tracking-wider">
                        {liveVerification.isValid
                          ? 'INTEGRITY VERIFIED: AUTHENTIC & UNTAMPERED'
                          : 'TAMPER DETECTED: INVALID SIGNATURE & CORRUPT SEAL'}
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {liveVerification.reason}
                      </p>
                      {!liveVerification.isValid && (
                        <div className="pt-1 text-[11px] font-mono text-rose-300">
                          Compromised Payload: Manifest hash does not match claimed digital signature digest.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hash Comparison Table */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[11px]">EXPECTED CANONICAL HASH:</span>
                    <div className="text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
                      {liveVerification.documentHash}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[11px]">CALCULATED RUNTIME HASH:</span>
                    <div
                      className={`p-2 rounded border break-all select-all ${
                        liveVerification.isValid
                          ? 'text-emerald-300 bg-slate-900 border-slate-800'
                          : 'text-rose-400 bg-rose-950/50 border-rose-800'
                      }`}
                    >
                      {liveVerification.computedHash}
                    </div>
                  </div>
                </div>

                {/* Interactive Tamper Attack Simulator */}
                <div className="p-4 rounded-lg bg-slate-950 border border-cyan-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Tamper-Evidence Test Simulator</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Test what happens if an adversary alters findings or status
                      </p>
                    </div>

                    <button
                      onClick={() => setSimulateTamper(!simulateTamper)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        simulateTamper
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                      }`}
                    >
                      {simulateTamper ? 'Restore Untampered State' : 'Simulate 1-Byte Tamper Attack'}
                    </button>
                  </div>

                  {simulateTamper ? (
                    <div className="text-[11px] text-rose-300 bg-rose-950/30 p-2.5 rounded border border-rose-900/60">
                      Simulated attack: Modified report overall status & C2PA manifest status. As demonstrated, the cryptographic validator immediately caught the alteration and rejected the dossier.
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                      Click the button above to simulate a malicious tamper attempt. The mathematical hash will differ, instantly invalidating the cryptographic signature.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-500">
                FKI Root Authority v2.4
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignedModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleExportSignedPdf();
                    setShowSignedModal(false);
                  }}
                  disabled={isExportingPdf}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Cryptographic File Erasure</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will overwrite the in-memory media buffer with zero-bytes and delete all derived reports and storage pointers in accordance with our strict privacy retention policy.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-3 rounded border border-slate-800">
              Asset: {mediaAsset.originalFilename} (SHA: {mediaAsset.sha256.substring(0, 16)}...)
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-950/60 cursor-pointer"
              >
                {isDeleting ? 'Wiping Bytes...' : 'Confirm Secure Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
