"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useStoryboard } from "@/context/storyboard-context"
import { generateStoryboard } from "@/lib/storyboard-generator"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type VisualStyle } from "@/lib/types"
import { Upload, Plus, Trash, Wand2, AlertTriangle } from "lucide-react"

interface StoryInputProps {
  onComplete: () => void
}

export default function StoryInput({ onComplete }: StoryInputProps) {
  const {
    storyInput,
    setStoryInput,
    setStoryboardData,
    isGenerating,
    setIsGenerating,
    currentStep,
    setCurrentStep,
    generationProgress,
    setGenerationProgress,
    styleSettings,
    updateStyleSetting,
    characters,
    setCharacters,
    characterDescriptions,
    setCharacterDescriptions,
    useGeminiPro,
    setUseGeminiPro,
  } = useStoryboard()

  const [activeTab, setActiveTab] = useState("story")
  const [newCharacter, setNewCharacter] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visualStyles: { id: VisualStyle; name: string; description: string }[] = [
    { id: "cinematic", name: "Cinematic", description: "Realistic style with cinematic composition and lighting" },
    { id: "anime", name: "Animation", description: "Studio Ghibli/Pixar inspired animation style" },
    { id: "comic", name: "Comic Book", description: "Comic book style with strong outlines and contrast" },
    { id: "minimal", name: "Minimal", description: "Minimalist style with simple lines and limited colors" },
    { id: "concept", name: "Concept Art", description: "Environment-focused visuals in film/game concept art style" },
    {
      id: "3d_realistic",
      name: "3D Realistic",
      description: "Photorealistic 3D rendered visuals with detailed textures",
    },
    { id: "watercolor", name: "Watercolor", description: "Traditional watercolor painting style with soft edges" },
    { id: "noir", name: "Film Noir", description: "High contrast black and white with dramatic shadows" },
  ]

  const steps = [
    "Analyzing story...",
    "Processing with AI...",
    "Extracting scene structure...",
    "Creating visual images...",
    "Assembling storyboard...",
  ]

  const handleGenerateStoryboard = async () => {
    if (!storyInput.trim()) return

    setIsGenerating(true)
    setCurrentStep(0)
    setGenerationProgress(0)
    setError(null)

    try {
      // Generate the storyboard
      const storyboard = await generateStoryboard(
        storyInput,
        {...styleSettings,
        visualStyle:undefined,
        aspectRatio: undefined,
        quality: undefined},
        useGeminiPro, (step, progress) => {
        setCurrentStep(step)
        setGenerationProgress(progress)
      })

      setStoryboardData(storyboard)

      // Short delay before completing to ensure the last step is shown
      setTimeout(() => {
        setIsGenerating(false)
        onComplete()
      }, 1000)
    } catch (error) {
      console.error("Error generating storyboard:", error)
      setError("An error occurred while generating the storyboard. Please try again.")
      setIsGenerating(false)
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setStoryInput(event.target.result as string)
        }
      }
      reader.readAsText(file)
    }
  }

  const addCharacter = () => {
    if (newCharacter && !characters.includes(newCharacter)) {
      setCharacters([...characters, newCharacter])
      setNewCharacter("")
    }
  }

  const removeCharacter = (character: string) => {
    setCharacters(characters.filter((c) => c !== character))
  }

  const updateCharacterDescription = (character: string, description: string) => {
    const newDescriptions = { ...characterDescriptions, [character]: description }
    setCharacterDescriptions(newDescriptions)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left panel - Story input */}
      <div className="md:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Story Input</CardTitle>
                <CardDescription>
                  Enter your story text or upload a file. The more details you provide about scenes, characters,
                  dialogue, and actions, the better the results will be.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="w-full h-64 mb-4"
                  placeholder="Enter your story here. Be descriptive about scenes, characters, actions, and emotions."
                  value={storyInput}
                  onChange={(e) => setStoryInput(e.target.value)}
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mt-4">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-gray-500">
                  {storyInput.length > 0 ? `${storyInput.length} characters` : "Enter your story"}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleFileUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.md,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="characters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Character Management</CardTitle>
                <CardDescription>
                  Define your characters and their descriptions to improve the visual consistency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex mb-4">
                  <Input
                    placeholder="Character name"
                    value={newCharacter}
                    onChange={(e) => setNewCharacter(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button onClick={addCharacter}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {characters.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No characters added yet. Add characters to improve visual consistency.
                    </div>
                  )}

                  {characters.map((character) => (
                    <div key={character} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{character}</h3>
                        <Button variant="ghost" size="sm" onClick={() => removeCharacter(character)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`character-${character}`}>Visual Description</Label>
                        <Textarea
                          id={`character-${character}`}
                          placeholder="Describe the character's appearance, clothing, etc."
                          value={characterDescriptions[character] || ""}
                          onChange={(e) => updateCharacterDescription(character, e.target.value)}
                          className="h-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Fine-tune the storyboard generation process with these advanced settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="use-gemini" checked={useGeminiPro} onCheckedChange={setUseGeminiPro} />
                  <Label htmlFor="use-gemini" className="font-medium">
                    Use enhanced story analysis
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist-reference">Artist Reference</Label>
                  <Input
                    id="artist-reference"
                    placeholder="e.g., Stanley Kubrick, Hayao Miyazaki, Ridley Scott"
                    value={styleSettings.artistReference || ""}
                    onChange={(e) => updateStyleSetting("artistReference", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Specify a filmmaker, artist, or style to influence the visual aesthetic.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color-palette">Color Palette</Label>
                  <Input
                    id="color-palette"
                    placeholder="e.g., warm tones, cool blues, high contrast"
                    value={styleSettings.colorPalette || ""}
                    onChange={(e) => updateStyleSetting("colorPalette", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Describe the color palette to use across the storyboard.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style-modifiers">Style Modifiers</Label>
                  <Input
                    id="style-modifiers"
                    placeholder="e.g., dramatic lighting, shallow depth of field"
                    value={styleSettings.styleModifiers?.join(", ") || ""}
                    onChange={(e) => updateStyleSetting("styleModifiers", e.target.value.split(", ").filter(Boolean))}
                  />
                  <p className="text-sm text-gray-500">Add comma-separated modifiers to refine the visual style.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-xl font-bold mb-4">Generating Storyboard...</h3>
            <Progress value={generationProgress} className="mb-4" />
            <p className="text-gray-700">{steps[currentStep]}</p>
              <CardFooter>
                <Button className="w-full" onClick={handleGenerateStoryboard} disabled={isGenerating || !storyInput.trim()}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Story
                </Button>
              </CardFooter>

          </div>
        </div>
      )}
    </div>
  )
}
