"use client";
import React, { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Brain, Users, Lightbulb, LogIn } from "lucide-react";

const DataAITalksHomepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-600">
      {/* Navigation Bar */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-xl">Data & AI Talks</div>
            <div className="flex gap-4">
              <Link href="/sign-in">
                <button className="bg-white text-purple-700 px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Data & AI Talks</h1>
          <h2 className="text-2xl mb-8">An Inter-School Competition</h2>
          <p className="text-xl mb-8">
            A Quest for AI Product Ideas from Children
          </p>
          <Link href="/dat/school/register">
            <button className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center mx-auto">
              Register Your School
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </Link>
        </div>
      </header>

      {/* Why AI for Kids Section */}
      <section className="bg-white bg-opacity-10 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why AI for Kids?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain />}
              title="Future Skills"
              description="Prepare for a future where AI knowledge and creative thinking are essential job skills"
            />
            <FeatureCard
              icon={<Users />}
              title="Creative Expression"
              description="Platform for children to share innovative ideas and showcase their imagination"
            />
            <FeatureCard
              icon={<Lightbulb />}
              title="Higher Learning"
              description="Engage with AI concepts beyond tools, focusing on human-centered innovation"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-6">
              The Need for Data & AI Talks
            </h2>
            <p className="text-white text-lg leading-relaxed">
              Today&apos;s kids are different - they have information at their
              fingertips and understand the world in unique ways. Through this
              event, we inspire children to think about AI&apos;s future and
              share their creative ideas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <p className="font-bold">Data & AI Talks</p>
              <p className="text-sm">India & US - 2025</p>
            </div>
            <div className="flex gap-4">
              <Image
                src="/api/dat/placeholder/100/40"
                alt="iGebra.ai"
                width={100}
                height={40}
              />
              <Image
                src="/api/dat/placeholder/100/40"
                alt="AI Ready School"
                width={100}
                height={40}
              />
              <Image
                src="/api/dat/placeholder/100/40"
                alt="Data & AI Club"
                width={100}
                height={40}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactElement<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm">
      <div className="text-white mb-4">
        {React.cloneElement(icon, { className: "h-12 w-12" })}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white text-opacity-90">{description}</p>
    </div>
  );
};

export default DataAITalksHomepage;
