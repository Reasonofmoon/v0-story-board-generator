"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, RefreshCw, X, Loader2 } from "lucide-react"

interface ImageUploadProps {
  imageUrl?: string
  onImageChange: (imageUrl: string) => void
  onImageRemove: () => void
  aspectRatio?: string
  className?: string
  isLoading?: boolean
  onLoadingChange?: (isLoading: boolean) => void
}

export default function ImageUpload({
  imageUrl,
  onImageChange,
  onImageRemove,
  aspectRatio = "16:9",
  className = "",
  isLoading = false,
  onLoadingChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update loading state
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(internalLoading)
    }
  }, [internalLoading, onLoadingChange])

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "16:9":
        return "aspect-video"
      case "4:3":
        return "aspect-[4/3]"
      case "1:1":
        return "aspect-square"
      case "2.35:1":
        return "aspect-[2.35/1]"
      case "9:16":
        return "aspect-[9/16]"
      default:
        return "aspect-video"
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Please select an image file")
      return
    }

    setInternalLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        onImageChange(e.target.result)
        setTimeout(() => setInternalLoading(false), 500) // Add a small delay to show loading state
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageLoad = () => {
    setInternalLoading(false)
  }

  const handleImageError = () => {
    setInternalLoading(false)
  }

  return (
    <div
      className={`relative border rounded-md overflow-hidden ${getAspectRatioClass()} ${className} ${
        isDragging ? "border-primary border-dashed bg-primary/10" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <>
          {(isLoading || internalLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-70 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Shot preview"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Replace
              </Button>

              <Button variant="destructive" size="sm" onClick={onImageRemove}>
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Drag & drop an image here or click to upload</p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Upload Image
          </Button>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  )
}
