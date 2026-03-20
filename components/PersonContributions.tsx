"use client";

import ContributionForm from "./ContributionForm";

interface PersonContributionsProps {
  personSlug: string;
  personName: string;
}

export default function PersonContributions({
  personSlug,
  personName,
}: PersonContributionsProps) {
  return (
    <section
      className="mt-10 pt-8"
      style={{ borderTop: "2px solid var(--surface-border)" }}
      aria-label="Share a memory"
    >
      <ContributionForm personSlug={personSlug} personName={personName} />
    </section>
  );
}
