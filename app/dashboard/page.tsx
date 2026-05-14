import Link from 'next/link';
import { getAssistantDashboardModel, type AssistantBoardItem } from '@/lib/dashboard/assistant-board';

const statusStyles: Record<AssistantBoardItem['status'], string> = {
  'needs-user': 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  'needs-qa': 'border-sky-400/40 bg-sky-400/10 text-sky-100',
  done: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  next: 'border-violet-400/40 bg-violet-400/10 text-violet-100',
};

const statusLabels: Record<AssistantBoardItem['status'], string> = {
  'needs-user': 'Needs tan action',
  'needs-qa': 'Needs QA / verify',
  done: 'Anya did',
  next: 'Anya next',
};

function BoardCard({ item }: { item: AssistantBoardItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
          {statusLabels[item.status]}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">owner: {item.owner}</span>
      </div>
      <h3 className="text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-300">{item.detail}</p>
      {item.whyItMatters ? <p className="mt-3 text-xs leading-5 text-gray-500">Why: {item.whyItMatters}</p> : null}
    </article>
  );
}

function BoardColumn({ title, subtitle, items }: { title: string; subtitle: string; items: AssistantBoardItem[] }) {
  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <BoardCard item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}

export default function AssistantDashboardPage() {
  const dashboard = getAssistantDashboardModel();

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/15 via-sky-400/10 to-violet-500/10 p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200">Anya private cockpit</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Personal assistant dashboard</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">{dashboard.activeFocus.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/20" href="/lab/NVDA">
                Open stock lab
              </Link>
              <Link className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/[0.08]" href="/lab">
                Trading overview
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Active focus</p>
            <h2 className="mt-2 text-xl font-semibold">{dashboard.activeFocus.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">Private coordination first, trading tools second.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Access rule</p>
            <h2 className="mt-2 text-xl font-semibold">Laptop-only tunnel</h2>
            <code className="mt-3 block rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-emerald-100">ssh -N -L 3000:127.0.0.1:3000 host@31.57.224.162</code>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Next product area</p>
            <h2 className="mt-2 text-xl font-semibold">Trading thing overview</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">Screener, mock ledger, Telegram digest, then stronger data provider.</p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <BoardColumn title="Needs you" subtitle="Actions only tan can take" items={dashboard.userActionItems} />
          <BoardColumn title="Anya did" subtitle="Completed work waiting in the branch" items={dashboard.anyaCompletedItems} />
          <BoardColumn title="QA / verify" subtitle="Do not move on until checked" items={dashboard.qaVerifyItems} />
          <BoardColumn title="Anya next" subtitle="Build queue after QA" items={dashboard.anyaNextItems} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-semibold">Current team</h2>
            <div className="mt-4 space-y-3">
              {dashboard.agentPanel.people.map((person) => (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={person.name}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{person.name}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">{person.role}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{person.currentResponsibility}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-xl font-semibold">Future AI agent seats</h2>
            <p className="mt-2 text-sm text-gray-500">Empty by design. We hire more agents only when a workflow becomes too large for just tan + Anya.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {dashboard.agentPanel.futureSlots.map((slot) => (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4" key={slot.name}>
                  <h3 className="font-semibold text-white">{slot.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{slot.purpose}</p>
                  <p className="mt-3 text-xs leading-5 text-gray-500">Trigger: {slot.trigger}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <h2 className="text-xl font-semibold">Trading overview build path</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {dashboard.activeFocus.nextBuildItems.map((item, index) => (
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-gray-300" key={item}>
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-200">{index + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
