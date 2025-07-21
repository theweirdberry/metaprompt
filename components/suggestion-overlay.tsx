"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Lightbulb, Zap, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  type: "clarity" | "specificity" | "structure" | "domain"
  original: string
  improved: string
  reason: string
  confidence: number
  position: { start: number; end: number }
}

interface SuggestionOverlayProps {
  suggestion: Suggestion
  onAccept: (suggestion: Suggestion) => void
  onReject: (suggestion: Suggestion) => void
  position?: { x: number; y: number }
}

export function SuggestionOverlay({ suggestion, onAccept, onReject, position }: SuggestionOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const getSuggestionTypeColor = (type: Suggestion["type"]) => {
    switch (type) {
      case "clarity":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "specificity":
        return "bg-green-100 text-green-800 border-green-200"
      case "structure":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "domain":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const handleAccept = () => {
    onAccept(suggestion)
    setIsVisible(false)
  }

  const handleReject = () => {
    onReject(suggestion)
    setIsVisible(false)
  }

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-200",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
      )}
      style={{
        left: position?.x || "auto",
        top: position?.y || "auto",
        transform: "translate(-50%, -100%)",
      }}
    >
      <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-lg border max-w-sm">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={cn("text-xs", getSuggestionTypeColor(suggestion.type))}>
              {getSuggestionTypeIcon(suggestion.type)}
              <span className="ml-1 capitalize">{suggestion.type}</span>
            </Badge>
            <span className="text-xs text-slate-500">{Math.round(suggestion.confidence * 100)}%</span>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-2">{suggestion.reason}</p>
            <div className="bg-slate-50 p-2 rounded text-xs font-mono text-slate-800 max-h-20 overflow-y-auto">
              {suggestion.improved.length > 100 ? `${suggestion.improved.substring(0, 100)}...` : suggestion.improved}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} className="h-7 px-3 text-xs flex-1">
              <Check className="w-3 h-3 mr-1" />
              Accept (Tab)
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} className="h-7 px-3 text-xs bg-transparent">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
