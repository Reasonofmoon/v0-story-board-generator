"use client"

import { useRef, useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize,
  Edit,
  Plus,
  Trash,
  Copy,
  RefreshCw,
  Palette,
  Pencil,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { SHOT_TYPES, CAMERA_ANGLES, CAMERA_MOVEMENTS } from "@/lib/types"
import VersionHistory from "./version-history"
import SortableSceneList from "./dnd/sortable-scene-list"
import InlineEditField from "./editable/inline-edit-field"
import ImageUpload from "./editable/image-upload"
import TemplateCustomizer from "@/components/template/template-customizer"
import AnnotationTools from "@/components/annotation/annotation-tools"
import AnnotationDisplay from "@/components/annotation/annotation-display"
import ErrorBoundary from "@/components/error-boundary"

export default function StoryboardViewer() {
  const {
    storyboardData,
    updateShot,
    addShot,
    removeShot,
    updateScene,
    addScene,
    removeScene,
    duplicateShot,
    duplicateScene,
    regenerateShot,
    regenerateStoryboard,
    styleSettings,
    clearAnnotations,
  } = useStoryboard()

  const [viewMode, setViewMode] = useState<"grid" | "single" | "edit">("grid")
  const [activeScene, setActiveScene] = useState(0)
  const [currentShot, setCurrentShot] = useState({ sceneIndex: 0, shotIndex: 0 })
  const [editingShot, setEditingShot] = useState(false)
  const [editingScene, setEditingScene] = useState(false)
  const [addingShot, setAddingShot] = useState(false)
  const [addingScene, setAddingScene] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: "shot" | "scene"; id: string } | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const [showTemplateCustomizer, setShowTemplateCustomizer] = useState(false)
  const [showAnnotationTools, setShowAnnotationTools] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})

  if (!storyboardData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <p className="text-gray-500">No storyboard generated yet. Please go to the Story Input tab to create one.</p>
      </div>
    )
  }

  // Calculate total shots for timeline
  const totalShots = storyboardData.scenes.reduce((total, scene) => total + scene.shots.length, 0)

  // Calculate current shot's overall index
  const calculateShotIndex = (sceneIndex: number, shotIndex: number) => {
    let index = 0
    for (let i = 0; i < sceneIndex; i++) {
      index += storyboardData.scenes[i].shots.length
    }
    return index + shotIndex
  }

  const currentShotIndex = calculateShotIndex(currentShot.sceneIndex, currentShot.shotIndex)

  // Navigation functions
  const goToNextShot = () => {
    if (currentShot.shotIndex < storyboardData.scenes[currentShot.sceneIndex].shots.length - 1) {
      setCurrentShot({
        ...currentShot,
        shotIndex: currentShot.shotIndex + 1,
      })
    } else if (currentShot.sceneIndex < storyboardData.scenes.length - 1) {
      setCurrentShot({
        sceneIndex: currentShot.sceneIndex + 1,
        shotIndex: 0,
      })
      setActiveScene(currentShot.sceneIndex + 1)
    }
  }

  const goToPrevShot = () => {
    if (currentShot.shotIndex > 0) {
      setCurrentShot({
        ...currentShot,
        shotIndex: currentShot.shotIndex - 1,
      })
    } else if (currentShot.sceneIndex > 0) {
      const prevSceneIndex = currentShot.sceneIndex - 1
      const prevShotIndex = storyboardData.scenes[prevSceneIndex].shots.length - 1
      setCurrentShot({
        sceneIndex: prevSceneIndex,
        shotIndex: prevShotIndex,
      })
      setActiveScene(prevSceneIndex)
    }
  }

  const handleEditShot = (sceneId?: string, shotId?: string) => {
    if (sceneId && shotId) {
      // Find the scene and shot indices
      const sceneIndex = storyboardData.scenes.findIndex((scene) => scene.id === sceneId)
      if (sceneIndex === -1) return

      const shotIndex = storyboardData.scenes[sceneIndex].shots.findIndex((shot) => shot.id === shotId)
      if (shotIndex === -1) return

      setCurrentShot({ sceneIndex, shotIndex })
    }

    setEditingShot(true)
  }

  const handleEditScene = (sceneId?: string) => {
    if (sceneId) {
      // Find the scene index
      const sceneIndex = storyboardData.scenes.findIndex((scene) => scene.id === sceneId)
      if (sceneIndex === -1) return

      setActiveScene(sceneIndex)
      setCurrentShot({ sceneIndex, shotIndex: 0 })
    }

    setEditingScene(true)
  }

  const handleAddShot = (sceneId?: string) => {
    if (sceneId) {
      // Find the scene index
      const sceneIndex = storyboardData.scenes.findIndex((scene) => scene.id === sceneId)
      if (sceneIndex === -1) return

      setActiveScene(sceneIndex)
      setCurrentShot({ sceneIndex, shotIndex: 0 })
    }

    setAddingShot(true)
  }

  const handleAddScene = () => {
    setAddingScene(true)
  }

  const handleDeleteShot = (sceneId?: string, shotId?: string) => {
    if (sceneId && shotId) {
      // Find the scene
      const scene = storyboardData.scenes.find((s) => s.id === sceneId)
      if (!scene) return

      if (scene.shots.length <= 1) {
        // Don't allow deleting the last shot in a scene
        return
      }

      setConfirmDelete({
        type: "shot",
        id: shotId,
      })
      return
    }

    if (storyboardData.scenes[currentShot.sceneIndex].shots.length <= 1) {
      // Don't allow deleting the last shot in a scene
      return
    }

    setConfirmDelete({
      type: "shot",
      id: storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
    })
  }

  const handleDeleteScene = (sceneId?: string) => {
    if (sceneId) {
      if (storyboardData.scenes.length <= 1) {
        // Don't allow deleting the last scene
        return
      }

      setConfirmDelete({
        type: "scene",
        id: sceneId,
      })
      return
    }

    if (storyboardData.scenes.length <= 1) {
      // Don't allow deleting the last scene
      return
    }

    setConfirmDelete({
      type: "scene",
      id: storyboardData.scenes[currentShot.sceneIndex].id,
    })
  }

  const handleDuplicateShot = () => {
    duplicateShot(
      storyboardData.scenes[currentShot.sceneIndex].id,
      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
    )
  }

  const handleDuplicateScene = () => {
    duplicateScene(storyboardData.scenes[currentShot.sceneIndex].id)
  }

  const handleRegenerateCurrentShot = async () => {
    try {
      setRegenerating(true)
      await regenerateShot(
        storyboardData.scenes[currentShot.sceneIndex].id,
        storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
      )
      setRegenerating(false)
    } catch (error) {
      console.error("Error regenerating shot:", error)
      setRegenerating(false)
    }
  }

  const confirmDeleteItem = () => {
    if (!confirmDelete) return

    if (confirmDelete.type === "shot") {
      // Find the scene that contains this shot
      const scene = storyboardData.scenes.find((scene) => scene.shots.some((shot) => shot.id === confirmDelete.id))

      if (!scene) return

      removeShot(scene.id, confirmDelete.id)

      // Adjust current shot index if needed
      if (scene.id === storyboardData.scenes[currentShot.sceneIndex].id) {
        if (currentShot.shotIndex >= storyboardData.scenes[currentShot.sceneIndex].shots.length - 1) {
          setCurrentShot({
            ...currentShot,
            shotIndex: Math.max(0, storyboardData.scenes[currentShot.sceneIndex].shots.length - 2),
          })
        }
      }
    } else {
      removeScene(confirmDelete.id)

      // Adjust current scene index if needed
      const deletedSceneIndex = storyboardData.scenes.findIndex((scene) => scene.id === confirmDelete.id)
      if (deletedSceneIndex !== -1) {
        if (currentShot.sceneIndex >= deletedSceneIndex) {
          const newSceneIndex = Math.max(0, currentShot.sceneIndex - 1)
          setCurrentShot({
            sceneIndex: newSceneIndex,
            shotIndex: 0,
          })
          setActiveScene(newSceneIndex)
        }
      }
    }

    setConfirmDelete(null)
  }

  const saveEditedShot = (updatedShot: any) => {
    updateShot(
      storyboardData.scenes[currentShot.sceneIndex].id,
      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
      updatedShot,
    )
    setEditingShot(false)
  }

  const saveEditedScene = (updatedScene: any) => {
    updateScene(storyboardData.scenes[currentShot.sceneIndex].id, updatedScene)
    setEditingScene(false)
  }

  const saveNewShot = (newShot: any) => {
    addShot(storyboardData.scenes[currentShot.sceneIndex].id, {
      ...newShot,
      sceneId: storyboardData.scenes[currentShot.sceneIndex].id,
    })
    setAddingShot(false)
  }

  const saveNewScene = (newScene: any) => {
    addScene(newScene)
    setAddingScene(false)

    // Switch to the new scene
    setActiveScene(storyboardData.scenes.length)
    setCurrentShot({
      sceneIndex: storyboardData.scenes.length,
      shotIndex: 0,
    })
  }

  const handleUpdateShotImage = (imageUrl: string) => {
    updateShot(
      storyboardData.scenes[currentShot.sceneIndex].id,
      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
      { imageUrl },
    )
  }

  const handleRemoveShotImage = () => {
    updateShot(
      storyboardData.scenes[currentShot.sceneIndex].id,
      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
      { imageUrl: undefined },
    )
  }

  const handleUpdateShotDescription = (shotDescription: string) => {
    updateShot(
      storyboardData.scenes[currentShot.sceneIndex].id,
      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
      { shotDescription },
    )
  }

  const handleUpdateSceneTitle = (title: string) => {
    updateScene(storyboardData.scenes[currentShot.sceneIndex].id, { title })
  }

  const handleUpdateSceneDescription = (description: string) => {
    updateScene(storyboardData.scenes[currentShot.sceneIndex].id, { description })
  }

  const handleImageLoading = (shotId: string, isLoading: boolean) => {
    setLoadingImages((prev) => ({
      ...prev,
      [shotId]: isLoading,
    }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Storyboard header */}
      <div className="bg-gray-100 p-4 rounded-t-lg border-b border-gray-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{storyboardData.title}</h2>
            <div className="flex text-sm text-gray-600 mt-1">
              {storyboardData.director && <span className="mr-4">Director: {storyboardData.director}</span>}
              {storyboardData.author && <span className="mr-4">Author: {storyboardData.author}</span>}
              <span>Version: {storyboardData.version}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <VersionHistory />

            <Button variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")} size="sm">
              <Grid className="h-4 w-4 mr-2" />
              Grid View
            </Button>

            <Button
              variant={viewMode === "single" ? "default" : "outline"}
              onClick={() => setViewMode("single")}
              size="sm"
            >
              <Maximize className="h-4 w-4 mr-2" />
              Single View
            </Button>

            <Button variant={viewMode === "edit" ? "default" : "outline"} onClick={() => setViewMode("edit")} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit View
            </Button>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => setShowTemplateCustomizer(true)}>
                <Palette className="h-4 w-4 mr-2" />
                Customize Template
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAnnotationTools(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Annotations
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-800 text-white p-3 flex items-center">
        <div className="mr-4 font-medium">Timeline:</div>
        <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden relative">
          {storyboardData.scenes.map((scene, sceneIndex) => {
            // Calculate each scene's start position
            const startPercent = (calculateShotIndex(sceneIndex, 0) / totalShots) * 100
            // Calculate each scene's width
            const widthPercent = (scene.shots.length / totalShots) * 100

            return (
              <div
                key={sceneIndex}
                className="absolute h-2"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: sceneIndex === currentShot.sceneIndex ? "rgb(16, 185, 129)" : "rgb(5, 150, 105)",
                  opacity: sceneIndex === currentShot.sceneIndex ? 1 : 0.7,
                }}
                onClick={() => {
                  setCurrentShot({ sceneIndex, shotIndex: 0 })
                  setActiveScene(sceneIndex)
                }}
              />
            )
          })}

          {/* Current shot indicator */}
          <div
            className="absolute h-4 w-3 bg-white rounded-full -mt-1 transform -translate-x-1/2"
            style={{ left: `${(currentShotIndex / totalShots) * 100}%` }}
          />
        </div>
        <div className="ml-4">
          {currentShotIndex + 1} / {totalShots}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {viewMode === "edit" ? (
          <div className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Storyboard</h3>
              <Button variant="outline" size="sm" onClick={handleAddScene}>
                <Plus className="h-4 w-4 mr-1" />
                Add Scene
              </Button>
            </div>

            <SortableSceneList
              onEditScene={handleEditScene}
              onDeleteScene={handleDeleteScene}
              onAddShot={handleAddShot}
              onEditShot={handleEditShot}
              onDeleteShot={handleDeleteShot}
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-4">
            {/* Scene tabs */}
            <div className="flex justify-between items-center mb-4">
              <Tabs
                defaultValue={`scene-${activeScene}`}
                value={`scene-${activeScene}`}
                onValueChange={(value) => setActiveScene(Number.parseInt(value.split("-")[1]))}
              >
                <TabsList className="flex overflow-x-auto">
                  {storyboardData.scenes.map((scene, index) => (
                    <TabsTrigger key={index} value={`scene-${index}`}>
                      {scene.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleAddScene}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Scene
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditScene()}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Scene
                </Button>
                <Button size="sm" variant="outline" onClick={handleDuplicateScene}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <Button size="sm" variant="outline" onClick={() => handleAddShot()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Shot
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storyboardData.scenes[activeScene].shots.map((shot, shotIndex) => (
                <div
                  key={shot.id}
                  className="border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setViewMode("single")
                    setCurrentShot({ sceneIndex: activeScene, shotIndex })
                  }}
                >
                  {/* Image area */}
                  <div className="bg-gray-200 aspect-video flex items-center justify-center">
                    {shot.imageUrl ? (
                      <>
                        {loadingImages[shot.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-70">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                          </div>
                        )}
                        <img
                          src={shot.imageUrl || "/placeholder.svg"}
                          alt={shot.shotDescription}
                          className="w-full h-full object-cover"
                          onLoad={() => handleImageLoading(shot.id, false)}
                          onError={() => handleImageLoading(shot.id, false)}
                          crossOrigin="anonymous"
                        />
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-500 mb-1">Shot {shotIndex + 1}</div>
                        <div className="text-sm text-gray-400">{shot.shotType}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium mb-1 truncate">{shot.shotDescription}</h3>
                    <div className="flex text-xs text-gray-500">
                      <span className="mr-2">Camera: {CAMERA_ANGLES[shot.cameraAngle]}</span>
                      <span>Movement: {CAMERA_MOVEMENTS[shot.cameraMovement]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col h-full">
            {/* Current shot detail view */}
            <div className="flex mb-4 items-center">
              <Button variant="outline" size="icon" onClick={goToPrevShot} disabled={currentShotIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="bg-gray-100 px-4 py-2 flex-1 text-center rounded-md mx-2">
                <InlineEditField
                  value={storyboardData.scenes[currentShot.sceneIndex].title}
                  onSave={handleUpdateSceneTitle}
                  className="font-medium"
                />
                <span> - Shot {currentShot.shotIndex + 1}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextShot}
                disabled={currentShotIndex === totalShots - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="ml-2 flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleRegenerateCurrentShot} disabled={regenerating}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${regenerating ? "animate-spin" : ""}`} />
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditShot()}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleDuplicateShot}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDeleteShot()}>
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image area */}
              <div
                className="bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative"
                ref={containerRef}
              >
                <ImageUpload
                  imageUrl={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].imageUrl}
                  onImageChange={handleUpdateShotImage}
                  onImageRemove={handleRemoveShotImage}
                  aspectRatio={styleSettings.aspectRatio}
                  className="w-full h-full"
                  isLoading={
                    loadingImages[storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id] ||
                    false
                  }
                  onLoadingChange={(isLoading) =>
                    handleImageLoading(
                      storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
                      isLoading,
                    )
                  }
                />

                <ErrorBoundary
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-800 max-w-md">
                        <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
                        <h3 className="font-medium mb-1">Annotation Error</h3>
                        <p className="text-sm">
                          There was an error displaying annotations. Try refreshing the page or clearing annotations.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            if (storyboardData) {
                              clearAnnotations(
                                storyboardData.scenes[currentShot.sceneIndex].id,
                                storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
                              )
                            }
                          }}
                        >
                          Clear Annotations
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <AnnotationDisplay
                    sceneId={storyboardData.scenes[currentShot.sceneIndex].id}
                    shotId={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id}
                    containerRef={containerRef}
                  />
                </ErrorBoundary>
              </div>

              {/* Shot info */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 overflow-auto">
                <h3 className="font-bold text-lg mb-3">Shot Information</h3>

                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">Description</h4>
                  <InlineEditField
                    value={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].shotDescription}
                    onSave={handleUpdateShotDescription}
                    multiline
                    className="text-gray-800 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <h4 className="font-medium text-gray-700">Shot Type</h4>
                    <p className="text-gray-800">
                      {SHOT_TYPES[storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].shotType]}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Camera Angle</h4>
                    <p className="text-gray-800">
                      {
                        CAMERA_ANGLES[
                          storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].cameraAngle
                        ]
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Camera Movement</h4>
                    <p className="text-gray-800">
                      {
                        CAMERA_MOVEMENTS[
                          storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].cameraMovement
                        ]
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Lighting</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].lighting}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <h4 className="font-medium text-gray-700">Characters</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].characters?.join(
                        ", ",
                      ) || "None"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Location</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].location ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Time of Day</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].timeOfDay ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Audio/Sound</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].audio ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].dialogueSnippet && (
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700">Dialogue</h4>
                    <p className="text-gray-800 italic">
                      "{storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].dialogueSnippet}"
                    </p>
                  </div>
                )}

                <div className="mb-3">
                  <h4 className="font-medium text-gray-700">Director's Notes</h4>
                  <p className="text-gray-800">
                    {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].notes ||
                      "No notes available"}
                  </p>
                </div>

                <div className="mb-3 bg-gray-100 p-3 rounded-md">
                  <h4 className="font-medium text-gray-700">AI Prompt</h4>
                  <p className="text-gray-800 font-mono text-sm">
                    {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Shot Dialog */}
      <Dialog open={editingShot} onOpenChange={setEditingShot}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Shot</DialogTitle>
            <DialogDescription>Edit the details of this shot.</DialogDescription>
          </DialogHeader>

          {editingShot && (
            <ShotEditForm
              shot={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex]}
              onSave={saveEditedShot}
              onCancel={() => setEditingShot(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Scene Dialog */}
      <Dialog open={editingScene} onOpenChange={setEditingScene}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scene</DialogTitle>
            <DialogDescription>Edit the details of this scene.</DialogDescription>
          </DialogHeader>

          {editingScene && (
            <SceneEditForm
              scene={storyboardData.scenes[currentShot.sceneIndex]}
              onSave={saveEditedScene}
              onCancel={() => setEditingScene(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Shot Dialog */}
      <Dialog open={addingShot} onOpenChange={setAddingShot}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Shot</DialogTitle>
            <DialogDescription>Add a new shot to this scene.</DialogDescription>
          </DialogHeader>

          <ShotEditForm
            shot={{
              id: "",
              sceneId: storyboardData.scenes[currentShot.sceneIndex].id,
              sceneContext: storyboardData.scenes[currentShot.sceneIndex].description,
              shotDescription: "",
              shotType: "MS",
              cameraAngle: "EYE_LEVEL",
              cameraMovement: "STATIC",
              lighting: "Natural lighting",
            }}
            isNew={true}
            onSave={saveNewShot}
            onCancel={() => setAddingShot(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Scene Dialog */}
      <Dialog open={addingScene} onOpenChange={setAddingScene}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Scene</DialogTitle>
            <DialogDescription>Add a new scene to the storyboard.</DialogDescription>
          </DialogHeader>

          <SceneEditForm
            scene={{
              id: "",
              title: "",
              description: "",
              shots: [],
            }}
            isNew={true}
            onSave={saveNewScene}
            onCancel={() => setAddingScene(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {confirmDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Customizer Dialog */}
      <Dialog open={showTemplateCustomizer} onOpenChange={setShowTemplateCustomizer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <TemplateCustomizer onClose={() => setShowTemplateCustomizer(false)} />
        </DialogContent>
      </Dialog>

      {/* Annotation Tools Dialog */}
      <Dialog open={showAnnotationTools} onOpenChange={setShowAnnotationTools}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <AnnotationTools
            activeSceneId={storyboardData.scenes[currentShot.sceneIndex].id}
            activeShotId={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id}
            onClose={() => setShowAnnotationTools(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Shot Edit Form Component
function ShotEditForm({
  shot,
  isNew = false,
  onSave,
  onCancel,
}: {
  shot: any
  isNew?: boolean
  onSave: (shot: any) => void
  onCancel: () => void
}) {
  const [editedShot, setEditedShot] = useState({ ...shot })

  const updateField = (field: string, value: any) => {
    setEditedShot({ ...editedShot, [field]: value })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="shot-description">Description</Label>
          <Textarea
            id="shot-description"
            value={editedShot.shotDescription}
            onChange={(e) => updateField("shotDescription", e.target.value)}
            className="h-24"
          />
        </div>

        <div>
          <Label htmlFor="shot-type">Shot Type</Label>
          <Select value={editedShot.shotType} onValueChange={(value) => updateField("shotType", value)}>
            <SelectTrigger id="shot-type">
              <SelectValue placeholder="Select shot type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHOT_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="camera-angle">Camera Angle</Label>
          <Select value={editedShot.cameraAngle} onValueChange={(value) => updateField("cameraAngle", value)}>
            <SelectTrigger id="camera-angle">
              <SelectValue placeholder="Select camera angle" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CAMERA_ANGLES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="camera-movement">Camera Movement</Label>
          <Select value={editedShot.cameraMovement} onValueChange={(value) => updateField("cameraMovement", value)}>
            <SelectTrigger id="camera-movement">
              <SelectValue placeholder="Select camera movement" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CAMERA_MOVEMENTS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="lighting">Lighting</Label>
          <Input
            id="lighting"
            value={editedShot.lighting || ""}
            onChange={(e) => updateField("lighting", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="characters">Characters (comma separated)</Label>
          <Input
            id="characters"
            value={editedShot.characters?.join(", ") || ""}
            onChange={(e) => updateField("characters", e.target.value.split(", ").filter(Boolean))}
          />
        </div>

        <div>
          <Label htmlFor="dialogue">Dialogue</Label>
          <Input
            id="dialogue"
            value={editedShot.dialogueSnippet || ""}
            onChange={(e) => updateField("dialogueSnippet", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="audio">Audio/Sound</Label>
          <Input id="audio" value={editedShot.audio || ""} onChange={(e) => updateField("audio", e.target.value)} />
        </div>

        <div>
          <Label htmlFor="notes">Director's Notes</Label>
          <Textarea
            id="notes"
            value={editedShot.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            className="h-24"
          />
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(editedShot)}>{isNew ? "Add Shot" : "Save Changes"}</Button>
      </div>
    </div>
  )
}

// Scene Edit Form Component
function SceneEditForm({
  scene,
  isNew = false,
  onSave,
  onCancel,
}: {
  scene: any
  isNew?: boolean
  onSave: (scene: any) => void
  onCancel: () => void
}) {
  const [editedScene, setEditedScene] = useState({ ...scene })

  const updateField = (field: string, value: any) => {
    setEditedScene({ ...editedScene, [field]: value })
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="scene-title">Title</Label>
        <Input id="scene-title" value={editedScene.title} onChange={(e) => updateField("title", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="scene-description">Description</Label>
        <Textarea
          id="scene-description"
          value={editedScene.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="h-24"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(editedScene)}>{isNew ? "Add Scene" : "Save Changes"}</Button>
      </div>
    </div>
  )
}
