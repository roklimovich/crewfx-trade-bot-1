export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-56 animate-pulse rounded bg-white/5" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel h-[92px] animate-pulse p-5" />
        ))}
      </div>
    </div>
  );
}
