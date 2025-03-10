import {LessonPlanViewer} from "../components/lesson-plan-viewer"

const sampleLessonPlan = {
  title: "Lesson Plan: Rational Numbers",
  grade: "4th Grade",
  board: "CBSE",
  sessions: 4,
  duration: 45,
  currentSession: {
    title: "Adding and Subtracting Rational Numbers",
    description:
      "Adding and subtracting rational numbers involves combining or removing fractions and decimals while following specific rules. When adding or subtracting fractions, a common denominator is needed. For decimals, align place values before performing operations. Understanding sign rules for positive and negative numbers is essential. This skill is crucial in real-life calculations.",
    learningOutcomes: [
      "Students will be able to define what makes a number 'rational' in their own words",
      "Students will be able to identify whether a given number is rational or irrational with 90% accuracy",
    ],
    lessonObjectives: [
      "Introduce the concept of rational numbers",
      "Explain the relationship between fractions, decimals, and rational numbers",
    ],
    plan: [
      {
        duration: "0:05",
        activities: {
          title: "Introduction",
          description: "Start with a real-life example (e.g., temperature changes or money transactions).",
          details: ["Ask: What happens when we combine positive and negative numbers?"],
        },
        materials: [
          {
            title: "Introduction to Rational Numbers",
            type: "lesson",
          },
          {
            title: "Video",
            type: "video",
          },
        ],
      },
      {
        duration: "0:10",
        activities: {
          title: "Guide Practice",
          description: "Solve a few examples together (step-by-step).",
          details: ["Use a number line for visualization.", "Include mixed problems (integers, fractions, decimals)."],
        },
        materials: [
          {
            title: "Interactive Visualization",
            type: "interactive",
          },
        ],
      },
      {
        duration: "0:05",
        activities: {
          title: "Quick Quiz & Recap",
          description: "A short quiz (3-4 questions).",
          details: ["Recap key takeaways using a mind map or discussion."],
        },
        materials: [
          {
            title: "Quiz",
            type: "quiz",
          },
        ],
      },
    ],
  },
}

export default function LessonPlanPage() {
  return <LessonPlanViewer lessonPlan={sampleLessonPlan} />
}

