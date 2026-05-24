import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated rounded-2xl p-6 lg:col-span-2 space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-36 mt-4" />
        </div>
        <div className="card-elevated rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-6 mt-6 space-y-4">
        <Skeleton className="h-4 w-1/3" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}
