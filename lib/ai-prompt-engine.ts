import type { ShotInfo, StyleSettings, VisualStyle, ShotType, CameraAngle, CameraMovement, SceneMood } from "./types"

/**
 * AI Prompt Engine Class
 * Generates optimized prompts for image generation services based on shot information and style settings
 */
export class AIPromptEngine {
  // Style templates with detailed descriptions for different visual styles
  private styleTemplates: Record<VisualStyle, string> = {
    cinematic:
      "cinematic film still, professional lighting, high production value, photorealistic, detailed, movie scene, film grain, 35mm film, anamorphic lens, shallow depth of field",
    anime:
      "anime style, vibrant colors, clean lines, expressive, Studio Ghibli inspired, 2D animation, cel shaded, detailed backgrounds, anime film still",
    comic:
      "comic book style, strong outlines, cel shading, bold colors, graphic novel aesthetic, comic panel, detailed illustration, dynamic composition",
    minimal:
      "minimalist style, limited color palette, simple shapes, clean design, elegant, negative space, subtle textures, understated lighting",
    concept:
      "concept art, environmental design, atmospheric, matte painting style, detailed background, professional illustration, fantasy art, digital painting, highly detailed",
    "3d_realistic":
      "3D rendering, photorealistic, physically based rendering, detailed textures, volumetric lighting, ray tracing, cinematic composition, hyperrealistic, octane render",
    watercolor:
      "watercolor painting style, soft edges, color bleeding, textured paper, artistic, hand-painted, traditional media, delicate brushwork, expressive",
    noir: "film noir style, high contrast black and white, dramatic shadows, low-key lighting, moody atmosphere, venetian blinds shadows, dramatic silhouettes, 1940s aesthetic",
  }

  // Shot type keywords with detailed descriptions
  private shotTypeKeywords: Record<ShotType, string> = {
    ECU: "extreme close-up shot, macro details, intimate, showing fine details, emotional intensity, filling the frame with subject detail",
    CU: "close-up shot, facial details, emotional, focusing on face or small object, revealing expressions, intimate perspective",
    MCU: "medium close-up shot, head and shoulders, personal space, showing upper body, facial expressions with some context",
    MS: "medium shot, from waist up, conversational, showing torso and arms, balanced framing, social distance",
    MLS: "medium long shot, full body with some environment, contextual, showing full character with surrounding space",
    LS: "long shot, character in full environment, establishing relationship with surroundings, wide perspective",
    ELS: "extreme long shot, wide establishing shot, vast environment, showing scale and scope, diminutive subject in expansive setting",
    OTS: "over-the-shoulder shot, from behind character looking at subject, relational, showing perspective and reaction",
    POV: "point of view shot, first-person perspective, subjective camera, seeing through character's eyes",
    AERIAL: "aerial shot, from above, bird's eye view, overhead perspective, showing layout and patterns from height",
    DUTCH: "dutch angle shot, tilted horizon, disorienting, creating tension and unease, diagonal composition",
    TWO_SHOT: "two-shot, featuring two characters in frame, relationship focused, showing interaction between subjects",
  }

  // Camera angle keywords with detailed descriptions
  private cameraAngleKeywords: Record<CameraAngle, string> = {
    EYE_LEVEL: "eye level camera, neutral perspective, natural viewpoint, balanced composition, objective framing",
    LOW_ANGLE:
      "low angle shot looking up, emphasizing power or size, heroic perspective, imposing viewpoint, dramatic upward view",
    HIGH_ANGLE: "high angle shot looking down, diminishing or vulnerable, overhead perspective, surveying viewpoint",
    BIRD_EYE: "bird's eye view, directly from above, overview, completely overhead perspective, map-like view",
    WORM_EYE: "worm's eye view, extreme low angle, imposing, dramatic upward perspective, monumental framing",
    DUTCH_ANGLE: "dutch angle, tilted horizon, disorientation, diagonal composition, psychological unease",
  }

  // Camera movement keywords with detailed descriptions
  private cameraMovementKeywords: Record<CameraMovement, string> = {
    STATIC: "static shot, fixed camera, stable framing, locked-down perspective, no movement",
    PAN: "panning shot, horizontal camera movement, rotating view, surveying space from fixed position",
    TILT: "tilting shot, vertical camera movement, looking up or down from fixed position, revealing vertical space",
    DOLLY_IN: "dolly in, camera moving forward, increasing intensity, approaching subject, deepening engagement",
    DOLLY_OUT: "dolly out, camera moving backward, revealing context, distancing from subject, expanding view",
    TRACKING: "tracking shot, camera following subject, moving alongside action, maintaining framing during movement",
    ZOOM_IN: "zoom in, focusing on detail, increasing tension, narrowing field of view, optical compression",
    ZOOM_OUT: "zoom out, revealing wider context, expanding perspective, broadening field of view",
    CRANE:
      "crane shot, smooth elevated movement, sweeping perspective change, vertical and horizontal movement combined",
    HANDHELD: "handheld camera, slightly unstable, documentary feel, organic movement, subjective perspective",
  }

