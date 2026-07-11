"use client";

import { useState } from "react";

interface CommunityMapToggleProps {
  name: string;
  latitude: number;
  longitude: number;
}

// Uses the Google Maps Embed API (view mode) - per Google's currently
// published pricing this is free/unmetered, unlike the Maps JavaScript API.
// Verify current pricing before relying on this at scale; Google's pricing
// structure can change. Renders nothing if the API key isn't configured yet,
// so this never ships a broken embed.
export function CommunityMapToggle({
  name,
  latitude,
  longitude,
}: CommunityMapToggleProps) {
  const [open, setOpen] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-brand-accent underline"
      >
        {open ? "Hide map" : "Where is this?"}
      </button>
      {open && (
        <iframe
          className="mt-2 w-full h-64 rounded-md border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${latitude},${longitude}&zoom=10`}
          title={`Map showing ${name}`}
        />
      )}
    </div>
  );
}
