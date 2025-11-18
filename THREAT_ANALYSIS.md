# NBX Backend Threat Analysis

_Last updated: 14 Nov 2025_

## 1. Overview
The Nairobi Block Exchange backend is a NestJS + MongoDB API that manages SME listings, Hedera tokenization, encrypted wallets, and investor onboarding. This document catalogues critical assets, trust boundaries, threats, existing controls, and recommended mitigations. It follows a STRIDE-inspired approach and highlights quick wins vs. long-term actions.

## 2. Crown Jewels & Trust Boundaries

| Asset / Boundary | Description | Current Controls | Risk Impact |
| --- | --- | --- | --- |
| **Hedera operator key & per-user private keys** | Used to create accounts and sign transactions; stored encrypted in MongoDB | AES-256-CBC encryption with password-derived key; secrets loaded from env | **Critical** – compromise gives attackers mint/burn/sign powers |
| **MongoDB data** | Users, companies, securities, documents | Authenticated API (JWT) for write endpoints | High – PII, financial data, governance info |
| **File uploads directory (`/uploads`)** | Company documents stored on local disk | JWT guard on upload/delete; minimal validation | Medium – path traversal, malware risk, disk exhaustion |
| **Hashgraph SDK interactions** | Equity/Bond issuance, dividends, voting | Singleton `HashgraphService`; env-based config | High – misconfig leads to tokenization errors or asset loss |
| **Auth/JWT boundary** | `/auth/register`, `/auth/login`, `JwtAuthGuard` protecting other routes | Custom AuthModule with Nest JWT strategy | High – missing refresh, brute-force mitigation |

## 3. Threat Model (STRIDE)

### Spoofing & Authentication
- **Weak password-only login**: No MFA, no rate limiting → brute-force risk.
- **JWT secrets stored in env**: If leaked (logs, repo), tokens can be forged.
- **No refresh-token rotation**: Long-lived access tokens increase replay window.

**Mitigations**
- Introduce rate limiting + IP throttling on `/auth/*` and `/users/:id/sign-transaction`.
- Add optional MFA / TOTP for high-risk operations (transaction signing, role changes).
- Rotate JWT secret regularly; store in HSM/secret manager.
- Short-lived access tokens + refresh token pair with revocation list.

### Tampering
- **File uploads**: No content-type/AV scanning or size limits; stored on local disk with predictable path.
- **Company documents**: Path stored in DB; potential manipulation to delete arbitrary files if `_id` guessable.
- **Transactions**: Signed transactions executed immediately; no secondary approval or limits.

**Mitigations**
- Enforce file type whitelist + max size + AV scan (e.g., ClamAV or cloud service).
- Store uploads in object storage (S3/GCS) with signed URLs and server-side encryption; don't persist absolute file paths in DB.
- Add per-user transaction limits & optional multi-signature approval.

### Repudiation
- Limited audit logs (only Nest Logger). Actions such as create equity, update user, sign transaction are not persisted in an audit trail.

**Mitigations**
- Implement structured audit logging (user, action, timestamp, request id) persisted to immutable store (e.g., Mongo collection with WORM controls or third-party log sink).
- Include transaction hash, diamond address, actor info for blockchain operations.

### Information Disclosure
- **Encrypted wallets**: Salt/IV stored alongside ciphertext. If DB dumped and password reused elsewhere, offline brute force is feasible.
- **API responses**: Login/register returns Hedera account IDs—acceptable but consider limiting when not needed.
- **Uploads**: `/uploads/companies/:companyId/documents` is unauthenticated GET (public). Sensitive docs might leak.

**Mitigations**
- Enforce password complexity, lockouts, and Argon2 or bcrypt cost tuning.
- Introduce KMS wrapping: encrypt AES key with HSM-managed key, so DB dump alone isn’t sufficient.
- Restrict document retrieval behind auth/ACL; provide pre-signed URLs per user role.

### Denial of Service
- **Expensive Hedera ops**: Each registration creates accounts + tokens; malicious actors could exhaust HBAR or API throughput.
- **Uploads**: No rate or size limit; disk exhaustion risk.

**Mitigations**
- Add API-level throttling & quotas per tenant (Nest rate-limiter or API gateway).
- Queue long-running Hedera operations and throttle concurrency; require email verification before provisioning blockchain accounts.
- Set upload size caps, background virus scanning, and cleanup jobs.

### Elevation of Privilege
- **Role changes**: `updateUserRole` accessible to any authenticated user? Controller route not shown but if exposed w/out guard, attacker could escalate.
- **JWT guard**: ensures auth but no fine-grained authorization; services rely on `role` but not enforced.

**Mitigations**
- Enforce RBAC at controller/service (e.g., Nest `RolesGuard`) so only admins can modify roles, companies, securities.
- Validate `useremail` path params match JWT subject unless admin override.

## 4. Transaction Signing Analysis
1. Users supply plaintext password each time; backend decrypts the stored wallet and signs via Hedera SDK.
2. Password reuse or weak password leads to offline cracking if DB leaked.
3. No hardware isolation—private keys exist briefly in memory on app server.

**Recommendations**
- Move encrypted wallets to dedicated key vault (HashiCorp Vault, AWS KMS). Store only vault reference in Mongo.
- Add per-transaction confirmation (email/app) to prevent replay.
- Consider client-side signing (non-custodial) for investors to avoid holding keys server-side.

## 5. Security Recommendations (Prioritized)

| Priority | Recommendation | Rationale |
| --- | --- | --- |
| P0 | Centralize secret management (JWT secret, Hedera operator key) in KMS/secret manager; rotate regularly. | Prevent catastrophic key leakage |
| P0 | Add input validation + guards for uploads; require auth for GET documents; move storage to secure bucket. | Prevent malware, path traversal, data leak |
| P1 | Implement rate limiting & account lockout on auth + transaction-sign endpoints. | Stop brute force and DoS |
| P1 | Introduce RBAC guard + policy checks on sensitive routes (role updates, company CRUD, securities). | Prevent privilege escalation |
| P1 | Add audit logging + SIEM integration (structured logs, tamper-evident trail). | For forensics/compliance |
| P2 | Improve wallet protection (Argon2id, pepper, KMS-wrapped keys, optional hardware signing). | Reduce risk of key theft |
| P2 | Queue blockchain operations, add retry/backoff, limit simultaneous creations. | Protect against rate spikes |
| P2 | Add automated dependency/lint/security scans (npm audit, Snyk, GitHub Advanced Security). | Catch known vulns |

## 6. Next Steps Checklist
- [ ] Secret inventory + rotation plan (JWT, Hedera operator, Mongo credentials)
- [ ] Implement Nest rate-limiter & `@nestjs/throttler`
- [ ] Build `RolesGuard` + decorators for admin-only actions
- [ ] Harden upload service (storage backend, scanning, ACL)
- [ ] Add monitoring: Prometheus metrics, health probes, log shipping
- [ ] Perform penetration test focusing on auth, uploads, transaction signing

---
_This document should be revisited quarterly or whenever major architectural changes land (new modules, blockchain flows, storage changes)._