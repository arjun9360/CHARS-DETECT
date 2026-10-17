# AI Model Cards & Analyzer Registry

Every forensic algorithm and machine learning model integrated into the platform is documented with its version, license, training provenance, and known failure modes:

| Analyzer Module | Model / Engine Name | Version | License | Provider | Intended Task | Documented Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C2PA Manifest Inspector** | C2PA-RS Core | v0.38.1 | Apache 2.0 | C2PA Alliance | JUMBF box extraction & cryptographic signature validation | Does not evaluate real-world event truthfulness; only certifies recorded provenance. |
| **EXIF & Chunk Prompt Extractor** | ExifToolSafe Forensics | v12.80 | Artistic / GPL | Local Deterministic | Extracts EXIF, XMP, and PNG text chunks for AI prompt parameters | Metadata can be stripped or rewritten during social media transmission. |
| **Error Level Analysis (ELA)** | Laplacian Compression Profiler | v2.1 | MIT | Local Deterministic | Localized compression variance & high-frequency spatial discontinuities | High compression variance can result from repeated legitimate JPEG resaves. |
| **Synthetic Media Transformer** | OpenForensics ViT-H/14-Deepfake | v3.2.0 | CC-BY-NC 4.0 | Local / PyTorch | Deepfake facial artifact & diffusion latent residual detection | Probabilistic classifier; novel generator architectures may exhibit lower detection sensitivity. |
| **Multimodal Vision Forensics** | Google Gemini 3.8 Flash | 2026-latest | GCP License | Google GenAI | Qualitative semantic inspection of lighting, reflections, and anatomy | Semantic evaluation is qualitative and should be paired with deterministic signal checks. |
| **Temporal Video Jitter Analyzer** | Keyframe Stream Inspector | v3.0 | LGPL 2.1 | Local / FFprobe | Keyframe boundary blending, face jitter, and A/V sync drift | Frame-rate conversion artifacts can occasionally simulate temporal jitter. |
| **Vocoder Spectral DSP** | AASIST-Spectral VoiceForensics | v2.4 | BSD-3-Clause | Forensic DSP | Neural vocoder 16kHz brickwall cutoff & pause floor analysis | Aggressive MP3 bitrates can produce high-frequency cutoff roll-offs. |
| **Sticker Alpha Mask Forensics** | AlphaMatte Edge Anomaly Detector | v1.4 | MIT | Local Deterministic | Alpha transparency gradient analysis & 64-bit dHash fingerprinting | Perceptual similarity requires registered reference asset database. |
