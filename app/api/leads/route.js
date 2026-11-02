import { NextResponse } from "next/server";
import { addLead } from "@/lib/leads";

const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: a real user never fills this hidden field. Pretend success so
  // a bot can't tell its submission was dropped, but never write anything.
  if (body.honeypot) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const car = typeof body.car === "string" && body.car.trim() ? body.car.trim() : null;
  const source = typeof body.source === "string" ? body.source.trim().slice(0, 200) : "";

  const fieldErrors = {};
  if (!name || name.length < 2 || name.length > 100) {
    fieldErrors.name = "Enter a name between 2 and 100 characters.";
  }
  if (!phone || !PHONE_PATTERN.test(phone)) {
    fieldErrors.phone = "Enter a valid phone number.";
  }
  if (!location || location.length < 2 || location.length > 200) {
    fieldErrors.location = "Enter a valid location.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: fieldErrors }, { status: 400 });
  }

  try {
    const lead = await addLead({ name, phone, location, car, source });
    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
