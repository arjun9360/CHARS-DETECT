# Privacy Charter, Consent Governance & Retention

## 1. Ethical Governance Charter
Digital trust must not come at the expense of user privacy. The platform implements privacy by design:
- **No Training on User Media:** Media uploaded for forensic verification is strictly isolated and never ingested into AI training pipelines or public datasets.
- **Purpose-Specific Consent (ISO/IEC 30107-3):** Explicit, informed consent is mandatory prior to initiating AI or biometric analysis. Users retain the legal right to withdraw consent at any time.
- **Cryptographic Erasure Guarantee:** When a user requests deletion, media byte buffers are overwritten with zero bytes before unlinking database records.

## 2. Retention Schedules
- **Active Reports & Assets:** Default retention is 30 days, configurable to 7 days, 90 days, or immediate user-directed deletion.
- **Audit Logs:** Metadata-only audit entries (actor, action, resource ID, timestamp) are retained for 90 days for forensic integrity.
