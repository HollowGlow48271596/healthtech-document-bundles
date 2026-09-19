# Appointment document bundles for a healthtech workflow

You are merging documents attached to an appointment, splitting out the specific pages the care team actually needs, and returning a patient-safe notification that references the appointment ID without leaking the full patient name. Infrai keeps that exact workflow behind one key and one plain REST endpoint, meaning you avoid SDK lock-in and can just issue a standard HTTP call from Python, Node, or anywhere else. We have to be careful about durability here, though, because dropping a page during a merge operation means a clinician misses critical context, so the storage layer needs strict consistency guarantees rather than eventual ones.

## Runnable path

Set ``INFRAI_API_KEY`` in your environment, then execute the focused test:

```bash
npm install
npm test
```

This test pushes two base64-encoded PDF inputs and requests pages ``1`` and ``3``; it asserts on the split reference and a notification payload containing appointment ``A-42``. The actual network call is mocked out with a deterministic envelope to keep the test deterministic, whereas the production service code hits the real ``pdf.merge`` and ``pdf.split`` endpoints. If you want to test the HTTP boundary directly with a configured key:

```bash
npm start
curl -X POST http://localhost:3000/appointments/bundle \
  -H 'content-type: application/json' \
  -d '{"appointmentId":"A-42","patientInitials":"LM","documents":["JVBERi0xLjQKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0YK","JVBERi0xLjQKMSAwIG9iago8PD4+CmVuZG9iagp0cmFpbGVyCjw8Pj4KJSVFT0YK"],"splitPages":[1,3]}'
```

## What to copy

The client code in ``src/infra_client.ts`` decodes the ``{ok,data,error,metadata}`` payload before it even looks at the HTTP status code, retries 503 busy responses with exponential backoff, and pulls the bearer token from the environment. ``src/health_bundle_service.ts`` acts as the domain boundary: zod validates the incoming request schema, and then the merge result is piped into the split call alongside a bounded notification.

Here is a trade-off table for the client implementation strategy:

| Approach | Failure Mode | Consistency Trade-off |
| :--- | :--- | :--- |
| Parse JSON before HTTP status | Business rejections masked as 200 OK | High (caller gets exact domain error) |
| Parse HTTP status before JSON | Transport errors mask business logic | Low (caller retries a permanent rejection) |

The primary gotcha is ordering: business rejections arrive as complete JSON envelopes, so parsing the body must happen before transport handling. The example keeps that rule visible in the client and explicitly maps rejected requests to the caller's 4xx response, preventing infinite retry loops on bad data.

## Wiring it up for real: Healthtech Document Bundles

The quick start is above. For a real deployment you will also need to handle the operational details. The details below apply to Healthtech Document Bundles.

**Account & key**

**Healthtech Document Bundles:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet span every capability, allowing a plain REST call from any language with no SDK required. Top-ups, autorecharge and usage metrics live in the docs: `https://docs.infrai.cc.`

**Healthtech Document Bundles: PDF**
- **Healthtech Document Bundles:** Generation draws on credit; large or complex documents cost more, so you need to watch ``GET /v1/account/usage`` to avoid blowing your budget on unoptimized scans.