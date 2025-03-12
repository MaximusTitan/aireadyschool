import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categories } from "../config/toolCategories";
import Link from "next/link";

// Utility function to find a tool by name across all categories and user types
const findToolRoute = (toolName: string): string | undefined => {
  for (const userType in categories) {
    for (const category in categories[userType]) {
      const tool = categories[userType][
        category as keyof (typeof categories)[typeof userType]
      ].find((tool) => tool.title === toolName);

      if (tool) {
        return tool.route;
      }
    }
  }
  return undefined;
};

const ActivitiesTable = () => {
  const activities = [
    {
      id: 1,
      activity: "Create a Story Presentation",
      examples: [
        "Indian History",
        "Journey to Mars",
        "Dive into the Ocean",
        "World War 3",
        "First Person on Earth",
        "Dooms Day",
        "Evolution of AI",
        "Evolution of New Religion",
        "Cat on an Island",
        "A Person That Cannot Change His Mind",
      ],
      tools: ["Presentation Generator"],
    },
    {
      id: 2,
      activity: "Create a Comic Book",
      examples: [
        "The Battle Between Spiderman and Chota Bheem",
        "Iron Man and Astro Boy: Mechanical Hearts",
        "Superman vs. Doraemon: Battle for the 5th Dimension",
        "Quantum Entangled: Fates in Parallel",
        "The Flash Races Sonic the Hedgehog",
        "Teenage Mutant Ninja Turtles vs. The Super Saiyans",
        "Deadpool's Adventures with Tom and Jerry",
        "The Avengers Meet Pokémon: Infinity Poké Ball",
        "Captain America in the World of Dragon Ball",
        "Groot and Totoro: Forest Guardians",
      ],
      tools: ["Comic Strip Generator"],
    },
    {
      id: 3,
      activity: "Create a Picture Album",
      examples: [
        "My Magical Pet Adventures",
        "Space Explorers: Journey to Planet X",
        "Underwater Kingdom Champions",
        "Backyard Safari Discoveries",
        "Time-Traveling History Detectives",
        "Foods vs. Monsters Battle Royale",
        "Cloud Kingdom Chronicles",
        "Miniature Heroes: The Tiny Defenders",
        "My Robot Buddy",
        "Enchanted Classroom",
      ],
      tools: ["Picture Album Creator"],
    },
    {
      id: 4,
      activity: "Create a Video",
      examples: [
        "Our Community Heroes",
        "Mini Science Explainers",
        "Earth Guardians",
        "Math in Real Life",
        "Literary Character Interviews",
        "Time Capsule 2025",
        "World Culture Spotlights",
        "Future Inventions",
        "Historical Moment Re-tellings",
        "Animal Habitat Tours",
      ],
      tools: [
        "Video Clip Generator",
        "Text to Speech Generator",
        "Video Editor",
      ],
    },
    {
      id: 5,
      activity: "Create a Personalized Study Plan for an Upcoming Exam",
      examples: [
        "A study plan with 2 hours a day for 10 days targeting a board exam",
        "A study plan with 1 hour a day for 4 days targeting a math olympiad",
      ],
      tools: [],
    },
    {
      id: 6,
      activity: "Generate and Take an Assessment Test and Get Feedback",
      examples: [
        "Generate a Math Assessment",
        "Generate a Science Assessment",
        "Generate a Biology Assessment",
        "Generate a Social Assessment",
        "Generate an English Assessment",
      ],
      tools: [],
    },
    {
      id: 7,
      activity: "Create a Subject Presentation",
      examples: [
        "Create a Presentation on Sound",
        "Create a Presentation on Photosynthesis",
        "Create a Presentation on Space",
        "Create a Presentation on Types of Metals",
        "Create a Presentation on Thermodynamics",
      ],
      tools: [],
    },
    {
      id: 8,
      activity: "Learn a Lesson from Agent Buddy",
      examples: [
        "Learn About Fractions and mixed numbers",
        "Learn About Ratios and rates",
        "Learn About Crop Production and Management",
        "Learn About Carbon and Its Compounds",
        "Learn About Light Reflection and Refraction",
        "Learn About Magnetic Effects and Electric Current",
        "Learn About Acids, Bases and Salts",
        "Learn About Weather and the Atmosphere",
        "Learn About Exponents and Order of Operations",
        "Learn About Negative Numbers",
      ],
      tools: [],
    },
    {
      id: 9,
      activity: "Play with PDF Documents",
      examples: [
        "Summarise the Given Document",
        "Ask Questions from Multiple Documents",
        "Create a Timeline of Activities from the Given Documents",
        "Compare Two Documents",
      ],
      tools: [],
    },
    {
      id: 10,
      activity: "Create Summaries of Youtube Videos",
      examples: [],
      tools: [],
    },
    {
      id: 11,
      activity: "Create a Research Document",
      examples: [],
      tools: [],
    },
    {
      id: 12,
      activity: "Update and Publish Portfolio",
      examples: [],
      tools: [],
    },
    {
      id: 13,
      activity: "Create a Video Script",
      examples: [],
      tools: [],
    },
    {
      id: 14,
      activity: "Build Creatives with Code",
      examples: [],
      tools: [],
    },
    {
      id: 15,
      activity: "Debate with Agent Buddy",
      examples: [],
      tools: [],
    },
    {
      id: 16,
      activity: "Create an AI App",
      examples: [
        "Recipe Maker",
        "Travel Planner",
        "Story Maker",
        "Book Suggestion Maker",
      ],
      tools: [],
    },
    {
      id: 17,
      activity: "Experience Image Recognition Model on Teachable Machine",
      examples: [],
      tools: [],
    },
    {
      id: 18,
      activity: "Create a Song",
      examples: [],
      tools: [],
    },
    {
      id: 19,
      activity: "Create Voice Over",
      examples: [],
      tools: [],
    },
    {
      id: 20,
      activity: "Plan for an AI Product Development Project",
      examples: [],
      tools: [],
    },
    {
      id: 21,
      activity: "Create an Art Work in Various Art Forms",
      examples: [
        "Mandala Art",
        "Painting",
        "3D Art",
        "Drawing",
        "Photography",
        "Digital Art",
        "Vector Art",
      ],
      tools: [],
    },
    {
      id: 22,
      activity: "Co-create a Story with Agent Buddy",
      examples: [],
      tools: [],
    },
    {
      id: 23,
      activity: "",
      examples: [],
      tools: [],
    },
    {
      id: 24,
      activity: "",
      examples: [],
      tools: [],
    },
    {
      id: 25,
      activity: "",
      examples: [],
      tools: [],
    },
  ];

  return (
    <div className="min-h-screen bg-backgroundApp py-8 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-sm">
          <CardTitle className="text-2xl font-bold">Activities</CardTitle>
          <CardDescription className="text-sm text-white">
            This is a list of activities that you can do with the tools
            available on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-rose-50">
                <TableRow>
                  <TableHead className="font-bold text-rose-700 w-12 text-center">
                    #
                  </TableHead>
                  <TableHead className="font-bold text-rose-700 w-1/4">
                    Activity
                  </TableHead>
                  <TableHead className="font-bold text-rose-700 w-2/5">
                    Examples
                  </TableHead>
                  <TableHead className="font-bold text-rose-700 w-1/4">
                    Tool(s)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <TableCell className="font-medium text-center">
                      {item.id}
                    </TableCell>
                    <TableCell className="font-medium text-base">
                      {item.activity || (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.examples.length > 0 ? (
                        <ol className="list-decimal pl-5 space-y-1">
                          {item.examples.map((example, index) => (
                            <li
                              key={index}
                              className="text-gray-700 hover:text-rose-600 transition-colors"
                            >
                              {example}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.tools.length > 0 ? (
                        <ol className="list-disc pl-5 space-y-1">
                          {item.tools.map((tool, index) => {
                            const toolRoute = findToolRoute(tool);
                            return (
                              <li
                                key={index}
                                className="text-gray-700 font-medium"
                              >
                                {toolRoute ? (
                                  <Link href={toolRoute}>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer">
                                      {tool}
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                    {tool}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivitiesTable;
