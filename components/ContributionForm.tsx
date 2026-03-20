"use client";

const REPO_URL = "https://github.com/ChrisDover/geneology-site/issues/new";

interface ContributionFormProps {
  personSlug: string;
  personName: string;
}

export default function ContributionForm({
  personSlug,
  personName,
}: ContributionFormProps) {
  const storyUrl = `${REPO_URL}?${new URLSearchParams({
    title: `Story about ${personName}`,
    labels: "family-story",
    body: `**Person:** ${personName}\n**Slug:** ${personSlug}\n\n## Your Name\n(Who are you in the family?)\n\n## Your Story\n(Share your memory, story, or what you know about ${personName}...)\n\n---\n*Submitted from the family history website*`,
  }).toString()}`;

  const photoUrl = `${REPO_URL}?${new URLSearchParams({
    title: `Photo of ${personName}`,
    labels: "family-photo",
    body: `**Person:** ${personName}\n**Slug:** ${personSlug}\n\n## Your Name\n(Who are you in the family?)\n\n## About this photo\n(Who's in it, when was it taken, where...)\n\n## Photo\n(Drag and drop your photo here, or click the area below to attach it)\n\n---\n*Submitted from the family history website*`,
  }).toString()}`;

  return (
    <div>
      <h2
        className="mb-3 text-xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--action-primary)" }}
      >
        Share a Memory
      </h2>
      <p className="mb-4 text-base" style={{ color: "var(--text-medium-emphasis)" }}>
        Do you have a story, memory, or photo of {personName}?
        Share it with the family!
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href={storyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Write a Story
        </a>
        <a
          href={photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Add a Photo
        </a>
      </div>
      <p className="mt-3 text-sm" style={{ color: "var(--text-low-emphasis)" }}>
        Opens GitHub where you can type your story or upload a photo.
        Chris will review and add it to the site.
      </p>
    </div>
  );
}
