import { v4 as uuidv4 } from "uuid"
import { AIPromptEngine } from "./ai-prompt-engine"
import { GeminiProService } from "./gemini-pro-service"
import { FalImageService } from "./fal-image-service"
import type { StoryboardData, SceneInfo, ShotInfo, StyleSettings } from "./types"

/**
 * Storyboard Generator
 * Generates a complete storyboard based on story text and style settings
 */
export async function generateStoryboard(
  storyText: string,
  styleSettings: StyleSettings,
  useGeminiPro = true,
  progressCallback?: (step: number, progress: number) => void,
): Promise<StoryboardData> {
  // Create services
  const promptEngine = new AIPromptEngine()
  const geminiService = new GeminiProService()
  const imageService = new FalImageService()

  // Update progress
  const updateProgress = (step: number, progress: number) => {
    if (progressCallback) {
      progressCallback(step, progress)
    }
  }

  // Step 1: Analyze story text
  updateProgress(0, 0)
  let storyStructure: any

  if (useGeminiPro) {
    // Use Gemini Pro for enhanced story analysis
    updateProgress(1, 0)
    storyStructure = await geminiService.analyzeStory(storyText)
    updateProgress(1, 100)
  } else {
    // Use basic analysis
    const basicAnalysis = await analyzeStoryBasic(storyText)
    storyStructure = basicAnalysis
    updateProgress(1, 100)
  }

  // Step 2: Extract scenes and shots
  updateProgress(2, 0)
  const title = storyStructure.title || generateTitle(storyText)

  // Create scenes and shots
  const scenes: SceneInfo[] = await Promise.all(
    storyStructure.scenes.map(async (scene: any, sceneIndex: number) => {
      updateProgress(2, (sceneIndex / storyStructure.scenes.length) * 100)

      // Create shots for this scene
      const shots: ShotInfo[] = scene.shots.map((shotInfo: any, shotIndex: number) => {
        // Create a unique ID for this shot
        const shotId = `${sceneIndex + 1}-${shotIndex + 1}`

        // Convert to ShotInfo format
        return {
          id: shotId,
          sceneId: `scene-${sceneIndex}`,
          sceneContext: scene.description,
          shotDescription: shotInfo.description,
          shotType: shotInfo.shotType,
          cameraAngle: shotInfo.cameraAngle,
          cameraMovement: shotInfo.cameraMovement,
          characters: shotInfo.characters,
          location: shotInfo.location,
          timeOfDay: shotInfo.timeOfDay,
          weather: shotInfo.weather,
          lighting: shotInfo.lighting,
          mood: shotInfo.mood,
          audio: shotInfo.audio,
          notes: shotInfo.notes,
          dialogueSnippet: shotInfo.dialogueSnippet,
        }
      })

      return {
        id: `scene-${sceneIndex}`,
        title: scene.title,
        description: scene.description,
        shots,
      }
    }),
  )

  // Step 3: Generate prompts for each shot
  updateProgress(3, 0)
  let totalShots = 0
  scenes.forEach((scene) => {
    totalShots += scene.shots.length
  })

  let processedShots = 0

  // Update shots with prompts
  const scenesWithPrompts = scenes.map((scene) => {
    const shotsWithPrompts = scene.shots.map((shot) => {
      // Generate prompt for this shot
      const prompt = promptEngine.generatePrompt(shot, styleSettings, "fal")
      processedShots++
      updateProgress(3, (processedShots / totalShots) * 100)

      return {
        ...shot,
        prompt,
      }
    })

    return {
      ...scene,
      shots: shotsWithPrompts,
    }
  })

  // Step 4: Generate images for each shot (sequentially)
  updateProgress(4, 0)
  processedShots = 0

  // Process scenes sequentially
  const scenesWithImages = []
  for (const scene of scenesWithPrompts) {
    // Process shots sequentially
    const shotsWithImages = []
    for (const shot of scene.shots) {
      // Generate image for this shot
      const imageUrl = await imageService.generateImage({
        prompt: shot.prompt || "",
        negativePrompt: promptEngine.generateNegativePrompt(styleSettings),
        width: getWidthForAspectRatio(styleSettings.aspectRatio),
        height: getHeightForAspectRatio(styleSettings.aspectRatio),
        steps: getStepsForQuality(styleSettings.quality),
      })

      processedShots++
      updateProgress(4, (processedShots / totalShots) * 100)

      shotsWithImages.push({
        ...shot,
        imageUrl,
      })
    }

    scenesWithImages.push({
      ...scene,
      shots: shotsWithImages,
    })
  }

  // Step 5: Assemble the storyboard
  updateProgress(5, 0)

  // Create storyboard data
  const storyboardData: StoryboardData = {
    id: uuidv4(),
    title,
    author: "AI Storyboard Generator",
    director: "User",
    date: new Date().toISOString().split("T")[0],
    version: "1.0",
    style: styleSettings.visualStyle,
    aspectRatio: styleSettings.aspectRatio,
    scenes: scenesWithImages,
    annotations: [], // Initialize annotations array
  }

  updateProgress(5, 100)

  return storyboardData
}

/**
 * Basic story analysis function (used when Gemini Pro is not available)
 * @param storyText Story text to analyze
 * @returns Analyzed story structure
 */
