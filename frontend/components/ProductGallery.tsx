"use client";

import { useState } from "react";
import { Zap, HardHat } from "lucide-react";

type GalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  category,
}: {
  images: GalleryImage[];
  category: "ELECTRONICS" | "CONSTRUCTION";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;
  const active = hasImages ? images[activeIndex] : null;

  return (
    <div>
      <div
        className="aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
      >
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt="" className="w-full h-full object-cover" />
        ) : category === "ELECTRONICS" ? (
          <Zap size={96} strokeWidth={1.25} style={{ color: "var(--accent)" }} />
        ) : (
          <HardHat size={96} strokeWidth={1.25} style={{ color: "var(--accent)" }} />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className="w-16 h-16 shrink-0 overflow-hidden"
              style={{
                border: `2px solid ${i === activeIndex ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}