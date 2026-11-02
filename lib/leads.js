import "server-only";
import crypto from "node:crypto";
import { readJson, writeJson } from "./db";

export async function getLeads() {
  return readJson("leads.json", []);
}

// The only place that writes to leads.json. Only app/api/leads/route.js
// should call this — it owns input validation and the honeypot check.
export async function addLead({ name, phone, location, car = null, source = "" }) {
  const leads = await getLeads();
  const lead = {
    id: crypto.randomUUID(),
    name,
    phone,
    location,
    car,
    source,
    createdAt: new Date().toISOString(),
  };
  leads.push(lead);
  await writeJson("leads.json", leads);
  return lead;
}
