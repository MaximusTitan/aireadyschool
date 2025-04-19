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
    // {
    //   title: "Library",
    //   description: "",
    //   link: "/guide/library",
    // },
  ];

  return (
    <div className="min-h-screen bg-backgroundApp py-6 px-4">
      <Card className="mb-6 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-xl text-rose-500">Guide</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Welcome to the AIReady School Guide. Explore our resources and get
            started with your AI learning journey.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guideCards.map((card, index) => (
          <Link href={card.link} key={index}>
            <Card className="hover:shadow-sm border hover:border-rose-200 transition-all cursor-pointer">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">{card.title}</CardTitle>
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
