import "server-only";
import crypto from "node:crypto";
import { readJson, writeJson } from "./db";
import { getBatteryById } from "./batteries";

export async function getOrders() {
  return readJson("orders.json", []);
}

// The only place that writes to orders.json. Prices are always resolved
// here from batteries.json by id — any price/unitPrice a client sends is
// ignored, so a tampered request can never change what gets charged.
export async function addOrder({ items, name, phone, location }) {
  const resolvedItems = [];
  for (const { batteryId, quantity } of items) {
    const battery = await getBatteryById(batteryId);
    if (!battery) {
      throw new Error(`Unknown battery id: ${batteryId}`);
    }
    const qty = Math.max(1, Math.floor(quantity) || 1);
    resolvedItems.push({
      batteryId: battery.id,
      slug: battery.slug,
      name: battery.name,
      quantity: qty,
      unitPrice: battery.price,
      lineTotal: battery.price * qty,
    });
  }

  const total = resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const orders = await getOrders();
  const order = {
    id: crypto.randomUUID(),
    items: resolvedItems,
    total,
    name,
    phone,
    location,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  await writeJson("orders.json", orders);
  return order;
}
