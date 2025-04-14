"use client"

import { useState, useRef, useEffect } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, Download, Save, RotateCcw } from "lucide-react"
import { PAGE_DIMENSIONS, type PrintSettings, type PrintPreviewPage } from "@/lib/types"
import PrintPreviewPageComponent from "./print-preview-page"
import PrintSettingsPanel from "./print-settings-panel"

const defaultPrintSettings: PrintSettings = {
  pageSize: "a4",
  orientation: "portrait",
  margins: {
    top: 15,
    right: 15,
    bottom: 15,
    left: 15,
  },
  scale: 100,
  shotsPerPage: 2,
  includeNotes: true,
  includePrompts: false,
  includeMetadata: true,
  headerFooter: true,
  pageNumbers: true,
  imageQuality: "standard",
  layout: "grid",
  customLayout: false,
}

interface PrintPreviewProps {
  onClose?: () => void
}

export default function PrintPreview({ onClose }: PrintPreviewProps) {
  const { storyboardData, exportOptions, updateExportOption } = useStoryboard()
  const [printSettings, setPrintSettings] = useState<PrintSettings>(exportOptions.printSettings || defaultPrintSettings)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [previewPages, setPreviewPages] = useState<PrintPreviewPage[]>([])
  const [activeTab, setActiveTab] = useState<"preview" | "settings">("preview")
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Update export options when print settings change
  useEffect(() => {
    updateExportOption("printSettings", printSettings)
  }, [printSettings, updateExportOption])

  // Generate preview pages based on storyboard data and print settings
  useEffect(() => {
    if (!storyboardData) return

    const pages: PrintPreviewPage[] = []
    let currentPageShots: PrintPreviewPage["shots"] = []
    let currentPageNumber = 1
    let currentSceneHeader: PrintPreviewPage["sceneHeader"] | undefined

    // Calculate shots per page based on layout
    const shotsPerPage = printSettings.layout === "detailed" ? 1 : printSettings.shotsPerPage

    storyboardData.scenes.forEach((scene, sceneIndex) => {
      // Check if we need a page break before this scene
      if (scene.printPageBreakBefore && currentPageShots.length > 0) {
        pages.push({
          pageNumber: currentPageNumber,
          shots: [...currentPageShots],
          sceneHeader: currentSceneHeader,
        })
        currentPageShots = []
        currentPageNumber++
        currentSceneHeader = undefined
      }

      // Add scene header to current page
      currentSceneHeader = {
        sceneId: scene.id,
        position: { x: 0, y: 0 }, // Position will be calculated in the page component
      }

      scene.shots.forEach((shot, shotIndex) => {
        // Add shot to current page
        currentPageShots.push({
          shotId: shot.id,
          sceneId: scene.id,
          position: shot.printPosition || { x: 0, y: 0 }, // Use saved position or default
          scale: shot.printScale || 1, // Use saved scale or default
        })

        // Check if we need to start a new page
        if (currentPageShots.length >= shotsPerPage) {
          pages.push({
            pageNumber: currentPageNumber,
            shots: [...currentPageShots],
            sceneHeader: currentSceneHeader,
          })
          currentPageShots = []
          currentPageNumber++
          currentSceneHeader = undefined
        }
      })
    })

    // Add any remaining shots to the last page
    if (currentPageShots.length > 0) {
      pages.push({
        pageNumber: currentPageNumber,
        shots: [...currentPageShots],
        sceneHeader: currentSceneHeader,
      })
    }

    setPreviewPages(pages)
    setTotalPages(pages.length)
    setCurrentPage(1) // Reset to first page when regenerating
  }, [storyboardData, printSettings.layout, printSettings.shotsPerPage])

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle zoom
  const zoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200))
  }

  const zoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 50))
  }

  const resetZoom = () => {
    setZoomLevel(100)
  }

  // Update print settings
  const updatePrintSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setPrintSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateMargin = (side: "top" | "right" | "bottom" | "left", value: number) => {
    setPrintSettings((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [side]: value,
      },
    }))
  }

  // Calculate page dimensions based on settings
  const getPageDimensions = () => {
    const dimensions = PAGE_DIMENSIONS[printSettings.pageSize]
    return printSettings.orientation === "portrait"
      ? { width: dimensions.width, height: dimensions.height }
      : { width: dimensions.height, height: dimensions.width }
  }

  // Generate PDF with current settings
  const handleGeneratePDF = async () => {
    // This will be implemented in the PDF export service
    console.log("Generating PDF with settings:", printSettings)
    // TODO: Call PDF export service with current settings
  }

  // Save current layout as default
  const saveLayoutAsDefault = () => {
    // TODO: Save current layout to storyboard data
    console.log("Saving layout as default")
  }

  if (!storyboardData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <p className="text-gray-500">No storyboard generated yet. Please go to the Story Input tab to create one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 p-4 rounded-t-lg border-b border-gray-300">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Print Preview</h2>
          <div className="flex space-x-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "preview" | "settings")}>
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoomLevel <= 50}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{zoomLevel}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoomLevel >= 200}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={saveLayoutAsDefault}>
              <Save className="h-4 w-4 mr-1" />
              Save Layout
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button onClick={handleGeneratePDF}>
              <Download className="h-4 w-4 mr-1" />
              Generate PDF
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        <div className="flex">
          {activeTab === "preview" ? (
            <div ref={previewContainerRef} className="flex-1 flex justify-center items-start min-h-[calc(100vh-250px)]">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease",
                }}
              >
                {previewPages.length > 0 && currentPage <= previewPages.length && (
                  <PrintPreviewPageComponent
                    page={previewPages[currentPage - 1]}
                    printSettings={printSettings}
                    storyboardData={storyboardData}
                  />
                )}
              </div>
            </div>
          ) : (
            <PrintSettingsPanel
              printSettings={printSettings}
              updatePrintSetting={updatePrintSetting}
              updateMargin={updateMargin}
            />
          )}
        </div>
      </div>
    </div>
  )
}
