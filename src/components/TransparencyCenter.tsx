import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  Fingerprint,
  Radio,
  Binary,
  Activity,
  FileCode,
  HardDrive,
  Eye,
  Volume2,
  Video,
  FileCheck
} from 'lucide-react';

export const TransparencyCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sensors' | 'standards' | 'models'>('pipeline');

  const sensors = [
    {
      id: 'SNS-01',
      name: 'Binary Magic Bytes Gatekeeper',
      category: 'Ingestion & Demux',
      latency: '2.1 ms',
      accuracy: '100% Deterministic',
      status: 'Active',
      description: 'Enforces byte-level format sanitization, rejecting polyglot files and payload masquerades before memory buffer allocation.'
    },
    {
      id: 'SNS-02',
      name: 'SHA-256 Cryptographic Digest Engine',
      category: 'Cryptographic Integrity',
      latency: '8.4 ms',
      accuracy: 'FIPS 180-4 Certified',
      status: 'Active',
      description: 'Direct byte-stream hashing binding every piece of ingested media to an immutable mathematical fingerprint.'
    },
    {
      id: 'SNS-03',
      name: 'Perceptual 64-bit dHash Matrix',
      category: 'Visual Hashing',
      latency: '14.2 ms',
      accuracy: 'Robust to Lossy Recompression',
      status: 'Active',
      description: 'Low-frequency DCT gradient matrix for identifying identical visual compositions subjected to transcode or resizing.'
    },
    {
      id: 'SNS-04',
      name: 'C2PA JUMBF Manifest Parser',
      category: 'Provenance & PKI',
      latency: '19.8 ms',
      accuracy: 'ISO 21496-1 Standard',
      status: 'Active',
      description: 'Recursively walks JUMBF box hierarchies, verifies assertion hashes, and validates X.509 certificate trust chains to root CAs.'
    },
    {
      id: 'SNS-05',
      name: 'Laplacian Error Level Profiler (ELA)',
      category: 'Spatial Forensics',
      latency: '34.6 ms',
      accuracy: '0.001 Noise Variance Delta',
      status: 'Active',
      description: 'High-pass differential kernel that isolates compression artifact inconsistencies across image boundaries to expose digital splicing.'
    },
    {
      id: 'SNS-06',
      name: 'Neural Vocoder Nyquist-Shannon Analyzer',
      category: 'Acoustic Forensics',
      latency: '28.1 ms',
      accuracy: 'Sub-Hz Spectral Resolution',
      status: 'Active',
      description: 'Detects synthetic voice cloning signatures: brickwall 16.0 kHz/24.0 kHz vocoder cutoffs and unnatural silent-segment energy floors.'
    },
    {
      id: 'SNS-07',
      name: 'Keyframe Temporal Discontinuity Prober',
      category: 'Video Forensics',
      latency: '62.0 ms',
      accuracy: 'Multi-Frame Motion Coherence',
      status: 'Active',
      description: 'Tracks inter-frame facial boundary warping, ocular blink distribution, and unnatural specular lighting variance in video streams.'
    },
    {
      id: 'SNS-08',
      name: 'Gemini Multimodal Forensic Copilot',
      category: 'Cognitive Forensics',
      latency: '410 ms',
      accuracy: 'Multi-Modal Reasoning',
      status: 'Active',
      description: 'Synthesizes mathematical signals with prompt archaeology, physics consistency, and contextual semantic threat intelligence.'
    }
  ];

  const standards = [
    {
      standard: 'ISO 21496-1',
      title: 'C2PA Content Credentials Specification',
      scope: 'Cryptographic binding of digital provenance assertions and digital signatures to media files.',
      implementation: 'Full JUMBF container demuxing, CBOR manifest validation, and X.509 trust anchor path verification.'
    },
    {
      standard: 'NIST SP 800-86',
      title: 'Guide to Integrating Forensic Techniques into Incident Response',
      scope: 'Chain of custody preservation, binary media integrity, and non-destructive analysis workflows.',
      implementation: 'Read-only byte stream isolation, immutable SHA-256 audit logging, and cryptographic zero-fill erasure upon user request.'
    },
    {
      standard: 'FIPS 180-4',
      title: 'Secure Hash Standard (SHA-256)',
      scope: 'Cryptographic digest computation for evidence authentication.',
      implementation: 'Hardware-accelerated byte-level SHA-256 computation over full binary content.'
    },
    {
      standard: 'RFC 3161',
      title: 'Internet X.509 Public Key Infrastructure Time-Stamp Protocol',
      scope: 'Cryptographic verification of provenance timestamp assertions.',
      implementation: 'Validation of trusted time-stamping authority (TSA) tokens embedded in C2PA signature boxes.'
    },
    {
      standard: 'ISO/IEC 30107-3',
      title: 'Biometric Presentation Attack Detection',
      scope: 'Evaluation of facial liveness and anti-spoofing presentation attack mechanisms.',
      implementation: 'Ephemeral active-challenge liveness validation in client volatile memory with zero raw biometric template storage.'
    }
  ];

  const modelCards = [
    {
      model: 'ViT-H/14 OpenForensics Latent Splicing Detector',
      version: 'v2.4.1',
      architecture: 'Vision Transformer (307M params)',
      trainingData: 'FaceForensics++, DiffusionDB (5M synthetic samples), RealCamera-100K',
      license: 'Apache 2.0',
      operatingBounds: 'Optimized for high-resolution faces, JPEG quality > 50. Performance degrades on extreme motion blur.'
    },
    {
      model: 'AASIST-Spectral Neural Vocoder Classifier',
      version: 'v1.8.0',
      architecture: 'Graph Attention Spectrogram Network',
      trainingData: 'ASVspoof 2021 DF/LA, In-the-Wild Cloned Voices (2024-2025 cohort)',
      license: 'BSD-3-Clause',
      operatingBounds: 'Calibrated for 16kHz and 44.1kHz audio streams. Minimum duration required: 1.2 seconds.'
    },
    {
      model: 'Google Gemini 3.8 Flash Multimodal',
      version: '3.8-flash-enterprise',
      architecture: 'Multimodal Deep Neural Transformer',
      trainingData: 'Curated multimodal corpus with forensic reasoning and visual artifact grounding',
      license: 'Google Cloud Enterprise API',
      operatingBounds: 'Operates as higher-order analytical synthesizer; does not replace deterministic mathematical hashing.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative p-6 rounded-xl tech-panel border border-cyan-900/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                <span>Forensic Engine Specifications</span>
              </span>
              <span className="text-xs font-mono text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-400">Architecture v1.4.0</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-cyan-400" />
              <span>Threat Defense Engine & Forensic Architecture</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Technical documentation of detection sensors, cryptographic algorithms, open standards alignment, and forensic model parameters powering CHARS DETECT.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs font-mono text-cyan-400">8 OF 8 SENSORS ONLINE</div>
              <div className="text-[11px] font-mono text-slate-400">DETERMINISTIC ASSURANCE: ACTIVE</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline Topology</span>
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sensors'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sensor Array (8 Modules)</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'standards'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Standards & Protocols</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'models'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Model Cards & Bounds</span>
          </button>
        </div>
      </div>

      {/* Content views */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl tech-panel border border-cyan-900/40 space-y-4">
            <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Multi-Modal Sandboxed Ingestion Flow</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every incoming piece of media traverses an isolated 4-stage analytical sieve. Raw assets are cryptographically fingerprinted at ingestion, validated against ISO/IEC magic-byte standards, decomposed into frequency and spatial layers, and checked against C2PA root anchors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-lg bg-[#060e1d] border border-cyan-900/60 relative overflow-hidden">
                <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Phase 01 // Gatekeeper</div>
                <div className="text-sm font-bold text-white mb-2">Binary Sanitization</div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>• Magic byte validation</li>
                  <li>• Polyglot file rejection</li>
                  <li>• Memory allocation bounds</li>
                  <li>• MIME type attestation</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#060e1d] border border-cyan-900/60 relative overflow-hidden">
                <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Phase 02 // Cryptography</div>
                <div className="text-sm font-bold text-white mb-2">Cryptographic Seal</div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>• Full SHA-256 byte digest</li>
                  <li>• 64-bit dHash perceptual fingerprint</li>
                  <li>• RFC 3161 timestamping</li>
                  <li>• Tamper-evident ledger log</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#060e1d] border border-cyan-900/60 relative overflow-hidden">
                <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Phase 03 // Provenance</div>
                <div className="text-sm font-bold text-white mb-2">C2PA Trust Engine</div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>• JUMBF box tree traversal</li>
                  <li>• X.509 cert chain validation</li>
                  <li>• Claim signature verification</li>
                  <li>• Action history extraction</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#060e1d] border border-cyan-900/60 relative overflow-hidden">
                <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Phase 04 // Forensics</div>
                <div className="text-sm font-bold text-white mb-2">Signal Analysis</div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>• Laplacian ELA noise profiling</li>
                  <li>• Nyquist vocoder 16kHz cutoffs</li>
                  <li>• Frame optical flow jitter</li>
                  <li>• ViT diffusion artifact score</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Zero-Trust Architecture</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform decisions never rely on opaque single-score heuristics. Media integrity, cryptographic provenance, biometric identity, and ML synthetic likelihood are computed as strictly separated, orthogonal vectors to eliminate blind-spot vulnerability.
              </p>
            </div>

            <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Zero-Retention Privacy Controls</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Biometric liveness calculations and facial telemetry run exclusively in volatile sandboxed memory. Users can initiate cryptographic zero-fill media erasure at any point, removing media bytes from storage while preserving immutable audit hashes.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sensors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sensors.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl tech-panel border border-cyan-900/40 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {s.id}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{s.category}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                    {s.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5">{s.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>LATENCY: <strong className="text-cyan-300 font-normal">{s.latency}</strong></span>
                <span>METRIC: <strong className="text-slate-200 font-normal">{s.accuracy}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'standards' && (
        <div className="space-y-4">
          {standards.map((st, idx) => (
            <div key={idx} className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                    {st.standard}
                  </span>
                  <h4 className="text-sm font-bold text-white">{st.title}</h4>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 self-start sm:self-auto">
                  ENFORCED IN CORE
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{st.scope}</p>
              <div className="bg-[#050c18] p-3 rounded-lg border border-cyan-950 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">Engine Execution: </span>
                {st.implementation}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-4">
          {modelCards.map((mc, idx) => (
            <div key={idx} className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span>{mc.model}</span>
                  </h4>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    Architecture: {mc.architecture} • Version: {mc.version}
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800 self-start sm:self-auto">
                  License: {mc.license}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#050c18] border border-slate-800 space-y-1">
                  <div className="font-mono text-cyan-400 font-semibold text-[11px]">Training Provenance</div>
                  <div className="text-slate-300">{mc.trainingData}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#050c18] border border-slate-800 space-y-1">
                  <div className="font-mono text-amber-400 font-semibold text-[11px]">Operational Failure Boundaries</div>
                  <div className="text-slate-300">{mc.operatingBounds}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransparencyCenter;