  // Mood keywords with detailed descriptions
  private moodKeywords: Record<SceneMood, string> = {
    HAPPY: "cheerful atmosphere, bright colors, warm lighting, uplifting, joyful mood, positive energy, vibrant scene",
    SAD: "melancholic mood, somber tones, soft shadows, emotional, subdued colors, pensive atmosphere, gentle lighting",
    TENSE:
      "tense atmosphere, harsh contrast, dramatic shadows, suspenseful, anxiety-inducing, sharp lighting, uneasy mood",
    MYSTERIOUS:
      "mysterious ambiance, fog, subtle lighting, enigmatic, secretive mood, obscured elements, intriguing shadows",
    ROMANTIC:
      "romantic mood, soft glowing light, warm colors, intimate, tender atmosphere, gentle bokeh, dreamy quality",
    SCARY:
      "eerie mood, dark shadows, high contrast, unsettling, foreboding atmosphere, ominous lighting, dread-inducing",
    SERENE:
      "peaceful atmosphere, soft lighting, harmonious, calming, balanced composition, tranquil mood, gentle colors",
    CHAOTIC:
      "chaotic scene, dynamic composition, visual tension, energetic, disorderly elements, complex lighting, frenetic mood",
  }

  // Aspect ratio parameters for different image generation services
  private aspectRatioParams: Record<string, Record<string, string>> = {
    fal: {
      "16:9": "width=1024,height=576",
      "4:3": "width=1024,height=768",
      "1:1": "width=1024,height=1024",
      "2.35:1": "width=1024,height=436",
      "9:16": "width=576,height=1024",
    },
    midjourney: {
      "16:9": "--ar 16:9",
      "4:3": "--ar 4:3",
      "1:1": "--ar 1:1",
      "2.35:1": "--ar 21:9",
      "9:16": "--ar 9:16",
    },
    dalle: {
      "16:9": "aspect_ratio=16:9",
      "4:3": "aspect_ratio=4:3",
      "1:1": "aspect_ratio=1:1",
      "2.35:1": "aspect_ratio=21:9",
      "9:16": "aspect_ratio=9:16",
    },
  }

  // Quality parameters for different image generation services
  private qualityParams: Record<string, Record<string, string>> = {
    fal: {
      standard: "steps=30",
      high: "steps=50",
      draft: "steps=15",
    },
    midjourney: {
      standard: "--q 1",
      high: "--q 2 --stylize 100",
      draft: "--q 0.5 --stylize 50",
    },
    dalle: {
      standard: "quality=standard",
      high: "quality=hd",
      draft: "quality=standard",
    },
  }

  /**
   * Generate a prompt based on shot information and style settings
   * @param shotInfo Shot information
   * @param styleSettings Style settings
   * @param service Image generation service (fal, midjourney, dalle)
   * @returns Optimized prompt for the specified service
   */
  generatePrompt(
    shotInfo: ShotInfo,
    styleSettings: StyleSettings,
    service: "fal" | "midjourney" | "dalle" = "fal",
  ): string {
    // Core shot description
    let prompt = this.extractCoreDescription(shotInfo.shotDescription)

    // Add shot type and camera information
    prompt += `, ${this.shotTypeKeywords[shotInfo.shotType]}`
    prompt += `, ${this.cameraAngleKeywords[shotInfo.cameraAngle]}`

    if (shotInfo.cameraMovement !== "STATIC") {
      prompt += `, ${this.cameraMovementKeywords[shotInfo.cameraMovement]}`
    }

    // Add character information with descriptions if available
    if (shotInfo.characters && shotInfo.characters.length > 0) {
      const characterDescriptions = shotInfo.characters.map((character) => {
        const description = styleSettings.characterDescriptions?.[character]
        return description ? `${character} (${description})` : character
      })
      prompt += `, featuring ${characterDescriptions.join(", ")}`
    }

    // Add location information
    if (shotInfo.location) {
      prompt += `, in ${shotInfo.location}`
    }

    // Add time and weather information
    if (shotInfo.timeOfDay) {
      prompt += `, ${shotInfo.timeOfDay}`
    }

    if (shotInfo.weather) {
      prompt += `, ${shotInfo.weather} weather`
    }

    // Add lighting information
    if (shotInfo.lighting) {
      prompt += `, ${shotInfo.lighting}`
    }

    // Add mood information
    if (shotInfo.mood) {
      prompt += `, ${this.moodKeywords[shotInfo.mood]}`
    }

    // Add key props if available
    if (shotInfo.keyProps && shotInfo.keyProps.length > 0) {
      prompt += `, with ${shotInfo.keyProps.join(", ")}`
    }

    // Add dialogue snippet if available
    if (shotInfo.dialogueSnippet) {
      prompt += `, dialogue: "${shotInfo.dialogueSnippet}"`
    }

    // Add visual style
    prompt += `, ${this.styleTemplates[styleSettings.visualStyle]}`

    // Add artist reference
    if (styleSettings.artistReference) {
      prompt += `, in the style of ${styleSettings.artistReference}`
    }

    // Add color palette
    if (styleSettings.colorPalette) {
      prompt += `, color palette: ${styleSettings.colorPalette}`
    }

    // Add style modifiers
    if (styleSettings.styleModifiers && styleSettings.styleModifiers.length > 0) {
      prompt += `, ${styleSettings.styleModifiers.join(", ")}`
    }

    // Add service-specific parameters
    if (service === "fal") {
      // For FAL.AI, we'll format differently
      return prompt
    } else if (service === "midjourney") {
      // Add aspect ratio and quality parameters for Midjourney
      prompt += ` ${this.aspectRatioParams.midjourney[styleSettings.aspectRatio] || "--ar 16:9"}`
      prompt += ` ${this.qualityParams.midjourney[styleSettings.quality] || "--q 1"}`
    } else if (service === "dalle") {
      // For DALL-E, we'll format differently
      prompt = `${prompt}. ${this.aspectRatioParams.dalle[styleSettings.aspectRatio] || "aspect_ratio=16:9"}, ${this.qualityParams.dalle[styleSettings.quality] || "quality=standard"}`
    }

    return prompt
  }

