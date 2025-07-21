"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Lightbulb,
  Check,
  X,
  Zap,
  AlertCircle,
  Wifi,
  WifiOff,
  BookOpen,
  Key,
  Shield,
  FlaskConical,
  Edit3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ApiKeySettings } from "@/components/api-key-settings"
import { LabInterface } from "@/components/lab-interface"
import SecureStorage from "@/lib/secure-storage"

interface Suggestion {
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

interface UserPreferences {
  enableClarity: boolean
  enableSpecificity: boolean
  enableStructure: boolean
  enableDomain: boolean
  sensitivity: number
}

interface ApiKeyConfig {
  provider: "gemini" | "openai"
  apiKey: string
  isValid?: boolean
  lastTested?: string
  autoCleanup?: boolean
}

export default function AIPromptImprover() {
  const [activeTab, setActiveTab] = useState("editor")
  const [prompt, setPrompt] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyConfig, setApiKeyConfig] = useState<ApiKeyConfig | null>(null)
  const [analysisInfo, setAnalysisInfo] = useState<{
    sources: string[]
    localAnalysisCount: number
    totalSuggestions: number
    usingUserKey: boolean
    provider?: string
  } | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    enableClarity: true,
    enableSpecificity: true,
    enableStructure: true,
    enableDomain: true,
    sensitivity: 0.7,
  })
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load API key config from secure storage on mount
  useEffect(() => {
    const config = SecureStorage.loadApiConfig()
    if (config) {
      setApiKeyConfig(config)
    }
  }, [])

  // Real-time analysis with debouncing
  const analyzePrompt = async (text: string) => {
    if (text.length < 5) {
      setSuggestions([])
      setActiveSuggestion(null)
      setAnalysisInfo(null)
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-with-user-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          preferences,
          apiConfig: apiKeyConfig,
        }),
      })

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("Non-JSON Response:", errorText)
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.")
      }

      const data = await response.json()

      setSuggestions(data.suggestions || [])
      setAnalysisInfo({
        sources: data.sources || [],
        localAnalysisCount: data.localAnalysisCount || 0,
        totalSuggestions: data.totalSuggestions || 0,
        usingUserKey: data.usingUserKey || false,
        provider: data.provider,
      })

      if (data.suggestions?.length > 0 && !activeSuggestion) {
        setActiveSuggestion(data.suggestions[0])
      }

      if (data.fallback) {
        setError("API 오류로 인해 로컬 분석만 사용됨")
      }
    } catch (err) {
      console.error("Analysis failed:", err)
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.")

      // Clear suggestions on error
      setSuggestions([])
      setActiveSuggestion(null)
      setAnalysisInfo(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Debounced analysis
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      analyzePrompt(prompt)
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [prompt, preferences, apiKeyConfig])

  const acceptSuggestion = (suggestion: Suggestion) => {
    setPrompt(suggestion.improved)
    setAcceptedSuggestions((prev) => [...prev, suggestion.id])
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    setActiveSuggestion(null)
    textareaRef.current?.focus()
  }

  const rejectSuggestion = (suggestion: Suggestion) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    if (activeSuggestion?.id === suggestion.id) {
      const remaining = suggestions.filter((s) => s.id !== suggestion.id)
      setActiveSuggestion(remaining.length > 0 ? remaining[0] : null)
    }
  }

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

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "openai":
        return "bg-green-100 text-green-800"
      case "anthropic":
        return "bg-orange-100 text-orange-800"
      case "google":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">AI 프롬프트 개선 서비스</h1>
          <p className="text-slate-600">OpenAI, Anthropic, Google 공식 가이드 기반 실시간 제안</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>공식 프롬프트 엔지니어링 전략 적용</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>최고 보안 등급</span>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              프롬프트 편집기
            </TabsTrigger>
            <TabsTrigger value="lab" className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              실험실
            </TabsTrigger>
          </TabsList>

          {/* 프롬프트 편집기 탭 */}
          <TabsContent value="editor" className="space-y-6 mt-6">
            {/* 기존 프롬프트 편집기 내용을 여기에 이동 */}
            {/* API Status Alert */}
            {!apiKeyConfig && (
              <Alert className="border-blue-200 bg-blue-50">
                <Key className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>로컬 분석 모드:</strong> 공식 가이드 기반 로컬 분석을 사용 중입니다. 설정에서 개인 API 키를
                  추가하면 더 고급 분석이 가능합니다.
                </AlertDescription>
              </Alert>
            )}

            {apiKeyConfig && (
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Wifi className="h-4 w-4 text-green-600" />
                </div>
                <AlertDescription className="text-green-800">
                  <strong>고급 분석 모드 (보안):</strong> {apiKeyConfig.provider === "gemini" ? "Gemini" : "OpenAI"}{" "}
                  API를 통한 최고 품질의 제안을 제공합니다. API 키는 암호화되어 안전하게 보호됩니다.
                </AlertDescription>
              </Alert>
            )}

            {/* Analysis Info */}
            {analysisInfo && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">분석 정보:</span>
                  <span className="text-sm">
                    {analysisInfo.totalSuggestions}개 제안 (로컬: {analysisInfo.localAnalysisCount}개
                    {analysisInfo.usingUserKey &&
                      `, ${analysisInfo.provider}: ${analysisInfo.totalSuggestions - analysisInfo.localAnalysisCount}개`}
                    )
                  </span>
                </div>
                <div className="mt-2 text-xs text-blue-600">적용된 가이드: {analysisInfo.sources.join(", ")}</div>
              </Card>
            )}

            {/* Main Interface */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">프롬프트 편집기</h2>
                <div className="flex items-center gap-2">
                  {apiKeyConfig ? (
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-green-600" />
                      <Wifi className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs text-slate-500">
                    {apiKeyConfig ? `${apiKeyConfig.provider} 보안 연결` : "로컬 모드"}
                  </span>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      분석 중...
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="AI 프롬프트를 입력하세요... (예: '웹사이트 만들어줘')"
                  className="min-h-[120px] text-base resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Tab" && activeSuggestion) {
                      e.preventDefault()
                      acceptSuggestion(activeSuggestion)
                    }
                  }}
                />

                {/* Inline suggestion preview */}
                {activeSuggestion && (
                  <div className="absolute top-2 right-2 max-w-xs">
                    <Card className="p-3 bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <Badge className={cn("text-xs", getSuggestionTypeColor(activeSuggestion.type))}>
                            {getSuggestionTypeIcon(activeSuggestion.type)}
                            {activeSuggestion.type}
                          </Badge>
                          {activeSuggestion.source && (
                            <Badge className={cn("text-xs", getSourceColor(activeSuggestion.source))}>
                              {activeSuggestion.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 mb-1">{activeSuggestion.reason}</p>
                          {activeSuggestion.strategy && (
                            <p className="text-xs text-slate-500 mb-2">{activeSuggestion.strategy}</p>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 px-2 text-xs"
                              onClick={() => acceptSuggestion(activeSuggestion)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              수락 (Tab)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs bg-transparent"
                              onClick={() => rejectSuggestion(activeSuggestion)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <Tabs defaultValue="preferences" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preferences">제안 설정</TabsTrigger>
                    <TabsTrigger value="api-key">API 키 설정</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preferences" className="mt-4">
                    <Card className="p-4 bg-slate-50">
                      <h3 className="font-medium text-slate-800 mb-3">제안 설정</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={preferences.enableClarity}
                              onChange={(e) => setPreferences((prev) => ({ ...prev, enableClarity: e.target.checked }))}
                              className="rounded"
                            />
                            <span className="text-sm">명확성 개선 (OpenAI)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={preferences.enableSpecificity}
                              onChange={(e) =>
                                setPreferences((prev) => ({ ...prev, enableSpecificity: e.target.checked }))
                              }
                              className="rounded"
                            />
                            <span className="text-sm">구체성 향상 (OpenAI/Gemini)</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={preferences.enableStructure}
                              onChange={(e) =>
                                setPreferences((prev) => ({ ...prev, enableStructure: e.target.checked }))
                              }
                              className="rounded"
                            />
                            <span className="text-sm">구조 개선 (Anthropic/Gemini)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={preferences.enableDomain}
                              onChange={(e) => setPreferences((prev) => ({ ...prev, enableDomain: e.target.checked }))}
                              className="rounded"
                            />
                            <span className="text-sm">도메인 특화 (Anthropic)</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm text-slate-600 mb-2">
                          제안 민감도: {Math.round(preferences.sensitivity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.3"
                          max="1"
                          step="0.1"
                          value={preferences.sensitivity}
                          onChange={(e) =>
                            setPreferences((prev) => ({ ...prev, sensitivity: Number.parseFloat(e.target.value) }))
                          }
                          className="w-full"
                        />
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="api-key" className="mt-4">
                    <ApiKeySettings onApiKeyChange={setApiKeyConfig} currentConfig={apiKeyConfig} />
                  </TabsContent>
                </Tabs>
              )}
            </Card>

            {/* All Suggestions List */}
            {suggestions.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">사용 가능한 제안 ({suggestions.length}개)</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        activeSuggestion?.id === suggestion.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSuggestionTypeColor(suggestion.type)}>
                              {getSuggestionTypeIcon(suggestion.type)}
                              {suggestion.type}
                            </Badge>
                            {suggestion.source && (
                              <Badge className={getSourceColor(suggestion.source)}>{suggestion.source}</Badge>
                            )}
                            <span className="text-xs text-slate-500">
                              신뢰도: {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                          {suggestion.strategy && (
                            <p className="text-sm font-medium text-slate-700 mb-1">{suggestion.strategy}</p>
                          )}
                          <p className="text-sm text-slate-600 mb-2">{suggestion.reason}</p>
                          <div className="text-sm">
                            <div className="text-slate-500 mb-1">개선된 프롬프트:</div>
                            <div className="bg-slate-50 p-2 rounded text-slate-800 font-mono text-xs max-h-32 overflow-y-auto">
                              {suggestion.improved}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => acceptSuggestion(suggestion)} className="h-8">
                            <Check className="w-4 h-4 mr-1" />
                            수락
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectSuggestion(suggestion)}
                            className="h-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats */}
            {acceptedSuggestions.length > 0 && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    이번 세션에서 {acceptedSuggestions.length}개의 제안을 수락했습니다
                  </span>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* 실험실 탭 */}
          <TabsContent value="lab" className="space-y-6 mt-6">
            <LabInterface apiKeyConfig={apiKeyConfig} onApiKeyChange={setApiKeyConfig} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
