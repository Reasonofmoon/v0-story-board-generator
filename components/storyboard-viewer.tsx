/* @jsxImportSource react */
"use client"

import { useRef, useState, type RefObject } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Edit,
  Plus,
  Trash,
  Copy,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { SHOT_TYPES, CAMERA_ANGLES, CAMERA_MOVEMENTS } from "@/lib/types"
import VersionHistory from "./version-history"
import SortableSceneList from "./dnd/sortable-scene-list"
import InlineEditField from "./editable/inline-edit-field"
import ImageUpload from "./editable/image-upload"
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import AnnotationTools from './annotation-tools';
import Canvas from "./Canvas";
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
  const [regenerating, setRegenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "scene" | "shot"
    id: string
  } | null>(null)
  const [showAnnotationTools, setShowAnnotationTools] = useState(false);

  const [viewMode, setViewMode] = useState<"single" | "edit">("single")
  const [activeScene, setActiveScene] = useState(0)
  const [currentShot, setCurrentShot] = useState({ sceneIndex: 0, shotIndex: 0 })
  const [editingShot, setEditingShot] = useState(false)
  const [editingScene, setEditingScene] = useState(false)
  const [addingShot, setAddingShot] = useState(false)
  const [addingScene, setAddingScene] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef: RefObject<HTMLCanvasElement> = useRef(null);

  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})

  if (!storyboardData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <p className="text-gray-500">No storyboard generated yet. Please go to the Story Input tab to create one.</p>
      </div>
    )
  }
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
        setConfirmDelete({
            type: "shot",
            id: shotId,
        })
        // Don't allow deleting the last shot in a scene
      setConfirmDelete({
        type: "shot",
        id: shotId,
      })
      return
    }

    if (storyboardData.scenes[currentShot.sceneIndex].shots.length <= 1) {
      return
    }
    setConfirmDelete({
      type: "shot",
      id: storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].id,
    });
  }
  const handleDeleteScene = () => {

    setConfirmDelete({
      type: "scene",
      id: storyboardData.scenes[currentShot.sceneIndex].id,
    });
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
    
  const handleRegenerateCurrentShot = async () => {
    setRegenerating(true);
    const scene = storyboardData.scenes[currentShot.sceneIndex];
    const shot = scene.shots[currentShot.shotIndex];
    await regenerateShot(scene.id, shot.id);

    // Set regenerating back to false after the image is updated
    setRegenerating(false);
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
    <div>
    <div className="flex flex-col h-full">      
        {/* Storyboard header */}
        <div className="bg-gray-100 p-4 rounded-t-lg border-b border-gray-300">
          <div className="flex justify-between items-center">

            <div>
              <h2 className="text-xl font-bold">{storyboardData.title}</h2>
              <div className="flex text-sm text-gray-600 mt-1">
                {storyboardData.director && <span className="mr-4">Director: {storyboardData.director}</span>}{storyboardData.author && <span className="mr-4">Author: {storyboardData.author}</span>}
                <span>Version: {storyboardData.version}</span>
              </div>
          <div className="flex justify-between items-center">
            <VersionHistory />

            <Button variant={viewMode === "edit" ? "default" : "outline"} onClick={() => setViewMode("edit")} size="sm" className="ml-4">
              <Edit className="h-4 w-4 mr-2" />
              Edit View
            </Button>
          </div>
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
          ) : (
            <div className="p-4 flex flex-col h-full">
              {/* Current shot detail view */}
              <div className="flex mb-4 items-center">
                <Button variant="outline" size="icon" onClick={goToPrevShot} disabled={currentShot.shotIndex === 0 && currentShot.sceneIndex === 0}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="bg-gray-100 px-4 py-2 flex-1 text-center rounded-md mx-2">
                  <InlineEditField
                    value={storyboardData.scenes[currentShot.sceneIndex].title}
                    onSave={handleUpdateSceneTitle}
                    className="font-medium" />              
                  <span> - Shot {currentShot.shotIndex + 1}</span>
              </div>
  
              <div className="flex-1 grid grid-cols-1 gap-6">
                  {/* Shot info */}
                <div className="bg-white rounded-lg border border-gray-300 p-4 overflow-auto">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={handleRegenerateCurrentShot} disabled={regenerating}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${regenerating ? "animate-spin" : ""}`} />
                        Regenerate
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
                  <div className="flex items-center space-x-4">
                    <h4 className="font-medium text-gray-700">Description</h4>
                    <InlineEditField
                    value={storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].shotDescription}
                    onSave={handleUpdateShotDescription}
                    multiline
                    className="text-gray-800 mt-1" 
                    />
                  </div>
  
                  <div className="mb-3 grid grid-cols-2 gap-3">
  
                    <h4 className="font-medium text-gray-700 mt-4">Shot Type</h4>
                      {SHOT_TYPES[storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].shotType]}
  
                    <h4 className="font-medium text-gray-700 mt-4">Camera Angle</h4>
                      {
                        CAMERA_ANGLES[
                          storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].cameraAngle
                        ]
                      }
  
  
                    <h4 className="font-medium text-gray-700 mt-4">Camera Movement</h4>
                      {
                        CAMERA_MOVEMENTS[
                          storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].cameraMovement
                        ]
                      }
  
                    <h4 className="font-medium text-gray-700 mt-4">Lighting</h4>
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].lighting}
  
                    <h4 className="font-medium text-gray-700 mt-4">Characters</h4>
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].characters?.join(
                        ", ",
                      ) || "None"}
  
                    <h4 className="font-medium text-gray-700 mt-4">Location</h4>
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].location ||
                        "Not specified"}
  
                    <h4 className="font-medium text-gray-700 mt-4">Time of Day</h4>
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].timeOfDay ||
                        "Not specified"}
  
                    <h4 className="font-medium text-gray-700 mt-4">Audio/Sound</h4>
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].audio ||
                        "Not specified"}
   
                  </div>
                  
                  {
                  storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].dialogueSnippet && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-700">Dialogue</h4>
                      <p className="text-gray-800 italic">
                        "{storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].dialogueSnippet}"
                      </p>
                    </div>
                  )
                  }
  
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700">Director's Notes:</h4>
                    <p className="text-gray-800">
                      {storyboardData.scenes[currentShot.sceneIndex].shots[currentShot.shotIndex].notes ||
                        "No notes available"}
                      </p>
                  <div className="mb-3 bg-gray-100 p-3 rounded-md">
                    <h4 className="font-medium text-gray-700">AI Prompt</h4>
                    <p className="text-gray-800 font-mono text-sm">
                    
                    </p>
                  </div>
                </div>
                </div>
                    
                <div className="w-full h-[300px] relative border border-gray-300 rounded-md">
                  <Canvas ref={canvasRef} />
                </div>
                
                <Button variant="outline" size="icon" onClick={goToNextShot} disabled={currentShot.shotIndex === storyboardData.scenes[currentShot.sceneIndex].shots.length -1 && currentShot.sceneIndex === storyboardData.scenes.length-1} className="mt-4">
                  <ChevronRight className="h-4 w-4" />
                </Button>
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