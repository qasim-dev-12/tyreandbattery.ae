import "server-only";
import { readJson } from "./db";

const DEFAULT_SITE = {
  businessName: "Your Business Name",
  tagline: "",
  phone: "",
  phoneDisplay: "",
  whatsapp: "",
  whatsappPrefilledText: "",
  address: "",
  city: "",
  country: "",
  currency: "USD",
  currencySymbol: "$",
  social: {},
  hero: { titleLine1: "", titleLine2: "", subtext: "", trustBadges: [], checklist: [] },
  trustBadges: [],
};

export async function getSite() {
  return readJson("site.json", DEFAULT_SITE);
}
