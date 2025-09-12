import {Skeleton} from "../skeleton/skeleton"

export function PollCardSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-3/4 rounded-none" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-none" />
        <Skeleton className="h-4 w-5/6 rounded-none" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-16 rounded-none" />
        <Skeleton className="h-8 w-16 rounded-none" />
        <Skeleton className="h-8 w-20 rounded-none" />
      </div>
    </div>
  )
}
