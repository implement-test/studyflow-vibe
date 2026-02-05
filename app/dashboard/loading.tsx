import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/layout/navbar"
import { PageWrapper } from "@/components/page-wrapper"

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <PageWrapper>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
               <div className="flex gap-2">
                 {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                 ))}
               </div>
               <div className="flex gap-2">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-9 w-24" />
               </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  )
}
