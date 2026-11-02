import Link from "next/link";
import Image from "next/image";

export default function BrandsSection({ brands }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Brands We Carry</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brand/${brand.slug}`}
            className="flex items-center justify-center rounded-xl border border-dark/10 bg-white p-4 hover:border-primary"
          >
            <Image src={brand.logo} alt={brand.name} width={96} height={38} className="h-8 w-auto" />
          </Link>
        ))}
      </div>
    </section>
  );
}
