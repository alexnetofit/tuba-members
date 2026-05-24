import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-1/2 max-w-md" />
        <Skeleton className="h-4 w-1/3 max-w-sm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="card-elevated rounded-2xl p-2">
        <div className="border-b border-[--border] py-3 px-4">
          <SkeletonRow cols={5} />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-4 border-b border-[--border] last:border-0">
            <SkeletonRow cols={5} />
          </div>
        ))}
      </div>
    </>
  );
}
