"use server"

import { generateText } from "ai"
import type { Message } from "../types"
import { openai } from "@ai-sdk/openai"

const model = openai("gpt-4o")

export async function generateProjectIdea(
  projectDomain: string,
  subject: string,
  interestsOrTopic: string,
  toolsOrProjectType: string,
  skillLevel: string,
  projectDuration: string,
  targetAudience: string,
  grade: string,
  detailedExplanation: string,
) {
  const prompt = `Generate a unique ${projectDomain} project idea for a student with the following parameters:
Subject: ${subject}
${projectDomain === "technical" ? "Interests" : "Topic"}: ${interestsOrTopic}
${projectDomain === "technical" ? "Tools/Technologies" : "Project Type"}: ${toolsOrProjectType}
Skill Level: ${skillLevel}
Project Duration: ${projectDuration} days
Target Audience: ${targetAudience}
Grade Level: ${grade}
Detailed Explanation: ${detailedExplanation}

${
  projectDomain === "technical"
    ? "Ensure the project idea incorporates the specified tools/technologies."
    : `Ensure the project idea aligns with the selected project type: ${toolsOrProjectType}. Tailor the project structure and activities to fit this type of project.`
}

Provide a detailed project idea that combines these elements and is suitable for the given skill level, duration, target audience, and grade level. Include the following sections:
1. Project Title
2. Project Overview
3. Key Features
4. Learning Objectives
5. ${projectDomain === "technical" ? "Technical Requirements" : "Project Requirements"}
6. ${projectDomain === "technical" ? "System Architecture" : "Project Structure"}
7. Potential Challenges
8. Impact and Relevance
9. Future Enhancements
10. ${projectDomain === "technical" ? "Security Considerations" : "Ethical Considerations"}

Incorporate the user's detailed explanation into the project idea, ensuring that their specific requirements and goals are addressed.

Format your response in markdown, using headings, bullet points, and emphasis where appropriate. Do not include a timeline or schedule in this idea generation.`

  try {
    const { text } = await generateText({
      model,
      prompt,
    })
    return text
  } catch (error) {
    console.error("Error in generateProjectIdea:", error)
    throw new Error("Failed to generate project idea. Please try again.")
  }
}

export async function modifyProjectIdea(currentIdea: string, userSuggestion: string) {
  const prompt = `Current project idea:
${currentIdea}

User suggestion for modification:
${userSuggestion}

Please modify the current project idea based on the user's suggestion. Maintain the overall structure and scope of the project, but incorporate the user's ideas where appropriate. Format your response in markdown, using headings, bullet points, and emphasis where appropriate.`

  try {
    const { text } = await generateText({
      model,
      prompt,
    })
    return text
  } catch (error) {
    console.error("Error in modifyProjectIdea:", error)
    throw new Error("Failed to modify project idea. Please try again.")
  }
}

export async function generateProjectPlan(projectIdea: string, duration: string, grade: string, projectDomain: string) {
  const prompt = `Based on the following project idea, duration, grade level, and project domain, generate a detailed project timeline:

Project Idea:
${projectIdea}

Project Duration: ${duration} days
Grade Level: ${grade}
Project Domain: ${projectDomain}

Create a detailed project timeline that is appropriate for a ${projectDomain} project. 
${
  projectDomain === "technical"
    ? "Include technical milestones, development phases, testing, and deployment steps."
    : "Focus on research, content creation, presentation preparation, or experimental setup depending on the project type."
}

Format the response using proper markdown:

# Project Timeline

## Project Phases
List the main phases of the project

## Milestones
Key achievements and checkpoints

## Task Breakdown
### Phase 1: [Phase Name] (Days X-Y)
- Task 1
- Task 2
- Task 3

[Continue for each phase]

## Dependencies
- List key dependencies between tasks

## Resource Allocation
- List required resources and roles

## Risk Assessment
- Identify potential risks
- Include mitigation strategies

## Deliverables
- List expected outputs for each phase

## Review Points
- Include checkpoints for review and feedback

Use proper markdown formatting:
- Use # for main title
- Use ## for sections
- Use ### for subsections
- Use - for bullet points
- Use **bold** for emphasis
- Use *italic* for secondary emphasis`

  try {
    const { text } = await generateText({
      model,
      prompt,
    })
    return text
  } catch (error) {
    console.error("Error in generateProjectPlan:", error)
    throw new Error("Failed to generate project plan. Please try again.")
  }
}

export async function modifyProjectPlan(currentPlan: string, userSuggestion: string, projectDomain: string) {
  const prompt = `Current project plan:
${currentPlan}

User suggestion for modification:
${userSuggestion}

Project Domain: ${projectDomain}

Please modify the current project plan based on the user's suggestion. Maintain the overall structure and timeline of the project, but incorporate the user's ideas where appropriate. Ensure that the modified plan still fits within the original project duration and is suitable for a ${projectDomain} project. Format your response in markdown, using headings, bullet points, and emphasis where appropriate.`

  try {
    const { text } = await generateText({
      model,
      prompt,
    })
    return text
  } catch (error) {
    console.error("Error in modifyProjectPlan:", error)
    throw new Error("Failed to modify project plan. Please try again.")
  }
}

