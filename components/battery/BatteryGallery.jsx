"use client";

import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER_IMAGE = "/images/batteries/placeholder.svg";

export default function BatteryGallery({ images, name }) {
  const gallery = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl border border-dark/10 bg-dark/5">
        <Image
          src={gallery[selected]}
          alt={name}
          width={600}
          height={600}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex gap-2">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Show image ${i + 1} of ${gallery.length}`}
              aria-pressed={selected === i}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                selected === i ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" width={64} height={64} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
