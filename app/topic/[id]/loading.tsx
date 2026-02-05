import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/layout/navbar"
import { PageWrapper } from "@/components/page-wrapper"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <PageWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <Card>
                      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-start">
                          <div className="space-y-2 w-full">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-8 w-3/4" />
                              <div className="flex gap-2 pt-1">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-16" />
                              </div>
                          </div>
                      </div>
                      <CardContent className="space-y-4 pt-6">
                           <Skeleton className="h-4 w-48" />
                           <div className="space-y-2 pt-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                           </div>
                           <div className="mt-6 border-t pt-4 border-neutral-100 dark:border-neutral-800 space-y-2">
                               <Skeleton className="h-5 w-24" />
                               <Skeleton className="h-4 w-full" />
                               <Skeleton className="h-4 w-full" />
                           </div>
                      </CardContent>
                  </Card>

                  <div className="space-y-6">
                      <Skeleton className="h-8 w-32" />
                      <div className="space-y-4">
                          <Skeleton className="h-24 w-full rounded-md" />
                          {[1, 2, 3].map(i => (
                              <div key={i} className="flex gap-3">
                                  <Skeleton className="h-8 w-8 rounded-full" />
                                  <div className="space-y-2 flex-1">
                                      <Skeleton className="h-4 w-32" />
                                      <Skeleton className="h-16 w-full rounded-md" />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <div className="space-y-6">
                  <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                      <Skeleton className="h-6 w-32 mb-4" />
                      <div className="space-y-3">
                          {[1, 2].map(i => (
                              <Skeleton key={i} className="h-12 w-full" />
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  )
}
