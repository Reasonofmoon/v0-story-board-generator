"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import type {
  StoryboardData,
  SceneInfo,
  ShotInfo,
  StyleSettings,
  ExportOptions,
  StoryboardVersion,
  TemplateStyle,
  Annotation,
} from "@/lib/types"

type StoryboardContextType = {
  // Story input
  storyInput: string
  setStoryInput: (text: string) => void

  // Storyboard data
  storyboardData: StoryboardData | null
  setStoryboardData: (data: StoryboardData | null) => void

  // Generation state
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  generationProgress: number
  setGenerationProgress: (progress: number) => void

  // Style settings
  styleSettings: StyleSettings
  setStyleSettings: (settings: StyleSettings) => void
  updateStyleSetting: <K extends keyof StyleSettings>(key: K, value: StyleSettings[K]) => void

  // Character management
  characters: string[]
  setCharacters: (characters: string[]) => void
  characterDescriptions: Record<string, string>
  setCharacterDescriptions: (descriptions: Record<string, string>) => void

  // Export options
  exportOptions: ExportOptions
  setExportOptions: (options: ExportOptions) => void
  updateExportOption: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void

  // Gemini Pro settings
  useGeminiPro: boolean
  setUseGeminiPro: (use: boolean) => void

  // Shot and scene management
  updateShot: (sceneId: string, shotId: string, updates: Partial<ShotInfo>) => void
  addShot: (sceneId: string, shot: Partial<ShotInfo>) => void
  removeShot: (sceneId: string, shotId: string) => void
  updateScene: (sceneId: string, updates: Partial<SceneInfo>) => void
  addScene: (scene: Partial<SceneInfo>) => void
  removeScene: (sceneId: string) => void
  reorderShots: (sceneId: string, shotIds: string[]) => void
  reorderScenes: (sceneIds: string[]) => void
  duplicateShot: (sceneId: string, shotId: string) => void
  duplicateScene: (sceneId: string) => void
  moveShot: (sourceSceneId: string, shotId: string, targetSceneId: string, targetIndex?: number) => void

  // Project management
  saveProject: () => void
  loadProject: (id: string) => Promise<void>
  createNewProject: () => void
  projectSaved: boolean
  setProjectSaved: (saved: boolean) => void

  // Version control
  versionHistory: StoryboardVersion[]
  currentVersionIndex: number
  saveVersion: (name: string, description?: string) => void
  loadVersion: (versionIndex: number) => void
  deleteVersion: (versionIndex: number) => void

  // Regeneration
  regenerateStoryboard: (options?: { keepScenes?: boolean }) => Promise<void>
  regenerateShot: (sceneId: string, shotId: string) => Promise<void>

  // Template style management
  savedTemplateStyles: TemplateStyle[]
  updateTemplateStyle: (templateStyle: TemplateStyle) => void
  saveTemplateStyle: (templateStyle: TemplateStyle) => void
  loadTemplateStyle: (templateId: string) => void
  deleteTemplateStyle: (templateId: string) => void

  // Annotation management
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (annotationId: string, updates: Partial<Annotation>) => void
  deleteAnnotation: (annotationId: string) => void
  clearAnnotations: (sceneId?: string, shotId?: string) => void
}

const defaultStyleSettings: StyleSettings = {
  visualStyle: "cinematic",
  aspectRatio: "16:9",
  quality: "standard",
  styleModifiers: [],
  characterDescriptions: {},
}

const defaultExportOptions: ExportOptions = {
  format: "pdf",
  includeNotes: true,
  includePrompts: true,
  includeMetadata: true,
  highResolution: true,
  includeText: true,
  organizeByScenesInFolders: true,
}

const StoryboardContext = createContext<StoryboardContextType | undefined>(undefined)

