"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Grid, List, Layers } from "lucide-react"
import { PAGE_SIZES, type PrintSettings } from "@/lib/types"

interface PrintSettingsPanelProps {
  printSettings: PrintSettings
  updatePrintSetting: <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => void
  updateMargin: (side: "top" | "right" | "bottom" | "left", value: number) => void
}

export default function PrintSettingsPanel({
  printSettings,
  updatePrintSetting,
  updateMargin,
}: PrintSettingsPanelProps) {
  const resetToDefaults = () => {
    updatePrintSetting("pageSize", "a4")
    updatePrintSetting("orientation", "portrait")
    updateMargin("top", 15)
    updateMargin("right", 15)
    updateMargin("bottom", 15)
    updateMargin("left", 15)
    updatePrintSetting("scale", 100)
    updatePrintSetting("shotsPerPage", 2)
    updatePrintSetting("includeNotes", true)
    updatePrintSetting("includePrompts", false)
    updatePrintSetting("includeMetadata", true)
    updatePrintSetting("headerFooter", true)
    updatePrintSetting("pageNumbers", true)
    updatePrintSetting("imageQuality", "standard")
    updatePrintSetting("layout", "grid")
    updatePrintSetting("customLayout", false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs defaultValue="page">
        <TabsList className="mb-4 grid grid-cols-4 w-full">
          <TabsTrigger value="page">Page Setup</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="page">
          <Card>
            <CardHeader>
              <CardTitle>Page Setup</CardTitle>
              <CardDescription>Configure the page size, orientation, and margins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-size">Page Size</Label>
                  <Select
                    value={printSettings.pageSize}
                    onValueChange={(value) => updatePrintSetting("pageSize", value as any)}
                  >
                    <SelectTrigger id="page-size">
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAGE_SIZES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <RadioGroup
                    value={printSettings.orientation}
                    onValueChange={(value) => updatePrintSetting("orientation", value as "portrait" | "landscape")}
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
              </div>

              <div className="space-y-4">
                <Label>Margins (mm)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="margin-top">Top</Label>
                      <span className="text-sm text-gray-500">{printSettings.margins.top}mm</span>
                    </div>
                    <Slider
                      id="margin-top"
                      min={5}
                      max={50}
                      step={1}
                      value={[printSettings.margins.top]}
                      onValueChange={(value) => updateMargin("top", value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="margin-right">Right</Label>
                      <span className="text-sm text-gray-500">{printSettings.margins.right}mm</span>
                    </div>
                    <Slider
                      id="margin-right"
                      min={5}
                      max={50}
                      step={1}
                      value={[printSettings.margins.right]}
                      onValueChange={(value) => updateMargin("right", value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="margin-bottom">Bottom</Label>
                      <span className="text-sm text-gray-500">{printSettings.margins.bottom}mm</span>
                    </div>
                    <Slider
                      id="margin-bottom"
                      min={5}
                      max={50}
                      step={1}
                      value={[printSettings.margins.bottom]}
                      onValueChange={(value) => updateMargin("bottom", value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="margin-left">Left</Label>
                      <span className="text-sm text-gray-500">{printSettings.margins.left}mm</span>
                    </div>
                    <Slider
                      id="margin-left"
                      min={5}
                      max={50}
                      step={1}
                      value={[printSettings.margins.left]}
                      onValueChange={(value) => updateMargin("left", value[0])}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Configure how shots are arranged on the page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Layout Style</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                      printSettings.layout === "grid" ? "border-primary bg-primary/10" : "border-gray-200"
                    }`}
                    onClick={() => updatePrintSetting("layout", "grid")}
                  >
                    <Grid className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Grid</span>
                    <span className="text-xs text-gray-500 text-center mt-1">Arrange shots in a grid layout</span>
                  </div>

                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                      printSettings.layout === "list" ? "border-primary bg-primary/10" : "border-gray-200"
                    }`}
                    onClick={() => updatePrintSetting("layout", "list")}
                  >
                    <List className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">List</span>
                    <span className="text-xs text-gray-500 text-center mt-1">Show shots in a vertical list</span>
                  </div>

                  <div
                    className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                      printSettings.layout === "detailed" ? "border-primary bg-primary/10" : "border-gray-200"
                    }`}
                    onClick={() => updatePrintSetting("layout", "detailed")}
                  >
                    <Layers className="h-8 w-8 mb-2" />
                    <span className="text-sm font-medium">Detailed</span>
                    <span className="text-xs text-gray-500 text-center mt-1">One shot per page with details</span>
                  </div>
                </div>
              </div>

              {printSettings.layout !== "detailed" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="shots-per-page">Shots Per Page</Label>
                    <span className="text-sm text-gray-500">{printSettings.shotsPerPage}</span>
                  </div>
                  <Slider
                    id="shots-per-page"
                    min={1}
                    max={printSettings.layout === "grid" ? 6 : 4}
                    step={1}
                    value={[printSettings.shotsPerPage]}
                    onValueChange={(value) => updatePrintSetting("shotsPerPage", value[0])}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-layout"
                  checked={printSettings.customLayout}
                  onCheckedChange={(checked) => updatePrintSetting("customLayout", !!checked)}
                />
                <div>
                  <Label htmlFor="custom-layout">Enable Custom Layout</Label>
                  <p className="text-sm text-gray-500">Manually position and scale shots on the page</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="scale">Scale</Label>
                  <span className="text-sm text-gray-500">{printSettings.scale}%</span>
                </div>
                <Slider
                  id="scale"
                  min={50}
                  max={150}
                  step={5}
                  value={[printSettings.scale]}
                  onValueChange={(value) => updatePrintSetting("scale", value[0])}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>Configure what information is included in the PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-notes"
                  checked={printSettings.includeNotes}
                  onCheckedChange={(checked) => updatePrintSetting("includeNotes", !!checked)}
                />
                <Label htmlFor="include-notes">Include Director's Notes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-prompts"
                  checked={printSettings.includePrompts}
                  onCheckedChange={(checked) => updatePrintSetting("includePrompts", !!checked)}
                />
                <Label htmlFor="include-prompts">Include AI Prompts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={printSettings.includeMetadata}
                  onCheckedChange={(checked) => updatePrintSetting("includeMetadata", !!checked)}
                />
                <Label htmlFor="include-metadata">Include Metadata</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="header-footer"
                  checked={printSettings.headerFooter}
                  onCheckedChange={(checked) => updatePrintSetting("headerFooter", !!checked)}
                />
                <Label htmlFor="header-footer">Show Headers and Footers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="page-numbers"
                  checked={printSettings.pageNumbers}
                  onCheckedChange={(checked) => updatePrintSetting("pageNumbers", !!checked)}
                />
                <Label htmlFor="page-numbers">Show Page Numbers</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced PDF export options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-quality">Image Quality</Label>
                <Select
                  value={printSettings.imageQuality}
                  onValueChange={(value) => updatePrintSetting("imageQuality", value as "draft" | "standard" | "high")}
                >
                  <SelectTrigger id="image-quality">
                    <SelectValue placeholder="Select image quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Faster, smaller file size)</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High Quality (Slower, larger file size)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={resetToDefaults} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
