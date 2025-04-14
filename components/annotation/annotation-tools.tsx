"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Pencil,
  Type,
  StickyNote,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Trash,
  Eraser,
  Move,
  Save,
  Undo,
  Redo,
} from "lucide-react"
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  type Annotation,
  type AnnotationType,
  type FontFamily,
  type FontWeight,
} from "@/lib/types"

interface AnnotationToolsProps {
  activeSceneId?: string
  activeShotId?: string
  onClose: () => void
}

export default function AnnotationTools({ activeSceneId, activeShotId, onClose }: AnnotationToolsProps) {
  const { storyboardData, addAnnotation, updateAnnotation, deleteAnnotation, clearAnnotations } = useStoryboard()

  const [activeTab, setActiveTab] = useState<AnnotationType>("freehand")
  const [activeTool, setActiveTool] = useState<"draw" | "erase" | "move">("draw")
  const [color, setColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(2)
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState<FontFamily>("sans")
  const [fontWeight, setFontWeight] = useState<FontWeight>("normal")
  const [textContent, setTextContent] = useState("")
  const [stickyContent, setStickyContent] = useState("")
  const [stickyColor, setStickyColor] = useState("#FFEB3B")
  const [shape, setShape] = useState<"rectangle" | "circle" | "arrow" | "line">("rectangle")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)

  // Drawing history for undo/redo
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Initialize canvas
  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set canvas size to match container
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Save initial state
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory([initialState])
    setHistoryIndex(0)
  }

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    isDrawing.current = true

    const rect = canvas.getBoundingClientRect()
    lastX.current = e.clientX - rect.left
    lastY.current = e.clientY - rect.top

    // For shapes, we'll just record the starting position
    if (activeTab === "shape") {
      return
    }

    // For freehand drawing
    if (activeTab === "freehand") {
      ctx.beginPath()
      ctx.moveTo(lastX.current, lastY.current)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
    }
  }

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (activeTab === "freehand") {
      if (activeTool === "draw") {
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (activeTool === "erase") {
        ctx.globalCompositeOperation = "destination-out"
        ctx.beginPath()
        ctx.arc(x, y, lineWidth * 2, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.globalCompositeOperation = "source-over"
      }
    }

    lastX.current = x
    lastY.current = y
  }

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    isDrawing.current = false

    if (activeTab === "shape") {
      drawShape(ctx, lastX.current, lastY.current, canvas.width, canvas.height)
    }

    // Save current state to history
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // If we're not at the end of the history, truncate it
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1))
    }

    setHistory([...history, currentState])
    setHistoryIndex(historyIndex + 1)
  }

  // Draw shape
  const drawShape = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()

    switch (shape) {
      case "rectangle":
        ctx.rect(startX, startY, endX - startX, endY - startY)
        break
      case "circle":
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
        ctx.arc(startX, startY, radius, 0, Math.PI * 2)
        break
      case "arrow":
        // Draw line
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)

        // Calculate arrow head
        const angle = Math.atan2(endY - startY, endX - startX)
        const headLength = 15

        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6))
        break
      case "line":
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        break
    }

    ctx.stroke()
  }

  // Add text annotation
  const addTextAnnotation = () => {
    if (!textContent.trim()) return

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: "text",
      shotId: activeShotId,
      sceneId: activeSceneId,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      color,
      content: textContent,
      fontSize,
      fontFamily,
      fontWeight,
      zIndex: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAnnotation(newAnnotation)
    setTextContent("")
  }

  // Add sticky note annotation
  const addStickyNote = () => {
    if (!stickyContent.trim()) return

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: "sticky",
      shotId: activeShotId,
      sceneId: activeSceneId,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 200 },
      color: stickyColor,
      content: stickyContent,
      fontSize: 14,
      fontFamily: "sans",
      fontWeight: "normal",
      zIndex: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAnnotation(newAnnotation)
    setStickyContent("")
  }

  // Save freehand drawing
  const saveFreehandDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get the image data URL
    const imageData = canvas.toDataURL("image/png")

    // Create a new annotation
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: "freehand",
      shotId: activeShotId,
      sceneId: activeSceneId,
      position: { x: 0, y: 0 },
      size: { width: canvas.width, height: canvas.height },
      color,
      content: imageData,
      lineWidth,
      zIndex: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAnnotation(newAnnotation)

    // Clear canvas
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Reset history
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setHistory([initialState])
      setHistoryIndex(0)
    }
  }

  // Undo
  const undo = () => {
    if (historyIndex <= 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const newIndex = historyIndex - 1
    ctx.putImageData(history[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  // Redo
  const redo = () => {
    if (historyIndex >= history.length - 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const newIndex = historyIndex + 1
    ctx.putImageData(history[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Reset history
    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory([initialState])
    setHistoryIndex(0)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Annotation Tools</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AnnotationType)} className="w-full">
          <div className="p-4 border-b">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="freehand">
                <Pencil className="h-4 w-4 mr-2" />
                Freehand
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="sticky">
                <StickyNote className="h-4 w-4 mr-2" />
                Sticky Note
              </TabsTrigger>
              <TabsTrigger value="shape">
                <Square className="h-4 w-4 mr-2" />
                Shapes
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="freehand" className="space-y-6">
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={activeTool === "draw" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool("draw")}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Draw
                </Button>
                <Button
                  variant={activeTool === "erase" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool("erase")}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Erase
                </Button>
                <Button
                  variant={activeTool === "move" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool("move")}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Move
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pen-color">Pen Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => document.getElementById("pen-color-input")?.click()}
                    />
                    <Input id="pen-color" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                    <input
                      id="pen-color-input"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pen-size">Pen Size</Label>
                    <span className="text-sm text-gray-500">{lineWidth}px</span>
                  </div>
                  <Slider
                    id="pen-size"
                    min={1}
                    max={20}
                    step={1}
                    value={[lineWidth]}
                    onValueChange={(value) => setLineWidth(value[0])}
                  />
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Trash className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="default" size="sm" onClick={saveFreehandDrawing}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Drawing
                </Button>
              </div>

              <div
                className="border rounded-md bg-white overflow-hidden"
                style={{ height: "400px" }}
                onMouseDown={() => initCanvas()}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-content">Text Content</Label>
                  <Input
                    id="text-content"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter text annotation..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-font-family">Font Family</Label>
                    <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as FontFamily)}>
                      <SelectTrigger id="text-font-family">
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FONT_FAMILIES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-font-weight">Font Weight</Label>
                    <Select value={fontWeight} onValueChange={(value) => setFontWeight(value as FontWeight)}>
                      <SelectTrigger id="text-font-weight">
                        <SelectValue placeholder="Select font weight" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FONT_WEIGHTS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="text-font-size">Font Size</Label>
                    <span className="text-sm text-gray-500">{fontSize}px</span>
                  </div>
                  <Slider
                    id="text-font-size"
                    min={10}
                    max={48}
                    step={1}
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => document.getElementById("text-color-input")?.click()}
                    />
                    <Input
                      id="text-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      id="text-color-input"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-2">Preview</h3>
                <div className="p-4 bg-white rounded border">
                  <p
                    style={{
                      fontFamily: getFontFamilyValue(fontFamily),
                      fontWeight: getFontWeightValue(fontWeight),
                      fontSize: `${fontSize}px`,
                      color: color,
                    }}
                  >
                    {textContent || "Text annotation preview"}
                  </p>
                </div>
              </div>

              <Button onClick={addTextAnnotation} disabled={!textContent.trim()}>
                Add Text Annotation
              </Button>
            </TabsContent>

            <TabsContent value="sticky" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sticky-content">Note Content</Label>
                  <Input
                    id="sticky-content"
                    value={stickyContent}
                    onChange={(e) => setStickyContent(e.target.value)}
                    placeholder="Enter sticky note content..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sticky-color">Note Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: stickyColor }}
                      onClick={() => document.getElementById("sticky-color-input")?.click()}
                    />
                    <Input
                      id="sticky-color"
                      value={stickyColor}
                      onChange={(e) => setStickyColor(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      id="sticky-color-input"
                      type="color"
                      value={stickyColor}
                      onChange={(e) => setStickyColor(e.target.value)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    "#FFEB3B",
                    "#FFC107",
                    "#FF9800",
                    "#FF5722",
                    "#E91E63",
                    "#9C27B0",
                    "#673AB7",
                    "#3F51B5",
                    "#2196F3",
                    "#03A9F4",
                    "#00BCD4",
                    "#009688",
                    "#4CAF50",
                    "#8BC34A",
                    "#CDDC39",
                    "#FFFFFF",
                  ].map((colorOption) => (
                    <div
                      key={colorOption}
                      className={`w-full aspect-square rounded-md cursor-pointer border ${stickyColor === colorOption ? "ring-2 ring-primary" : ""}`}
                      style={{ backgroundColor: colorOption }}
                      onClick={() => setStickyColor(colorOption)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Preview</h3>
                <div
                  className="p-4 rounded shadow-md"
                  style={{
                    backgroundColor: stickyColor,
                    width: "200px",
                    minHeight: "200px",
                    transform: "rotate(-2deg)",
                  }}
                >
                  <p style={{ color: getContrastColor(stickyColor) }}>{stickyContent || "Sticky note preview"}</p>
                </div>
              </div>

              <Button onClick={addStickyNote} disabled={!stickyContent.trim()}>
                Add Sticky Note
              </Button>
            </TabsContent>

            <TabsContent value="shape" className="space-y-6">
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={shape === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShape("rectangle")}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Rectangle
                </Button>
                <Button
                  variant={shape === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShape("circle")}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Circle
                </Button>
                <Button variant={shape === "arrow" ? "default" : "outline"} size="sm" onClick={() => setShape("arrow")}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Arrow
                </Button>
                <Button variant={shape === "line" ? "default" : "outline"} size="sm" onClick={() => setShape("line")}>
                  <Minus className="h-4 w-4 mr-2" />
                  Line
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shape-color">Shape Color</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-10 h-10 rounded-md border cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => document.getElementById("shape-color-input")?.click()}
                    />
                    <Input
                      id="shape-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      id="shape-color-input"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="shape-line-width">Line Width</Label>
                    <span className="text-sm text-gray-500">{lineWidth}px</span>
                  </div>
                  <Slider
                    id="shape-line-width"
                    min={1}
                    max={10}
                    step={1}
                    value={[lineWidth]}
                    onValueChange={(value) => setLineWidth(value[0])}
                  />
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo className="h-4 w-4 mr-2" />
                  Redo
                </Button>
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Trash className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="default" size="sm" onClick={saveFreehandDrawing}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Shape
                </Button>
              </div>

              <div
                className="border rounded-md bg-white overflow-hidden"
                style={{ height: "400px" }}
                onMouseDown={() => initCanvas()}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Helper function to get contrasting text color for a background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}

// Helper functions to convert enum values to CSS values
function getFontFamilyValue(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case "sans":
      return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    case "serif":
      return "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    case "display":
      return "'Playfair Display', Georgia, serif"
    case "handwriting":
      return "'Caveat', cursive"
    default:
      return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  }
}

function getFontWeightValue(fontWeight: FontWeight): string {
  switch (fontWeight) {
    case "normal":
      return "400"
    case "medium":
      return "500"
    case "semibold":
      return "600"
    case "bold":
      return "700"
    default:
      return "400"
  }
}
