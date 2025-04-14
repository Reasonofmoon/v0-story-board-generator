"use client"

import { useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, FileIcon as FileNew, Download, Upload, Menu } from "lucide-react"

interface HeaderProps {
  onTabChange: (tab: string) => void
}

export default function Header({ onTabChange }: HeaderProps) {
  const { storyboardData, saveProject, createNewProject, loadProject, projectSaved } = useStoryboard()

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [projectId, setProjectId] = useState("")

  const handleNew = () => {
    setShowNewDialog(true)
  }

  const handleSave = () => {
    if (storyboardData) {
      saveProject()
    } else {
      setShowSaveDialog(true)
    }
  }

  const handleLoad = () => {
    setShowLoadDialog(true)
  }

  const confirmNew = () => {
    createNewProject()
    setShowNewDialog(false)
    onTabChange("input")
  }

  const confirmLoad = () => {
    if (projectId) {
      loadProject(projectId)
      setShowLoadDialog(false)
      onTabChange("storyboard")
    }
  }

  return (
    <header className="bg-emerald-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Storyboard Visualization Dashboard</h1>

        <div className="flex items-center space-x-4">
          <Button variant="outline" className="bg-white text-emerald-600 hover:bg-gray-100" onClick={handleNew}>
            <FileNew className="mr-2 h-4 w-4" />
            New Project
          </Button>

          <Button
            variant={projectSaved ? "outline" : "default"}
            className={
              projectSaved
                ? "bg-white text-emerald-600 hover:bg-gray-100"
                : "bg-emerald-700 text-white hover:bg-emerald-800"
            }
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            {projectSaved ? "Saved" : "Save"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white text-emerald-600 hover:bg-gray-100">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleLoad}>
                <Upload className="mr-2 h-4 w-4" />
                Load Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("export")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to create a new project? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmNew}>Create New Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Project Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>Enter the ID of the project you want to load.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-id" className="text-right">
                Project ID
              </Label>
              <Input
                id="project-id"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLoad}>Load Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
