"use client"

import { Textarea } from "@/components/ui/textarea"

import type React from "react"

import { useState } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, Save, Trash, Undo, Download, Upload } from "lucide-react"
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  LINE_STYLES,
  LINE_THICKNESSES,
  type TemplateStyle,
  type FontFamily,
  type FontWeight,
  type LineStyle,
  type LineThickness,
} from "@/lib/types"

// Default color palettes
const DEFAULT_COLOR_PALETTES = [
  {
    id: "professional",
    name: "Professional",
    colors: {
      primary: "#2563eb",
      secondary: "#4b5563",
      accent: "#8b5cf6",
      background: "#ffffff",
      text: "#1f2937",
      lines: "#d1d5db",
    },
  },
  {
    id: "creative",
    name: "Creative",
    colors: {
      primary: "#ec4899",
      secondary: "#8b5cf6",
      accent: "#f59e0b",
      background: "#fffbeb",
      text: "#4b5563",
      lines: "#e5e7eb",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    colors: {
      primary: "#111827",
      secondary: "#374151",
      accent: "#6b7280",
      background: "#f9fafb",
      text: "#111827",
      lines: "#e5e7eb",
    },
  },
  {
    id: "vibrant",
    name: "Vibrant",
    colors: {
      primary: "#f97316",
      secondary: "#0ea5e9",
      accent: "#10b981",
      background: "#ffffff",
      text: "#1f2937",
      lines: "#d1d5db",
    },
  },
  {
    id: "dark",
    name: "Dark Mode",
    colors: {
      primary: "#3b82f6",
      secondary: "#6b7280",
      accent: "#8b5cf6",
      background: "#1f2937",
      text: "#f9fafb",
      lines: "#374151",
    },
  },
]

// Default template style
const DEFAULT_TEMPLATE_STYLE: TemplateStyle = {
  id: "default",
  name: "Default",
  description: "Default template style",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  backgroundColor: "#ffffff",

  headerFontFamily: "sans",
  headerFontWeight: "bold",
  headerFontSize: 16,
  headerColor: "#111827",

  bodyFontFamily: "sans",
  bodyFontWeight: "normal",
  bodyFontSize: 14,
  bodyColor: "#374151",

  borderStyle: "solid",
  borderThickness: "medium",
  borderColor: "#d1d5db",

  shotFrameStyle: "solid",
  shotFrameThickness: "medium",
  shotFrameColor: "#d1d5db",

  sceneSeparatorStyle: "solid",
  sceneSeparatorThickness: "medium",
  sceneSeparatorColor: "#d1d5db",

  shotSpacing: 16,
  sceneSpacing: 32,

  cornerRadius: 8,
  shadowEnabled: true,
  shadowColor: "rgba(0, 0, 0, 0.1)",
  shadowBlur: 10,

  colorPalette: DEFAULT_COLOR_PALETTES[0],
}

interface TemplateCustomizerProps {
  onClose: () => void
}

export default function TemplateCustomizer({ onClose }: TemplateCustomizerProps) {
  const {
    storyboardData,
    updateTemplateStyle,
    savedTemplateStyles,
    saveTemplateStyle,
    loadTemplateStyle,
    deleteTemplateStyle,
  } = useStoryboard()

  const [activeTab, setActiveTab] = useState("typography")
  const [currentStyle, setCurrentStyle] = useState<TemplateStyle>(
    storyboardData?.templateStyle || DEFAULT_TEMPLATE_STYLE,
  )
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Update the current style
  const updateStyle = <K extends keyof TemplateStyle>(key: K, value: TemplateStyle[K]) => {
    setCurrentStyle((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }))
  }

  // Apply the current style to the storyboard
  const applyStyle = () => {
    updateTemplateStyle(currentStyle)
    onClose()
  }

  // Save the current style as a template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return

    const templateToSave: TemplateStyle = {
      ...currentStyle,
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveTemplateStyle(templateToSave)
    setShowSaveDialog(false)
    setTemplateName("")
    setTemplateDescription("")
  }

  // Load a saved template
  const handleLoadTemplate = (templateId: string) => {
    loadTemplateStyle(templateId)
    setShowLoadDialog(false)

    // Update current style with the loaded template
    const loadedTemplate = savedTemplateStyles.find((template) => template.id === templateId)
    if (loadedTemplate) {
      setCurrentStyle(loadedTemplate)
    }
  }

  // Reset to default style
  const resetToDefault = () => {
    setCurrentStyle(DEFAULT_TEMPLATE_STYLE)
  }

  // Export template as JSON
  const exportTemplate = () => {
    const templateJson = JSON.stringify(currentStyle, null, 2)
    const blob = new Blob([templateJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentStyle.name.replace(/\s+/g, "_")}_template.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import template from JSON
  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string) as TemplateStyle
        setCurrentStyle({
          ...template,
          id: `template-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error parsing template JSON:", error)
        // Show error message to user
      }
    }
    reader.readAsText(file)

    // Reset the input value so the same file can be selected again
    event.target.value = ""
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Template Customization</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <Undo className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Load Template
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("import-template")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input id="import-template" type="file" accept=".json" className="hidden" onChange={importTemplate} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-4 border-b">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="borders">Borders & Lines</TabsTrigger>
              <TabsTrigger value="spacing">Spacing</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Header Typography</CardTitle>
                  <CardDescription>Customize the appearance of headers and titles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-font-family">Font Family</Label>
                      <Select
                        value={currentStyle.headerFontFamily}
                        onValueChange={(value) => updateStyle("headerFontFamily", value as FontFamily)}
                      >
                        <SelectTrigger id="header-font-family">
                          <SelectValue placeholder="Select font family" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FONT_FAMILIES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="header-font-weight">Font Weight</Label>
                      <Select
                        value={currentStyle.headerFontWeight}
                        onValueChange={(value) => updateStyle("headerFontWeight", value as FontWeight)}
                      >
                        <SelectTrigger id="header-font-weight">
                          <SelectValue placeholder="Select font weight" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FONT_WEIGHTS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="header-font-size">Font Size</Label>
                      <span className="text-sm text-gray-500">{currentStyle.headerFontSize}px</span>
                    </div>
                    <Slider
                      id="header-font-size"
                      min={12}
                      max={32}
                      step={1}
                      value={[currentStyle.headerFontSize]}
                      onValueChange={(value) => updateStyle("headerFontSize", value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header-color">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-10 h-10 rounded-md border cursor-pointer"
                        style={{ backgroundColor: currentStyle.headerColor }}
                        onClick={() => document.getElementById("header-color-input")?.click()}
                      />
                      <Input
                        id="header-color"
                        value={currentStyle.headerColor}
                        onChange={(e) => updateStyle("headerColor", e.target.value)}
                        className="flex-1"
                      />
                      <input
                        id="header-color-input"
                        type="color"
                        value={currentStyle.headerColor}
                        onChange={(e) => updateStyle("headerColor", e.target.value)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 border rounded-md">
                    <h3
                      className="text-lg"
                      style={{
                        fontFamily: getFontFamilyValue(currentStyle.headerFontFamily),
                        fontWeight: getFontWeightValue(currentStyle.headerFontWeight),
                        fontSize: `${currentStyle.headerFontSize}px`,
                        color: currentStyle.headerColor,
                      }}
                    >
                      Header Preview Text
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Body Typography</CardTitle>
                  <CardDescription>Customize the appearance of body text</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="body-font-family">Font Family</Label>
                      <Select
                        value={currentStyle.bodyFontFamily}
                        onValueChange={(value) => updateStyle("bodyFontFamily", value as FontFamily)}
                      >
                        <SelectTrigger id="body-font-family">
                          <SelectValue placeholder="Select font family" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FONT_FAMILIES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="body-font-weight">Font Weight</Label>
                      <Select
                        value={currentStyle.bodyFontWeight}
                        onValueChange={(value) => updateStyle("bodyFontWeight", value as FontWeight)}
                      >
                        <SelectTrigger id="body-font-weight">
                          <SelectValue placeholder="Select font weight" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FONT_WEIGHTS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="body-font-size">Font Size</Label>
                      <span className="text-sm text-gray-500">{currentStyle.bodyFontSize}px</span>
                    </div>
                    <Slider
                      id="body-font-size"
                      min={10}
                      max={24}
                      step={1}
                      value={[currentStyle.bodyFontSize]}
                      onValueChange={(value) => updateStyle("bodyFontSize", value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body-color">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-10 h-10 rounded-md border cursor-pointer"
                        style={{ backgroundColor: currentStyle.bodyColor }}
                        onClick={() => document.getElementById("body-color-input")?.click()}
                      />
                      <Input
                        id="body-color"
                        value={currentStyle.bodyColor}
                        onChange={(e) => updateStyle("bodyColor", e.target.value)}
                        className="flex-1"
                      />
                      <input
                        id="body-color-input"
                        type="color"
                        value={currentStyle.bodyColor}
                        onChange={(e) => updateStyle("bodyColor", e.target.value)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 border rounded-md">
                    <p
                      style={{
                        fontFamily: getFontFamilyValue(currentStyle.bodyFontFamily),
                        fontWeight: getFontWeightValue(currentStyle.bodyFontWeight),
                        fontSize: `${currentStyle.bodyFontSize}px`,
                        color: currentStyle.bodyColor,
                      }}
                    >
                      This is a preview of the body text. It shows how the text will appear in your storyboard. The
                      quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Choose a predefined color palette or customize your own</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {DEFAULT_COLOR_PALETTES.map((palette) => (
                      <div
                        key={palette.id}
                        className={`border rounded-md p-3 cursor-pointer transition-all hover:shadow-md ${
                          currentStyle.colorPalette.id === palette.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => updateStyle("colorPalette", palette)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{palette.name}</span>
                          {currentStyle.colorPalette.id === palette.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex space-x-1">
                          {Object.values(palette.colors).map((color, index) => (
                            <div key={index} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Customize Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary-color">Primary Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.primary }}
                              onClick={() => document.getElementById("primary-color-input")?.click()}
                            />
                            <Input
                              id="primary-color"
                              value={currentStyle.colorPalette.colors.primary}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    primary: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="primary-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.primary}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    primary: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="secondary-color">Secondary Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.secondary }}
                              onClick={() => document.getElementById("secondary-color-input")?.click()}
                            />
                            <Input
                              id="secondary-color"
                              value={currentStyle.colorPalette.colors.secondary}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    secondary: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="secondary-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.secondary}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    secondary: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accent-color">Accent Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.accent }}
                              onClick={() => document.getElementById("accent-color-input")?.click()}
                            />
                            <Input
                              id="accent-color"
                              value={currentStyle.colorPalette.colors.accent}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    accent: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="accent-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.accent}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    accent: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="background-color">Background Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.background }}
                              onClick={() => document.getElementById("background-color-input")?.click()}
                            />
                            <Input
                              id="background-color"
                              value={currentStyle.colorPalette.colors.background}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    background: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="background-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.background}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    background: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="text-color">Text Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.text }}
                              onClick={() => document.getElementById("text-color-input")?.click()}
                            />
                            <Input
                              id="text-color"
                              value={currentStyle.colorPalette.colors.text}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    text: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="text-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.text}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    text: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lines-color">Lines Color</Label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-10 h-10 rounded-md border cursor-pointer"
                              style={{ backgroundColor: currentStyle.colorPalette.colors.lines }}
                              onClick={() => document.getElementById("lines-color-input")?.click()}
                            />
                            <Input
                              id="lines-color"
                              value={currentStyle.colorPalette.colors.lines}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    lines: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="flex-1"
                            />
                            <input
                              id="lines-color-input"
                              type="color"
                              value={currentStyle.colorPalette.colors.lines}
                              onChange={(e) => {
                                const newPalette = {
                                  ...currentStyle.colorPalette,
                                  colors: {
                                    ...currentStyle.colorPalette.colors,
                                    lines: e.target.value,
                                  },
                                }
                                updateStyle("colorPalette", newPalette)
                              }}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-6 p-4 border rounded-md"
                    style={{ backgroundColor: currentStyle.colorPalette.colors.background }}
                  >
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: currentStyle.colorPalette.colors.primary }}
                    >
                      Color Palette Preview
                    </h3>
                    <p style={{ color: currentStyle.colorPalette.colors.text }}>
                      This is how your color palette will look. Primary text looks like{" "}
                      <span style={{ color: currentStyle.colorPalette.colors.primary }}>this</span>, secondary elements
                      like <span style={{ color: currentStyle.colorPalette.colors.secondary }}>this</span>, and accent
                      elements like <span style={{ color: currentStyle.colorPalette.colors.accent }}>this</span>.
                    </p>
                    <div
                      className="mt-2 p-2 border rounded"
                      style={{ borderColor: currentStyle.colorPalette.colors.lines }}
                    >
                      Border lines will appear like this.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="borders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Border Styles</CardTitle>
                  <CardDescription>Customize the appearance of borders and lines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Main Borders</h3>

                      <div className="space-y-2">
                        <Label htmlFor="border-style">Border Style</Label>
                        <Select
                          value={currentStyle.borderStyle}
                          onValueChange={(value) => updateStyle("borderStyle", value as LineStyle)}
                        >
                          <SelectTrigger id="border-style">
                            <SelectValue placeholder="Select border style" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_STYLES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="border-thickness">Border Thickness</Label>
                        <Select
                          value={currentStyle.borderThickness}
                          onValueChange={(value) => updateStyle("borderThickness", value as LineThickness)}
                        >
                          <SelectTrigger id="border-thickness">
                            <SelectValue placeholder="Select border thickness" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_THICKNESSES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="border-color">Border Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-10 h-10 rounded-md border cursor-pointer"
                            style={{ backgroundColor: currentStyle.borderColor }}
                            onClick={() => document.getElementById("border-color-input")?.click()}
                          />
                          <Input
                            id="border-color"
                            value={currentStyle.borderColor}
                            onChange={(e) => updateStyle("borderColor", e.target.value)}
                            className="flex-1"
                          />
                          <input
                            id="border-color-input"
                            type="color"
                            value={currentStyle.borderColor}
                            onChange={(e) => updateStyle("borderColor", e.target.value)}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div
                        className="mt-4 p-4"
                        style={{
                          borderStyle: getLineStyleValue(currentStyle.borderStyle),
                          borderWidth: getLineThicknessValue(currentStyle.borderThickness),
                          borderColor: currentStyle.borderColor,
                        }}
                      >
                        <p>Border preview</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Shot Frame</h3>

                      <div className="space-y-2">
                        <Label htmlFor="shot-frame-style">Frame Style</Label>
                        <Select
                          value={currentStyle.shotFrameStyle}
                          onValueChange={(value) => updateStyle("shotFrameStyle", value as LineStyle)}
                        >
                          <SelectTrigger id="shot-frame-style">
                            <SelectValue placeholder="Select frame style" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_STYLES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shot-frame-thickness">Frame Thickness</Label>
                        <Select
                          value={currentStyle.shotFrameThickness}
                          onValueChange={(value) => updateStyle("shotFrameThickness", value as LineThickness)}
                        >
                          <SelectTrigger id="shot-frame-thickness">
                            <SelectValue placeholder="Select frame thickness" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_THICKNESSES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shot-frame-color">Frame Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-10 h-10 rounded-md border cursor-pointer"
                            style={{ backgroundColor: currentStyle.shotFrameColor }}
                            onClick={() => document.getElementById("shot-frame-color-input")?.click()}
                          />
                          <Input
                            id="shot-frame-color"
                            value={currentStyle.shotFrameColor}
                            onChange={(e) => updateStyle("shotFrameColor", e.target.value)}
                            className="flex-1"
                          />
                          <input
                            id="shot-frame-color-input"
                            type="color"
                            value={currentStyle.shotFrameColor}
                            onChange={(e) => updateStyle("shotFrameColor", e.target.value)}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div
                        className="mt-4 p-4"
                        style={{
                          borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                          borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                          borderColor: currentStyle.shotFrameColor,
                        }}
                      >
                        <p>Shot frame preview</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Scene Separator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scene-separator-style">Separator Style</Label>
                        <Select
                          value={currentStyle.sceneSeparatorStyle}
                          onValueChange={(value) => updateStyle("sceneSeparatorStyle", value as LineStyle)}
                        >
                          <SelectTrigger id="scene-separator-style">
                            <SelectValue placeholder="Select separator style" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_STYLES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scene-separator-thickness">Separator Thickness</Label>
                        <Select
                          value={currentStyle.sceneSeparatorThickness}
                          onValueChange={(value) => updateStyle("sceneSeparatorThickness", value as LineThickness)}
                        >
                          <SelectTrigger id="scene-separator-thickness">
                            <SelectValue placeholder="Select separator thickness" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LINE_THICKNESSES).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scene-separator-color">Separator Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-10 h-10 rounded-md border cursor-pointer"
                            style={{ backgroundColor: currentStyle.sceneSeparatorColor }}
                            onClick={() => document.getElementById("scene-separator-color-input")?.click()}
                          />
                          <Input
                            id="scene-separator-color"
                            value={currentStyle.sceneSeparatorColor}
                            onChange={(e) => updateStyle("sceneSeparatorColor", e.target.value)}
                            className="flex-1"
                          />
                          <input
                            id="scene-separator-color-input"
                            type="color"
                            value={currentStyle.sceneSeparatorColor}
                            onChange={(e) => updateStyle("sceneSeparatorColor", e.target.value)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center">
                      <div
                        className="flex-1"
                        style={{
                          borderTopStyle: getLineStyleValue(currentStyle.sceneSeparatorStyle),
                          borderTopWidth: getLineThicknessValue(currentStyle.sceneSeparatorThickness),
                          borderTopColor: currentStyle.sceneSeparatorColor,
                        }}
                      ></div>
                      <span className="mx-4 text-sm text-gray-500">Scene separator preview</span>
                      <div
                        className="flex-1"
                        style={{
                          borderTopStyle: getLineStyleValue(currentStyle.sceneSeparatorStyle),
                          borderTopWidth: getLineThicknessValue(currentStyle.sceneSeparatorThickness),
                          borderTopColor: currentStyle.sceneSeparatorColor,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spacing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spacing & Layout</CardTitle>
                  <CardDescription>Customize spacing between elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="shot-spacing">Shot Spacing</Label>
                        <span className="text-sm text-gray-500">{currentStyle.shotSpacing}px</span>
                      </div>
                      <Slider
                        id="shot-spacing"
                        min={8}
                        max={48}
                        step={4}
                        value={[currentStyle.shotSpacing]}
                        onValueChange={(value) => updateStyle("shotSpacing", value[0])}
                      />
                      <p className="text-sm text-gray-500">Controls the spacing between shots in the same scene</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="scene-spacing">Scene Spacing</Label>
                        <span className="text-sm text-gray-500">{currentStyle.sceneSpacing}px</span>
                      </div>
                      <Slider
                        id="scene-spacing"
                        min={16}
                        max={96}
                        step={8}
                        value={[currentStyle.sceneSpacing]}
                        onValueChange={(value) => updateStyle("sceneSpacing", value[0])}
                      />
                      <p className="text-sm text-gray-500">Controls the spacing between different scenes</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="corner-radius">Corner Radius</Label>
                        <span className="text-sm text-gray-500">{currentStyle.cornerRadius}px</span>
                      </div>
                      <Slider
                        id="corner-radius"
                        min={0}
                        max={16}
                        step={2}
                        value={[currentStyle.cornerRadius]}
                        onValueChange={(value) => updateStyle("cornerRadius", value[0])}
                      />
                      <p className="text-sm text-gray-500">Controls the roundness of corners for cards and elements</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border rounded-md">
                    <h3 className="text-lg font-medium mb-4">Spacing Preview</h3>
                    <div className="space-y-4">
                      <div
                        className="p-4 border rounded-md"
                        style={{
                          borderRadius: `${currentStyle.cornerRadius}px`,
                          borderColor: currentStyle.borderColor,
                          borderStyle: getLineStyleValue(currentStyle.borderStyle),
                          borderWidth: getLineThicknessValue(currentStyle.borderThickness),
                        }}
                      >
                        <p>Scene 1</p>
                        <div className="flex flex-wrap mt-2" style={{ gap: `${currentStyle.shotSpacing}px` }}>
                          <div
                            className="w-24 h-24 bg-gray-200 flex items-center justify-center"
                            style={{
                              borderRadius: `${currentStyle.cornerRadius}px`,
                              borderColor: currentStyle.shotFrameColor,
                              borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                              borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                            }}
                          >
                            Shot 1
                          </div>
                          <div
                            className="w-24 h-24 bg-gray-200 flex items-center justify-center"
                            style={{
                              borderRadius: `${currentStyle.cornerRadius}px`,
                              borderColor: currentStyle.shotFrameColor,
                              borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                              borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                            }}
                          >
                            Shot 2
                          </div>
                          <div
                            className="w-24 h-24 bg-gray-200 flex items-center justify-center"
                            style={{
                              borderRadius: `${currentStyle.cornerRadius}px`,
                              borderColor: currentStyle.shotFrameColor,
                              borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                              borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                            }}
                          >
                            Shot 3
                          </div>
                        </div>
                      </div>

                      <div style={{ height: `${currentStyle.sceneSpacing}px` }}></div>

                      <div
                        className="p-4 border rounded-md"
                        style={{
                          borderRadius: `${currentStyle.cornerRadius}px`,
                          borderColor: currentStyle.borderColor,
                          borderStyle: getLineStyleValue(currentStyle.borderStyle),
                          borderWidth: getLineThicknessValue(currentStyle.borderThickness),
                        }}
                      >
                        <p>Scene 2</p>
                        <div className="flex flex-wrap mt-2" style={{ gap: `${currentStyle.shotSpacing}px` }}>
                          <div
                            className="w-24 h-24 bg-gray-200 flex items-center justify-center"
                            style={{
                              borderRadius: `${currentStyle.cornerRadius}px`,
                              borderColor: currentStyle.shotFrameColor,
                              borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                              borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                            }}
                          >
                            Shot 1
                          </div>
                          <div
                            className="w-24 h-24 bg-gray-200 flex items-center justify-center"
                            style={{
                              borderRadius: `${currentStyle.cornerRadius}px`,
                              borderColor: currentStyle.shotFrameColor,
                              borderStyle: getLineStyleValue(currentStyle.shotFrameStyle),
                              borderWidth: getLineThicknessValue(currentStyle.shotFrameThickness),
                            }}
                          >
                            Shot 2
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Effects</CardTitle>
                  <CardDescription>Add shadows and other visual effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shadow-enabled"
                      checked={currentStyle.shadowEnabled}
                      onCheckedChange={(checked) => updateStyle("shadowEnabled", checked)}
                    />
                    <Label htmlFor="shadow-enabled">Enable Shadows</Label>
                  </div>

                  {currentStyle.shadowEnabled && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shadow-color">Shadow Color</Label>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-10 h-10 rounded-md border cursor-pointer"
                            style={{ backgroundColor: currentStyle.shadowColor }}
                            onClick={() => document.getElementById("shadow-color-input")?.click()}
                          />
                          <Input
                            id="shadow-color"
                            value={currentStyle.shadowColor}
                            onChange={(e) => updateStyle("shadowColor", e.target.value)}
                            className="flex-1"
                          />
                          <input
                            id="shadow-color-input"
                            type="color"
                            value={currentStyle.shadowColor.replace(/rgba?$$|$$/g, "")}
                            onChange={(e) => {
                              // Convert hex to rgba
                              const hex = e.target.value
                              const r = Number.parseInt(hex.slice(1, 3), 16)
                              const g = Number.parseInt(hex.slice(3, 5), 16)
                              const b = Number.parseInt(hex.slice(5, 7), 16)
                              updateStyle("shadowColor", `rgba(${r}, ${g}, ${b}, 0.1)`)
                            }}
                            className="hidden"
                          />
                        </div>
                        <p className="text-sm text-gray-500">Use rgba() format for transparency</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="shadow-blur">Shadow Blur</Label>
                          <span className="text-sm text-gray-500">{currentStyle.shadowBlur}px</span>
                        </div>
                        <Slider
                          id="shadow-blur"
                          min={0}
                          max={30}
                          step={1}
                          value={[currentStyle.shadowBlur]}
                          onValueChange={(value) => updateStyle("shadowBlur", value[0])}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4">
                    <h3 className="text-lg font-medium mb-4">Effects Preview</h3>
                    <div className="flex space-x-4">
                      <div
                        className="w-40 h-40 bg-white border rounded-md flex items-center justify-center"
                        style={{
                          borderRadius: `${currentStyle.cornerRadius}px`,
                          borderColor: currentStyle.borderColor,
                          borderStyle: getLineStyleValue(currentStyle.borderStyle),
                          borderWidth: getLineThicknessValue(currentStyle.borderThickness),
                          boxShadow: currentStyle.shadowEnabled
                            ? `0 4px ${currentStyle.shadowBlur}px ${currentStyle.shadowColor}`
                            : "none",
                        }}
                      >
                        With Effects
                      </div>
                      <div className="w-40 h-40 bg-white border rounded-md flex items-center justify-center">
                        Without Effects
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="p-4 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={applyStyle}>Apply Style</Button>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {savedTemplateStyles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No saved templates. Create and save a template to see it here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTemplateStyles.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-md p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleLoadTemplate(template.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTemplateStyle(template.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{template.description || "No description"}</p>
                    <div className="flex space-x-1 mt-2">
                      {Object.values(template.colorPalette.colors).map((color, index) => (
                        <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper functions to convert enum values to CSS values
function getFontFamilyValue(fontFamily: FontFamily): string {
  switch (fontFamily) {
    case "sans":
      return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    case "serif":
      return "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    case "display":
      return "'Playfair Display', Georgia, serif"
    case "handwriting":
      return "'Caveat', cursive"
    default:
      return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  }
}

function getFontWeightValue(fontWeight: FontWeight): string {
  switch (fontWeight) {
    case "normal":
      return "400"
    case "medium":
      return "500"
    case "semibold":
      return "600"
    case "bold":
      return "700"
    default:
      return "400"
  }
}

function getLineStyleValue(lineStyle: LineStyle): string {
  switch (lineStyle) {
    case "solid":
      return "solid"
    case "dashed":
      return "dashed"
    case "dotted":
      return "dotted"
    case "double":
      return "double"
    case "groove":
      return "groove"
    case "ridge":
      return "ridge"
    default:
      return "solid"
  }
}

function getLineThicknessValue(lineThickness: LineThickness): string {
  switch (lineThickness) {
    case "thin":
      return "1px"
    case "medium":
      return "2px"
    case "thick":
      return "3px"
    case "extraThick":
      return "4px"
    default:
      return "2px"
  }
}
