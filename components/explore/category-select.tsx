"use client";
import { useRouter } from "next/navigation";

export function CategorySelect({
  categories,
  selected,
  month,
}: {
  categories: string[];
  selected: string | undefined;
  month: number | undefined;
}) {
  const router = useRouter();
  return (
    <select
      defaultValue={selected ?? ""}
      onChange={(e) => {
        const cat = e.target.value;
        const params = new URLSearchParams();
        if (cat) params.set("category", cat);
        if (month != null) params.set("month", String(month));
        const qs = params.toString();
        router.push(qs ? `/festivals?${qs}` : "/festivals");
      }}
      className="rounded border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
