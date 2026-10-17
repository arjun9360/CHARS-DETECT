import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileSearch,
  History,
  Sparkles,
  Layers,
  ArrowRight,
  Fingerprint,
  Activity,
  AlertTriangle,
  Play,
  Bot,
  Radio,
  Cpu,
  Binary,
  Volume2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  FileCode,
  Crosshair
} from 'lucide-react';
import { MediaAsset, VerificationReport, ActiveTab } from '../types/client.ts';

interface DashboardProps {
  reports: VerificationReport[];
  mediaAssets: MediaAsset[];
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedReportId: (id: string) => void;
  onLaunchBenchmark: (sampleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  reports,
  mediaAssets,
  setActiveTab,
  setSelectedReportId,
  onLaunchBenchmark
}) => {
  const totalSubmissions = mediaAssets.length;
  const totalReports = reports.length;
  const provenanceVerifiedCount = reports.filter(r => r.provenance.credentialStatus === 'valid').length;
  const manipulationDetectedCount = reports.filter(r => r.overallStatus === 'Potential manipulation indicators detected').length;

  return (
    <div className="space-y-6">
      {/* Threat Posture Status Bar */}
      <div className="relative p-4 sm:p-5 rounded-xl tech-panel border border-cyan-500/30 overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono uppercase bg-cyan-950/90 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span>DEFCON // FORENSIC POSTURE: ELEVATED</span>
              </span>
              <span className="text-xs font-mono text-slate-500">|</span>
              <span className="text-[11px] font-mono text-slate-400">SENSOR PIPELINE: 8/8 ENGAGED</span>
              <span className="text-xs font-mono text-slate-500">|</span>
              <span className="text-[11px] font-mono text-cyan-300">ISO 21496-1 C2PA ACTIVE</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              <span>Cyber Threat Analysis & Media Forensics Console</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Real-time deepfake surveillance, neural audio cloning interception, synthetic diffusion detection, and cryptographic C2PA provenance validation across enterprise ingest vectors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('workspace')}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <FileSearch className="w-4 h-4 text-slate-950" />
              <span>Deploy Forensic Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('chat')}
              className="px-3.5 py-2.5 rounded-lg bg-[#071329] hover:bg-[#0c1f44] text-cyan-300 font-semibold text-xs sm:text-sm border border-cyan-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Threat AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Cyber Metrics Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-xl tech-panel border border-cyan-900/40 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">Total Scans Ingested</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {totalSubmissions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Image / Video / Audio / Stickers</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-xl tech-panel border border-cyan-900/40 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">C2PA Provenance Valid</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight">
            {provenanceVerifiedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Cryptographic root signatures</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-xl tech-panel border border-cyan-900/40 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">Anomalies Intercepted</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums tracking-tight">
            {manipulationDetectedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Deepfakes & synthetic vectors</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-xl tech-panel border border-cyan-900/40 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400">Evidence Dossiers</span>
            <FileSearch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono tabular-nums tracking-tight">
            {totalReports}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>NIST SP 800-86 tamper-sealed</span>
          </div>
        </div>
      </div>

      {/* Threat Vector Analysis Radar & Active Ingest Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Threat Vector Heatmap Panel */}
        <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Active Threat Vector Radar & Anomaly Distribution</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time inspection telemetry across the 5 primary synthetic attack vectors.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 self-start sm:self-auto">
              REAL-TIME SENSORS
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Vector 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Generative Diffusion Lattice (ViT-H/14 + ELA Noise)</span>
                </span>
                <span className="text-amber-400 font-bold tabular-nums">89.4% Anomaly Confidence</span>
              </div>
              <div className="h-2 w-full bg-[#050d1a] rounded-full overflow-hidden border border-cyan-950">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 rounded-full" style={{ width: '89.4%' }} />
              </div>
            </div>

            {/* Vector 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Neural Vocoder Frequency Brickwall (16kHz Nyquist Cutoff)</span>
                </span>
                <span className="text-rose-400 font-bold tabular-nums">94.1% Synthetic Probability</span>
              </div>
              <div className="h-2 w-full bg-[#050d1a] rounded-full overflow-hidden border border-cyan-950">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: '94.1%' }} />
              </div>
            </div>

            {/* Vector 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Facial Warping & Keyframe Blink Cadence Disparity</span>
                </span>
                <span className="text-amber-400 font-bold tabular-nums">78.6% Deepfake Likelihood</span>
              </div>
              <div className="h-2 w-full bg-[#050d1a] rounded-full overflow-hidden border border-cyan-950">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full" style={{ width: '78.6%' }} />
              </div>
            </div>

            {/* Vector 4 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cryptographic C2PA Provenance Assertion Integrity</span>
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">100% Root CA Verified</span>
              </div>
              <div className="h-2 w-full bg-[#050d1a] rounded-full overflow-hidden border border-cyan-950">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Security Engine Telemetry Sidecard */}
        <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Forensic Engine Status</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#060e1d] border border-cyan-950">
                <span className="text-slate-400">HASH PRIMITIVE</span>
                <span className="text-cyan-300">SHA-256 (FIPS 180-4)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#060e1d] border border-cyan-950">
                <span className="text-slate-400">C2PA CONTAINER</span>
                <span className="text-cyan-300">ISO 21496-1 JUMBF</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#060e1d] border border-cyan-950">
                <span className="text-slate-400">ELA ERROR KERNEL</span>
                <span className="text-cyan-300">Laplacian 3x3 Mat</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#060e1d] border border-cyan-950">
                <span className="text-slate-400">ZERO-RETENTION</span>
                <span className="text-emerald-400">ENFORCED (RAM ONLY)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('transparency')}
            className="w-full py-2 px-3 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Engine Architecture Specs</span>
          </button>
        </div>
      </div>

      {/* Forensic Benchmark Targets */}
      <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>Deterministic Threat Triage Targets</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized forensic test artifacts representing four critical enterprise threat categories.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800 self-start sm:self-auto">
            STANDARDIZED THREAT BENCHMARKS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Target 1: Authentic Leica */}
          <div className="p-4 rounded-lg bg-[#071020] border border-cyan-900/40 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  SEC-TRG // TRUSTED PROVENANCE
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                Leica M11-P Hardware Capture
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Contains cryptographically signed C2PA JUMBF manifest, valid Leica Root CA chain, and uniform sensor error level profile.
              </p>
            </div>
            <button
              onClick={() => onLaunchBenchmark('med_authentic_c2pa')}
              className="mt-4 w-full py-2 px-3 rounded bg-[#0b1b36] hover:bg-cyan-950 text-xs text-cyan-300 font-mono font-medium flex items-center justify-center gap-1.5 border border-cyan-900 hover:border-cyan-600 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              <span>Inspect Forensic Dossier</span>
            </button>
          </div>

          {/* Target 2: Midjourney AI */}
          <div className="p-4 rounded-lg bg-[#071020] border border-cyan-900/40 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/80">
                  SEC-TRG // SYNTHETIC DIFFUSION
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                Midjourney v6 Cyber Operative
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Embedded generation parameters in PNG text chunks, ViT diffusion artifact score 94.2%, absent C2PA root manifest.
              </p>
            </div>
            <button
              onClick={() => onLaunchBenchmark('med_ai_midjourney')}
              className="mt-4 w-full py-2 px-3 rounded bg-[#0b1b36] hover:bg-amber-950/80 text-xs text-amber-300 font-mono font-medium flex items-center justify-center gap-1.5 border border-amber-900/60 hover:border-amber-600 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Inspect Forensic Dossier</span>
            </button>
          </div>

          {/* Target 3: ElevenLabs Audio */}
          <div className="p-4 rounded-lg bg-[#071020] border border-cyan-900/40 hover:border-rose-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/80">
                  SEC-TRG // NEURAL VOICE CLONE
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-rose-300 transition-colors">
                Cloned Voice Wire Memo
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Sharp 16.0 kHz brickwall vocoder cutoff, unnatural zero-energy pause floors, synthetic voice marker in spectral domain.
              </p>
            </div>
            <button
              onClick={() => onLaunchBenchmark('med_audio_synth')}
              className="mt-4 w-full py-2 px-3 rounded bg-[#0b1b36] hover:bg-rose-950/80 text-xs text-rose-300 font-mono font-medium flex items-center justify-center gap-1.5 border border-rose-900/60 hover:border-rose-600 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>Inspect Forensic Dossier</span>
            </button>
          </div>

          {/* Target 4: Deepfake Video */}
          <div className="p-4 rounded-lg bg-[#071020] border border-cyan-900/40 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/80">
                  SEC-TRG // TEMPORAL DEEPFAKE
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                Press Briefing Face Re-enactment
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Keyframe boundary blurring at frames 42-88, unnatural 0-blink cadence, specular illumination disparity across facial planes.
              </p>
            </div>
            <button
              onClick={() => onLaunchBenchmark('med_video_deepfake')}
              className="mt-4 w-full py-2 px-3 rounded bg-[#0b1b36] hover:bg-amber-950/80 text-xs text-amber-300 font-mono font-medium flex items-center justify-center gap-1.5 border border-amber-900/60 hover:border-amber-600 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Inspect Forensic Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Incident & Analysis Ledger */}
      <div className="p-5 rounded-xl tech-panel border border-cyan-900/40 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Active Forensic Dossiers & Telemetry Stream</span>
          </h2>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Dossier Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono">
          {reports.map((report) => (
            <div
              key={report.id}
              className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#08152b] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-cyan-900/50"
              onClick={() => {
                setSelectedReportId(report.id);
                setActiveTab('reports');
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#061021] border border-cyan-900/60 flex items-center justify-center text-xs font-bold uppercase text-cyan-400">
                  {report.mediaAsset.mediaType.substring(0, 3)}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-sans font-medium text-slate-200">
                    {report.mediaAsset.originalFilename}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    SHA-256: {report.mediaAsset.sha256.substring(0, 18)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded border font-mono ${
                    report.overallStatus === 'Evidence supports recorded provenance'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : report.overallStatus === 'Potential manipulation indicators detected'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {report.overallStatus}
                </span>
                <span className="text-[11px] text-slate-500 hidden md:block">
                  {new Date(report.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
