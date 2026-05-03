"use client";

import { useRouter } from "next/navigation";
import { SearchIcon, VoiceIcon, FilterIcon } from "../icons/NavigationIcons";

export function SearchBar() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    if (q) {
      router.push(`/catalogo?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-[var(--color-secondary-200)] border border-[var(--color-secondary-400)]/60 rounded-xl px-3 h-11 w-full"
    >
      <SearchIcon size={18} className="text-[var(--color-neutral-500)] flex-shrink-0" />
      <input
        type="text"
        name="q"
        placeholder="Buscar:"
        className="flex-1 bg-transparent text-sm text-[var(--color-neutral-800)] placeholder-[var(--color-neutral-400)] outline-none"
      />
      <button type="button" className="text-[var(--color-neutral-500)] cursor-pointer flex-shrink-0 opacity-60" disabled>
        <VoiceIcon size={20} />
      </button>
      <button type="submit" className="text-[var(--color-neutral-600)] hover:text-[var(--color-primary-500)] cursor-pointer flex-shrink-0 transition">
        <FilterIcon size={20} />
      </button>
    </form>
  );
}