  /**
   * Generate a negative prompt based on style settings
   * @param styleSettings Style settings
   * @returns Negative prompt for image generation
   */
  generateNegativePrompt(styleSettings: StyleSettings): string {
    // Base negative prompt to avoid common issues
    let negativePrompt =
      "blurry, distorted, low quality, low resolution, cropped, out of frame, deformed, disfigured, watermark, signature, text"

    // Add style-specific negative prompts
    if (styleSettings.visualStyle === "cinematic") {
      negativePrompt += ", cartoon, illustration, painting, drawing, anime, 3d render"
    } else if (styleSettings.visualStyle === "anime") {
      negativePrompt += ", photorealistic, photograph, 3d render, low quality anime, deformed anime characters"
    } else if (styleSettings.visualStyle === "comic") {
      negativePrompt += ", photograph, 3d render, realistic, photorealistic"
    }

    return negativePrompt
  }

  /**
   * Extract core description from shot description
   * @param description Shot description
   * @returns Cleaned and enhanced core description
   */
  private extractCoreDescription(description: string): string {
    // Remove punctuation and clean up the description
    let cleanDescription = description.trim()

    // Remove trailing periods
    if (cleanDescription.endsWith(".")) {
      cleanDescription = cleanDescription.slice(0, -1)
    }

    // Remove any "Shot of" or similar prefixes
    cleanDescription = cleanDescription.replace(/^(Shot of|A shot of|This shot shows|We see|This is a shot of)/i, "")

    // Trim again and return
    return cleanDescription.trim()
  }

  /**
   * Analyze story text to extract scenes and shots
   */
  analyzeStoryText(storyText: string): {
    scenes: Array<{
      title: string
      description: string
      shots: ShotInfo[]
    }>
  } {
    // In a real implementation, this would use NLP or AI to analyze the text
    // For this example, we'll return a simple structure

    // Split the story into paragraphs
    const paragraphs = storyText.split(/\n+/).filter((p) => p.trim().length > 0)

    // Create scenes based on paragraphs (simplified approach)
    const scenes = paragraphs.map((paragraph, index) => {
      const sceneTitle = `Scene ${index + 1}`

      // Create 2-3 shots per scene
      const shotCount = Math.floor(Math.random() * 2) + 2
      const shots: ShotInfo[] = []

      for (let i = 0; i < shotCount; i++) {
        // Determine shot type based on position in scene
        let shotType: ShotType
        if (i === 0) {
          shotType = "ELS" // Establishing shot
        } else if (i === shotCount - 1) {
          shotType = "CU" // Close-up for emotional impact
        } else {
          const shotTypes: ShotType[] = ["MS", "MLS", "LS", "MCU"]
          shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)]
        }

        // Determine camera angle
        const cameraAngles: CameraAngle[] = ["EYE_LEVEL", "LOW_ANGLE", "HIGH_ANGLE"]
        const cameraAngle = cameraAngles[Math.floor(Math.random() * cameraAngles.length)]

        // Determine camera movement
        const cameraMovements: CameraMovement[] = ["STATIC", "PAN", "DOLLY_IN", "ZOOM_IN"]
        const cameraMovement = cameraMovements[Math.floor(Math.random() * cameraMovements.length)]

        // Create shot description (simplified)
        const words = paragraph.split(" ")
        const startIndex = Math.floor((words.length / shotCount) * i)
        const endIndex = Math.min(startIndex + Math.floor(words.length / shotCount), words.length)
        const shotDescription = words.slice(startIndex, endIndex).join(" ")

        shots.push({
          id: `${index + 1}-${i + 1}`,
          sceneId: `scene-${index}`,
          sceneContext: paragraph,
          shotDescription,
          shotType,
          cameraAngle,
          cameraMovement,
          lighting: "natural lighting with soft shadows",
        })
      }

      return {
        title: sceneTitle,
        description: paragraph,
        shots,
      }
    })

    return { scenes }
  }
}
