export function AffiliatePromo() {
  return (
    <div className="mt-10 rounded-lg border border-brand-border bg-brand-cream px-6 py-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-1">
        Sponsored
      </p>
      <p className="text-lg font-bold text-brand-text mb-1">
        Planning your move to Texas?
      </p>
      <p className="text-sm text-brand-muted mb-4">
        Get a free moving quote and see how easy it can be.
      </p>
      {/* TODO: replace href with real affiliate URL before go-live */}
      <a
        href="#TODO"
        className="inline-block rounded-full bg-brand-accent px-6 py-2 text-sm font-semibold text-white hover:bg-brand-accent-hover"
      >
        Get a Free Quote &rarr;
      </a>
    </div>
  );
}
