import { Skeleton } from "@/components/ui/skeleton";

export default function ConcursosLoading() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 -mt-8 lg:-mt-12 pb-8">
      <section className="relative min-h-[58vh] sm:min-h-[64vh] flex items-end overflow-hidden bg-gradient-to-br from-[--surface] to-[--background]">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 pb-12 pt-32">
          <div className="grid items-end gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Skeleton className="aspect-[2/3] w-44 sm:w-52 lg:w-full rounded-2xl mx-auto lg:mx-0" />
            <div className="text-center lg:text-left space-y-4">
              <Skeleton className="h-5 w-32 mx-auto lg:mx-0" />
              <Skeleton className="h-12 w-2/3 mx-auto lg:mx-0" />
              <Skeleton className="h-4 w-full max-w-xl mx-auto lg:mx-0" />
              <Skeleton className="h-4 w-1/2 mx-auto lg:mx-0" />
              <Skeleton className="h-11 w-44 mt-4 mx-auto lg:mx-0 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 mt-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-[150px] sm:w-[180px] lg:w-[200px] aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
