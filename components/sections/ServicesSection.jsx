import Link from "next/link";
import ServiceIcon from "@/components/ServiceIcon";

// Grid grows as more entries are added to data/services.json without any
// code changes — each service's own `icon` field (components/ServiceIcon.jsx)
// gives it a distinct visual identity instead of one icon for every card.
export default function ServicesSection({ services }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Our Services</h2>
      <p className="mt-1 text-sm text-dark/60">More services are on the way — here's what we offer today.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/${service.slug}`}
            className="flex flex-col gap-3 rounded-xl border border-dark/10 bg-white p-6 hover:border-primary"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ServiceIcon name={service.icon} className="h-6 w-6 text-primary" />
            </span>
            <h3 className="font-bold text-dark">{service.name}</h3>
            <p className="text-sm text-dark/60">{service.shortDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
