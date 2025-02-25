"use client"

import { createClient } from "@/utils/supabase/client"
import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import newLogo from "@/public/newLogo.png"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { FileIcon } from "lucide-react"

interface StudentData {
  student_email: string
  name: string
  grade: number
  location: string
  role: string
  about: string
  interests: string[]
  profile_slug?: string
  profile_url?: string
}

interface Artwork {
  id: string
  file_url: string
  title: string
  updated_at: string
}

interface ResearchWork {
  id: string
  file_url: string
  title: string
  updated_at: string
}

interface Presentation {
  id: string
  title: string
  file_url: string
  updated_at: string
}

interface Video {
  id: string
  title: string
  file_url: string
  updated_at: string
}

interface App {
  id: string
  name: string
  description: string
  app_url: string
  created_at: string
  updated_at: string
}

interface ProfilePicture {
  id: string
  student_email: string
  file_url: string
  updated_at: string
}

interface PublicPortfolioProps {
  
  slug: string
}

export default function PublicPortfolio({ slug }: PublicPortfolioProps) {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [profilePicture, setProfilePicture] = useState<ProfilePicture | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [researchWorks, setResearchWorks] = useState<ResearchWork[]>([])
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student data based on the profile slug
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("profile_slug", slug)
          .single()

        if (studentError || !studentData) {
          setError("Profile not found.")
          return
        }

        setStudentData(studentData)

        // Fetch profile picture
        const { data: profilePicture, error: profilePictureError } = await supabase
          .from("profile_pictures")
          .select("*")
          .eq("student_email", studentData.student_email)
          .single()

        if (!profilePictureError) {
          setProfilePicture(profilePicture)
        }

        // Fetch related data
        const { data: artworks } = await supabase
          .from("artworks")
          .select("*")
          .eq("student_email", studentData.student_email)

        const { data: researchWorks } = await supabase
          .from("research_works")
          .select("*")
          .eq("student_email", studentData.student_email)

        const { data: presentations } = await supabase
          .from("presentations")
          .select("*")
          .eq("student_email", studentData.student_email)

        const { data: videos } = await supabase
          .from("videos")
          .select("*")
          .eq("student_email", studentData.student_email)

        const { data: apps } = await supabase
          .from("apps")
          .select("*")
          .eq("student_email", studentData.student_email)
          .order("created_at", { ascending: false })

        setArtworks(artworks || [])
        setResearchWorks(researchWorks || [])
        setPresentations(presentations || [])
        setVideos(videos || [])
        setApps(apps || [])
      } catch (error) {
        setError("Failed to fetch data.")
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [slug, supabase])

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  if (!studentData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{ background: "radial-gradient(circle,#fff 0,rgba(255,182,193,.3) 25%,#fff 80%)" }}
    >
      <div className="max-w-6xl mx-auto bg-[#f7f3f2] p-6 rounded-lg shadow relative">
        {/* Logo positioning */}
        <div className="absolute top-6 right-6">
          <Link href="/">
            <Image src={newLogo || "/placeholder.svg"} alt="AI Ready School Logo" width={150} height={150} />
          </Link>
        </div>

        <div className="flex items-center gap-6 mb-12">
          {profilePicture && (
            <div className="w-32 h-32 relative rounded-full overflow-hidden">
              <Image
                src={profilePicture.file_url || "/placeholder.svg"}
                alt="Profile picture"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{studentData.name}</h1>
            <p className="text-gray-600">
              {studentData.role || "Student"} • Grade {studentData.grade} • {studentData.location}
            </p>
          </div>
        </div>

        {studentData.about && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-gray-700">{studentData.about}</p>
          </div>
        )}

        {studentData.interests && studentData.interests.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Interest Areas</h2>
            <div className="flex flex-wrap gap-2">
              {studentData.interests.map((interest: string) => (
                <span key={interest} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {artworks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Artworks</h2>
            <Carousel className="w-full relative px-12">
              <CarouselContent className="-ml-1">
                {artworks.map((artwork: Artwork) => (
                  <CarouselItem key={artwork.id} className="pl-1 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col aspect-square p-4">
                          <div className="relative w-full h-3/4 mb-2">
                            <Image
                              src={artwork.file_url || "/placeholder.svg"}
                              alt={artwork.title}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm">{artwork.title}</h3>
                              <p className="text-gray-500 text-xs">
                                {new Date(artwork.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <a
                              href={artwork.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 transition-colors"
                            >
                              View
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {researchWorks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Research Works</h2>
            <Carousel className="w-full relative px-12">
              <CarouselContent className="-ml-1">
                {researchWorks.map((work: ResearchWork) => (
                  <CarouselItem key={work.id} className="pl-1 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col aspect-square p-4">
                          <div className="relative h-3/4 w-full bg-blue-50 flex items-center justify-center mb-2">
                            <svg
                              className="w-12 h-12 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              ></path>
                            </svg>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm">{work.title}</h3>
                              <p className="text-gray-500 text-xs">{new Date(work.updated_at).toLocaleDateString()}</p>
                            </div>
                            <a
                              href={work.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 transition-colors"
                            >
                              View
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {presentations.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Presentations</h2>
            <Carousel className="w-full relative px-12">
              <CarouselContent className="-ml-1">
                {presentations.map((presentation: Presentation) => {
                  const getPresentationId = (url: string) => {
                    try {
                      const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/
                      const match = url.match(regex)
                      return match ? match[1] : null
                    } catch (error) {
                      return null
                    }
                  }

                  const presentationId = getPresentationId(presentation.file_url)
                  const embedUrl = presentationId
                    ? `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`
                    : null

                  return (
                    <CarouselItem key={presentation.id} className="pl-1 md:basis-1/3 lg:basis-1/4">
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex flex-col aspect-square p-4">
                            <div className="relative h-3/4 w-full bg-gray-100 border-b mb-2 rounded-md overflow-hidden">
                              {embedUrl ? (
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full border-0"
                                  loading="lazy"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                  <FileIcon className="w-12 h-12 text-blue-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-sm truncate max-w-[180px]" title={presentation.title}>
                                  {presentation.title}
                                </h3>
                                <p className="text-gray-500 text-xs">
                                  {new Date(presentation.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <a
                                href={presentation.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 transition-colors"
                              >
                                View
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {videos && videos.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Videos</h2>
            <Carousel className="w-full relative px-12">
              <CarouselContent className="-ml-1">
                {videos.map((video: Video) => (
                  <CarouselItem key={video.id} className="pl-1 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col aspect-square p-4">
                          <div className="relative h-3/4 w-full mb-2">
                            <video src={video.file_url} preload="metadata" className="w-full h-full object-cover">
                              Your browser does not support the video tag.
                            </video>
                            {/* Play button overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-opacity">
                              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-opacity">
                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm">{video.title}</h3>
                              <p className="text-gray-500 text-xs">{new Date(video.updated_at).toLocaleDateString()}</p>
                            </div>
                            <a
                              href={video.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 transition-colors"
                            >
                              Watch
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {apps.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4">Apps</h2>
            <Carousel className="w-full relative px-12">
              <CarouselContent className="-ml-1">
                {apps.map((app) => (
                  <CarouselItem key={app.id} className="pl-1 md:basis-1/3 lg:basis-1/4">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col aspect-square p-4">
                          <div className="relative bg-gray-100 border-b w-full h-3/4 mb-2">
                            <iframe src={app.app_url} className="w-full h-full border-0" loading="lazy" />
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm">{app.name}</h3>
                              <p className="text-gray-500 text-xs">{new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                            <a
                              href={app.app_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 transition-colors"
                            >
                              View
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
      </div>
    </div>
  )
}

