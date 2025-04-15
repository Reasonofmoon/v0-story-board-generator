export type VisualStyle = 'cinematic' | 'anime' | 'comic' | 'cartoon' | 'photographic' | 'sketch' | 'abstract'

export type AspectRatio = '16:9' | '4:3' | '1:1' | '2.35:1' | '9:16'

export type Quality = 'draft' | 'standard' | 'high'

// Storyboard data types
export interface Annotation {
  id: string
  sceneId?: string
  shotId?: string
  text: string
  x: number
  y: number
  createdAt: string
  updatedAt: string
}

export interface ShotInfo {
  id: string
  sceneId: string
  sceneContext?: string
  shotDescription: string
  shotType?: string
  cameraAngle?: string
  cameraMovement?: string
  lighting?: string
  audio?: string
  notes?: string
  specialNotes?: string
  dialogueSnippet?: string
  order?: number // For explicit ordering
  // Print layout properties
  printWidth?: number
  printHeight?: number
}

export interface SceneInfo {
  id: string
  title: string
  description: string
  shots: ShotInfo[]
}

export interface TemplateStyle {
  id: string
  name: string
  description: string
  styleSettings: StyleSettings
}

export interface StoryboardVersion {
  id: string
  name: string
  description?: string
  timestamp: string
  storyboardData: StoryboardData
  storyInput: string
  styleSettings: StyleSettings
}

export interface StyleSettings {
  visualStyle: VisualStyle
  aspectRatio: AspectRatio
  quality: Quality
  styleModifiers: string[]
  characterDescriptions: Record<string, string>
}

export interface StoryboardData {
  id: string
  title: string
  author?: string
  date: string
  version: string
  style: VisualStyle
  scenes: SceneInfo[]
  templateStyle?: TemplateStyle
  annotations: Annotation[]
  // sceneOrder: string[] // For explicit ordering
}

export interface ProjectInfo {
  id: string
  name: string
  updatedAt: string
  createdAt: string
}

export type ProjectList = {
  projects: ProjectInfo[]
}

// Export options
export interface ExportOptions {
  format: "pdf" | "images" | "video" | "html"
  includeNotes: boolean
  includePrompts: boolean
  includeMetadata: boolean
  highResolution: boolean
  includeText: boolean
  organizeByScenesInFolders: boolean
}

// Generic character interface
export interface Character {
  id: string
  name: string
  description: string
  imageUrl?: string
  // Any other properties
}

// Character management interface
export interface CharacterManager {
  characters: Character[]
  addCharacter: (character: Character) => void
  updateCharacter: (character: Character) => void
  removeCharacter: (id: string) => void
}

// Drag and drop interfaces
export interface DragItem {
  id: string
  type: "scene" | "shot"
  index?: number
  sceneId?: string
}
