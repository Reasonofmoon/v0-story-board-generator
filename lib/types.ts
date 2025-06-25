// Visual style options
export type VisualStyle =
  | "cinematic"
  | "anime"
  | "comic"
  | "minimal"
  | "concept"
  | "3d_realistic"
  | "watercolor"
  | "noir"

// Shot types with descriptions for user reference
export const SHOT_TYPES = {
  ECU: "Extreme Close-Up",
  CU: "Close-Up",
  MCU: "Medium Close-Up",
  MS: "Medium Shot",
  MLS: "Medium Long Shot",
  LS: "Long Shot",
  ELS: "Extreme Long Shot",
  OTS: "Over The Shoulder",
  POV: "Point of View",
  AERIAL: "Aerial Shot",
  DUTCH: "Dutch Angle",
  TWO_SHOT: "Two Shot",
} as const

export type ShotType = keyof typeof SHOT_TYPES

// Camera angles
export const CAMERA_ANGLES = {
  EYE_LEVEL: "Eye Level",
  LOW_ANGLE: "Low Angle",
  HIGH_ANGLE: "High Angle",
  BIRD_EYE: "Bird's Eye View",
  WORM_EYE: "Worm's Eye View",
  DUTCH_ANGLE: "Dutch Angle",
} as const

export type CameraAngle = keyof typeof CAMERA_ANGLES

// Camera movements
export const CAMERA_MOVEMENTS = {
  STATIC: "Static",
  PAN: "Pan",
  TILT: "Tilt",
  DOLLY_IN: "Dolly In",
  DOLLY_OUT: "Dolly Out",
  TRACKING: "Tracking",
  ZOOM_IN: "Zoom In",
  ZOOM_OUT: "Zoom Out",
  CRANE: "Crane",
  HANDHELD: "Handheld",
} as const

export type CameraMovement = keyof typeof CAMERA_MOVEMENTS

// Scene moods
export const SCENE_MOODS = {
  HAPPY: "Happy",
  SAD: "Sad",
  TENSE: "Tense",
  MYSTERIOUS: "Mysterious",
  ROMANTIC: "Romantic",
  SCARY: "Scary",
  SERENE: "Serene",
  CHAOTIC: "Chaotic",
} as const

export type SceneMood = keyof typeof SCENE_MOODS

// Aspect ratios
export const ASPECT_RATIOS = {
  "16:9": "16:9 (Widescreen)",
  "4:3": "4:3 (Standard)",
  "2.35:1": "2.35:1 (Cinemascope)",
  "1:1": "1:1 (Square)",
  "9:16": "9:16 (Vertical)",
} as const

export type AspectRatio = keyof typeof ASPECT_RATIOS

// Page sizes
export const PAGE_SIZES = {
  a4: "A4 (210 × 297 mm)",
  letter: "Letter (8.5 × 11 in)",
  legal: "Legal (8.5 × 14 in)",
  tabloid: "Tabloid (11 × 17 in)",
  a3: "A3 (297 × 420 mm)",
  a5: "A5 (148 × 210 mm)",
} as const

export type PageSize = keyof typeof PAGE_SIZES

// Page dimensions in mm
export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
  tabloid: { width: 279.4, height: 431.8 },
  a3: { width: 297, height: 420 },
  a5: { width: 148, height: 210 },
}

// Shot information interface
export interface ShotInfo {
  id: string
  sceneId: string
  sceneContext: string
  shotDescription: string
  shotType: ShotType
  cameraAngle: CameraAngle
  cameraMovement: CameraMovement
  characters?: string[]
  location?: string
  timeOfDay?: string
  weather?: string
  keyProps?: string[]
  mood?: SceneMood
  lighting?: string
  audio?: string
  notes?: string
  specialNotes?: string
  prompt?: string
  imageUrl?: string
  dialogueSnippet?: string
  order?: number // For explicit ordering
  // Print layout properties
  printPosition?: { x: number; y: number }
  printScale?: number
}

// Scene information interface
export interface SceneInfo {
  id: string
  title: string
  description: string
  shots: ShotInfo[]
  order?: number // For explicit ordering
  // Print layout properties
  printPageBreakBefore?: boolean
}

// Style settings interface
export interface StyleSettings {
  visualStyle: VisualStyle
  aspectRatio: AspectRatio
  quality: "standard" | "high" | "draft"
  styleModifiers?: string[]
  artistReference?: string
  colorPalette?: string
  characterDescriptions?: Record<string, string>
}

// Storyboard data interface
export interface StoryboardData {
  id: string
  title: string
  author?: string
  director?: string
  date: string
  version: string
  style: VisualStyle
  aspectRatio: AspectRatio
  scenes: SceneInfo[]
  templateStyle?: TemplateStyle
  annotations: Annotation[]
}

// Version control interface
export interface StoryboardVersion {
  id: string
  name: string
  description?: string
  timestamp: string
  storyboardData: StoryboardData
  storyInput: string
  styleSettings: StyleSettings
}

