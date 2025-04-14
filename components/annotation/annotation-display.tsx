"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Trash, Move, Lock, Unlock } from "lucide-react"
import type { Annotation } from "@/lib/types"

interface AnnotationDisplayProps {
  sceneId?: string
  shotId?: string
  containerRef: React.RefObject<HTMLDivElement>
}

export default function AnnotationDisplay({ sceneId, shotId, containerRef }: AnnotationDisplayProps) {
  const { storyboardData, updateAnnotation, deleteAnnotation } = useStoryboard()

  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [lockedAnnotations, setLockedAnnotations] = useState<Record<string, boolean>>({})

  const startPos = useRef({ x: 0, y: 0 })
  const annotationPos = useRef({ x: 0, y: 0 })
  const annotationSize = useRef({ width: 0, height: 0 })

  // Filter annotations for this scene/shot
  // Ensure we're safely handling the case where annotations might be undefined
  const annotations = storyboardData?.annotations
    ? storyboardData.annotations.filter((annotation) => {
        if (shotId && annotation.shotId === shotId) return true
        if (!shotId && sceneId && annotation.sceneId === sceneId) return true
        return false
      })
    : []

  // Sort annotations by z-index
  const sortedAnnotations = [...annotations].sort((a, b) => a.zIndex - b.zIndex)

  // Start moving annotation
  const startMoving = (e: React.MouseEvent, annotation: Annotation) => {
    if (lockedAnnotations[annotation.id]) return

    e.stopPropagation()
    setSelectedAnnotation(annotation.id)
    setIsMoving(true)

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    startPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    annotationPos.current = {
      x: annotation.position.x,
      y: annotation.position.y,
    }
  }

  // Start resizing annotation
  const startResizing = (e: React.MouseEvent, annotation: Annotation, direction: string) => {
    if (lockedAnnotations[annotation.id]) return

    e.stopPropagation()
    setSelectedAnnotation(annotation.id)
    setIsResizing(true)
    setResizeDirection(direction)

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    startPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    annotationSize.current = {
      width: annotation.size.width,
      height: annotation.size.height,
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: MouseEvent) => {
    if (!isMoving && !isResizing) return
    if (!selectedAnnotation) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const deltaX = currentX - startPos.current.x
    const deltaY = currentY - startPos.current.y

    const annotation = annotations.find((a) => a.id === selectedAnnotation)
    if (!annotation) return

    if (isMoving) {
      // Update position
      const newX = Math.max(
        0,
        Math.min(annotationPos.current.x + deltaX, container.clientWidth - annotation.size.width),
      )
      const newY = Math.max(
        0,
        Math.min(annotationPos.current.y + deltaY, container.clientHeight - annotation.size.height),
      )

      updateAnnotation(selectedAnnotation, {
        position: { x: newX, y: newY },
      })
    } else if (isResizing) {
      // Update size based on resize direction
      let newWidth = annotationSize.current.width
      let newHeight = annotationSize.current.height

      if (resizeDirection?.includes("e")) {
        newWidth = Math.max(50, annotationSize.current.width + deltaX)
      }
      if (resizeDirection?.includes("w")) {
        newWidth = Math.max(50, annotationSize.current.width - deltaX)
      }
      if (resizeDirection?.includes("s")) {
        newHeight = Math.max(50, annotationSize.current.height + deltaY)
      }
      if (resizeDirection?.includes("n")) {
        newHeight = Math.max(50, annotationSize.current.height - deltaY)
      }

      // Update position if resizing from top or left
      let newX = annotation.position.x
      let newY = annotation.position.y

      if (resizeDirection?.includes("w")) {
        newX = annotation.position.x - (newWidth - annotation.size.width)
      }
      if (resizeDirection?.includes("n")) {
        newY = annotation.position.y - (newHeight - annotation.size.height)
      }

      updateAnnotation(selectedAnnotation, {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      })
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsMoving(false)
    setIsResizing(false)
    setResizeDirection(null)
  }

  // Add event listeners
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isMoving, isResizing, selectedAnnotation])

  // Toggle lock for an annotation
  const toggleLock = (annotationId: string) => {
    setLockedAnnotations((prev) => ({
      ...prev,
      [annotationId]: !prev[annotationId],
    }))
  }

  // Bring annotation to front
  const bringToFront = (annotationId: string) => {
    const annotation = annotations.find((a) => a.id === annotationId)
    if (!annotation) return

    // Find the highest z-index
    const highestZIndex = annotations.reduce((max, a) => Math.max(max, a.zIndex), 0)

    // Update z-index
    updateAnnotation(annotationId, {
      zIndex: highestZIndex + 1,
    })
  }

  // Render annotation
  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = selectedAnnotation === annotation.id
    const isLocked = lockedAnnotations[annotation.id]

    switch (annotation.type) {
      case "text":
        return (
          <div
            key={annotation.id}
            className={`absolute cursor-move ${isSelected ? "ring-2 ring-primary" : ""}`}
            style={{
              left: `${annotation.position.x}px`,
              top: `${annotation.position.y}px`,
              width: `${annotation.size.width}px`,
              minHeight: `${annotation.size.height}px`,
              zIndex: annotation.zIndex,
              fontFamily: getFontFamilyValue(annotation.fontFamily || "sans"),
              fontSize: `${annotation.fontSize || 16}px`,
              fontWeight: getFontWeightValue(annotation.fontWeight || "normal"),
              color: annotation.color,
              padding: "8px",
              border: isSelected ? "1px dashed #ccc" : "none",
              backgroundColor: isSelected ? "rgba(255, 255, 255, 0.5)" : "transparent",
            }}
            onMouseDown={(e) => startMoving(e, annotation)}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedAnnotation(annotation.id)
            }}
          >
            {annotation.content}

            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1 bg-white border rounded-md shadow-sm p-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLock(annotation.id)}>
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => bringToFront(annotation.id)}>
                  <Move className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => deleteAnnotation(annotation.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            )}

            {isSelected && !isLocked && (
              <>
                {/* Resize handles */}
                <div
                  className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full cursor-ne-resize -mt-1.5 -mr-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "ne")}
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-se-resize -mb-1.5 -mr-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "se")}
                />
                <div
                  className="absolute bottom-0 left-0 w-3 h-3 bg-primary rounded-full cursor-sw-resize -mb-1.5 -ml-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "sw")}
                />
                <div
                  className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full cursor-nw-resize -mt-1.5 -ml-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "nw")}
                />
              </>
            )}
          </div>
        )

      case "sticky":
        return (
          <div
            key={annotation.id}
            className={`absolute cursor-move ${isSelected ? "ring-2 ring-primary" : ""}`}
            style={{
              left: `${annotation.position.x}px`,
              top: `${annotation.position.y}px`,
              width: `${annotation.size.width}px`,
              minHeight: `${annotation.size.height}px`,
              zIndex: annotation.zIndex,
              backgroundColor: annotation.color,
              padding: "16px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transform: "rotate(-2deg)",
              color: getContrastColor(annotation.color),
            }}
            onMouseDown={(e) => startMoving(e, annotation)}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedAnnotation(annotation.id)
            }}
          >
            {annotation.content}

            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1 bg-white border rounded-md shadow-sm p-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLock(annotation.id)}>
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => bringToFront(annotation.id)}>
                  <Move className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => deleteAnnotation(annotation.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            )}

            {isSelected && !isLocked && (
              <>
                {/* Resize handles */}
                <div
                  className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full cursor-ne-resize -mt-1.5 -mr-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "ne")}
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-se-resize -mb-1.5 -mr-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "se")}
                />
                <div
                  className="absolute bottom-0 left-0 w-3 h-3 bg-primary rounded-full cursor-sw-resize -mb-1.5 -ml-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "sw")}
                />
                <div
                  className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full cursor-nw-resize -mt-1.5 -ml-1.5"
                  onMouseDown={(e) => startResizing(e, annotation, "nw")}
                />
              </>
            )}
          </div>
        )

      case "freehand":
        return (
          <div
            key={annotation.id}
            className={`absolute ${isSelected ? "ring-2 ring-primary" : ""}`}
            style={{
              left: `${annotation.position.x}px`,
              top: `${annotation.position.y}px`,
              width: `${annotation.size.width}px`,
              height: `${annotation.size.height}px`,
              zIndex: annotation.zIndex,
            }}
            onMouseDown={(e) => startMoving(e, annotation)}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedAnnotation(annotation.id)
            }}
          >
            <img src={annotation.content || "/placeholder.svg"} alt="Freehand drawing" className="w-full h-full" />

            {isSelected && (
              <div className="absolute -top-8 right-0 flex space-x-1 bg-white border rounded-md shadow-sm p-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleLock(annotation.id)}>
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => bringToFront(annotation.id)}>
                  <Move className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500"
                  onClick={() => deleteAnnotation(annotation.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none" onClick={() => setSelectedAnnotation(null)}>
      {sortedAnnotations.map((annotation) => (
        <div key={annotation.id} className="pointer-events-auto">
          {renderAnnotation(annotation)}
        </div>
      ))}
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
function getFontFamilyValue(fontFamily: string): string {
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

function getFontWeightValue(fontWeight: string): string {
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
