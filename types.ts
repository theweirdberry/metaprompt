export interface AnalysisRequest {
  prompt: string
  preferences: UserPreferences
}

export interface Suggestion {
  id: string
  type: "clarity" | "specificity" | "structure" | "domain"
  original: string
  improved: string
  reason: string
  confidence: number
  position: { start: number; end: number }
  strategy?: string
  source?: "openai" | "anthropic" | "google"
}

export interface UserPreferences {
  enableClarity: boolean
  enableSpecificity: boolean
  enableStructure: boolean
  enableDomain: boolean
  sensitivity: number
}
