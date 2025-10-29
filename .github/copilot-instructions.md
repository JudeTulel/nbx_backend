## Purpose
This file gives concise, actionable guidance for AI coding agents working on the nbx_backend repository (NestJS + Mongoose). The NBX backend powers the Nairobi Block Exchange, a blockchain-based SME stock exchange on Hedera Hashgraph, enabling tokenized securities trading for SMEs and investors. Focus on immediate, discoverable patterns, build/test commands, and concrete file examples so an agent can be productive without extra context.

## Big-picture architecture
- Framework: NestJS (see `nest-cli.json`, `src/main.ts`, `src/app.module.ts`).
- Persistence: Mongoose models are defined as `*.schema.ts` and wired with `MongooseModule.forFeature()` inside module files (e.g. `src/companies/company.schema.ts`, `src/users/users.schema.ts`).
- Modules: logical domains are organized as Nest modules under `src/` (notably `users`, `companies`, `equities`, `bonds`). Each module follows the controller-service-schema pattern.
- Config & bootstrap: `ConfigModule` is used globally and `MongooseModule.forRootAsync()` reads `DATABASE_URL` via `ConfigService` in `AppModule`. App is bootstrapped in `src/main.ts` and uses CORS and port from `process.env.PORT` (default 3001).

## Typical request flow (common pattern)
1. HTTP request hits a controller (e.g. `src/companies/companies.controller.ts`).
2. Controller delegates business logic to the module's service (`companies.service.ts`).
3. Service queries or updates Mongoose models defined in the corresponding `*.schema.ts` file via injected Mongoose models.

Refer to `src/app.module.ts` for how modules are registered and how the Mongoose connection is configured.

## Scripts & developer workflows
- Install: `npm install`
- Run in dev (watch): `npm run start:dev` (uses Nest CLI watch mode)
- Run production: `npm run start:prod` (assumes `dist/main` is present)
- Build: `npm run build` (Nest build output lands in `dist/`)
- Tests: `npm run test` (unit), `npm run test:e2e` (e2e using `test/jest-e2e.json`), `npm run test:cov` for coverage
- Lint/format: `npm run lint` and `npm run format`

When changing schema or DTO shapes, rebuild before running `start:prod` or re-run tests.

## Project-specific conventions and patterns
- Schemas: files are named `*.schema.ts` and export a class (e.g. `Company`) and `CompanySchema`. Use `MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])` in the module file.
- DTOs: domain DTOs live near the module (example: `src/companies/dto/create-company.dto.ts`). Prefer DTO validation patterns used elsewhere in the project.
- Module wiring: modules are self-contained under `src/<domain>/`. Avoid duplicating providers globally unless the codebase already exposes a provider at the `AppModule` level (note: `EquitiesController` and `EquitiesService` are present both in their module and referenced in `AppModule` — be cautious when refactoring).
- Environment variables: `DATABASE_URL` is required for Mongoose connection; `PORT` optional (defaults to 3001 in `src/main.ts`).

## Integration points & external dependencies
- Hashgraph SDKs: `@hashgraph/sdk` and `@hashgraph/asset-tokenization-sdk` are present as domain dependencies—changes touching blockchain flows or tokenization must respect those APIs.
- Mongoose connection: configured asynchronously via `ConfigService` in `AppModule`.

## Files to reference for examples
- Entry & bootstrap: `src/main.ts`
- Composition root: `src/app.module.ts`
- Example module: `src/companies/companies.module.ts`, `src/companies/company.schema.ts`, `src/companies/dto/create-company.dto.ts`
- Users: `src/users/users.module.ts`, `src/users/users.schema.ts`, `src/users/encrypted-wallet.schema.ts`
- Tests: `src/*.spec.ts` and `test/jest-e2e.json` for e2e configuration

## What to avoid / gotchas
- Don't assume all modules are wired the same—some providers/controllers appear directly on `AppModule`. Verify provider scope before moving or de-duplicating.
- Database connection depends on runtime env var `DATABASE_URL`. When running tests or dev, ensure a mock or test DB is available.

## Example tasks and where to start
- Add a new field to a model: update `*.schema.ts`, update DTOs under `dto/`, adjust service methods and add/update tests in the corresponding `*.spec.ts` files.
- Add a new endpoint: create controller method in module's controller, delegate to service, add unit tests for service and controller.

## Short guidance for automated code edits
- Keep changes small and module-scoped. Update or add DTOs and schema together. Run `npm run test` locally after changes.
- Respect existing project style (TypeScript + Nest idioms). Run `npm run format` and `npm run lint` before pushing.

---
If anything in this draft is unclear or missing, tell me which parts you want expanded (examples, command variants, or references to additional files) and I will iterate.
