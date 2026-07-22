type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeading({ eyebrow, title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
        ) : null}
      </div>
      {actionLabel && actionHref ? (
        <a
          href={actionHref}
          className="inline-flex items-center text-sm font-medium text-primary transition hover:text-foreground"
        >
          {actionLabel} →
        </a>
      ) : null}
    </div>
  );
}
