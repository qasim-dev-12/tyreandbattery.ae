import "server-only";
import { readJson } from "./db";

export async function getFaqs(page) {
  const faqs = await readJson("faqs.json", []);
  return page ? faqs.filter((f) => f.page === page) : faqs;
}

// Deterministic FAQ subsets for generated pages, driven by the record's own
// attributes so pages aren't all showing the identical static FAQ block
// (docs/SEO-RULES.md content uniqueness rule #6).
function findByQuestion(faqs, question) {
  return faqs.find((f) => f.question === question) ?? null;
}

export function selectFaqsForArea(faqs, area) {
  const base = [
    findByQuestion(faqs, "How fast can you reach my location?"),
    findByQuestion(faqs, "What areas do you cover?"),
    findByQuestion(faqs, "Is there a call-out fee?"),
  ].filter(Boolean);

  const extra =
    area.demand >= 7
      ? findByQuestion(faqs, "Can you test my battery before replacing it?")
      : findByQuestion(faqs, "What payment methods do you accept?");

  return extra ? [...base, extra] : base;
}

export function selectFaqsForBattery(faqs, battery) {
  const base = [
    findByQuestion(faqs, "Do you offer a warranty on replacement batteries?"),
    findByQuestion(faqs, "How do I know which battery fits my car?"),
    findByQuestion(faqs, "Can you test my battery before replacing it?"),
  ].filter(Boolean);

  const extra =
    battery.stock < 5
      ? findByQuestion(faqs, "What if the battery I ordered is out of stock?")
      : findByQuestion(faqs, "Can I pay in installments?");

  return extra ? [...base, extra] : base;
}

export function selectFaqsForBrand(faqs, brand) {
  const base = [
    findByQuestion(faqs, "Do you offer a warranty on replacement batteries?"),
    findByQuestion(faqs, "Do you service all car makes and models?"),
    findByQuestion(faqs, "Is there a call-out fee?"),
  ].filter(Boolean);

  const extra =
    brand.warrantyMonths >= 18
      ? findByQuestion(faqs, "Can you test my battery before replacing it?")
      : findByQuestion(faqs, "What payment methods do you accept?");

  return extra ? [...base, extra] : base;
}

export function selectFaqsForCar(faqs, car) {
  const base = [
    findByQuestion(faqs, "Do you service all car makes and models?"),
    findByQuestion(faqs, "How do I know which battery fits my car?"),
    findByQuestion(faqs, "Can you test my battery before replacing it?"),
  ].filter(Boolean);

  const extra = car.startStop
    ? findByQuestion(faqs, "Can I pay in installments?")
    : findByQuestion(faqs, "What if the battery I ordered is out of stock?");

  return extra ? [...base, extra] : base;
}
