export function RouteLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Chargement de la page" role="status">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-80 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="h-10 w-40 hidden sm:block rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