// Print settings interface
export interface PrintSettings {
  pageSize: PageSize
  orientation: "portrait" | "landscape"
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  scale: number
  shotsPerPage: number
  includeNotes: boolean
  includePrompts: boolean
  includeMetadata: boolean
  headerFooter: boolean
  pageNumbers: boolean
  imageQuality: "draft" | "standard" | "high"
  layout: "grid" | "list" | "detailed"
  customLayout: boolean
}

// Gemini Pro API response structure
export interface GeminiProSceneAnalysis {
  title: string
  scenes: Array<{
    title: string
    description: string
    shots: Array<{
      shotType: ShotType
      description: string
      cameraAngle: CameraAngle
      cameraMovement: CameraMovement
      characters?: string[]
      location?: string
      timeOfDay?: string
      weather?: string
      lighting?: string
      mood?: SceneMood
      audio?: string
      notes?: string
      dialogueSnippet?: string
    }>
  }>
}

// FAL.AI image generation options
export interface FalImageGenerationOptions {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  modelId?: string
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
  printSettings?: PrintSettings
  pdfSettings?: {
    pageSize: PageSize
    orientation: "portrait" | "landscape"
    margin: number
    imagePlaceholderSize: number
  }
  htmlSettings?: {
    responsive: boolean
    darkMode: boolean
    embedCss: boolean
    imageSize: "small" | "medium" | "large"
  }
}

// Generic image generation options
export interface ImageGenerationOptions {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  seed?: number
}

// Drag and drop interfaces
export interface DragItem {
  type: "SCENE" | "SHOT"
  id: string
  sceneId?: string
  index: number
}

export interface DropResult {
  dropEffect: string
  type: "SCENE" | "SHOT"
  id: string
  sceneId?: string
  targetIndex: number
  targetSceneId?: string
}

// Print preview page interface
export interface PrintPreviewPage {
  pageNumber: number
  shots: Array<{
    shotId: string
    sceneId: string
    position: { x: number; y: number }
    scale: number
  }>
  sceneHeader?: {
    sceneId: string
    position: { x: number; y: number }
  }
}

// Line styles for template customization
export const LINE_STYLES = {
  solid: "Solid",
  dashed: "Dashed",
  dotted: "Dotted",
  double: "Double",
  groove: "Groove",
  ridge: "Ridge",
} as const

export type LineStyle = keyof typeof LINE_STYLES

// Line thickness options
export const LINE_THICKNESSES = {
  thin: "Thin",
  medium: "Medium",
  thick: "Thick",
  extraThick: "Extra Thick",
} as const

export type LineThickness = keyof typeof LINE_THICKNESSES

// Font styles
export const FONT_FAMILIES = {
  sans: "Sans-serif",
  serif: "Serif",
  mono: "Monospace",
  display: "Display",
  handwriting: "Handwriting",
} as const

export type FontFamily = keyof typeof FONT_FAMILIES

// Font weights
export const FONT_WEIGHTS = {
  normal: "Normal",
  medium: "Medium",
  semibold: "Semibold",
  bold: "Bold",
} as const

export type FontWeight = keyof typeof FONT_WEIGHTS

// Professional color palette
export interface ColorPalette {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    lines: string
  }
}

// Annotation types
export type AnnotationType = "freehand" | "text" | "sticky" | "shape"

// Annotation interface
export interface Annotation {
  id: string
  type: AnnotationType
  shotId?: string
  sceneId?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation?: number
  color: string
  content?: string // For text and sticky notes
  fontSize?: number // For text
  fontFamily?: FontFamily // For text
  fontWeight?: FontWeight // For text
  lineWidth?: number // For freehand and shapes
  lineStyle?: LineStyle // For shapes
  points?: Array<{ x: number; y: number }> // For freehand
  shape?: "rectangle" | "circle" | "arrow" | "line" // For shapes
  zIndex: number
  createdAt: string
  updatedAt: string
}

// Template style interface
export interface TemplateStyle {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string

  // Background
  backgroundColor: string
  backgroundPattern?: string

  // Text styles
  headerFontFamily: FontFamily
  headerFontWeight: FontWeight
  headerFontSize: number
  headerColor: string

  bodyFontFamily: FontFamily
  bodyFontWeight: FontWeight
  bodyFontSize: number
  bodyColor: string

  // Border styles
  borderStyle: LineStyle
  borderThickness: LineThickness
  borderColor: string

  // Shot frame styles
  shotFrameStyle: LineStyle
  shotFrameThickness: LineThickness
  shotFrameColor: string

  // Scene separator styles
  sceneSeparatorStyle: LineStyle
  sceneSeparatorThickness: LineThickness
  sceneSeparatorColor: string

  // Spacing
  shotSpacing: number
  sceneSpacing: number

  // Other
  cornerRadius: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number

  // Color scheme
  colorPalette: ColorPalette
}

// Update StoryboardData to include template style and annotations
// Annotation interface
export interface Annotation {
  id: string
  type: "text" | "sticky" | "freehand" | "shape"
  content: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  color?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  sceneId?: string
  shotId?: string
  createdAt: string
  updatedAt: string
}
