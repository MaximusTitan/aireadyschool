import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LearnWithAIPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Learn About AI</h1>

      {/* 5th and 6th Grade Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Foundation - 5th and 6th Grade
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Module 1 - Introduction to GenAI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full pt-[62.5%]">
                <iframe
                  src="https://docs.google.com/presentation/d/1S-DLOpotisKQT2a_3S9Gkw17j-bSYVVO4Ud8Ck8LJuA/embed"
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Module 2 - How AI Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full pt-[62.5%]">
                <iframe
                  src="https://docs.google.com/presentation/d/14yDGMl5R8riNqN9EjVLPnLJLLPB03FfG7HqroR_67No/embed"
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* 7th to 10th Grade Section */}
      <div className="mb-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Module 3 - How GenAI Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full pt-[62.5%]">
                <iframe
                  src="https://docs.google.com/presentation/d/1ldpxa1xQAJtmg8BjEIMMNYBx5BEcUShj/embed"
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Module 4</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full pt-[62.5%]">
                <iframe
                  src="https://docs.google.com/presentation/d/18OccPFdHNal_MHPhH86J4qi9FaKQR1rifzC7Vryy4Hs/embed"
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-4">
        Foundation - 7th to 10th Grade
      </h2>
    </div>
  );
}
