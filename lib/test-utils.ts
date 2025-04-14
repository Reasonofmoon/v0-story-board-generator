/**
 * Test utility functions for validating application functionality
 */

/**
 * Test image generation queue
 * @param count Number of images to generate
 * @returns Promise that resolves when all images are generated
 */
export async function testImageGenerationQueue(count = 5): Promise<void> {
  const { FalImageService } = await import("./fal-image-service")
  const imageService = new FalImageService()

  console.log(`Testing image generation queue with ${count} images...`)

  const startTime = Date.now()

  // Generate multiple images simultaneously
  const promises = Array.from({ length: count }).map((_, i) => {
    return imageService
      .generateImage({
        prompt: `Test image ${i + 1}`,
        width: 512,
        height: 512,
      })
      .then((url) => {
        console.log(`Image ${i + 1} generated: ${url.substring(0, 50)}...`)
        return url
      })
  })

  // Wait for all images to be generated
  await Promise.all(promises)

  const endTime = Date.now()
  console.log(`All ${count} images generated in ${(endTime - startTime) / 1000} seconds`)
}

/**
 * Test annotation functionality
 * @returns Promise that resolves when test is complete
 */
export async function testAnnotationFunctionality(): Promise<void> {
  console.log("Testing annotation functionality...")

  // Create a mock storyboard data
  const mockStoryboardData = {
    id: "test-id",
    title: "Test Storyboard",
    scenes: [
      {
        id: "scene-1",
        title: "Test Scene",
        description: "Test scene description",
        shots: [
          {
            id: "shot-1",
            sceneId: "scene-1",
            shotType: "MS",
            shotDescription: "Test shot",
            cameraAngle: "EYE_LEVEL",
            cameraMovement: "STATIC",
          },
        ],
      },
    ],
    annotations: [
      {
        id: "annotation-1",
        type: "text",
        content: "Test annotation",
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        zIndex: 1,
        sceneId: "scene-1",
        shotId: "shot-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }

  // Test filtering annotations
  const filteredAnnotations = mockStoryboardData.annotations.filter((a) => a.shotId === "shot-1")
  console.log(`Filtered annotations: ${filteredAnnotations.length}`)

  // Test with undefined annotations
  const mockStoryboardWithoutAnnotations = { ...mockStoryboardData, annotations: undefined }
  const safeFilteredAnnotations =
    mockStoryboardWithoutAnnotations.annotations?.filter((a) => a.shotId === "shot-1") || []
  console.log(`Safe filtered annotations: ${safeFilteredAnnotations.length}`)

  console.log("Annotation functionality test complete")
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log("Running all tests...")

  try {
    await testImageGenerationQueue(3)
    await testAnnotationFunctionality()

    console.log("All tests completed successfully!")
  } catch (error) {
    console.error("Test failed:", error)
  }
}
