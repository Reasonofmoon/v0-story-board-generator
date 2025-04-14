"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { StoryboardProvider } from "@/context/storyboard-context"
import StoryInput from "@/components/story-input"
import StoryboardViewer from "@/components/storyboard-viewer"
import ExportPanel from "@/components/export-panel"
import Header from "@/components/header"

export default function StoryboardDashboard() {
  const [activeTab, setActiveTab] = useState("input")

  return (
    <StoryboardProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header onTabChange={setActiveTab} />

        <div className="flex-1 container mx-auto px-4 py-6">
          <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="input">Story Input</TabsTrigger>
              <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="input">
              <Card className="p-0">
                <StoryInput onComplete={() => setActiveTab("storyboard")} />
              </Card>
            </TabsContent>

            <TabsContent value="storyboard">
              <Card className="p-0">
                <StoryboardViewer />
              </Card>
            </TabsContent>

            <TabsContent value="export">
              <Card className="p-0">
                <ExportPanel />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StoryboardProvider>
  )
}
