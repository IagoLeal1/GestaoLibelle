import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="h-10 w-full mb-4" />

      <Card className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
