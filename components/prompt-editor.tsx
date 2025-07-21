"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Settings, Lightbulb, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePromptAnalyzer } from "@/hooks/use-prompt-analyzer"
import { SuggestionOverlay } from "./suggestion-overlay"

interface Suggestion {
  id: string
  type: "clarity" | "specificity" | "structure" | "domain"
  original: string
  improved: string
  reason: string
  confidence: number
  position: { start: number; end: number }
}

interface UserPreferences {
  enableClarity: boolean
  enableSpecificity: boolean
  enableStructure: boolean
  enableDomain: boolean
  sensitivity: number
}

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  preferences: UserPreferences
  onSuggestionAccepted?: (suggestion: Suggestion) => void
  onSuggestionRejected?: (suggestion: Suggestion) => void
}

export function PromptEditor({
  value,
  onChange,
  preferences,
  onSuggestionAccepted,
  onSuggestionRejected,
}: PromptEditorProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { suggestions, isAnalyzing, error, analyzePrompt, removeSuggestion } = usePromptAnalyzer(preferences, {
    debounceMs: 300,
    maxSuggestions: 3,
  })

  // Analyze prompt when value changes
  useEffect(() => {
    analyzePrompt(value)
  }, [value, analyzePrompt])

  // Set active suggestion when suggestions change
  useEffect(() => {
    if (suggestions.length > 0 && !activeSuggestion) {
      setActiveSuggestion(suggestions[0])
    } else if (suggestions.length === 0) {
      setActiveSuggestion(null)
    }
  }, [suggestions, activeSuggestion])

  const handleAcceptSuggestion = useCallback(
    (suggestion: Suggestion) => {
      onChange(suggestion.improved)
      removeSuggestion(suggestion.id)
      setActiveSuggestion(null)
      onSuggestionAccepted?.(suggestion)

      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    },
    [onChange, removeSuggestion, onSuggestionAccepted],
  )

  const handleRejectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      removeSuggestion(suggestion.id)

      // Set next suggestion as active
      const remainingSuggestions = suggestions.filter((s) => s.id !== suggestion.id)
      setActiveSuggestion(remainingSuggestions.length > 0 ? remainingSuggestions[0] : null)

      onSuggestionRejected?.(suggestion)
    },
    [removeSuggestion, suggestions, onSuggestionRejected],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab" && activeSuggestion) {
        e.preventDefault()
        handleAcceptSuggestion(activeSuggestion)
      } else if (e.key === "Escape" && activeSuggestion) {
        e.preventDefault()
        handleRejectSuggestion(activeSuggestion)
      }
    },
    [activeSuggestion, handleAcceptSuggestion, handleRejectSuggestion],
  )

  const updateCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect()
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    }
  }, [])

  const getSuggestionTypeColor = (type: Suggestion["type"]) => {
    switch (type) {
      case "clarity":
        return "bg-blue-100 text-blue-800"
      case "specificity":
        return "bg-green-100 text-green-800"
      case "structure":
        return "bg-purple-100 text-purple-800"
      case "domain":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSuggestionTypeIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "clarity":
        return <Lightbulb className="w-3 h-3" />
      case "specificity":
        return <Zap className="w-3 h-3" />
      case "structure":
        return <Settings className="w-3 h-3" />
      case "domain":
        return <Check className="w-3 h-3" />
      default:
        return <Lightbulb className="w-3 h-3" />
    }
  }

  return (
    <div className="relative">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">Prompt Editor</h3>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Analyzing...
              </div>
            )}
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={updateCursorPosition}
            onBlur={updateCursorPosition}
            placeholder="Start typing your AI prompt here... (e.g., 'make a website for my business')"
            className={cn(
              "min-h-[120px] text-base resize-none transition-all",
              activeSuggestion && "border-blue-300 ring-1 ring-blue-200",
            )}
          />

          {/* Inline suggestion indicator */}
          {activeSuggestion && (
            <div className="absolute top-2 right-2">
              <Card className="p-2 bg-white/95 backdrop-blur-sm border-blue-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", getSuggestionTypeColor(activeSuggestion.type))}>
                    {getSuggestionTypeIcon(activeSuggestion.type)}
                    <span className="ml-1">{activeSuggestion.type}</span>
                  </Badge>
                  <span className="text-xs text-slate-500">Press Tab to accept</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Analysis error: {error}</div>}
      </div>

      {/* Suggestion overlay */}
      {activeSuggestion && (
        <SuggestionOverlay
          suggestion={activeSuggestion}
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          position={cursorPosition}
        />
      )}
    </div>
  )
}