export async function generateResources(
  topic: string,
  specificGoals: string,
  timeAvailable: string,
  grade: string,
  projectDomain: string,
) {
  // Input validation with specific error messages
  if (!topic) throw new Error("Topic is required")
  if (!specificGoals) throw new Error("Learning goals are required")
  if (!timeAvailable) throw new Error("Time available is required")
  if (!grade) throw new Error("Grade level is required")
  if (!projectDomain) throw new Error("Project domain is required")

  try {

    const { text } = await generateText({
      model,
      prompt: `Generate educational resources for a ${grade} student's ${projectDomain} project:

Topic: ${topic}
Learning Goals: ${specificGoals}
Time Available: ${timeAvailable}
Project Domain: ${projectDomain}

Please provide 5 high-quality educational resources that are:
1. Age-appropriate for ${grade} students
2. Relevant to ${topic}
3. Suitable for ${projectDomain} projects
4. Achievable within ${timeAvailable}
5. Aligned with the learning goals: ${specificGoals}

For each resource, provide:
1. A descriptive title
2. A valid URL (use real, accessible educational websites)
3. A brief but informative description (2-3 sentences)

Format each resource exactly like this example:

## [Science Buddies - Volcano Project Guide](https://www.sciencebuddies.org/volcano-guide)
Step-by-step instructions for building and demonstrating a volcanic eruption model. Includes safety guidelines, material lists, and scientific explanations suitable for middle school students.

## [National Geographic Kids - Volcanoes](https://kids.nationalgeographic.com/science/volcanoes)
Interactive learning resources about volcanic formations and eruptions, with videos and animations suitable for classroom use.

Ensure each resource:
- Has a clear, descriptive title in [brackets]
- Has a working URL in (parentheses)
- Includes a helpful description
- Is appropriate for ${grade} level
- Supports the specific learning goals`,
      temperature: 0.7,
      maxTokens: 1000,
    })

    if (!text || typeof text !== 'string') {
      throw new Error("No response received from the AI model")
    }

    const resources = extractResourcesFromText(text)
    
    if (!Array.isArray(resources) || resources.length === 0) {
      throw new Error("Failed to generate resources. Please try again with different parameters.")
    }

    return resources
  } catch (error) {
    console.error("Error in generateResources:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate resources: ${error.message}`)
    } else {
      throw new Error("An unexpected error occurred while generating resources")
    }
  }
}

export async function modifyResources(currentResources: any[], userSuggestion: string, projectDomain: string) {
  const prompt = `Current resource suggestions:
${JSON.stringify(currentResources, null, 2)}

User suggestion for modification:
${userSuggestion}

Project Domain: ${projectDomain}

Please modify the current resource suggestions based on the user's input. You can add new resources, remove existing ones, or modify the details of current resources. Ensure that the modified list still contains relevant and high-quality resources for the user's learning goals and is appropriate for a ${projectDomain} project. Return the modified list of resources in the same format as the input.`

  try {
    const { text } = await generateText({
      model,
      prompt,
    })
    return JSON.parse(text)
  } catch (error) {
    console.error("Error in modifyResources:", error)
    throw new Error("Failed to modify resource suggestions. Please try again.")
  }
}

export async function generateChatResponse(messages: Message[]) {
  try {
    const { text } = await generateText({
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
    })
    return text
  } catch (error) {
    console.error("Error in generateChatResponse:", error)
    throw new Error("Failed to generate a response. Please try again.")
  }
}

// Helper function to extract resources from text
function extractResourcesFromText(text: string): Array<{ title: string; url: string; description: string }> {
  const resources: Array<{ title: string; url: string; description: string }> = []
  const lines = text.split("\n")
  let currentResource: { title: string; url: string; description: string } | null = null

  for (const line of lines) {
    const headerMatch = line.match(/^##\s*\[(.*?)\]\((.*?)\)/)
    
    if (headerMatch) {
      if (currentResource) {
        resources.push({
          ...currentResource,
          description: currentResource.description.trim()
        })
      }
      
      currentResource = {
        title: headerMatch[1].trim(),
        url: headerMatch[2].trim(),
        description: ""
      }
    } 
    else if (currentResource && line.trim() && !line.startsWith('#')) {
      currentResource.description += (currentResource.description ? " " : "") + line.trim()
    }
  }

  if (currentResource) {
    resources.push({
      ...currentResource,
      description: currentResource.description.trim()
    })
  }

  return resources
}