export function StoryboardProvider({ children }: { children: ReactNode }) {
  // Story input
  const [storyInput, setStoryInput] = useState("")

  // Storyboard data
  const [storyboardData, setStoryboardDataInternal] = useState<StoryboardData | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Style settings
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(defaultStyleSettings)

  // Character management
  const [characters, setCharacters] = useState<string[]>([])
  const [characterDescriptions, setCharacterDescriptions] = useState<Record<string, string>>({})

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions)

  // Gemini Pro settings
  const [useGeminiPro, setUseGeminiPro] = useState(true)

  // Project management
  const [projectSaved, setProjectSaved] = useState(true)

  // Version control
  const [versionHistory, setVersionHistory] = useState<StoryboardVersion[]>([])
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)

  // Template style management
  const [savedTemplateStyles, setSavedTemplateStyles] = useState<TemplateStyle[]>([])

  // Custom setStoryboardData function that ensures annotations are initialized
  const setStoryboardData = (data: StoryboardData | null) => {
    if (data) {
      // Ensure annotations array is initialized
      if (!data.annotations) {
        data.annotations = []
      }
    }
    setStoryboardDataInternal(data)
  }

  // Update a specific style setting
  const updateStyleSetting = <K extends keyof StyleSettings>(key: K, value: StyleSettings[K]) => {
    setStyleSettings((prev) => ({ ...prev, [key]: value }))
    setProjectSaved(false)
  }

  // Update a specific export option
  const updateExportOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }))
  }

  // Update a shot in a scene
  const updateShot = (sceneId: string, shotId: string, updates: Partial<ShotInfo>) => {
    if (!storyboardData) return

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              shots: scene.shots.map((shot) => (shot.id === shotId ? { ...shot, ...updates } : shot)),
            }
          : scene,
      ),
    })

    setProjectSaved(false)
  }

  // Add a new shot to a scene
  const addShot = (sceneId: string, shot: Partial<ShotInfo>) => {
    if (!storyboardData) return

    const newShot: ShotInfo = {
      id: shot.id || uuidv4(),
      sceneId,
      sceneContext: "",
      shotDescription: shot.shotDescription || "New shot",
      shotType: shot.shotType || "MS",
      cameraAngle: shot.cameraAngle || "EYE_LEVEL",
      cameraMovement: shot.cameraMovement || "STATIC",
      lighting: shot.lighting || "Natural lighting",
      ...shot,
    }

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              shots: [...scene.shots, newShot],
            }
          : scene,
      ),
    })

    setProjectSaved(false)
  }

  // Remove a shot from a scene
  const removeShot = (sceneId: string, shotId: string) => {
    if (!storyboardData) return

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              shots: scene.shots.filter((shot) => shot.id !== shotId),
            }
          : scene,
      ),
    })

    setProjectSaved(false)
  }

  // Update a scene
  const updateScene = (sceneId: string, updates: Partial<SceneInfo>) => {
    if (!storyboardData) return

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...updates } : scene)),
    })

    setProjectSaved(false)
  }

  // Add a new scene
  const addScene = (scene: Partial<SceneInfo>) => {
    if (!storyboardData) return

    const newScene: SceneInfo = {
      id: scene.id || uuidv4(),
      title: scene.title || "New Scene",
      description: scene.description || "",
      shots: scene.shots || [],
    }

    setStoryboardData({
      ...storyboardData,
      scenes: [...storyboardData.scenes, newScene],
    })

    setProjectSaved(false)
  }

  // Remove a scene
  const removeScene = (sceneId: string) => {
    if (!storyboardData) return

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.filter((scene) => scene.id !== sceneId),
    })

    setProjectSaved(false)
  }

  // Reorder shots within a scene
  const reorderShots = (sceneId: string, shotIds: string[]) => {
    if (!storyboardData) return

    const scene = storyboardData.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    // Create a map of shots by ID for quick lookup
    const shotMap = new Map(scene.shots.map((shot) => [shot.id, shot]))

    // Create new ordered array of shots
    const reorderedShots = shotIds.map((id) => {
      const shot = shotMap.get(id)
      if (!shot) throw new Error(`Shot with ID ${id} not found`)
      return shot
    })

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, shots: reorderedShots } : scene,
      ),
    })

    setProjectSaved(false)
  }

  // Reorder scenes
  const reorderScenes = (sceneIds: string[]) => {
    if (!storyboardData) return

    // Create a map of scenes by ID for quick lookup
    const sceneMap = new Map(storyboardData.scenes.map((scene) => [scene.id, scene]))

    // Create new ordered array of scenes
    const reorderedScenes = sceneIds.map((id) => {
      const scene = sceneMap.get(id)
      if (!scene) throw new Error(`Scene with ID ${id} not found`)
      return scene
    })

    setStoryboardData({
      ...storyboardData,
      scenes: reorderedScenes,
    })

    setProjectSaved(false)
  }

  // Duplicate a shot
  const duplicateShot = (sceneId: string, shotId: string) => {
    if (!storyboardData) return

    const scene = storyboardData.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shotToDuplicate = scene.shots.find((s) => s.id === shotId)
    if (!shotToDuplicate) return

    const newShot: ShotInfo = {
      ...shotToDuplicate,
      id: uuidv4(),
      shotDescription: `${shotToDuplicate.shotDescription} (Copy)`,
    }

    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, shots: [...scene.shots, newShot] } : scene,
      ),
    })

    setProjectSaved(false)
  }

  // Duplicate a scene
  const duplicateScene = (sceneId: string) => {
    if (!storyboardData) return

    const sceneToDuplicate = storyboardData.scenes.find((s) => s.id === sceneId)
    if (!sceneToDuplicate) return

    const newSceneId = uuidv4()

    // Duplicate all shots with new IDs and updated sceneId
    const duplicatedShots = sceneToDuplicate.shots.map((shot) => ({
      ...shot,
      id: uuidv4(),
      sceneId: newSceneId,
    }))

    const newScene: SceneInfo = {
      ...sceneToDuplicate,
      id: newSceneId,
      title: `${sceneToDuplicate.title} (Copy)`,
      shots: duplicatedShots,
    }

    setStoryboardData({
      ...storyboardData,
      scenes: [...storyboardData.scenes, newScene],
    })

    setProjectSaved(false)
  }

  // Move a shot from one scene to another
  const moveShot = (sourceSceneId: string, shotId: string, targetSceneId: string, targetIndex?: number) => {
    if (!storyboardData) return

    const sourceScene = storyboardData.scenes.find((s) => s.id === sourceSceneId)
    const targetScene = storyboardData.scenes.find((s) => s.id === targetSceneId)

    if (!sourceScene || !targetScene) return

    const shotToMove = sourceScene.shots.find((s) => s.id === shotId)
    if (!shotToMove) return

    // Create updated shot with new sceneId and context
    const updatedShot: ShotInfo = {
      ...shotToMove,
      sceneId: targetSceneId,
      sceneContext: targetScene.description,
    }

    // Remove shot from source scene
    const updatedSourceScene = {
      ...sourceScene,
      shots: sourceScene.shots.filter((s) => s.id !== shotId),
    }

    // Add shot to target scene at specified index or end
    let updatedTargetShots: ShotInfo[]
    if (targetIndex !== undefined) {
      updatedTargetShots = [...targetScene.shots]
      updatedTargetShots.splice(targetIndex, 0, updatedShot)
    } else {
      updatedTargetShots = [...targetScene.shots, updatedShot]
    }

    const updatedTargetScene = {
      ...targetScene,
      shots: updatedTargetShots,
    }

    // Update storyboard data
    setStoryboardData({
      ...storyboardData,
      scenes: storyboardData.scenes.map((scene) => {
        if (scene.id === sourceSceneId) return updatedSourceScene
        if (scene.id === targetSceneId) return updatedTargetScene
        return scene
      }),
    })

    setProjectSaved(false)
  }

  // Save the current project
  const saveProject = () => {
    if (!storyboardData) return

    // In a real implementation, this would save to a database or file
    localStorage.setItem(
      `storyboard-${storyboardData.id}`,
      JSON.stringify({
        storyboardData,
        storyInput,
        styleSettings,
        characters,
        characterDescriptions,
        versionHistory,
        currentVersionIndex,
        savedTemplateStyles,
      }),
    )

    setProjectSaved(true)
  }

  // Load a project
  const loadProject = async (id: string) => {
    // In a real implementation, this would load from a database or file
    const savedProject = localStorage.getItem(`storyboard-${id}`)

    if (savedProject) {
      try {
        const {
          storyboardData,
          storyInput,
          styleSettings,
          characters,
          characterDescriptions,
          versionHistory = [],
          currentVersionIndex = 0,
          savedTemplateStyles = [],
        } = JSON.parse(savedProject)

        // Ensure annotations are initialized
        if (storyboardData && !storyboardData.annotations) {
          storyboardData.annotations = []
        }

        setStoryboardData(storyboardData)
        setStoryInput(storyInput)
        setStyleSettings(styleSettings)
        setCharacters(characters)
        setCharacterDescriptions(characterDescriptions)
        setVersionHistory(versionHistory)
        setCurrentVersionIndex(currentVersionIndex)
        setSavedTemplateStyles(savedTemplateStyles)
        setProjectSaved(true)
      } catch (error) {
        console.error("Error loading project:", error)
      }
    }
  }

  // Create a new project
  const createNewProject = () => {
    setStoryboardData(null)
    setStoryInput("")
    setStyleSettings(defaultStyleSettings)
    setCharacters([])
    setCharacterDescriptions({})
    setVersionHistory([])
    setCurrentVersionIndex(0)
    setSavedTemplateStyles([])
    setProjectSaved(true)
  }

  // Save a version of the storyboard
  const saveVersion = (name: string, description?: string) => {
    if (!storyboardData) return

    const newVersion: StoryboardVersion = {
      id: uuidv4(),
      name,
      description,
      timestamp: new Date().toISOString(),
      storyboardData: JSON.parse(JSON.stringify(storyboardData)),
      storyInput,
      styleSettings: JSON.parse(JSON.stringify(styleSettings)),
    }

    // Add new version to history
    const updatedHistory = [...versionHistory, newVersion]
    setVersionHistory(updatedHistory)
    setCurrentVersionIndex(updatedHistory.length - 1)
    setProjectSaved(false)
  }

  // Load a specific version
  const loadVersion = (versionIndex: number) => {
    if (versionIndex < 0 || versionIndex >= versionHistory.length) return

    const version = versionHistory[versionIndex]

    // Ensure annotations are initialized
    const versionData = JSON.parse(JSON.stringify(version.storyboardData))
    if (!versionData.annotations) {
      versionData.annotations = []
    }

    setStoryboardData(versionData)
    setStoryInput(version.storyInput)
    setStyleSettings(JSON.parse(JSON.stringify(version.styleSettings)))
    setCurrentVersionIndex(versionIndex)
    setProjectSaved(false)
  }

  // Delete a version
  const deleteVersion = (versionIndex: number) => {
    if (versionIndex < 0 || versionIndex >= versionHistory.length) return

    const updatedHistory = versionHistory.filter((_, index) => index !== versionIndex)
    setVersionHistory(updatedHistory)

    // Adjust current version index if needed
    if (currentVersionIndex >= versionIndex) {
      setCurrentVersionIndex(Math.max(0, currentVersionIndex - 1))
    }

    setProjectSaved(false)
  }

  // Regenerate the entire storyboard
  const regenerateStoryboard = async (options?: { keepScenes?: boolean }) => {
    if (!storyInput.trim()) return

    setIsGenerating(true)
    setCurrentStep(0)
    setGenerationProgress(0)

    try {
      // Import dynamically to avoid circular dependencies
      const { generateStoryboard } = await import("@/lib/storyboard-generator")

      // Generate the storyboard
      const storyboard = await generateStoryboard(storyInput, styleSettings, useGeminiPro, (step, progress) => {
        setCurrentStep(step)
        setGenerationProgress(progress)
      })

      // Ensure annotations are initialized
      if (!storyboard.annotations) {
        storyboard.annotations = []
      }

      // If keepScenes is true, preserve the existing scenes structure but update other metadata
      if (options?.keepScenes && storyboardData) {
        setStoryboardData({
          ...storyboard,
          scenes: storyboardData.scenes,
          annotations: storyboardData.annotations || [],
        })
      } else {
        setStoryboardData(storyboard)
      }

      // Save this as a new version
      const versionName = `Regenerated ${new Date().toLocaleString()}`
      saveVersion(versionName, "Automatically saved after regeneration")

      setIsGenerating(false)
      return storyboard
    } catch (error) {
      console.error("Error regenerating storyboard:", error)
      setIsGenerating(false)
      throw error
    }
  }

  // Regenerate a specific shot
  const regenerateShot = async (sceneId: string, shotId: string) => {
    if (!storyboardData) return

    const scene = storyboardData.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shot = scene.shots.find((s) => s.id === shotId)
    if (!shot) return

    try {
      // Import dynamically to avoid circular dependencies
      const { AIPromptEngine } = await import("@/lib/ai-prompt-engine")
      const { FalImageService } = await import("@/lib/fal-image-service")

      const promptEngine = new AIPromptEngine()
      const imageService = new FalImageService()

      // Generate a new prompt
      const prompt = promptEngine.generatePrompt(shot, styleSettings, "fal")

      // Generate a new image
      const imageUrl = await imageService.generateImage({
        prompt,
        negativePrompt: promptEngine.generateNegativePrompt(styleSettings),
        width: getWidthForAspectRatio(styleSettings.aspectRatio),
        height: getHeightForAspectRatio(styleSettings.aspectRatio),
        steps: getStepsForQuality(styleSettings.quality),
      })

      // Update the shot
      updateShot(sceneId, shotId, {
        prompt,
        imageUrl,
      })

      return { prompt, imageUrl }
    } catch (error) {
      console.error("Error regenerating shot:", error)
      throw error
    }
  }

  // Template style management
  // Update template style
  const updateTemplateStyle = (templateStyle: TemplateStyle) => {
    if (!storyboardData) return

    setStoryboardData({
      ...storyboardData,
      templateStyle,
    })

    setProjectSaved(false)
  }

  // Save template style
  const saveTemplateStyle = (templateStyle: TemplateStyle) => {
    setSavedTemplateStyles([...savedTemplateStyles, templateStyle])
    setProjectSaved(false)
  }

  // Load template style
  const loadTemplateStyle = (templateId: string) => {
    const template = savedTemplateStyles.find((t) => t.id === templateId)
    if (!template || !storyboardData) return

    setStoryboardData({
      ...storyboardData,
      templateStyle: template,
    })

    setProjectSaved(false)
  }

  // Delete template style
  const deleteTemplateStyle = (templateId: string) => {
    setSavedTemplateStyles(savedTemplateStyles.filter((t) => t.id !== templateId))
    setProjectSaved(false)
  }

  // Annotation management
  // Add annotation
  const addAnnotation = (annotation: Annotation) => {
    if (!storyboardData) return

    if (!storyboardData.annotations) {
      setStoryboardData({
        ...storyboardData,
        annotations: [annotation],
      })
    } else {
      setStoryboardData({
        ...storyboardData,
        annotations: [...storyboardData.annotations, annotation],
      })
    }

    setProjectSaved(false)
  }

  // Update annotation
  const updateAnnotation = (annotationId: string, updates: Partial<Annotation>) => {
    if (!storyboardData || !storyboardData.annotations) return

    setStoryboardData({
      ...storyboardData,
      annotations: storyboardData.annotations.map((a) =>
        a.id === annotationId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
      ),
    })

    setProjectSaved(false)
  }

  // Delete annotation
  const deleteAnnotation = (annotationId: string) => {
    if (!storyboardData || !storyboardData.annotations) return

    setStoryboardData({
      ...storyboardData,
      annotations: storyboardData.annotations.filter((a) => a.id !== annotationId),
    })

    setProjectSaved(false)
  }

  // Clear annotations
  const clearAnnotations = (sceneId?: string, shotId?: string) => {
    if (!storyboardData || !storyboardData.annotations) return

    if (shotId) {
      // Clear annotations for a specific shot
      setStoryboardData({
        ...storyboardData,
        annotations: storyboardData.annotations.filter((a) => a.shotId !== shotId),
      })
    } else if (sceneId) {
      // Clear annotations for a specific scene
      setStoryboardData({
        ...storyboardData,
        annotations: storyboardData.annotations.filter((a) => a.sceneId !== sceneId),
      })
    } else {
      // Clear all annotations
      setStoryboardData({
        ...storyboardData,
        annotations: [],
      })
    }

    setProjectSaved(false)
  }

  // Helper functions for image generation
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

  // Update character descriptions when characters change
  useEffect(() => {
    // Add new characters to descriptions
    const newDescriptions = { ...characterDescriptions }

    characters.forEach((character) => {
      if (!newDescriptions[character]) {
        newDescriptions[character] = ""
      }
    })

    // Remove descriptions for characters that no longer exist
    Object.keys(newDescriptions).forEach((character) => {
      if (!characters.includes(character)) {
        delete newDescriptions[character]
      }
    })

    setCharacterDescriptions(newDescriptions)

    // Update style settings with character descriptions
    setStyleSettings((prev) => ({
      ...prev,
      characterDescriptions: newDescriptions,
    }))
  }, [characters])

  return (
    <StoryboardContext.Provider
      value={{
        storyInput,
        setStoryInput,
        storyboardData,
        setStoryboardData,
        isGenerating,
        setIsGenerating,
        currentStep,
        setCurrentStep,
        generationProgress,
        setGenerationProgress,
        styleSettings,
        setStyleSettings,
        updateStyleSetting,
        characters,
        setCharacters,
        characterDescriptions,
        setCharacterDescriptions,
        exportOptions,
        setExportOptions,
        updateExportOption,
        useGeminiPro,
        setUseGeminiPro,
        updateShot,
        addShot,
        removeShot,
        updateScene,
        addScene,
        removeScene,
        reorderShots,
        reorderScenes,
        duplicateShot,
        duplicateScene,
        moveShot,
        saveProject,
        loadProject,
        createNewProject,
        projectSaved,
        setProjectSaved,
        versionHistory,
        currentVersionIndex,
        saveVersion,
        loadVersion,
        deleteVersion,
        regenerateStoryboard,
        regenerateShot,
        savedTemplateStyles,
        updateTemplateStyle,
        saveTemplateStyle,
        loadTemplateStyle,
        deleteTemplateStyle,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        clearAnnotations,
      }}
    >
      {children}
    </StoryboardContext.Provider>
  )
}

export function useStoryboard() {
  const context = useContext(StoryboardContext)
  if (context === undefined) {
    throw new Error("useStoryboard must be used within a StoryboardProvider")
  }
  return context
}
