# Database Schema & Entity Relationships

The data layer models 8 normalized entities designed for cross-tenant isolation and strict privacy compliance:

## 1. `profiles`
- `id` (UUID / text, Primary Key)
- `email` (Unique, text)
- `display_name` (text)
- `role` ('user' | 'admin' | 'operator')
- `email_verified` (boolean)
- `phone_verified` (boolean)
- `phone_number` (text, nullable)
- `identity_verified` (boolean)
- `identity_provider` (text, nullable)
- `biometric_verified` (boolean)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)

## 2. `verification_records`
- `id` (UUID / text, Primary Key)
- `user_id` (Foreign Key -> profiles.id)
- `method` ('email_otp' | 'phone_otp' | 'government_id' | 'biometric_liveness')
- `status` ('pending' | 'verified' | 'rejected' | 'expired' | 'cancelled' | 'unavailable')
- `provider` (text)
- `provider_reference` (text)
- `consent_record_id` (Foreign Key -> consent_records.id, nullable)
- `verified_at` (timestamp, nullable)
- `expires_at` (timestamp, nullable)
- `is_sandbox` (boolean)
- `details` (JSONB)

## 3. `consent_records`
- `id` (UUID / text, Primary Key)
- `user_id` (Foreign Key -> profiles.id)
- `purpose` ('ai_analysis' | 'biometric_verification' | 'identity_verification' | 'telemetry_retention')
- `policy_version` (text)
- `consent_status` ('granted' | 'withdrawn')
- `granted_at` (timestamp)
- `withdrawn_at` (timestamp, nullable)

## 4. `media_assets`
- `id` (UUID / text, Primary Key)
- `owner_id` (Foreign Key -> profiles.id)
- `media_type` ('image' | 'video' | 'audio' | 'sticker')
- `storage_key` (text, random private UUID key)
- `original_filename` (text)
- `mime_type` (text)
- `file_size` (bigint)
- `sha256` (char(64), cryptographic digest)
- `perceptual_hash` (text, 64-bit dHash)
- `retention_until` (timestamp)
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable)

## 5. `analysis_jobs`
- `id` (UUID / text, Primary Key)
- `media_id` (Foreign Key -> media_assets.id)
- `owner_id` (Foreign Key -> profiles.id)
- `status` ('queued' | 'validating' | 'processing' | 'completed' | 'partially_completed' | 'failed' | 'cancelled')
- `progress_percent` (integer)
- `current_step` (text)
- `requested_checks` (JSONB array)
- `started_at` (timestamp)
- `completed_at` (timestamp, nullable)

## 6. `reports`
- `id` (UUID / text, Primary Key)
- `media_id` (Foreign Key -> media_assets.id)
- `job_id` (Foreign Key -> analysis_jobs.id)
- `owner_id` (Foreign Key -> profiles.id)
- `report_version` (text)
- `overall_status` (enum of responsible assessment states)
- `assessment_summary` (text)
- `uncertainty_notes` (JSONB array)
- `unavailable_checks` (JSONB array)
- `recommended_next_steps` (JSONB array)
- `is_demo_data` (boolean)
- `generated_at` (timestamp)

## 7. `audit_events`
- `id` (UUID / text, Primary Key)
- `actor_id` (Foreign Key -> profiles.id)
- `actor_email` (text, nullable)
- `action` (text)
- `resource_type` ('media' | 'report' | 'verification' | 'consent' | 'session')
- `resource_id` (text)
- `created_at` (timestamp)
- `metadata` (JSONB, strictly non-sensitive telemetry)
