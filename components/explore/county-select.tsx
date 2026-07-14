"use client";
import { useRouter } from "next/navigation";

export function CountySelect({
  counties,
  selected,
}: {
  counties: string[];
  selected: string | undefined;
}) {
  const router = useRouter();
  return (
    <select
      defaultValue={selected ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        router.push(val ? `/lakes?county=${encodeURIComponent(val)}` : "/lakes");
      }}
      className="rounded border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text"
    >
      <option value="">All counties</option>
      {counties.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
