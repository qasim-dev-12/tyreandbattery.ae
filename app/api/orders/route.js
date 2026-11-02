import { NextResponse } from "next/server";
import { addOrder } from "@/lib/orders";

const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const items = Array.isArray(body.items) ? body.items : [];

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
  if (items.length === 0) {
    fieldErrors.items = "Cart is empty.";
  } else if (!items.every((item) => Number.isInteger(item.batteryId) && Number(item.quantity) > 0)) {
    // Note: unitPrice/price, if a client sends them, are ignored entirely —
    // lib/orders.js resolves every price itself from batteries.json.
    fieldErrors.items = "Each item needs a valid batteryId and a positive quantity.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: fieldErrors }, { status: 400 });
  }

  try {
    const order = await addOrder({ items, name, phone, location });
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    // addOrder throws when a batteryId doesn't exist in batteries.json —
    // that's bad client input, not a server failure.
    if (err.message?.startsWith("Unknown battery id")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
