# CHARS DETECT
### Provenance Checker

**CHARS DETECT** is a digital media verification platform designed to analyze images, videos, audio, and supported stickers for AI-generated content indicators, potential manipulation, file metadata, integrity, and digital provenance.

## Features

- **Media Analysis** — Analyze supported media for AI-generated and manipulated content indicators.
- **Provenance Checking** — Examine available digital content credentials and provenance information.
- **Metadata Extraction** — Inspect available file metadata and technical details.
- **File Integrity** — Generate SHA-256 hashes to identify exact file matches.
- **Analysis Reports** — View findings, verification statuses, and technical evidence.
- **Secure Workspace** — Manage media analyses and reports with appropriate access controls.

## Supported Media

- Images
- Videos
- Audio files
- Static and supported animated stickers

*Supported formats and analysis capabilities depend on the implemented modules.*

## Technology Stack

Update this list to match the technologies actually used in the project.

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Python / FastAPI
- Database: PostgreSQL
- AI Analysis: Configured media-detection models
- Provenance: C2PA-compatible tools, where integrated

## Getting Started

1. Clone the repository.
2. Install the project's dependencies.
3. Configure the required environment variables.
4. Start the application using the project's development instructions.
5. Upload supported media and review the available analysis results.

## Security & Privacy

- Protect uploaded media and analysis reports.
- Restrict access to authorized users.
- Keep API keys and secrets out of source control.
- Process personal or sensitive media only with appropriate authorization and consent.

## Important Note

CHARS DETECT provides technical indicators and provenance information to support media assessment. AI detection results are not definitive proof of authenticity or manipulation. Missing provenance information does not automatically mean that a file is fake.
