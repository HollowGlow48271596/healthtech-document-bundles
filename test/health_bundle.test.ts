import assert from "node:assert/strict";
import { prepareAppointmentBundle } from "../src/health_bundle_service.js";

const originalFetch = globalThis.fetch;
const calls: unknown[] = [];
globalThis.fetch = (async (_url: string, init?: RequestInit) => {
  calls.push(JSON.parse(String(init?.body)));
  const data = calls.length === 1 ? { pdf: "merged-document" } : { pdf: "split-document" };
  return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
}) as typeof fetch;
process.env.INFRAI_API_KEY = "test-key";
const result = await prepareAppointmentBundle({ appointmentId: "A-42", patientInitials: "LM", documents: ["doc-a.pdf", "doc-b.pdf"], splitPages: [1, 3] });
assert.equal(result.document, "split-document");
assert.match(result.notification, /A-42/);
assert.deepEqual(calls, [{ inputs: ["doc-a.pdf", "doc-b.pdf"] }, { pdf: "merged-document", ranges: [1, 3] }]);
globalThis.fetch = originalFetch;
console.log("health bundle decision passed");
