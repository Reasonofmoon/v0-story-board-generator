"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useDrag } from "react-use-gesture"
import { PAGE_DIMENSIONS, type PrintSettings, type PrintPreviewPage as PrintPreviewPageType } from "@/lib/types"
import type { StoryboardData } from "@/lib/types"
import { SHOT_TYPES, CAMERA_ANGLES } from "@/lib/types"
import { Maximize, Minimize } from "lucide-react"

interface PrintPreviewPageProps {
  page: PrintPreviewPageType
  printSettings: PrintSettings
  storyboardData: StoryboardData
}

export default function PrintPreviewPage({ page, printSettings, storyboardData }: PrintPreviewPageProps) {
  const [draggableShots, setDraggableShots] = useState(page.shots)
  const pageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragStates, setDragStates] = useState<{ [key: string]: any }>({})

  // Calculate page dimensions based on settings
  const getPageDimensions = () => {
    const dimensions = PAGE_DIMENSIONS[printSettings.pageSize]
    return printSettings.orientation === "portrait"
      ? { width: dimensions.width, height: dimensions.height }
      : { width: dimensions.height, height: dimensions.width }
  }

  const pageDimensions = getPageDimensions()

  // Calculate printable area based on margins
  const printableArea = {
    x: printSettings.margins.left,
    y: printSettings.margins.top,
    width: pageDimensions.width - printSettings.margins.left - printSettings.margins.right,
    height: pageDimensions.height - printSettings.margins.top - printSettings.margins.bottom,
  }

  // Update draggable shots when page changes
  useEffect(() => {
    setDraggableShots(page.shots)
  }, [page])

  // Initialize canvas with willReadFrequently attribute
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true })
      // Additional canvas initialization if needed
    }
  }, [])

  // Find shot and scene data
  const getShotData = (shotId: string, sceneId: string) => {
    const scene = storyboardData.scenes.find((s) => s.id === sceneId)
    if (!scene) return null

    const shot = scene.shots.find((s) => s.id === shotId)
    return { shot, scene }
  }

  // Handle shot dragging
  const handleDrag = useCallback(
    (index: number) =>
      ({ movement: [mx, my], first, last }: any) => {
        if (printSettings.customLayout) {
          setDraggableShots((prev) => {
            const newShots = [...prev]
            const shot = newShots[index]

            // Update position
            newShots[index] = {
              ...shot,
              position: {
                x: shot.position.x + mx,
                y: shot.position.y + my,
              },
            }

            return newShots
          })

          // Save position to storyboard data when drag ends
          if (last) {
            // TODO: Save position to storyboard data
            console.log("Drag ended, save position")
          }
        }
      },
    [printSettings.customLayout, setDraggableShots],
  )

  // Handle shot scaling
  const handleScale = (index: number, scaleFactor: number) => {
    if (printSettings.customLayout) {
      setDraggableShots((prev) => {
        const newShots = [...prev]
        const shot = newShots[index]

        // Update scale
        newShots[index] = {
          ...shot,
          scale: (shot.scale || 1) * scaleFactor,
        }

        return newShots
      })

      // Save scale to storyboard data
      // TODO: Save scale to storyboard data
      console.log("Scale changed, save scale")
    }
  }

  useEffect(() => {
    const newDragStates: { [key: string]: any } = {}
    draggableShots.forEach((shot, index) => {
      newDragStates[shot.shotId] = useDrag(handleDrag(index))
    })
    setDragStates(newDragStates)
  }, [draggableShots, handleDrag])

  return (
    <div
      ref={pageRef}
      className="bg-white shadow-lg relative"
      style={{
        width: `${pageDimensions.width}mm`,
        height: `${pageDimensions.height}mm`,
        margin: "0 auto 20px auto",
      }}
    >
      {/* Page border */}
      <div className="absolute inset-0 border border-gray-300" />

      {/* Margin guides */}
      <div
        className="absolute border border-dashed border-gray-300 pointer-events-none"
        style={{
          left: `${printSettings.margins.left}mm`,
          top: `${printSettings.margins.top}mm`,
          width: `${printableArea.width}mm`,
          height: `${printableArea.height}mm`,
        }}
      />

      {/* Page number */}
      {printSettings.pageNumbers && (
        <div
          className="absolute text-gray-500 text-xs"
          style={{
            bottom: "5mm",
            right: "5mm",
          }}
        >
          {page.pageNumber}
        </div>
      )}

      {/* Scene header */}
      {page.sceneHeader && printSettings.headerFooter && (
        <div
          className="absolute"
          style={{
            left: `${printableArea.x}mm`,
            top: `${printableArea.y}mm`,
            width: `${printableArea.width}mm`,
          }}
        >
          {(() => {
            const scene = storyboardData.scenes.find((s) => s.id === page.sceneHeader?.sceneId)
            if (!scene) return null

            return (
              <div className="border-b border-gray-300 pb-2 mb-4">
                <h3 className="font-bold">{scene.title}</h3>
                {printSettings.includeNotes && <p className="text-sm text-gray-600 mt-1">{scene.description}</p>}
              </div>
            )
          })()}
        </div>
      )}

      {/* Shots */}
      {draggableShots.map((shot, index) => {
        const shotData = getShotData(shot.shotId, shot.sceneId)
        if (!shotData || !shotData.shot) return null

        const { shot: shotInfo, scene } = shotData

        // Calculate shot position and size based on layout
        let shotWidth, shotHeight, shotX, shotY

        if (printSettings.customLayout) {
          // Use custom position and scale
          shotX = printableArea.x + shot.position.x
          shotY = printableArea.y + (page.sceneHeader ? 15 : 0) + shot.position.y
          shotWidth = (printableArea.width / 2) * (shot.scale || 1)
          shotHeight = (shotWidth * 9) / 16 // Assuming 16:9 aspect ratio
        } else if (printSettings.layout === "grid") {
          // Grid layout
          const columns = printSettings.shotsPerPage <= 2 ? 1 : 2
          const rows = Math.ceil(printSettings.shotsPerPage / columns)
          const colWidth = printableArea.width / columns
          const rowHeight = printableArea.height / rows
          const col = index % columns
          const row = Math.floor(index / columns)

          shotX = printableArea.x + col * colWidth
          shotY = printableArea.y + (page.sceneHeader ? 15 : 0) + row * rowHeight
          shotWidth = colWidth * 0.9 // 90% of column width
          shotHeight = (shotWidth * 9) / 16 // Assuming 16:9 aspect ratio
        } else if (printSettings.layout === "list") {
          // List layout
          const rowHeight = printableArea.height / printSettings.shotsPerPage

          shotX = printableArea.x
          shotY = printableArea.y + (page.sceneHeader ? 15 : 0) + index * rowHeight
          shotWidth = printableArea.width * 0.3 // 30% of printable width
          shotHeight = (shotWidth * 9) / 16 // Assuming 16:9 aspect ratio
        } else {
          // Detailed layout (one shot per page)
          shotX = printableArea.x
          shotY = printableArea.y + (page.sceneHeader ? 15 : 0)
          shotWidth = printableArea.width
          shotHeight = (shotWidth * 9) / 16 // Assuming 16:9 aspect ratio
        }

        // Bind drag gesture
        //const bind = useDrag(handleDrag(index))

        return (
          <div
            key={shot.shotId}
            className={`absolute ${printSettings.customLayout ? "cursor-move" : ""}`}
            style={{
              left: `${shotX}mm`,
              top: `${shotY}mm`,
              width: `${shotWidth}mm`,
              height: `${shotHeight + (printSettings.includeNotes ? 20 : 0)}mm`,
            }}
            {...(printSettings.customLayout ? dragStates[shot.shotId]?.() : {})}
          >
            <div className="relative">
              {/* Shot image */}
              <div
                className="bg-gray-100 border border-gray-300"
                style={{
                  width: `${shotWidth}mm`,
                  height: `${shotHeight}mm`,
                  overflow: "hidden",
                }}
              >
                {shotInfo.imageUrl ? (
                  <img
                    src={shotInfo.imageUrl || "/placeholder.svg"}
                    alt={shotInfo.shotDescription}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image available</div>
                )}

                {/* Shot type overlay */}
                <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {SHOT_TYPES[shotInfo.shotType]}
                </div>

                {/* Camera angle overlay */}
                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {CAMERA_ANGLES[shotInfo.cameraAngle]}
                </div>

                {/* Scale controls (only in custom layout mode) */}
                {printSettings.customLayout && (
                  <div className="absolute bottom-1 right-1 flex space-x-1">
                    <button
                      className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70"
                      onClick={() => handleScale(index, 0.9)}
                      title="Scale down"
                    >
                      <Minimize className="h-3 w-3" />
                    </button>
                    <button
                      className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70"
                      onClick={() => handleScale(index, 1.1)}
                      title="Scale up"
                    >
                      <Maximize className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Shot info */}
              {printSettings.includeNotes && (
                <div className="mt-1 text-xs">
                  <p className="font-medium truncate">{shotInfo.shotDescription}</p>
                  {printSettings.layout === "detailed" && (
                    <>
                      <p className="text-gray-600 mt-1">
                        {shotInfo.cameraMovement}, {shotInfo.lighting || "Natural lighting"}
                      </p>
                      {shotInfo.notes && <p className="text-gray-600 mt-1 italic">{shotInfo.notes}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Hidden canvas for image processing if needed */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
