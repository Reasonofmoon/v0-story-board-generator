"use client"

import { useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { History, Save, MoreHorizontal, Check, ArrowLeft, Trash, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function VersionHistory() {
  const { versionHistory, currentVersionIndex, saveVersion, loadVersion, deleteVersion, storyboardData } =
    useStoryboard()

  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [versionName, setVersionName] = useState("")
  const [versionDescription, setVersionDescription] = useState("")

  const handleSaveVersion = () => {
    if (!versionName.trim()) return

    saveVersion(versionName, versionDescription)
    setVersionName("")
    setVersionDescription("")
    setShowVersionDialog(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (!storyboardData) return null

  return (
    <>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowVersionDialog(true)} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Version
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistoryDialog(true)}
          className="flex items-center"
          disabled={versionHistory.length === 0}
        >
          <History className="h-4 w-4 mr-2" />
          Version History
          {versionHistory.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {versionHistory.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Save Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Save the current state of your storyboard as a version you can return to later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="version-name" className="text-right">
                Version Name
              </label>
              <Input
                id="version-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., First Draft, After Client Feedback"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="version-description" className="text-right">
                Description
              </label>
              <Textarea
                id="version-description"
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                placeholder="Optional description of this version"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVersion} disabled={!versionName.trim()}>
              Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>View and restore previous versions of your storyboard.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versionHistory.map((version, index) => (
                  <TableRow key={version.id} className={index === currentVersionIndex ? "bg-muted" : ""}>
                    <TableCell>
                      {index === currentVersionIndex && <Check className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell className="font-medium">{version.name}</TableCell>
                    <TableCell>{formatDate(version.timestamp)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{version.description || "No description"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {index !== currentVersionIndex && (
                            <DropdownMenuItem
                              onClick={() => {
                                loadVersion(index)
                                setShowHistoryDialog(false)
                              }}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Restore this version
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              // Create a duplicate of this version with a new name
                              const newName = `Copy of ${version.name}`
                              saveVersion(newName, `Copy of version from ${formatDate(version.timestamp)}`)
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteVersion(index)}
                            className="text-red-600"
                            disabled={versionHistory.length <= 1}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {versionHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No versions saved yet. Save a version to track changes to your storyboard.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
