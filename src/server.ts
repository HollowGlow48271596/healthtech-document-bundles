import { createServer } from "node:http";
import { prepareAppointmentBundle } from "./health_bundle_service.js";
import { InfraiError } from "./infra_client.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/appointments/bundle") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const result = await prepareAppointmentBundle(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError && error.status >= 400 && error.status < 500 ? error.status : 400;
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "request rejected" }));
  }
});
server.listen(Number(process.env.PORT ?? 3000));
