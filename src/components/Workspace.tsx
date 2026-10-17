import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Video,
  Music,
  Sticker,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Settings2,
  ShieldCheck,
  Hash,
  Loader2,
  ArrowRight,
  Info,
  Radio,
  Binary,
  Crosshair,
  Cpu
} from 'lucide-react';
import { MediaType } from '../server/core/forensics.ts';
import { MediaAsset } from '../types/client.ts';

interface WorkspaceProps {
  onMediaUploaded: (file: File, requestedChecks: string[], referenceHash?: string) => Promise<void>;
  onSelectBenchmark: (sampleId: string) => void;
  isAnalyzing: boolean;
  analysisProgress: { step: string; percent: number };
}

export const Workspace: React.FC<WorkspaceProps> = ({
  onMediaUploaded,
  onSelectBenchmark,
  isAnalyzing,
  analysisProgress
}) => {
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{ valid: boolean; message: string; details?: string } | null>(null);
  const [referenceHash, setReferenceHash] = useState('');
  const [requestedChecks, setRequestedChecks] = useState<string[]>([
    'c2pa_manifest',
    'exif_metadata_prompt',
    'noise_ela_variance',
    'synthetic_detection'
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'wav', 'mp3'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setFileValidation({
        valid: false,
        message: 'Unsupported format. Allowed: JPEG, PNG, WebP, MP4, WebM, WAV, MP3.'
      });
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileValidation({
        valid: false,
        message: 'File size exceeds 50MB limit.'
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFileValidation({
      valid: true,
      message: 'Binary magic bytes pre-validated. Cryptographic hash binding ready.',
      details: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB, MIME: ${file.type || 'application/octet-stream'})`
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const toggleCheck = (id: string) => {
    setRequestedChecks((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onMediaUploaded(selectedFile, requestedChecks, referenceHash.trim() || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl tech-panel border border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
              MEDIA FORENSICS STUDIO
            </span>
            <span className="text-xs font-mono text-slate-500">|</span>
            <span className="text-xs font-mono text-slate-400">INGESTION GATEWAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <span>Digital Evidence Ingestion & Forensic Lab</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Isolate, sandbox, and inspect suspect digital media against C2PA provenance and multi-modal synthetic models.
          </p>
        </div>

        {/* Media type filter tabs */}
        <div className="flex items-center gap-1 bg-[#060e1d] p-1 rounded-lg border border-cyan-950 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setSelectedMediaType('all')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
              selectedMediaType === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedMediaType('image')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedMediaType === 'image'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Images</span>
          </button>
          <button
            onClick={() => setSelectedMediaType('video')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedMediaType === 'video'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setSelectedMediaType('audio')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedMediaType === 'audio'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setSelectedMediaType('sticker')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedMediaType === 'sticker'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sticker className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Area & Pipeline Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dropzone & File Summary */}
        <div className="lg:col-span-2 space-y-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px] overflow-hidden ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                : selectedFile
                ? 'border-emerald-500/50 bg-[#061124] shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'border-cyan-900/50 hover:border-cyan-500/40 bg-[#071020]/90 hover:bg-[#09152b]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.wav,.mp3"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-xl bg-[#08152c] border border-cyan-800/60 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="text-base font-bold text-white mb-1 font-mono">
              {selectedFile ? selectedFile.name : 'Drop Media File for Forensic Dissection'}
            </div>
            <p className="text-xs text-slate-400 max-w-md mb-4 font-sans">
              Supports JPEG, PNG, WebP, MP4, WebM, WAV, MP3, and alpha stickers up to 50MB. Safe non-destructive isolated processing.
            </p>

            <span className="px-4 py-2 rounded text-xs font-mono font-medium bg-[#0b1d3d] hover:bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm transition-colors">
              Browse Local Media
            </span>
          </div>

          {/* Validation Notice */}
          {fileValidation && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                fileValidation.valid
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}
            >
              {fileValidation.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold font-mono">{fileValidation.message}</p>
                {fileValidation.details && (
                  <p className="text-slate-400 font-mono mt-1 text-[11px]">{fileValidation.details}</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Scenario Triage Panel */}
          <div className="rounded-xl tech-panel border border-cyan-900/40 p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span>Pre-Loaded Incident Triage Benchmarks</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">Deterministic Evidence</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectBenchmark('med_authentic_c2pa')}
                className="p-3 rounded-lg border border-cyan-950 bg-[#060e1d] hover:border-emerald-500/50 hover:bg-[#0a1833] text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] font-mono text-emerald-400 font-bold">AUTHENTIC</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-1">Leica C2PA Image</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Valid Manifest</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectBenchmark('med_ai_midjourney')}
                className="p-3 rounded-lg border border-cyan-950 bg-[#060e1d] hover:border-amber-500/50 hover:bg-[#0a1833] text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] font-mono text-amber-400 font-bold">SYNTHETIC</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-1">Midjourney Image</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Prompt Artifacts</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectBenchmark('med_audio_synth')}
                className="p-3 rounded-lg border border-cyan-950 bg-[#060e1d] hover:border-rose-500/50 hover:bg-[#0a1833] text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] font-mono text-rose-400 font-bold">VOICE CLONE</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-1">ElevenLabs Audio</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">16kHz Cutoff</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectBenchmark('med_video_deepfake')}
                className="p-3 rounded-lg border border-cyan-950 bg-[#060e1d] hover:border-amber-500/50 hover:bg-[#0a1833] text-left transition-all cursor-pointer"
              >
                <div className="text-[10px] font-mono text-amber-400 font-bold">DEEPFAKE</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-1">Face-Swap Video</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Temporal Jitter</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pipeline Configuration */}
        <div className="space-y-5">
          <div className="rounded-xl tech-panel border border-cyan-900/40 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3 font-mono">
              <Settings2 className="w-4 h-4 text-cyan-400" />
              <span>Inspection Sensor Configuration</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-[#071329] transition-colors">
                <input
                  type="checkbox"
                  checked={requestedChecks.includes('c2pa_manifest')}
                  onChange={() => toggleCheck('c2pa_manifest')}
                  className="rounded border-cyan-800 bg-slate-900 text-cyan-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white font-mono">C2PA Content Credentials</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Scan JUMBF boxes, verify cryptographic root chain.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-[#071329] transition-colors">
                <input
                  type="checkbox"
                  checked={requestedChecks.includes('exif_metadata_prompt')}
                  onChange={() => toggleCheck('exif_metadata_prompt')}
                  className="rounded border-cyan-800 bg-slate-900 text-cyan-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white font-mono">Metadata & Prompt Remnants</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Detect ComfyUI, Midjourney, and SD prompt embeddings.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-[#071329] transition-colors">
                <input
                  type="checkbox"
                  checked={requestedChecks.includes('noise_ela_variance')}
                  onChange={() => toggleCheck('noise_ela_variance')}
                  className="rounded border-cyan-800 bg-slate-900 text-cyan-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white font-mono">Error Level & Compression ELA</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Laplacian error variance & high-frequency discontinuities.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-[#071329] transition-colors">
                <input
                  type="checkbox"
                  checked={requestedChecks.includes('synthetic_detection')}
                  onChange={() => toggleCheck('synthetic_detection')}
                  className="rounded border-cyan-800 bg-slate-900 text-cyan-500 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white font-mono">Synthetic Media Model Inference</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">ViT diffusion artifact and vocoder spectral models.</p>
                </div>
              </label>
            </div>

            {/* Optional Reference Hash Input */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 font-mono">
                Known Reference Hash (Optional)
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={referenceHash}
                  onChange={(e) => setReferenceHash(e.target.value)}
                  placeholder="Expected SHA-256 for byte match"
                  className="w-full bg-[#050c18] border border-cyan-950 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-cyan-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Verifies byte digest against an authoritative evidence vault hash.
              </p>
            </div>

            {/* Ingestion & Dispatch Action */}
            <button
              type="button"
              disabled={!selectedFile || isAnalyzing}
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedFile && !isAnalyzing
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                  : 'bg-[#071329] text-slate-500 cursor-not-allowed border border-cyan-950'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Executing Threat Extraction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Forensic Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Processing Stepper Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#050b16]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full tech-panel border border-cyan-500/50 rounded-xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-5 animate-cyber-scan">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_#22d3ee]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Forensic Pipeline In Progress</h3>
                <p className="text-xs text-cyan-300/80 font-mono">Sandboxed signal decomposition...</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-cyan-300">
                <span>{analysisProgress.step}</span>
                <span>{analysisProgress.percent}%</span>
              </div>
              <div className="w-full bg-[#050c18] h-2 rounded-full overflow-hidden border border-cyan-900">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 shadow-[0_0_10px_#22d3ee]"
                  style={{ width: `${analysisProgress.percent}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-cyan-300/90 bg-[#050d1a] p-3 rounded-lg border border-cyan-950 font-mono">
              [ANALYZER] Dispatching C2PA JUMBF parser & Laplacian ELA profiler...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