async function analyzeStoryBasic(storyText: string): Promise<any> {
  // Generate a title from the story
  const title = generateTitle(storyText)

  // Split the story into paragraphs
  const paragraphs = storyText.split(/\n+/).filter((p) => p.trim().length > 0)

  // Create scenes based on paragraphs
  const scenes = paragraphs.map((paragraph, index) => {
    // Generate a scene title
    const sceneTitle = `Scene ${index + 1}: ${paragraph.split(" ").slice(0, 3).join(" ")}...`

    // Create 2-4 shots per scene
    const shotCount = Math.floor(Math.random() * 3) + 2 // 2-4 shots
    const shots = []

    for (let i = 0; i < shotCount; i++) {
      // Determine shot type based on position in scene
      let shotType
      if (i === 0) {
        // First shot is usually establishing
        shotType = ["ELS", "LS", "AERIAL"][Math.floor(Math.random() * 3)]
      } else if (i === shotCount - 1) {
        // Last shot often closer for emotional impact
        shotType = ["CU", "MCU", "MS"][Math.floor(Math.random() * 3)]
      } else {
        // Middle shots vary
        shotType = ["MS", "MLS", "LS", "MCU", "OTS"][Math.floor(Math.random() * 5)]
      }

      // Determine camera angle
      const cameraAngles = ["EYE_LEVEL", "LOW_ANGLE", "HIGH_ANGLE", "BIRD_EYE"]
      const cameraAngle = cameraAngles[Math.floor(Math.random() * cameraAngles.length)]

      // Determine camera movement
      const cameraMovements = ["STATIC", "PAN", "DOLLY_IN", "ZOOM_IN", "TRACKING"]
      const cameraMovement = cameraMovements[Math.floor(Math.random() * cameraMovements.length)]

      // Create shot description
      const sentenceCount = paragraph.split(/[.!?]+/).length
      const startSentence = Math.floor((sentenceCount / shotCount) * i)
      const endSentence = Math.min(startSentence + Math.ceil(sentenceCount / shotCount), sentenceCount)

      const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0)
      const shotDescription = sentences.slice(startSentence, endSentence).join(". ") + "."

      // Extract potential characters
      const characterMatches = paragraph.match(/\b[A-Z][a-z]+\b/g)
      const characters = characterMatches ? [...new Set(characterMatches)].slice(0, 2) : undefined

      // Determine mood
      const moods = ["HAPPY", "SAD", "TENSE", "MYSTERIOUS", "ROMANTIC", "SCARY"]
      const mood = moods[Math.floor(Math.random() * moods.length)]

      // Generate lighting based on content
      let lighting = "Natural lighting"
      if (paragraph.toLowerCase().includes("night") || paragraph.toLowerCase().includes("dark")) {
        lighting = "Low-key lighting with deep shadows"
      } else if (paragraph.toLowerCase().includes("sunset") || paragraph.toLowerCase().includes("dusk")) {
        lighting = "Golden hour lighting with warm orange tones"
      } else if (paragraph.toLowerCase().includes("morning") || paragraph.toLowerCase().includes("dawn")) {
        lighting = "Soft diffused morning light with cool blue tones"
      }

      // Generate audio description
      let audio = "Ambient sounds"
      if (mood === "TENSE" || mood === "SCARY") {
        audio = "Tense music, subtle heartbeat sound"
      } else if (mood === "HAPPY") {
        audio = "Upbeat music, cheerful ambient sounds"
      } else if (mood === "SAD") {
        audio = "Melancholic music, soft ambient sounds"
      } else if (mood === "MYSTERIOUS") {
        audio = "Mysterious ambient sounds, subtle tones"
      }

      // Generate director's notes
      const notes = `This ${shotType} shot emphasizes the ${shotType === "CU" || shotType === "ECU" ? "emotional impact" : "environmental context"} of the scene. ${cameraMovement !== "STATIC" ? `The ${cameraMovement.toLowerCase()} movement adds dynamism.` : ""}`

      shots.push({
        shotType,
        description: shotDescription,
        cameraAngle,
        cameraMovement,
        characters,
        location: "Story location",
        timeOfDay: paragraph.toLowerCase().includes("night") ? "Night" : "Day",
        lighting,
        mood,
        audio,
        notes,
      })
    }

    return {
      title: sceneTitle,
      description: paragraph,
      shots,
    }
  })

  return {
    title,
    scenes,
  }
}

/**
 * Generate a title from story text
 * @param storyText Story text
 * @returns Generated title
 */
function generateTitle(storyText: string): string {
  // In a real implementation, this would use AI to generate a title
  // For this example, we'll extract the first few words
  const words = storyText.split(" ")
  const titleWords = words.slice(0, Math.min(5, words.length))
  return titleWords.join(" ") + (titleWords.length < words.length ? "..." : "")
}

/**
 * Get width for aspect ratio
 * @param aspectRatio Aspect ratio
 * @returns Width in pixels
 */
function getWidthForAspectRatio(aspectRatio: string): number {
  switch (aspectRatio) {
    case "16:9":
      return 1024
    case "4:3":
      return 1024
    case "1:1":
      return 1024
    case "2.35:1":
      return 1024
    case "9:16":
      return 576
    default:
      return 1024
  }
}

/**
 * Get height for aspect ratio
 * @param aspectRatio Aspect ratio
 * @returns Height in pixels
 */
function getHeightForAspectRatio(aspectRatio: string): number {
  switch (aspectRatio) {
    case "16:9":
      return 576
    case "4:3":
      return 768
    case "1:1":
      return 1024
    case "2.35:1":
      return 436
    case "9:16":
      return 1024
    default:
      return 768
  }
}

/**
 * Get steps for quality
 * @param quality Quality setting
 * @returns Number of steps
 */
function getStepsForQuality(quality: string): number {
  switch (quality) {
    case "high":
      return 50
    case "standard":
      return 30
    case "draft":
      return 15
    default:
      return 30
  }
}
