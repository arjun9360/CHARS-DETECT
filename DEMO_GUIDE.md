# Judge & Evaluator Demo Walkthrough Guide

Follow this 5-minute walkthrough to evaluate all critical capabilities:

## 1. Quick Benchmark Evaluation (Dashboard)
1. Open the **Dashboard**.
2. Notice the real metrics and ethical constitution: "User verification, AI detection, provenance, and file integrity are evaluated as strictly independent dimensions."
3. In the **Benchmark Scenarios** section, click **Inspect Verification Report** on the **Leica M11-P Authentic Photo**.
4. Observe:
   - **Overall Assessment:** "Evidence supports recorded provenance".
   - **Dimension 1 (User Trust):** Displays account authentication & sandbox ID verification.
   - **Dimension 2 (File Integrity):** Actual computed SHA-256 and perceptual dHash.
   - **Dimension 3 (C2PA Credentials):** Valid JUMBF manifest, Leica Camera AG Root CA, assertion tree.
   - **Dimension 4 (Forensics):** Uniform sensor noise profile with Laplacian ELA score.

## 2. Inspect Synthetic AI Image Findings
1. Return to **Dashboard** and click **Inspect Verification Report** on **Midjourney v6 Cyber Operative**.
2. Notice:
   - **Overall Assessment:** "Potential manipulation indicators detected".
   - **Findings:** Detects embedded Midjourney prompt remnants in text chunks, ViT diffusion artifact score 94.2%, and absent C2PA credentials.
   - Switch to the **Visual ELA Map** tab to see the simulated compression disparity grid.

## 3. Real Media Upload & Ingestion (Workspace)
1. Navigate to **Workspace**.
2. Drag & drop or browse any supported image, audio, or video file.
3. Observe real-time binary magic byte validation and SHA-256 pre-calculation.
4. Select desired inspection modules (C2PA, Metadata, Noise ELA, Synthetic Detection).
5. Click **Execute Forensic Analysis** and watch the live progress stepper progress from `validating` to `processing` to `completed`.

## 4. Multi-Tier User Trust & Biometric Liveness (User Trust)
1. Navigate to **User Trust**.
2. Test the **Email & Phone OTP Verification Simulator** by clicking verify.
3. Launch the **Consent-Based Biometric Liveness Studio**.
4. Read the ISO/IEC 30107-3 informed consent notice, check the voluntary consent box, and click **Perform Liveness Check**.
5. Observe the passive/active liveness analysis and zero-raw-template retention policy.

## 5. Privacy, Cryptographic Wiping & Audit Trail (Audit Logs)
1. Navigate to **Audit Logs**.
2. View the immutable audit log entries recording login sessions, file uploads, and verification checks.
3. Open any report and click **Cryptographic Wipe**.
4. Confirm deletion and observe that the byte buffer is zero-filled and logged in the immutable audit feed.
