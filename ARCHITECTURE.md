# System Architecture & Multi-Modal Forensics Pipeline

## 1. Architectural Overview

```
                      [Browser Client: React 19 + TypeScript]
                                     │
                                     │ HTTP REST API v1 / Multipart Upload
                                     ▼
                      [Express 4.21 Gateway (server.ts)]
                                     │
           ┌─────────────────────────┴────────────────────────┐
           ▼                                                  ▼
[Identity & Biometric Services]                    [Media Security Gatekeeper]
 ├─ Email / Phone OTP Service                       ├─ File Signature (Magic Bytes)
 ├─ Government ID Adapter (Sandbox)                 ├─ Cryptographic SHA-256 Engine
 └─ Edge Liveness Verification                      └─ Perceptual Difference Hash (dHash)
                                                              │
                                                              ▼
                                                   [Asynchronous Job Queue]
                                                              │
    ┌──────────────────────┬──────────────────────┬───────────┴──────────┬──────────────────────┐
    ▼                      ▼                      ▼                      ▼                      ▼
[C2PA Engine]      [Metadata Parser]      [Laplacian ELA]        [Spectral DSP]         [Gemini Vision]
 ├─ JUMBF box       ├─ EXIF tags           ├─ Block variance      ├─ 16kHz vocoder       └─ Multimodal
 ├─ XMP manifest    ├─ Chunk prompts       ├─ High-frequency         cutoff detection        semantic
 └─ Signature CA    └─ AI markers             discontinuities     └─ Silence floors          forensics
    │                      │                      │                      │                      │
    └──────────────────────┴──────────────────────┼──────────────────────┴──────────────────────┘
                                                  ▼
                                    [Evidence Aggregator]
                                    (Strict Non-Blending)
                                                  │
                                                  ▼
                                     [Verification Dossier]
                                    (Reports, Wipes & Audit)
```

## 2. Processing Pipeline Stages

1. **Authentication & Authorization:** Validates user identity and tenant context.
2. **File Gatekeeping:** Validates binary file headers against authorized MIME types (JPEG, PNG, WebP, MP4, WebM, WAV, MP3). Oversized or malformed files are rejected immediately.
3. **Cryptographic Fingerprinting:** SHA-256 is generated directly from raw bytes, accompanied by a 64-bit perceptual dHash.
4. **C2PA Manifest Scanning:** Inspects file byte streams for C2PA JUMBF boxes, certificate chains, assertions, and cryptographic binding.
5. **Forensic Analysis:**
   - **Image:** Metadata extraction (detecting Midjourney, Stable Diffusion, ComfyUI prompt remnants), Laplacian Error Level Analysis (ELA) for localized compression anomalies.
   - **Video:** Container stream inspection, keyframe temporal boundary jitter, audio-visual sync delay check.
   - **Audio:** Fast Fourier Transform (FFT) spectral analysis, detecting neural vocoder brickwall cutoffs (16.0 kHz) and unnatural silence floors.
   - **Stickers:** Alpha mask transparency gradient analysis, edge antialiasing forensics, perceptual hash similarity.
6. **Evidence Aggregation:** Combines findings without generating a misleading single "fake percentage".
7. **Retention & Cryptographic Deletion:** Files can be cryptographically zero-filled on user command.
