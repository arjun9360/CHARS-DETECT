import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Workspace } from './components/Workspace.tsx';
import { ReportView } from './components/ReportView.tsx';
import { ForensicChatbot } from './components/ForensicChatbot.tsx';
import { IdentityCenter } from './components/IdentityCenter.tsx';
import { HistoryAndAudit } from './components/HistoryAndAudit.tsx';
import { TransparencyCenter } from './components/TransparencyCenter.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import {
  UserProfile,
  MediaAsset,
  VerificationReport,
  AuditEvent,
  VerificationRecord,
  ConsentRecord,
  ActiveTab,
  cleanDisplayName
} from './types/client.ts';
import { auth, db as firestore, googleProvider, signInWithPopup, signOut } from './lib/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // User profile state - starts as null until authenticated
  const [user, setUser] = useState<UserProfile | null>(null);

  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ step: 'Initializing analysis workers...', percent: 5 });
  const [systemNotice, setSystemNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  // Handle Google Auth
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Strip any designation/title from displayName
        const cleanName = cleanDisplayName(fbUser.displayName) || 'Authenticated User';

        // Sync with Firestore profile
        const userRef = doc(firestore, 'users', fbUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: cleanName,
              role: 'user',
              emailVerified: fbUser.emailVerified,
              phoneVerified: false,
              identityVerified: false,
              biometricVerified: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Firestore user profile sync notice:', e);
        }

        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          displayName: cleanName,
          role: 'user',
          emailVerified: fbUser.emailVerified,
          phoneVerified: false,
          phoneNumber: fbUser.phoneNumber || '',
          identityVerified: false,
          biometricVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
      // Re-fetch reports, media, and audit trail for user session
      refreshData();
    });

    return () => unsubscribe();
  }, []);

  // Initial Data Fetching from Express Server
  const refreshData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        headers['Authorization'] = `Bearer ${auth.currentUser.uid}`;
      }

      const [resUser, resStatus, resMedia, resReports, resAudit] = await Promise.all([
        fetch('/api/v1/me', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/me/verification-status', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/media', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/reports', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/audit-events', { headers }).then(r => r.ok ? r.json() : null)
      ]);

      if (auth.currentUser && resUser?.user) {
        setUser({
          ...resUser.user,
          displayName: cleanDisplayName(resUser.user.displayName)
        });
      } else if (!auth.currentUser) {
        setUser(null);
      }

      if (resStatus?.verifications) setVerifications(resStatus.verifications);
      if (resStatus?.consents) setConsents(resStatus.consents);
      if (resMedia?.assets) setMediaAssets(resMedia.assets);
      if (resReports?.reports) {
        setReports(resReports.reports);
        if (!selectedReportId && resReports.reports.length > 0) {
          setSelectedReportId(resReports.reports[0].id);
        }
      }
      if (resAudit?.events) setAuditEvents(resAudit.events);
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Upload and Analysis Dispatch
  const handleMediaUploaded = async (file: File, requestedChecks: string[], referenceHash?: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ step: 'Validating magic bytes & computing SHA-256...', percent: 15 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/v1/media', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload media asset');
      }

      const mediaAsset: MediaAsset = await uploadRes.json();

      // Persist to Firestore if authenticated
      if (auth.currentUser) {
        try {
          await setDoc(doc(firestore, 'media_assets', mediaAsset.id), {
            ...mediaAsset,
            ownerId: auth.currentUser.uid
          });
        } catch (e) {
          console.warn('Firestore asset sync notice:', e);
        }
      }

      setAnalysisProgress({ step: 'Executing C2PA JUMBF extraction & EXIF forensic scanner...', percent: 40 });

      // Dispatch analysis job
      const analyzeRes = await fetch(`/api/v1/media/${mediaAsset.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedChecks, referenceHash })
      });

      if (!analyzeRes.ok) {
        throw new Error('Failed to start analysis job');
      }

      const { jobId } = await analyzeRes.json();

      // Poll analysis job until finished
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        try {
          const jobRes = await fetch(`/api/v1/jobs/${jobId}`);
          if (jobRes.ok) {
            const data = await jobRes.json();
            const job = data.job;

            setAnalysisProgress({
              step: job.currentStep || 'Processing forensic models...',
              percent: job.progressPercent || Math.min(95, 30 + pollCount * 15)
            });

            if (job.status === 'completed') {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              await refreshData();
              if (data.reportId) {
                setSelectedReportId(data.reportId);
              }
              setActiveTab('reports');
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              setSystemNotice({ type: 'error', message: 'Analysis failed: ' + (job.errorMessage || 'Unknown error') });
              setTimeout(() => setSystemNotice(null), 7000);
            }
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 500);
    } catch (err: any) {
      setIsAnalyzing(false);
      setSystemNotice({ type: 'error', message: err.message || 'Media ingestion failed' });
      setTimeout(() => setSystemNotice(null), 7000);
    }
  };

  // 1-Click Launch Benchmark Scenario
  const handleLaunchBenchmark = (sampleId: string) => {
    const foundReport = reports.find(r => r.mediaId === sampleId || r.id === `rep_${sampleId.replace('med_', '')}`);
    if (foundReport) {
      setSelectedReportId(foundReport.id);
    } else if (reports.length > 0) {
      setSelectedReportId(reports[0].id);
    }
    setActiveTab('reports');
  };

  // Secure Cryptographic Erasure
  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const res = await fetch(`/api/v1/media/${mediaId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshData();
        setSelectedReportId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Re-run Analysis
  const handleRerunAnalysis = async (mediaId: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ step: 'Re-initializing forensic analyzers...', percent: 20 });
    try {
      const res = await fetch(`/api/v1/media/${mediaId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedChecks: ['all'] })
      });
      if (res.ok) {
        const { jobId } = await res.json();
        const pollInterval = setInterval(async () => {
          const jobRes = await fetch(`/api/v1/jobs/${jobId}`);
          if (jobRes.ok) {
            const data = await jobRes.json();
            if (data.job?.status === 'completed') {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              await refreshData();
              if (data.reportId) setSelectedReportId(data.reportId);
            } else if (data.job?.status === 'failed') {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              setSystemNotice({ type: 'error', message: 'Re-run analysis failed: ' + (data.job?.errorMessage || 'Engine error') });
              setTimeout(() => setSystemNotice(null), 6000);
            }
          } else {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
          }
        }, 500);
      } else {
        setIsAnalyzing(false);
        const errJson = await res.json().catch(() => ({}));
        setSystemNotice({ type: 'error', message: errJson.error || 'Failed to start re-run analysis' });
        setTimeout(() => setSystemNotice(null), 6000);
      }
    } catch (err: any) {
      setIsAnalyzing(false);
      setSystemNotice({ type: 'error', message: err.message || 'Rerun error' });
      setTimeout(() => setSystemNotice(null), 6000);
      console.error('Rerun error:', err);
    }
  };

  // OTP Verification
  const handleVerifyOtp = async (type: 'email' | 'phone', code: string): Promise<boolean> => {
    const res = await fetch('/api/v1/verifications/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, code })
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Start Real-World ID Verification (Sandbox)
  const handleStartIdentityVerification = async () => {
    const res = await fetch('/api/v1/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'government_id' })
    });
    if (res.ok) {
      const session = await res.json();
      await fetch('/api/v1/verifications/webhook/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, outcome: 'approve' })
      });
      await refreshData();
    }
  };

  // Consent-Based Biometric Verification
  const handleStartBiometricVerification = async () => {
    const res = await fetch('/api/v1/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'biometric_liveness', hasConsent: true })
    });
    if (res.ok) {
      await refreshData();
    }
  };

  // Revoke Consent
  const handleRevokeConsent = async (purpose: string) => {
    const res = await fetch(`/api/v1/consent/${purpose}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshData();
    }
  };

  const currentReport = reports.find(r => r.id === selectedReportId) || reports[0] || null;

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-100 flex flex-col font-sans cyber-grid relative selection:bg-cyan-500 selection:text-black">
      {/* Subtle Ambient Radial Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        firebaseUser={firebaseUser}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
        {systemNotice && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              systemNotice.type === 'error'
                ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                : 'bg-cyan-950/70 border-cyan-800 text-cyan-200'
            }`}
          >
            <span>{systemNotice.message}</span>
            <button
              onClick={() => setSystemNotice(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            reports={reports}
            mediaAssets={mediaAssets}
            setActiveTab={setActiveTab}
            setSelectedReportId={setSelectedReportId}
            onLaunchBenchmark={handleLaunchBenchmark}
          />
        )}

        {activeTab === 'workspace' && (
          <Workspace
            onMediaUploaded={handleMediaUploaded}
            onSelectBenchmark={handleLaunchBenchmark}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView
            report={currentReport}
            onDeleteMedia={handleDeleteMedia}
            onRerunAnalysis={handleRerunAnalysis}
            onBackToWorkspace={() => setActiveTab('workspace')}
          />
        )}

        {activeTab === 'chat' && (
          <ForensicChatbot currentReport={currentReport} />
        )}

        {activeTab === 'identity' && (
          <IdentityCenter
            user={user}
            firebaseUser={firebaseUser}
            onSignIn={handleGoogleSignIn}
            verifications={verifications}
            consents={consents}
            onVerifyOtp={handleVerifyOtp}
            onStartIdentityVerification={handleStartIdentityVerification}
            onStartBiometricVerification={handleStartBiometricVerification}
            onRevokeConsent={handleRevokeConsent}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAndAudit
            mediaAssets={mediaAssets}
            auditEvents={auditEvents}
            reports={reports}
            onSelectReport={(repId) => {
              setSelectedReportId(repId);
              setActiveTab('reports');
            }}
            onDeleteMedia={handleDeleteMedia}
          />
        )}

        {activeTab === 'transparency' && <TransparencyCenter />}

        {activeTab === 'docs' && <DocumentationView />}
      </main>

      {/* Cyber Security Technical Footer */}
      <footer className="border-t border-cyan-950/80 bg-[#03070f] px-4 py-5 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-bold">CHARS DETECT</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400/80">PROVENANCE CHECKER</span>
          </div>
          <div>CHARS DETECT • PROVENANCE CHECKER • All Rights Reserved • Version 1.4.0</div>
          <div className="text-[11px] text-slate-600">FIPS 180-4 • ISO 21496-1 • NIST SP 800-86</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
