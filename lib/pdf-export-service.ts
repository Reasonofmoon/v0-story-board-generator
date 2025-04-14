import { jsPDF } from "jspdf"
import type { StoryboardData, SceneInfo, ShotInfo, ExportOptions, PrintSettings } from "./types"

/**
 * PDF Export Service
 * Handles the generation of PDF files from storyboard data
 */
export class PDFExportService {
  /**
   * Generate a PDF from storyboard data
   * @param storyboardData Storyboard data
   * @param exportOptions Export options
   * @returns PDF document as Blob
   */
  async generatePDF(storyboardData: StoryboardData, exportOptions: ExportOptions): Promise<Blob> {
    // Use print settings if available, otherwise use default settings
    const printSettings = exportOptions.printSettings || {
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

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: printSettings.orientation,
      unit: "mm",
      format: printSettings.pageSize,
    })

    // Add metadata
    doc.setProperties({
      title: storyboardData.title,
      author: storyboardData.author || "AI Storyboard Generator",
      creator: "AI Storyboard Visualization Dashboard",
      subject: "Storyboard",
      keywords: "storyboard, film, animation",
    })

    // Set default font
    doc.setFont("helvetica")

    // Add title page
    this.addTitlePage(doc, storyboardData, printSettings)

    // Calculate printable area
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const printableArea = {
      x: printSettings.margins.left,
      y: printSettings.margins.top,
      width: pageWidth - printSettings.margins.left - printSettings.margins.right,
      height: pageHeight - printSettings.margins.top - printSettings.margins.bottom,
    }

    // Add scenes and shots
    let currentPage = 1
    let currentY = printSettings.margins.top

    for (let i = 0; i < storyboardData.scenes.length; i++) {
      const scene = storyboardData.scenes[i]

      // Add scene header
      if (i > 0 || scene.shots.length > 0) {
        doc.addPage()
        currentPage++
        currentY = printSettings.margins.top
      }

      // Add scene header if enabled
      if (printSettings.headerFooter) {
        this.addSceneHeader(doc, scene, i + 1, printSettings, printableArea)
        currentY += 15 // Add space after header
      }

      // Determine layout for shots
      if (printSettings.customLayout) {
        // Use custom layout positions if available
        for (let j = 0; j < scene.shots.length; j++) {
          const shot = scene.shots[j]

          // Check if we need a new page based on custom position
          if (shot.printPosition && shot.printPosition.y + currentY > pageHeight - printSettings.margins.bottom) {
            doc.addPage()
            currentPage++
            currentY = printSettings.margins.top

            // Add scene header on new page if enabled
            if (printSettings.headerFooter) {
              this.addSceneHeader(doc, scene, i + 1, printSettings, printableArea)
              currentY += 15
            }
          }

          // Add shot with custom position and scale
          const shotX = printSettings.margins.left + (shot.printPosition?.x || 0)
          const shotY = currentY + (shot.printPosition?.y || 0)
          const scale = shot.printScale || 1

          this.addShot(doc, shot, j + 1, shotX, shotY, printSettings, scale)
        }
      } else if (printSettings.layout === "detailed") {
        // Detailed layout - one shot per page
        for (let j = 0; j < scene.shots.length; j++) {
          if (j > 0) {
            doc.addPage()
            currentPage++
            currentY = printSettings.margins.top

            // Add scene header on new page if enabled
            if (printSettings.headerFooter) {
              this.addSceneHeader(doc, scene, i + 1, printSettings, printableArea)
              currentY += 15
            }
          }

          const shot = scene.shots[j]
          this.addDetailedShot(doc, shot, j + 1, printSettings, printableArea, currentY)
        }
      } else if (printSettings.layout === "grid") {
        // Grid layout
        const columns = Math.min(printSettings.shotsPerPage, 3) // Max 3 columns
        const rows = Math.ceil(printSettings.shotsPerPage / columns)
        const colWidth = printableArea.width / columns
        const rowHeight = Math.min(colWidth * 0.75, (printableArea.height - currentY) / rows) // Maintain aspect ratio

        for (let j = 0; j < scene.shots.length; j++) {
          const col = j % columns
          const row = Math.floor(j / columns) % rows

          // Check if we need a new page
          if (row === 0 && col === 0 && j > 0) {
            doc.addPage()
            currentPage++
            currentY = printSettings.margins.top

            // Add scene header on new page if enabled
            if (printSettings.headerFooter) {
              this.addSceneHeader(doc, scene, i + 1, printSettings, printableArea)
              currentY += 15
            }
          }

          const shotX = printSettings.margins.left + col * colWidth
          const shotY = currentY + row * rowHeight

          this.addShot(doc, scene.shots[j], j + 1, shotX, shotY, printSettings)
        }
      } else {
        // List layout
        const shotHeight = 40 // Fixed height for list items

        for (let j = 0; j < scene.shots.length; j++) {
          // Check if we need a new page
          if (currentY + shotHeight > pageHeight - printSettings.margins.bottom) {
            doc.addPage()
            currentPage++
            currentY = printSettings.margins.top

            // Add scene header on new page if enabled
            if (printSettings.headerFooter) {
              this.addSceneHeader(doc, scene, i + 1, printSettings, printableArea)
              currentY += 15
            }
          }

          this.addListShot(doc, scene.shots[j], j + 1, printSettings, printableArea, currentY)
          currentY += shotHeight + 5 // Add spacing between shots
        }
      }
    }

