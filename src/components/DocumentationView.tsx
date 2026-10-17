import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Shield,
  Lock,
  Code,
  BookOpen
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'architecture' | 'api' | 'security' | 'privacy'>('architecture');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            TECHNICAL SPECIFICATIONS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>Platform Documentation & Architecture Specs</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete engineering reference detailing system topology, API v1 schemas, threat mitigations, and privacy governance.
        </p>
      </div>

      {/* Doc Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveDoc('architecture')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeDoc === 'architecture' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ARCHITECTURE.md</span>
        </button>

        <button
          onClick={() => setActiveDoc('api')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeDoc === 'api' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>API.md (REST v1)</span>
        </button>

        <button
          onClick={() => setActiveDoc('security')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeDoc === 'security' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>SECURITY.md</span>
        </button>

        <button
          onClick={() => setActiveDoc('privacy')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeDoc === 'privacy' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>PRIVACY.md</span>
        </button>
      </div>

      {/* Doc Contents */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 font-mono text-xs text-slate-300 space-y-4 leading-relaxed">
        {activeDoc === 'architecture' && (
          <div className="space-y-4 font-sans">
            <h2 className="text-lg font-bold text-white font-mono">System Architecture & Multi-Modal Pipeline</h2>
            <p className="text-slate-400">
              The platform implements an asynchronous, worker-oriented media verification architecture that dispatches untrusted user media into isolated analytical sandboxes:
            </p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-cyan-300 whitespace-pre overflow-x-auto text-[11px]">
{`[Client Ingestion]
      │ (Multipart / Memory Buffer)
      ▼
[Security Gatekeeper]
  ├─ Binary Magic Bytes Validation (JPEG, PNG, WebP, MP4, WebM, WAV, MP3)
  ├─ Cryptographic SHA-256 Byte Fingerprinting
  └─ Perceptual Difference Hashing (dHash 64-bit)
      │
      ├───────────────────────┬──────────────────────┬──────────────────────┐
      ▼                       ▼                      ▼                      ▼
 [C2PA Provenance]      [EXIF & Prompts]      [Forensic Signals]     [Multimodal AI]
  ├─ JUMBF box scanner   ├─ Midjourney tags     ├─ Laplacian ELA       └─ Gemini 3.8
  ├─ XMP manifest parse  ├─ ComfyUI parameters  ├─ Vocoder 16k cutoff     Vision Forensics
  └─ Issuer signature    └─ Chunk metadata      └─ Frame-jitter sync
      │                       │                      │                      │
      └───────────────────────┴──────────────────────┴──────────────────────┘
                              │
                              ▼
                 [Independent Evidence Aggregator]
                  (No Misleading Authenticity Score)
                              │
                              ▼
                 [Verification Report & Cryptographic Wiping Engine]`}
            </div>
            <p className="text-slate-400">
              Four independent questions are answered: 1) Account Trust, 2) Media Analysis, 3) Provenance & Integrity, and 4) Responsible Assessment.
            </p>
          </div>
        )}

        {activeDoc === 'api' && (
          <div className="space-y-4 font-sans">
            <h2 className="text-lg font-bold text-white font-mono">REST API v1 Specification</h2>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">GET /health</span> & <span className="text-cyan-400 font-bold">GET /ready</span>
                <p className="text-slate-400 font-sans mt-1">Liveness and readiness probes returning system uptime and forensics engine status.</p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold">POST /api/v1/media</span>
                <p className="text-slate-400 font-sans mt-1">Accepts multipart file upload, validates binary signatures, computes byte SHA-256, stores in isolated buffer.</p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold">POST /api/v1/media/:id/analyze</span>
                <p className="text-slate-400 font-sans mt-1">Dispatches asynchronous background verification job with requested forensic checks.</p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">GET /api/v1/jobs/:id</span>
                <p className="text-slate-400 font-sans mt-1">Polls job status (queued, validating, processing, completed, failed) and active progress percent.</p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">GET /api/v1/reports/:id</span>
                <p className="text-slate-400 font-sans mt-1">Retrieves structured verification dossier with separate trust dimensions and model cards.</p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-rose-400 font-bold">DELETE /api/v1/media/:id</span>
                <p className="text-slate-400 font-sans mt-1">Cryptographically overwrites media bytes with zeroes, removes associated report, and appends immutable audit event.</p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'security' && (
          <div className="space-y-4 font-sans">
            <h2 className="text-lg font-bold text-white font-mono">Security Model & Threat Mitigations</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Untrusted Input Handling:</strong> All uploaded files undergo binary magic byte verification prior to parsing; non-whitelisted formats are dropped at the gate.</li>
              <li><strong className="text-slate-200">Decompression Bomb Protection:</strong> Ingestion byte streams are capped at 50MB and bounded by memory limits to prevent resource starvation.</li>
              <li><strong className="text-slate-200">Zero Execution Boundary:</strong> Uploaded media assets are stored strictly in private object containers and never executed on the host system.</li>
              <li><strong className="text-slate-200">Role-Based Access Control:</strong> Reports and media assets enforce strict ownership checks; cross-tenant access attempts return 404/403.</li>
            </ul>
          </div>
        )}

        {activeDoc === 'privacy' && (
          <div className="space-y-4 font-sans">
            <h2 className="text-lg font-bold text-white font-mono">Privacy Charter & Biometric Governance</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-200">No Raw Biometric Retention:</strong> Biometric liveness calculations occur ephemerally at the edge. No facial embeddings or biometric vectors are ever stored in the database.</li>
              <li><strong className="text-slate-200">Informed Purpose-Specific Consent:</strong> Explicit consent is required before invoking AI or biometric endpoints with full withdrawal workflows.</li>
              <li><strong className="text-slate-200">Cryptographic Erasure Guarantee:</strong> On user request, media byte buffers are overwritten with zero bytes rather than merely unlinking file pointers.</li>
              <li><strong className="text-slate-200">No Model Training on User Data:</strong> Uploaded files are strictly isolated for forensic inspection and never ingested into AI training pipelines.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
