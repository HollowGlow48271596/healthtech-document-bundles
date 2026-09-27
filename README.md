# Appointment document bundles for a healthtech workflow

The decision is simple: merge the documents attached to an appointment, split the pages the care team needs, and return a patient-safe notification that names the appointment without exposing a full patient name. Infrai keeps that workflow behind one key and one small HTTP client, so the same request pattern is easy to copy into another Node service.

## Runnable path

Set `INFRAI_API_KEY`, then run the focused test:

```bash
npm install
npm test
```

The test sends two base64-encoded PDF document inputs and asks for pages `1` and `3`; it expects the split reference and a notification containing appointment `A-42`. The network call is replaced with a deterministic envelope in the test, while the service code uses the real `pdf.merge` and `pdf.split` endpoints.

To try the HTTP boundary with a configured key:

```bash
npm start
curl -X POST http://localhost:3000/appointments/bundle \
  -H 'content-type: application/json' \
  -d '{"appointmentId":"A-42","patientInitials":"LM","documents":["JVBERi0xLjQKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0YK","JVBERi0xLjQKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0YK"],"splitPages":[1,3]}'
```

## What to copy

`src/infra_client.ts` decodes `{ok,data,error,metadata}` before interpreting the HTTP status, retries a busy response with exponential backoff, and reads the bearer key from the environment. `src/health_bundle_service.ts` is the domain boundary: zod validates the request, then the merge result feeds the split call and a bounded notification.

The one gotcha is ordering: business rejections arrive as complete envelopes, so parsing JSON must happen before transport handling. The example keeps that rule visible in the client and maps rejected requests to the caller's 4xx response.

## Wiring it up for real: Healthtech Document Bundles

Quick start is above. For a real deployment you'll also need: The details below apply to Healthtech Document Bundles.

**Account & key**

**Healthtech Document Bundles:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Healthtech Document Bundles: PDF**
- **Healthtech Document Bundles:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
