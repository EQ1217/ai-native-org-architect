interface SectionHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
}: SectionHeaderProps) {
  return (
    <header className="section-header">
      {eyebrow ? <p className="section-header-eyebrow">{eyebrow}</p> : null}
      <div className="section-header-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}
