"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

interface UsePromptAnalyzerOptions {
  debounceMs?: number
  maxSuggestions?: number
}

export function usePromptAnalyzer(preferences: UserPreferences, options: UsePromptAnalyzerOptions = {}) {
  const { debounceMs = 300, maxSuggestions = 5 } = options

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const analyzePrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || prompt.length < 5) {
        setSuggestions([])
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setIsAnalyzing(true)
      setError(null)

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            preferences,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error("Analysis failed")
        }

        const data = await response.json()
        setSuggestions(data.suggestions.slice(0, maxSuggestions))
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message)
          console.error("Prompt analysis error:", err)
        }
      } finally {
        setIsAnalyzing(false)
      }
    },
    [preferences, maxSuggestions],
  )

  const debouncedAnalyze = useCallback(
    (prompt: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        analyzePrompt(prompt)
      }, debounceMs)
    },
    [analyzePrompt, debounceMs],
  )

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const removeSuggestion = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    suggestions,
    isAnalyzing,
    error,
    analyzePrompt: debouncedAnalyze,
    clearSuggestions,
    removeSuggestion,
  }
}
