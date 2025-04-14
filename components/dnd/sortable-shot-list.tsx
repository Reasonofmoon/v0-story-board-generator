"use client"

import { useStoryboard } from "@/context/storyboard-context"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, Edit, Trash, RefreshCw } from "lucide-react"
import type { ShotInfo } from "@/lib/types"
import { SHOT_TYPES, CAMERA_ANGLES } from "@/lib/types"

interface SortableShotListProps {
  sceneId: string
  shots: ShotInfo[]
  onEditShot: (shotId: string) => void
  onDeleteShot: (shotId: string) => void
}

export default function SortableShotList({ sceneId, shots, onEditShot, onDeleteShot }: SortableShotListProps) {
  const { reorderShots, regenerateShot } = useStoryboard()

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    // Create a new array of shot IDs in the new order
    const shotIds = shots.map((shot) => shot.id)
    const [removed] = shotIds.splice(sourceIndex, 1)
    shotIds.splice(destinationIndex, 0, removed)

    // Update the order
    reorderShots(sceneId, shotIds)
  }

  const handleRegenerateShot = async (shotId: string) => {
    try {
      await regenerateShot(sceneId, shotId)
    } catch (error) {
      console.error("Error regenerating shot:", error)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`shots-${sceneId}`}>
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {shots.map((shot, index) => (
              <Draggable key={shot.id} draggableId={shot.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="mb-2">
                    <Card className="border border-gray-200">
                      <CardContent className="p-3 flex items-center">
                        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">
                            Shot {index + 1}: {SHOT_TYPES[shot.shotType]}
                          </div>
                          <div className="text-sm text-gray-600 truncate max-w-md">{shot.shotDescription}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {CAMERA_ANGLES[shot.cameraAngle]}, {shot.cameraMovement}
                          </div>
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRegenerateShot(shot.id)}
                            title="Regenerate shot"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Regenerate</span>
                          </Button>

                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEditShot(shot.id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Shot</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => onDeleteShot(shot.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete Shot</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {shots.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No shots in this scene. Add a shot to get started.
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
