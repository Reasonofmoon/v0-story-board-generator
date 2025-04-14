"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Code, Bug, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<
    Array<{ name: string; status: "success" | "error" | "running"; message?: string }>
  >([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runTests = async () => {
    setIsRunningTests(true)
    setTestResults([{ name: "Starting tests...", status: "running" }])

    try {
      // Import test utilities
      const { runAllTests, testImageGenerationQueue, testAnnotationFunctionality } = await import("@/lib/test-utils")

      // Test image generation queue
      setTestResults((prev) => [...prev, { name: "Image Generation Queue", status: "running" }])
      try {
        await testImageGenerationQueue(3)
        setTestResults((prev) => {
          const newResults = [...prev]
          const index = newResults.findIndex((r) => r.name === "Image Generation Queue")
          if (index !== -1) {
            newResults[index] = { name: "Image Generation Queue", status: "success" }
          }
          return newResults
        })
      } catch (error) {
        setTestResults((prev) => {
          const newResults = [...prev]
          const index = newResults.findIndex((r) => r.name === "Image Generation Queue")
          if (index !== -1) {
            newResults[index] = {
              name: "Image Generation Queue",
              status: "error",
              message: error instanceof Error ? error.message : String(error),
            }
          }
          return newResults
        })
      }

      // Test annotation functionality
      setTestResults((prev) => [...prev, { name: "Annotation Functionality", status: "running" }])
      try {
        await testAnnotationFunctionality()
        setTestResults((prev) => {
          const newResults = [...prev]
          const index = newResults.findIndex((r) => r.name === "Annotation Functionality")
          if (index !== -1) {
            newResults[index] = { name: "Annotation Functionality", status: "success" }
          }
          return newResults
        })
      } catch (error) {
        setTestResults((prev) => {
          const newResults = [...prev]
          const index = newResults.findIndex((r) => r.name === "Annotation Functionality")
          if (index !== -1) {
            newResults[index] = {
              name: "Annotation Functionality",
              status: "error",
              message: error instanceof Error ? error.message : String(error),
            }
          }
          return newResults
        })
      }

      setTestResults((prev) => [
        ...prev.filter((r) => r.name !== "Starting tests..."),
        { name: "All Tests", status: "success" },
      ])
    } catch (error) {
      setTestResults((prev) => [
        ...prev.filter((r) => r.name !== "Starting tests..."),
        {
          name: "All Tests",
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        },
      ])
    } finally {
      setIsRunningTests(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-80">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white shadow-md">
            <Bug className="h-4 w-4" />
            Developer Tools
            {testResults.some((r) => r.status === "error") && (
              <Badge variant="destructive" className="ml-2">
                Error
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-md border bg-white p-4 shadow-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <Code className="h-4 w-4 mr-2" />
            Test & Validation Tools
          </h3>

          <div className="space-y-2 mb-4">
            <Button onClick={runTests} disabled={isRunningTests} size="sm" className="w-full">
              {isRunningTests ? "Running Tests..." : "Run All Tests"}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map((result, i) => (
                <Alert key={i} variant={result.status === "error" ? "destructive" : "default"} className="py-2">
                  <div className="flex items-center">
                    {result.status === "success" && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                    {result.status === "error" && <XCircle className="h-4 w-4 mr-2 text-red-500" />}
                    {result.status === "running" && <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />}
                    <AlertTitle className="text-sm">{result.name}</AlertTitle>
                  </div>
                  {result.message && (
                    <AlertDescription className="text-xs mt-1 max-h-20 overflow-auto">
                      {result.message}
                    </AlertDescription>
                  )}
                </Alert>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
