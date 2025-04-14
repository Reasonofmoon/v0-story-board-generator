"use client"

import { useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GripVertical, ChevronDown, ChevronRight, Plus, Edit, Trash } from "lucide-react"
import SortableShotList from "./sortable-shot-list"

interface SortableSceneListProps {
  onEditScene: (sceneId: string) => void
  onDeleteScene: (sceneId: string) => void
  onAddShot: (sceneId: string) => void
  onEditShot: (sceneId: string, shotId: string) => void
  onDeleteShot: (sceneId: string, shotId: string) => void
}

export default function SortableSceneList({
  onEditScene,
  onDeleteScene,
  onAddShot,
  onEditShot,
  onDeleteShot,
}: SortableSceneListProps) {
  const { storyboardData, reorderScenes } = useStoryboard()
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({})

  if (!storyboardData) return null

  const toggleSceneExpanded = (sceneId: string) => {
    setExpandedScenes((prev) => ({
      ...prev,
      [sceneId]: !prev[sceneId],
    }))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    // Create a new array of scene IDs in the new order
    const sceneIds = storyboardData.scenes.map((scene) => scene.id)
    const [removed] = sceneIds.splice(sourceIndex, 1)
    sceneIds.splice(destinationIndex, 0, removed)

    // Update the order
    reorderScenes(sceneIds)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="scenes">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {storyboardData.scenes.map((scene, index) => (
              <Draggable key={scene.id} draggableId={scene.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="mb-4">
                    <Card>
                      <CardHeader className="p-3 flex flex-row items-center space-x-0 space-y-0">
                        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-2 p-1 h-auto"
                          onClick={() => toggleSceneExpanded(scene.id)}
                        >
                          {expandedScenes[scene.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>

                        <CardTitle className="text-base flex-1">
                          Scene {index + 1}: {scene.title}
                        </CardTitle>

                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onAddShot(scene.id)}>
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add Shot</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEditScene(scene.id)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Scene</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => onDeleteScene(scene.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete Scene</span>
                          </Button>
                        </div>
                      </CardHeader>

                      {expandedScenes[scene.id] && (
                        <CardContent className="p-3 pt-0">
                          <div className="text-sm text-gray-600 mb-3">{scene.description}</div>

                          <SortableShotList
                            sceneId={scene.id}
                            shots={scene.shots}
                            onEditShot={(shotId) => onEditShot(scene.id, shotId)}
                            onDeleteShot={(shotId) => onDeleteShot(scene.id, shotId)}
                          />
                        </CardContent>
                      )}
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
