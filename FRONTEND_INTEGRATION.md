# Frontend Integration Guide

This document is intended for frontend developers integrating with the NBX Backend API. It outlines base URLs, authentication, common endpoints, request/response shapes, error handling, and example JavaScript fetch snippets.

> Note: DTO files in the repository (e.g., `src/companies/dto/create-company.dto.ts`) are the canonical source of truth for payload shape. If a DTO changes, the frontend contract should be updated to match.

---

## Base URL

- Default (development): http://localhost:3001
- In production, the base URL will be provided by the backend/ops team.

All endpoints assume the base URL above. Example: POST http://localhost:3001/companies

---

## Authentication

- The API uses JWT Bearer tokens for protected endpoints.
- Login/registration endpoints live in `src/users/` or a dedicated auth module; confirm exact route in the repo.
- To call protected endpoints, include header:
  - `Authorization: Bearer <JWT_TOKEN>`

Auth flow (typical):
1. POST /users/login (or /auth/login) with { email, password }
2. Receive { accessToken }
3. Use token in Authorization header for protected requests

Example fetch for attaching JWT:

```js
const token = '<ACCESS_TOKEN>'
fetch(`${BASE_URL}/companies`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## Common endpoints (modules)

Below are likely endpoints inferred from module names. Confirm exact paths and parameter names by inspecting the controllers in `src/*/*.controller.ts` when implementing.

### Companies
- GET /companies - list companies (query params: page, limit, search)
- GET /companies/:id - get company by id
- POST /companies - create company (protected)
- PUT /companies/:id - update company (protected)
- DELETE /companies/:id - delete company (protected)

Example create payload (inspect `CreateCompanyDto` for exact fields):
{
  "name": "Acme Co",
  "slug": "acme-co",
  "description": "...",
  "industry": "...",
  "website": "https://..."
}

### Equities
- GET /equities - list equities
- GET /equities/:id - get equity details
- POST /equities - create equity (protected, may trigger blockchain tokenization)
- PUT /equities/:id - update equity (protected)

Create equity payload example (approximate):
{
  "companyId": "<company_id>",
  "ticker": "ACME",
  "totalSupply": 1000000,
  "price": 1.25
}

### Bonds
- GET /bonds
- GET /bonds/:id
- POST /bonds (protected)

### Users
- POST /users/register - create account
- POST /users/login - authenticate and receive JWT
- GET /users/me - get current user (protected)

### Uploads
- POST /uploads - multipart/form-data upload (protected)
  - Content-Type: multipart/form-data
  - Field: `file` (single file) and optional metadata fields

Example upload in fetch (browser):
```js
const fd = new FormData();
fd.append('file', fileInput.files[0]);
fetch(`${BASE_URL}/uploads`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: fd
})
```

---

## Response conventions

- Success responses: JSON objects or arrays. For created resources, server returns 201 with the created resource.
- Error responses: consistent shape, e.g. `{ statusCode: 400, message: 'Validation failed', error: 'Bad Request' }`.
- For authentication errors: 401 Unauthorized. For permissions: 403 Forbidden.

---

## Pagination and filtering

- List endpoints typically accept `page` and `limit` query parameters; also `search` and other filters depending on the resource.
- Responses should include meta info (if implemented): `{ data: [...], meta: { total, page, limit } }`.

---

## CORS

- Backend config allows CORS in `src/main.ts` (the app bootstrapping file). If you see CORS issues in development, ensure frontend origin is allowed or use a proxy during local development.

---

## Error handling best practices for frontend

- Map HTTP statuses:
  - 2xx: success
  - 4xx: user/fetchable errors (show message from `message` field)
  - 401: redirect to login
  - 5xx: show a generic server error and optionally a retry option
- Show clear feedback on forms for validation messages returned from the API.

---

## Example integration snippets

Auth + create company (JS):

```js
async function createCompany(token, payload) {
  const res = await fetch(`${BASE_URL}/companies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

Fetch list with pagination:

```js
async function listCompanies({page = 1, limit = 20, q = ''} = {}) {
  const url = new URL(`${BASE_URL}/companies`);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  if (q) url.searchParams.set('search', q);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

---

## Developer notes and checklist for integration

- Inspect DTOs in `src/*/dto/*.ts` to confirm exact payload shapes and required fields.
- Confirm which endpoints require authentication by checking controllers and `@UseGuards(JwtAuthGuard)` usage.
- For endpoints that trigger blockchain operations (equities issuance), expect asynchronous state and consider polling or webhooks to track completion.
- Ask backend to expose Swagger docs (recommended) or generate OpenAPI from DTOs for precise contract details.

---

## Contact & further support

If you need missing field details or example responses, inspect the DTO files in the repository or ping the backend team. If you'd like, I can extract DTO field lists into a separate file for the frontend to use (OpenAPI/JSON schema generation recommended).

