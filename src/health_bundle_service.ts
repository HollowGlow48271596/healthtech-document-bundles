import { z } from "zod";
import { callInfrai } from "./infra_client.js";

const inputSchema = z.object({
  appointmentId: z.string().min(1),
  patientInitials: z.string().min(1).max(4),
  documents: z.array(z.string().min(1)).min(1),
  splitPages: z.array(z.number().int().positive()).min(1)
});
export type BundleRequest = z.infer<typeof inputSchema>;

export async function prepareAppointmentBundle(raw: unknown) {
  const request = inputSchema.parse(raw);
  const mergeCapability = "pdf.merge";
  const merged = await callInfrai<{ id?: string; pdf?: string }>("/v1/pdf/merge", { inputs: request.documents });
  const source = merged.pdf ?? merged.id;
  if (!source) throw new Error("merge response did not include a document reference");
  const split = await callInfrai<{ id?: string; pdf?: string }>("/v1/pdf/split", { pdf: source, ranges: request.splitPages });
  return {
    appointmentId: request.appointmentId,
    patientInitials: request.patientInitials,
    document: split.pdf ?? split.id,
    notification: `Appointment ${request.appointmentId}: ${request.patientInitials} document bundle is ready for review.`
  };
}
