# Security Model & Threat Mitigations

## 1. Threat Matrix & Defense Controls

| Threat Vector | Potential Impact | Defensive Mitigation Implemented |
| :--- | :--- | :--- |
| **File Extension Spoofing** | Executable masquerading as JPEG/PNG | Pure magic byte binary inspection prior to memory decoding (`detectFileSignature`). Unknown byte signatures rejected at gateway. |
| **Parser Exploits & Image Bombs** | Heap overflow or resource exhaustion | Strict 50MB file size limit, isolated buffer processing, explicit memory disposal. |
| **Cross-Tenant Asset Access** | Unauthorized inspection of private reports | Multi-tenant ownership checks on every `/api/v1/media/:id` and `/api/v1/reports/:id` route. Direct access attempts by non-owners return 404/403. |
| **Forged Provenance Manifests** | Attacker claims fake C2PA verification | C2PA-RS manifest verification parses JUMBF box signatures, validating root certificate authorities and SHA-256 byte bindings. |
| **Biometric Template Leakage** | Long-term identity compromise | **Zero Raw Biometric Storage Policy.** Face liveness calculations occur ephemerally in volatile memory; templates are never written to disk or database. |
| **Deceptive Authenticity Claims** | False sense of security | **Anti-Hallucination Constitution.** Separates user verification, AI detection, provenance, and file integrity into independent dimensions. |

## 2. Ingestion Security Boundary
All uploaded content is treated as untrusted binary data:
- Content is stored in isolated memory buffers or dedicated private object storage keys.
- Media files are never mounted into web-accessible public directories.
- Error messages returned to clients never leak internal stack traces or filesystem paths.