    // Add page numbers if enabled
    if (printSettings.pageNumbers) {
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(
          `Page ${i} of ${totalPages}`,
          doc.internal.pageSize.getWidth() - 30,
          doc.internal.pageSize.getHeight() - 10,
        )
      }
    }

    // Return the PDF as a blob
    return doc.output("blob")
  }

  /**
   * Add title page to PDF
   * @param doc PDF document
   * @param storyboardData Storyboard data
   * @param printSettings Print settings
   */
  private addTitlePage(doc: jsPDF, storyboardData: StoryboardData, printSettings: PrintSettings): void {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Add title
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text(storyboardData.title, pageWidth / 2, 60, { align: "center" })

    // Add subtitle
    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    doc.text("Storyboard", pageWidth / 2, 75, { align: "center" })

    // Add metadata if enabled
    if (printSettings.includeMetadata) {
      doc.setFontSize(12)
      const metadataY = 100
      doc.text(`Author: ${storyboardData.author || "Not specified"}`, 20, metadataY)
      doc.text(`Director: ${storyboardData.director || "Not specified"}`, 20, metadataY + 10)
      doc.text(`Date: ${storyboardData.date}`, 20, metadataY + 20)
      doc.text(`Version: ${storyboardData.version}`, 20, metadataY + 30)
      doc.text(`Style: ${storyboardData.style}`, 20, metadataY + 40)
      doc.text(`Aspect Ratio: ${storyboardData.aspectRatio}`, 20, metadataY + 50)
    }

    // Add footer
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Generated by AI Storyboard Visualization Dashboard", pageWidth / 2, pageHeight - 20, { align: "center" })
  }

  /**
   * Add scene header to PDF
   * @param doc PDF document
   * @param scene Scene information
   * @param sceneNumber Scene number
   * @param printSettings Print settings
   * @param printableArea Printable area
   */
  private addSceneHeader(
    doc: jsPDF,
    scene: SceneInfo,
    sceneNumber: number,
    printSettings: PrintSettings,
    printableArea: { x: number; y: number; width: number; height: number },
  ): void {
    // Add scene title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`Scene ${sceneNumber}: ${scene.title}`, printableArea.x, printableArea.y)

    // Add scene description if notes are enabled
    if (printSettings.includeNotes) {
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")

      // Split description into lines to fit the page width
      const lines = doc.splitTextToSize(scene.description, printableArea.width)

      // Add description with a maximum of 3 lines
      const maxLines = Math.min(lines.length, 3)
      doc.text(lines.slice(0, maxLines), printableArea.x, printableArea.y + 10)
    }
  }

  /**
   * Add shot to PDF in standard format
   * @param doc PDF document
   * @param shot Shot information
   * @param shotNumber Shot number
   * @param x X position
   * @param y Y position
   * @param printSettings Print settings
   * @param scale Optional scale factor
   */
  private addShot(
    doc: jsPDF,
    shot: ShotInfo,
    shotNumber: number,
    x: number,
    y: number,
    printSettings: PrintSettings,
    scale = 1,
  ): void {
    // Calculate dimensions based on available space and scale
    const availableWidth = doc.internal.pageSize.getWidth() - printSettings.margins.left - printSettings.margins.right
    const baseWidth = (availableWidth / 2) * scale
    const baseHeight = baseWidth * 0.5625 // 16:9 aspect ratio

    // Add image placeholder
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(x, y, baseWidth, baseHeight, 2, 2, "FD")

    // Add placeholder text
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text("Shot " + shotNumber, x + baseWidth / 2, y + baseHeight / 2, { align: "center" })
    doc.setTextColor(0, 0, 0)

    // Add shot details if notes are enabled
    if (printSettings.includeNotes) {
      const detailsY = y + baseHeight + 5

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(
        `${shot.shotType}: ${shot.shotDescription.substring(0, 30)}${shot.shotDescription.length > 30 ? "..." : ""}`,
        x,
        detailsY,
      )

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(`${shot.cameraAngle}, ${shot.cameraMovement}`, x, detailsY + 5)
    }
  }

  /**
   * Add shot to PDF in detailed format (one shot per page)
   * @param doc PDF document
   * @param shot Shot information
   * @param shotNumber Shot number
   * @param printSettings Print settings
   * @param printableArea Printable area
   * @param startY Starting Y position
   */
  private addDetailedShot(
    doc: jsPDF,
    shot: ShotInfo,
    shotNumber: number,
    printSettings: PrintSettings,
    printableArea: { x: number; y: number; width: number; height: number },
    startY: number,
  ): void {
    // Calculate image dimensions (maintain aspect ratio)
    const imageWidth = printableArea.width
    const imageHeight = imageWidth * 0.5625 // 16:9 aspect ratio

    // Add shot header
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`Shot ${shotNumber}: ${shot.shotType}`, printableArea.x, startY)

    // Add image placeholder
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(printableArea.x, startY + 10, imageWidth, imageHeight, 2, 2, "FD")

    // Add placeholder text
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text("Image Placeholder", printableArea.x + imageWidth / 2, startY + 10 + imageHeight / 2, { align: "center" })
    doc.setTextColor(0, 0, 0)

    // Add shot details
    let detailsY = startY + 10 + imageHeight + 10

    // Add shot description
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Description:", printableArea.x, detailsY)
    doc.setFont("helvetica", "normal")
    const descLines = doc.splitTextToSize(shot.shotDescription, printableArea.width - 30)
    doc.text(descLines, printableArea.x + 30, detailsY)
    detailsY += 10 + (descLines.length - 1) * 5

    // Add camera details
    doc.setFont("helvetica", "bold")
    doc.text("Camera:", printableArea.x, detailsY)
    doc.setFont("helvetica", "normal")
    doc.text(`${shot.cameraAngle}, ${shot.cameraMovement}`, printableArea.x + 30, detailsY)
    detailsY += 10

    // Add lighting
    doc.setFont("helvetica", "bold")
    doc.text("Lighting:", printableArea.x, detailsY)
    doc.setFont("helvetica", "normal")
    doc.text(shot.lighting || "Natural lighting", printableArea.x + 30, detailsY)
    detailsY += 10

    // Add characters if available
    if (shot.characters && shot.characters.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Characters:", printableArea.x, detailsY)
      doc.setFont("helvetica", "normal")
      doc.text(shot.characters.join(", "), printableArea.x + 30, detailsY)
      detailsY += 10
    }

    // Add notes if enabled
    if (printSettings.includeNotes && shot.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("Notes:", printableArea.x, detailsY)
      doc.setFont("helvetica", "normal")
      const noteLines = doc.splitTextToSize(shot.notes, printableArea.width - 30)
      doc.text(noteLines, printableArea.x + 30, detailsY)
      detailsY += 10 + (noteLines.length - 1) * 5
    }

    // Add prompt if enabled
    if (printSettings.includePrompts && shot.prompt) {
      doc.setFont("helvetica", "bold")
      doc.text("AI Prompt:", printableArea.x, detailsY)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      const promptLines = doc.splitTextToSize(shot.prompt, printableArea.width - 30)
      doc.text(promptLines, printableArea.x + 30, detailsY)
    }
  }

  /**
   * Add shot to PDF in list format
   * @param doc PDF document
   * @param shot Shot information
   * @param shotNumber Shot number
   * @param printSettings Print settings
   * @param printableArea Printable area
   * @param startY Starting Y position
   */
  private addListShot(
    doc: jsPDF,
    shot: ShotInfo,
    shotNumber: number,
    printSettings: PrintSettings,
    printableArea: { x: number; y: number; width: number; height: number },
    startY: number,
  ): void {
    // Calculate image dimensions
    const imageWidth = printableArea.width * 0.3
    const imageHeight = imageWidth * 0.5625 // 16:9 aspect ratio

    // Add image placeholder
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(printableArea.x, startY, imageWidth, imageHeight, 2, 2, "FD")

    // Add placeholder text
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Shot " + shotNumber, printableArea.x + imageWidth / 2, startY + imageHeight / 2, { align: "center" })
    doc.setTextColor(0, 0, 0)

    // Add shot details
    const detailsX = printableArea.x + imageWidth + 10
    const detailsWidth = printableArea.width - imageWidth - 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`Shot ${shotNumber}: ${shot.shotType}`, detailsX, startY + 5)

    doc.setFont("helvetica", "normal")
    const descLines = doc.splitTextToSize(shot.shotDescription, detailsWidth)
    doc.text(descLines.slice(0, 2), detailsX, startY + 15)

    doc.setFontSize(8)
    doc.text(`Camera: ${shot.cameraAngle}, ${shot.cameraMovement}`, detailsX, startY + 25)

    if (shot.characters && shot.characters.length > 0) {
      doc.text(`Characters: ${shot.characters.join(", ")}`, detailsX, startY + 30)
    }
  }

  /**
   * Calculate image width based on shot type and aspect ratio
   * @param shotType Shot type
   * @param maxWidth Maximum width
   * @param height Height
   * @returns Calculated width
   */
  private calculateImageWidth(shotType: string, maxWidth: number, height: number): number {
    // Adjust width based on shot type
    switch (shotType) {
      case "ECU":
      case "CU":
      case "MCU":
        return height * 0.8 // More square for close-ups
      case "ELS":
      case "LS":
      case "AERIAL":
        return Math.min(maxWidth * 0.7, height * 1.8) // Wider for establishing shots
      default:
        return Math.min(maxWidth * 0.5, height * 1.33) // Standard 4:3 ratio
    }
  }

  /**
   * Get orientation based on aspect ratio
   * @param aspectRatio Aspect ratio
   * @returns Orientation ("portrait" or "landscape")
   */
  private getOrientation(aspectRatio: string): "portrait" | "landscape" {
    switch (aspectRatio) {
      case "16:9":
      case "2.35:1":
        return "landscape"
      case "9:16":
        return "portrait"
      default:
        return "portrait"
    }
  }
}
