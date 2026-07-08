interface CommunityOption {
  id: string;
  name: string;
}

interface CommunityPickerProps {
  options: CommunityOption[];
}

// Options are fetched server-side (see app/quiz/page.tsx) via the
// service-role client and passed in as props. This component never
// queries Supabase directly, so no Supabase key of any kind needs to
// reach the browser for this picker to work.
export function CommunityPicker({ options }: CommunityPickerProps) {
  return (
    <div className="mb-8">
      <label htmlFor="closeToCommunityId" className="block text-lg font-medium mb-2">
        Want to be close to a specific community? (optional)
      </label>
      <select
        id="closeToCommunityId"
        name="closeToCommunityId"
        defaultValue=""
        className="w-full border rounded p-2"
      >
        <option value="">No preference</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
