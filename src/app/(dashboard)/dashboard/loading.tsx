export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel h-[92px] animate-pulse p-5" />
        ))}
      </div>
      <div className="glass-panel h-[420px] animate-pulse p-2" />
    </div>
  );
}
