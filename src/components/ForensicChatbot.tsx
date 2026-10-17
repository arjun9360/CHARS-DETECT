import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  Radio,
  PhoneCall,
  PhoneOff
} from 'lucide-react';
import { VerificationReport } from '../types/client.ts';
import { db as firestore, auth } from '../lib/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  model?: string;
  timestamp: string;
}

interface ForensicChatbotProps {
  currentReport: VerificationReport | null;
}

export const ForensicChatbot: React.FC<ForensicChatbotProps> = ({ currentReport }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      content: `Hello, I am the **CHARS DETECT Forensic Intelligence Assistant**.

I specialize in **digital media forensics, C2PA Content Credentials (ISO 21496-1), neural vocoder spectral analysis, and Laplacian Error Level Analysis (ELA)**.

${currentReport ? `*Currently inspecting:* **${currentReport.mediaAsset.originalFilename}** (${currentReport.overallStatus}).` : 'No specific media dossier is selected, but you can ask any general forensic inquiry or select an asset from the Reports tab.'}

How can I assist your forensic investigation today? You can type below or click **"Live Voice (gemini-3.8-live)"** to talk in real-time.`,
      model: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live API Real-Time Voice State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle standard text chat message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Save to Firestore if authenticated
    try {
      if (auth.currentUser) {
        await addDoc(collection(firestore, 'chats', auth.currentUser.uid, 'messages'), {
          role: 'user',
          content: text,
          timestamp: serverTimestamp(),
          userId: auth.currentUser.uid
        });
      }
    } catch (e) {
      console.warn('Firestore message save note:', e);
    }

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          modelChoice,
          reportContext: currentReport || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with forensic model.');
      }

      const data = await response.json();
      const modelMsg: Message = {
        id: 'mod_' + Date.now(),
        role: 'model',
        content: data.reply,
        model: data.model,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Save model reply to Firestore
      if (auth.currentUser) {
        await addDoc(collection(firestore, 'chats', auth.currentUser.uid, 'messages'), {
          role: 'model',
          content: data.reply,
          model: data.model,
          timestamp: serverTimestamp(),
          userId: auth.currentUser.uid
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          content: `Forensic engine error: ${err.message || 'Service unavailable'}. Please verify connection.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Float32Array PCM to 16-bit LE Base64
  const pcmFloatToBase64 = (channelData: Float32Array): string => {
    const buffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play base64 audio response chunk
  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Check if WAV header or raw PCM
      if (bytes.length > 44 && binaryString.startsWith('RIFF')) {
        ctx.decodeAudioData(bytes.buffer.slice(0), (buffer) => {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        });
      } else {
        // Raw 16-bit PCM (24kHz)
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768.0;
        }
        const audioBuf = ctx.createBuffer(1, float32.length, 24000);
        audioBuf.copyToChannel(float32, 0);
        const source = ctx.createBufferSource();
        source.buffer = audioBuf;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('Audio chunk playback warning:', e);
    }
  };

  // Start real-time voice conversation session (Live API with gemini-3.8-live)
  const startLiveVoiceSession = async () => {
    try {
      setIsLiveActive(true);
      setLiveStatus('Connecting to Gemini 3.8 Live WebSocket bridge...');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setLiveStatus('Live API session active. Listening to microphone...');

        // Start microphone capture
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMuted || ws.readyState !== WebSocket.OPEN) return;
            const channel = e.inputBuffer.getChannelData(0);
            const base64Audio = pcmFloatToBase64(channel);
            ws.send(JSON.stringify({ audio: base64Audio }));
          };
        } catch (micErr: any) {
          setLiveStatus('Microphone access denied or simulated. Type to talk live.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            setLiveStatus('Gemini 3.8 Live is speaking...');
            playAudioChunk(data.audio);
          }
          if (data.text) {
            // Live transcription message
            const liveMsg: Message = {
              id: 'live_' + Date.now(),
              role: 'model',
              content: data.text,
              model: 'gemini-3.8-live',
              timestamp: new Date().toLocaleTimeString()
            };
            setMessages((prev) => [...prev, liveMsg]);
          }
          if (data.interrupted) {
            setLiveStatus('Live conversation turn interrupted by user.');
          }
        } catch (e) {
          console.warn('WS message parse warning:', e);
        }
      };

      ws.onclose = () => {
        setIsLiveActive(false);
        setLiveStatus('Live session closed.');
      };
    } catch (err: any) {
      console.error('Failed to start Live API session:', err);
      setIsLiveActive(false);
    }
  };

  const endLiveVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveActive(false);
    setLiveStatus('idle');
  };

  return (
    <div className="flex flex-col h-[740px] rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-950/50 border border-cyan-400/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>CHARS DETECT Forensic Intelligence Assistant</span>
              <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                Gemini Powered
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Role: Senior Media Forensics & C2PA Provenance Specialist
            </p>
          </div>
        </div>

        {/* Live Voice & Model Controls */}
        <div className="flex items-center gap-2">
          {/* Live Voice Button (gemini-3.8-live) */}
          {isLiveActive ? (
            <button
              onClick={endLiveVoiceSession}
              className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Live Call</span>
            </button>
          ) : (
            <button
              onClick={startLiveVoiceSession}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Voice (gemini-3.8-live)</span>
            </button>
          )}

          {/* Model Selector */}
          <select
            value={modelChoice}
            onChange={(e) => setModelChoice(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-lg px-2.5 py-1.5 font-mono outline-none cursor-pointer hover:border-cyan-500"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (General Forensics)</option>
            <option value="gemini-4-argon">gemini-4-argon (Deep Reasoning)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Triage)</option>
          </select>
        </div>
      </div>

      {/* Live Voice Banner when Active */}
      {isLiveActive && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border-b border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">
              <strong>GEMINI 3.8 LIVE (REAL-TIME VOICE):</strong> {liveStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded text-xs border ${
                isMuted ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Active Inspection Dossier Context Banner */}
      {currentReport && (
        <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-800/60 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2 truncate">
            <FileCheck2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              <strong>Active Dossier Context:</strong> {currentReport.mediaAsset.originalFilename} (SHA: {currentReport.mediaAsset.sha256.substring(0, 12)}...)
            </span>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 shrink-0 border border-cyan-700">
            {currentReport.overallStatus}
          </span>
        </div>
      )}

      {/* Scrollable Messages Thread */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              <div
                className={`text-[10px] font-mono flex items-center justify-between gap-2 pt-1 border-t ${
                  msg.role === 'user'
                    ? 'border-cyan-500/50 text-cyan-100'
                    : 'border-slate-800/80 text-slate-500'
                }`}
              >
                <span>{msg.model ? `Model: ${msg.model}` : 'User Question'}</span>
                <span>{msg.timestamp}</span>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Synthesizing forensic analysis with {modelChoice}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-mono text-slate-500 shrink-0">Prompts:</span>
        <button
          onClick={() => handleSendMessage('How do I interpret high Laplacian ELA variance?')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] border border-slate-800 shrink-0 transition-colors cursor-pointer"
        >
          Explain Laplacian ELA
        </button>
        <button
          onClick={() => handleSendMessage('Why does C2PA presence not guarantee real-world event truthfulness?')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] border border-slate-800 shrink-0 transition-colors cursor-pointer"
        >
          C2PA vs Event Truth
        </button>
        <button
          onClick={() => handleSendMessage('Explain how 16kHz Nyquist cutoffs detect ElevenLabs synthetic speech.')}
          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] border border-slate-800 shrink-0 transition-colors cursor-pointer"
        >
          Audio Vocoder 16kHz Cutoff
        </button>
        {currentReport && (
          <button
            onClick={() => handleSendMessage(`Analyze the active report for ${currentReport.mediaAsset.originalFilename} in detail.`)}
            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] border border-cyan-800 shrink-0 transition-colors cursor-pointer"
          >
            Analyze Current Report
          </button>
        )}
      </div>

      {/* Message Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask a forensic question or click 'Live Voice' to talk in real-time..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 outline-none"
        />

        <button
          disabled={!input.trim() || isLoading}
          onClick={() => handleSendMessage()}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            input.trim() && !isLoading
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
