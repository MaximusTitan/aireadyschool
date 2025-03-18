import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

const GuidePage = () => {
  const guideCards = [
    {
      title: "Activities",
      description: "Explore various educational activities and exercises",
      link: "/guide/activities",
    },
    {
      title: "Library",
      description: "",
      link: "/guide/library",
    },
  ];

  return (
    <div className="min-h-screen bg-backgroundApp py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mb-8">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-sm">
          <CardTitle className="text-2xl font-bold">Guide</CardTitle>
          <CardDescription className="text-sm text-white">
            Welcome to the AIReady School Guide. Explore our resources and get
            started with your AI learning journey.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guideCards.map((card, index) => (
          <Link href={card.link} key={index}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-rose-600">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GuidePage;
