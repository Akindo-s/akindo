"use client";

import Link from "next/link";

const CATEGORIES = [
  { label: "Nuevos productos", slug: "nuevos" },
  { label: "Café de especialidad", slug: "cafe-de-especialidad" },
  { label: "Tés", slug: "tes" },
];

export function CategoryChips() {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/catalogo?categoria=${cat.slug}`}
          className="whitespace-nowrap text-xs font-medium px-3.5 py-1.5 rounded-full border border-[var(--color-neutral-800)] bg-[var(--color-neutral-800)] text-white hover:bg-[var(--color-neutral-700)] transition select-none"
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}
