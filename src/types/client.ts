import {
  UserProfile,
  VerificationRecord,
  ConsentRecord,
  MediaAsset,
  AnalysisJob,
  VerificationReport,
  AuditEvent,
  AnalyzerFinding,
  ProvenanceDetails
} from '../server/types.ts';

export type {
  UserProfile,
  VerificationRecord,
  ConsentRecord,
  MediaAsset,
  AnalysisJob,
  VerificationReport,
  AuditEvent,
  AnalyzerFinding,
  ProvenanceDetails
};

export type ActiveTab =
  | 'dashboard'
  | 'workspace'
  | 'reports'
  | 'chat'
  | 'identity'
  | 'history'
  | 'transparency'
  | 'docs';

/**
 * Strips any designation, title, or parenthetical qualification from display names
 * (e.g. "Arjun R. (Principal Security Officer)" -> "Arjun R.")
 */
export function cleanDisplayName(name?: string | null): string {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}
