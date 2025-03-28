import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Card className="w-full sm:w-auto">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-4 w-[240px] mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full sm:w-[240px]" />
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-4 w-[240px] mt-2" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <Skeleton className="h-16 w-16 rounded-full" />
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-[120px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
