import type { ReactNode } from 'react';

interface AppShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="app-frame">
        <section className="app-page-hero">
          <div className="app-page-copy">
            {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="app-page-actions">{actions}</div> : null}
        </section>
        {children}
      </div>
    </main>
  );
}
