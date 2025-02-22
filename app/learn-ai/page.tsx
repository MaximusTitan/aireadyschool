import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function LearnWithAIPage() {
  const modules = [
    {
      number: 1,
      title: "Introduction to GenAI",
      presentationUrl: "https://docs.google.com/presentation/d/1S-DLOpotisKQT2a_3S9Gkw17j-bSYVVO4Ud8Ck8LJuA/embed",
    },
    {
      number: 2,
      title: "How AI Works",
      presentationUrl: "https://docs.google.com/presentation/d/14yDGMl5R8riNqN9EjVLPnLJLLPB03FfG7HqroR_67No/embed",
    },
    {
      number: 3,
      title: "How GenAI Works",
      presentationUrl: "https://docs.google.com/presentation/d/1ldpxa1xQAJtmg8BjEIMMNYBx5BEcUShj/embed",
    },
    {
      number: 4,
      title: "GenAI Tools",
      presentationUrl: "https://docs.google.com/presentation/d/18OccPFdHNal_MHPhH86J4qi9FaKQR1rifzC7Vryy4Hs/embed",
    },
    {
      number: 5,
      title: "Story Videos with GenAI Tools",
      presentationUrl: "https://docs.google.com/presentation/d/1Ndt2aCMsbIahx8gB5hBjbCqIPKC_XqdC525pt1x_vSI/embed", // Replace with actual URL
    },
    {
      number: 6,
      title: "RAPDF with Thinking 2.0",
      presentationUrl: "https://docs.google.com/presentation/d/1ysik8giZNOOdjcgF3kYuhRKlheb9NIb02hUjS30K93I/embed", // Replace with actual URL
    },
    {
      number: 7,
      title: "Building GenAI APPs",
      presentationUrl: "https://docs.google.com/presentation/d/1onvDxSr1s9KvMpTF5jA_qau3Oal_3ouwIG6uWMrJrZ8/embed", // Replace with actual URL
    },
    {
      number: 8,
      title: "Responsible AI",
      presentationUrl: "https://docs.google.com/presentation/d/1NN3-Z6pIzq3oRcsI6omkCrhZtmK_CZF5TOuKvHrFoBo/embed", // Replace with actual URL
    },
  ]

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-12">
      <div className="flex items-center gap-1 mb-8 ml-[-46px]" >
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
        >
       
          <span className="sr-only">Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold pr-20">Learn AI</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6">Foundation Courses</h2>
        <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 max-w-[1200px]">
          {modules.map((module) => (
            <Card key={module.number} className="overflow-hidden group border border-neutral-200 relative overflow-hidden hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:to-rose-100/60 
      transition-all duration-300 ease-in-out cursor-pointer 
      dark:bg-neutral-900 dark:border-neutral-800 dark:hover:from-neutral-900 dark:hover:to-rose-900/20">
              <CardContent className="p-2 pb-3">
                <div className="relative w-full pt-[50%] bg-muted rounded-md overflow-hidden mb-3">
                  <iframe
                    src={module.presentationUrl}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
                <h3 className="font-bold text-m mb-2 ml-2">Module - {module.number}</h3>
                
                <a 
                  href={module.presentationUrl.replace("/embed", "/preview")} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-500 hover:text-gray-700 ml-2 no-underline"
                >
                  {module.title}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

