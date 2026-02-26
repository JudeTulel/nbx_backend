# AWS Deployment Implementation (Hedera Trade Signing with AWS KMS)

## Goal
Move `nbx_backend` from VPS-style private key handling (`OPERATOR_KEY` in `.env`) to AWS-native signing with **AWS KMS**, so the trade route signs Hedera transactions without exposing a private key.

## Why KMS?
- Private keys **never** leave AWS infrastructure
- Tamper-resistant hardware security modules (HSMs)
- Audit logs and access controls built-in
- Key rotation capabilities

## Current Gap in This Repo
`src/modules/trade/trade.service.ts` currently reads:
- `OPERATOR_ID`
- `OPERATOR_KEY`

and signs with `transaction.sign(this.backendOperatorKey)`.

This is what we are replacing.

## Target Architecture
1. Backend (NestJS) receives trade request.
2. Backend builds and freezes Hedera transaction.
3. Backend hashes signing payload.
4. Backend calls `kms:Sign` on an asymmetric `ECC_SECG_P256K1` key.
5. Backend converts DER signature -> Hedera raw `(r || s)` 64-byte signature.
6. Backend attaches KMS signature to transaction and returns serialized tx bytes.

## AWS Services to Use
- AWS KMS: transaction signing key
- AWS IAM: role-based access to `kms:Sign`
- AWS CloudTrail: audit `Sign` operations
- AWS Secrets Manager or SSM Parameter Store: non-key config secrets
- AWS ECS Fargate (recommended) or EC2: app hosting
- AWS ECR: container image registry
- (Optional) ALB + ACM + Route53: HTTPS and DNS

## Migration from Google Cloud VPS to AWS
1. Containerize backend (if not already).
2. Push image to ECR.
3. Deploy on ECS Fargate.
4. Replace static AWS access keys with **task role** permissions.
5. Remove `OPERATOR_KEY` from `.env` and CI secrets.

## Step 1: Create KMS Key (Hedera-Compatible)
Create asymmetric key with:
- `KeySpec`: `ECC_SECG_P256K1`
- `KeyUsage`: `SIGN_VERIFY`
- `SigningAlgorithm`: `ECDSA_SHA_256`

Example:
```bash
aws kms create-key \
  --key-spec ECC_SECG_P256K1 \
  --key-usage SIGN_VERIFY \
  --description "NBX Hedera Trade Signing Key"
```

Optional alias:
```bash
aws kms create-alias \
  --alias-name alias/nbx-hedera-trade-signing \
  --target-key-id <KEY_ID>
```

## Step 2: IAM Policy (Least Privilege)
Grant app runtime role only:
- `kms:Sign`
- `kms:GetPublicKey`
- `kms:DescribeKey`

Scope permissions to the specific key ARN (not `*`).

## Step 3: App Config Changes
Keep in environment (safe):
```env
HEDERA_NETWORK=testnet
OPERATOR_ID=0.0.xxxxx
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=alias/nbx-hedera-trade-signing
```

Remove from environment:
```env
OPERATOR_KEY=
```

## Step 4: Trade Service Refactor (Code-Level)
In `src/modules/trade/trade.service.ts`:
1. Remove `PrivateKey` loading from env.
2. Initialize AWS KMS client.
3. Fetch/parse KMS public key and create Hedera `PublicKey`.
4. Use `client.setOperatorWith(operatorId, publicKey, signerFn)`.
5. `signerFn` should:
   - hash transaction bytes (digest mode)
   - call `SignCommand` (`ECDSA_SHA_256`, `MessageType: DIGEST`)
   - convert DER ECDSA -> raw 64-byte signature
   - return raw signature bytes

## Step 5: Deploy to AWS (Recommended: ECS Fargate)
1. Create ECR repository and push image.
2. Create ECS task definition with:
   - container image from ECR
   - env vars (`OPERATOR_ID`, `AWS_KMS_KEY_ID`, `AWS_REGION`)
   - task IAM role with KMS policy
3. Create ECS service (behind ALB if public API).
4. Configure health checks and autoscaling.
5. Configure CloudWatch logs.

## Step 6: Validation Checklist
- App starts without `OPERATOR_KEY`.
- Trade route signs successfully.
- `aws cloudtrail lookup-events` shows `kms:Sign` calls.
- Hedera transaction status is `SUCCESS`.
- No private key appears in env, logs, or repo.

## Operational Hardening
- Enable KMS key rotation policy/process.
- Restrict key policy to runtime role only.
- Add CloudWatch alarms for KMS access denied/error rates.
- Add DLQ/retry strategy for transient KMS failures.

## Rollback Plan
If KMS signing fails in production:
1. Keep old deployment artifact available.
2. Roll back ECS service to previous task definition revision.
3. Investigate CloudTrail + app logs.
4. Re-deploy KMS version after fix.

## Notes
- You can still keep a Hedera funding/admin key in a secure manager for non-trade administrative flows, but trade signing should remain KMS-backed.
- Do not attach broad IAM permissions (`kms:*`).

## License
Apache-2.0
