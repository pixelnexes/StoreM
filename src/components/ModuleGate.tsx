import Link from 'next/link';
import { MODULES, moduleLabel } from '@/lib/modules';

/**
 * Renders children only when the tenant's plan bought `moduleKey`; otherwise an
 * upgrade prompt that names the missing module and where to raise it.
 */
export function ModuleGate({ allowed, moduleKey, children }: { allowed: string[]; moduleKey: string; children: React.ReactNode }) {
  if (allowed.includes(moduleKey)) return <>{children}</>;

  const mod = MODULES.find((m) => m.key === moduleKey);
  return (
    <div className="mx-auto max-w-xl border-l-2 border-brand bg-surface px-5 py-6">
      <span className="eyebrow">Not in your plan</span>
      <h2 className="mt-2 text-xl font-semibold">{mod?.label ?? moduleLabel(moduleKey)}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your current plan doesn&apos;t include this module. Ask your platform admin to move the store
        to a plan that does — the data stays yours either way.
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/app/settings" className="btn btn-ghost btn-sm">See my plan</Link>
        <Link href="/app" className="btn btn-primary btn-sm">Back to dashboard</Link>
      </div>
    </div>
  );
}
