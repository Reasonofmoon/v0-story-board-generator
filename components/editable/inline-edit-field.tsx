"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Edit2 } from "lucide-react"

interface InlineEditFieldProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  inputClassName?: string
}

export default function InlineEditField({
  value,
  onSave,
  placeholder = "Enter text...",
  multiline = false,
  className = "",
  inputClassName = "",
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center ${className}`}>
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 ${inputClassName}`}
            rows={3}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 ${inputClassName}`}
          />
        )}

        <div className="flex ml-2">
          <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0 text-green-600">
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0 text-red-600">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex items-center ${className}`} onClick={() => setIsEditing(true)}>
      <div className="flex-1 cursor-text">{value || <span className="text-gray-400">{placeholder}</span>}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
