import React, { useState } from 'react';
import {
  History,
  FileCheck2,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  Lock,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MediaAsset, AuditEvent, VerificationReport } from '../types/client.ts';

interface HistoryAndAuditProps {
  mediaAssets: MediaAsset[];
  auditEvents: AuditEvent[];
  reports: VerificationReport[];
  onSelectReport: (reportId: string) => void;
  onDeleteMedia: (mediaId: string) => Promise<void>;
}

export const HistoryAndAudit: React.FC<HistoryAndAuditProps> = ({
  mediaAssets,
  auditEvents,
  reports,
  onSelectReport,
  onDeleteMedia
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'media' | 'audit'>('media');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedia = mediaAssets.filter(
    (m) =>
      m.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sha256.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAudit = auditEvents.filter(
    (e) =>
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.resourceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Audit Trail & Media Retention History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable system logs, retention schedule management, and cryptographic media deletion controls.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('media')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'media' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Media Library ({mediaAssets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Log Feed ({auditEvents.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by filename, SHA-256 or action..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:border-cyan-500 outline-none"
        />
      </div>

      {activeSubTab === 'media' ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">SHA-256 Fingerprint</th>
                  <th className="p-3.5">Retention Until</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMedia.map((m) => {
                  const rep = reports.find((r) => r.mediaId === m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-medium text-slate-200">{m.originalFilename}</div>
                        {m.isSampleData && (
                          <span className="text-[10px] font-mono text-cyan-400">BENCHMARK SAMPLE</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-cyan-400 uppercase">{m.mediaType}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        {(m.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                        {m.sha256.substring(0, 16)}...
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(m.retentionUntil).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {rep && (
                          <button
                            onClick={() => onSelectReport(rep.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-[11px] cursor-pointer"
                          >
                            View Report
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMedia(m.id)}
                          className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-medium text-[11px] cursor-pointer"
                        >
                          Wipe
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="text-xs text-slate-400 font-mono pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>IMMUTABLE AUDIT RECORD FEED</span>
            <span>PROTECTED FROM USER TAMPERING</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {filteredAudit.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{event.action}</span>
                    <span className="text-[11px] text-slate-500">[{event.resourceType}]</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Target: {event.resourceId} • Actor: {event.actorEmail || event.actorId}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 shrink-0">
                  {new Date(event.createdAt).toLocaleTimeString()} ({new Date(event.createdAt).toLocaleDateString()})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
