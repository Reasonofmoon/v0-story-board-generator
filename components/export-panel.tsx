"use client"

import { useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, ImageIcon, Download, Printer, Code, Copy, FileDown, Eye } from "lucide-react"
import { PDFExportService } from "@/lib/pdf-export-service"
import { HTMLExportService } from "@/lib/html-export-service"
import PrintPreview from "./print-preview/print-preview"

export default function ExportPanel() {
  const { storyboardData, exportOptions, updateExportOption } = useStoryboard()
  const [exportTab, setExportTab] = useState("pdf")
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">("idle")
  const [exportMessage, setExportMessage] = useState("")
  const [htmlExport, setHtmlExport] = useState<{ html: string; css: string } | null>(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [pdfSettings, setPdfSettings] = useState({
    pageSize: "a4",
    orientation: "portrait",
    margin: 20,
    imagePlaceholderSize: 50, // percentage of available width
  })
  const [htmlSettings, setHtmlSettings] = useState({
    responsive: true,
    darkMode: false,
    embedCss: true,
    imageSize: "medium", // small, medium, large
  })

  if (!storyboardData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <p className="text-gray-500">No storyboard generated yet. Please go to the Story Input tab to create one.</p>
      </div>
    )
  }

  if (showPrintPreview) {
    return <PrintPreview onClose={() => setShowPrintPreview(false)} />
  }

  const handleExportPDF = async () => {
    setExportStatus("exporting")
    setExportMessage("Preparing PDF export...")

    try {
      const pdfService = new PDFExportService()
      const pdfBlob = await pdfService.generatePDF(storyboardData, {
        ...exportOptions,
        format: "pdf",
        // Add PDF-specific settings
        pdfSettings: {
          pageSize: pdfSettings.pageSize,
          orientation: pdfSettings.orientation,
          margin: pdfSettings.margin,
          imagePlaceholderSize: pdfSettings.imagePlaceholderSize,
        },
      })

      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${storyboardData.title.replace(/\s+/g, "_")}_storyboard.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setExportStatus("success")
      setExportMessage("Storyboard exported successfully as PDF")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      setExportStatus("error")
      setExportMessage("Error exporting storyboard as PDF. Please try again.")
    }
  }

  const handleExportHTML = async () => {
    setExportStatus("exporting")
    setExportMessage("Preparing HTML/CSS export...")

    try {
      const htmlService = new HTMLExportService()
      const { html, css } = htmlService.generateHTML(storyboardData, {
        ...exportOptions,
        format: "html",
        // Add HTML-specific settings
        htmlSettings: {
          responsive: htmlSettings.responsive,
          darkMode: htmlSettings.darkMode,
          embedCss: htmlSettings.embedCss,
          imageSize: htmlSettings.imageSize,
        },
      })

      setHtmlExport({ html, css })

      setExportStatus("success")
      setExportMessage("Storyboard exported successfully as HTML/CSS")
    } catch (error) {
      console.error("Error exporting HTML:", error)
      setExportStatus("error")
      setExportMessage("Error exporting storyboard as HTML/CSS. Please try again.")
    }
  }

  const handleDownloadHTML = () => {
    if (!htmlExport) return

    // Create HTML file with embedded CSS
    const fullHtml = htmlExport.html.replace(
      "<style>\n    /* CSS will be included here or linked externally */\n  </style>",
      `<style>\n${htmlExport.css}\n  </style>`,
    )

    // Create a download link for the HTML
    const blob = new Blob([fullHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${storyboardData.title.replace(/\s+/g, "_")}_storyboard.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadCSS = () => {
    if (!htmlExport) return

    // Create a download link for the CSS
    const blob = new Blob([htmlExport.css], { type: "text/css" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${storyboardData.title.replace(/\s+/g, "_")}_storyboard.css`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setExportMessage("Copied to clipboard!")
        setTimeout(() => {
          if (exportStatus === "success") {
            setExportMessage("Storyboard exported successfully")
          }
        }, 2000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        setExportMessage("Failed to copy to clipboard")
      })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Export Storyboard</h2>

      <Tabs value={exportTab} onValueChange={setExportTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pdf" onClick={() => updateExportOption("format", "pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Export
          </TabsTrigger>
          <TabsTrigger value="html" onClick={() => updateExportOption("format", "html")}>
            <Code className="h-4 w-4 mr-2" />
            HTML/CSS Export
          </TabsTrigger>
          <TabsTrigger value="images" onClick={() => updateExportOption("format", "images")}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Image Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>PDF Export</CardTitle>
              <CardDescription>
                Export your storyboard as a printable PDF document with all shots and information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="page-size">Page Size</Label>
                    <Select
                      value={pdfSettings.pageSize}
                      onValueChange={(value) => setPdfSettings({ ...pdfSettings, pageSize: value })}
                    >
                      <SelectTrigger id="page-size">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="tabloid">Tabloid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <RadioGroup
                      value={pdfSettings.orientation}
                      onValueChange={(value: "portrait" | "landscape") =>
                        setPdfSettings({ ...pdfSettings, orientation: value })
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="portrait" />
                        <Label htmlFor="portrait">Portrait</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="landscape" />
                        <Label htmlFor="landscape">Landscape</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="margin">Margin (mm)</Label>
                      <span className="text-sm text-gray-500">{pdfSettings.margin}mm</span>
                    </div>
                    <Slider
                      id="margin"
                      min={10}
                      max={30}
                      step={1}
                      value={[pdfSettings.margin]}
                      onValueChange={(value) => setPdfSettings({ ...pdfSettings, margin: value[0] })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="image-size">Image Placeholder Size</Label>
                      <span className="text-sm text-gray-500">{pdfSettings.imagePlaceholderSize}%</span>
                    </div>
                    <Slider
                      id="image-size"
                      min={30}
                      max={70}
                      step={5}
                      value={[pdfSettings.imagePlaceholderSize]}
                      onValueChange={(value) => setPdfSettings({ ...pdfSettings, imagePlaceholderSize: value[0] })}
                    />
                  </div>

                  <div className="flex items-start space-x-2 pt-4">
                    <Checkbox
                      id="include-notes-pdf"
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(checked) => updateExportOption("includeNotes", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-notes-pdf">Include director's notes</Label>
                      <p className="text-sm text-muted-foreground">Add detailed director's notes for each shot</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-prompts-pdf"
                      checked={exportOptions.includePrompts}
                      onCheckedChange={(checked) => updateExportOption("includePrompts", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-prompts-pdf">Include AI prompts</Label>
                      <p className="text-sm text-muted-foreground">Add the AI prompts used to generate each shot</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-metadata-pdf"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => updateExportOption("includeMetadata", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-metadata-pdf">Include metadata</Label>
                      <p className="text-sm text-muted-foreground">
                        Add project metadata like title, author, date, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowPrintPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Print Preview
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="html">
          <Card>
            <CardHeader>
              <CardTitle>HTML/CSS Export</CardTitle>
              <CardDescription>
                Export your storyboard as HTML and CSS code for web viewing or further customization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-size-html">Image Placeholder Size</Label>
                    <Select
                      value={htmlSettings.imageSize}
                      onValueChange={(value: "small" | "medium" | "large") =>
                        setHtmlSettings({ ...htmlSettings, imageSize: value })
                      }
                    >
                      <SelectTrigger id="image-size-html">
                        <SelectValue placeholder="Select image size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="responsive"
                      checked={htmlSettings.responsive}
                      onCheckedChange={(checked) => setHtmlSettings({ ...htmlSettings, responsive: !!checked })}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="responsive">Responsive design</Label>
                      <p className="text-sm text-muted-foreground">Optimize for different screen sizes</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="dark-mode"
                      checked={htmlSettings.darkMode}
                      onCheckedChange={(checked) => setHtmlSettings({ ...htmlSettings, darkMode: !!checked })}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="dark-mode">Dark mode</Label>
                      <p className="text-sm text-muted-foreground">Use dark color scheme</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="embed-css"
                      checked={htmlSettings.embedCss}
                      onCheckedChange={(checked) => setHtmlSettings({ ...htmlSettings, embedCss: !!checked })}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="embed-css">Embed CSS</Label>
                      <p className="text-sm text-muted-foreground">Include CSS directly in the HTML file</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-notes-html"
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(checked) => updateExportOption("includeNotes", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-notes-html">Include director's notes</Label>
                      <p className="text-sm text-muted-foreground">Add detailed director's notes for each shot</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-prompts-html"
                      checked={exportOptions.includePrompts}
                      onCheckedChange={(checked) => updateExportOption("includePrompts", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-prompts-html">Include AI prompts</Label>
                      <p className="text-sm text-muted-foreground">Add the AI prompts used to generate each shot</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-metadata-html"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => updateExportOption("includeMetadata", !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include-metadata-html">Include metadata</Label>
                      <p className="text-sm text-muted-foreground">
                        Add project metadata like title, author, date, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {htmlExport && (
                <div className="mt-6 space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">HTML Code</h3>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(htmlExport.html)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md max-h-40 overflow-auto">
                      <pre className="text-xs">
                        <code>{htmlExport.html.substring(0, 500)}...</code>
                      </pre>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">CSS Code</h3>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(htmlExport.css)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md max-h-40 overflow-auto">
                      <pre className="text-xs">
                        <code>{htmlExport.css.substring(0, 500)}...</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleDownloadHTML}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>
                    <Button variant="outline" onClick={handleDownloadCSS}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download CSS
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleExportHTML}>
                <Code className="h-4 w-4 mr-2" />
                Generate HTML/CSS
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Image Export</CardTitle>
              <CardDescription>Export your storyboard as a series of high-resolution images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="high-res"
                  checked={exportOptions.highResolution}
                  onCheckedChange={(checked) => updateExportOption("highResolution", !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="high-res">High resolution</Label>
                  <p className="text-sm text-muted-foreground">Export images at maximum resolution</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="include-text"
                  checked={exportOptions.includeText}
                  onCheckedChange={(checked) => updateExportOption("includeText", !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="include-text">Include text overlay</Label>
                  <p className="text-sm text-muted-foreground">Add shot information as text overlay on images</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="organize-folders"
                  checked={exportOptions.organizeByScenesInFolders}
                  onCheckedChange={(checked) => updateExportOption("organizeByScenesInFolders", !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="organize-folders">Organize by scenes</Label>
                  <p className="text-sm text-muted-foreground">Create separate folders for each scene</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-format">Image Format</Label>
                <Select defaultValue="png">
                  <SelectTrigger id="image-format">
                    <SelectValue placeholder="Select image format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => {
                  setExportStatus("exporting")
                  setExportMessage("Preparing image export...")

                  // Simulate export process
                  setTimeout(() => {
                    setExportStatus("success")
                    setExportMessage("Storyboard exported successfully as images")
                  }, 2000)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Images
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export status message */}
      {exportStatus !== "idle" && (
        <div
          className={`mt-6 p-4 rounded-md ${
            exportStatus === "exporting"
              ? "bg-blue-50 text-blue-700"
              : exportStatus === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          <p>{exportMessage}</p>
        </div>
      )}
    </div>
  )
}
