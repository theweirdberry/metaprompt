"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Copy,
  Download,
  Trash2,
  FlaskConical,
  Zap,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Key,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ApiKeySettings } from "./api-key-settings"

interface ApiKeyConfig {
  provider: "gemini" | "openai"
  apiKey: string
  isValid?: boolean
  lastTested?: string
  autoCleanup?: boolean
}

interface LabInterfaceProps {
  apiKeyConfig: ApiKeyConfig | null
  onApiKeyChange: (config: ApiKeyConfig | null) => void
}

interface TestResult {
  id: string
  prompt: string
  response: string
  model: string
  provider: "gemini" | "openai"
  timestamp: string
  responseTime: number
  tokenCount?: number
  evaluation?: EvaluationResult
  isEvaluating?: boolean
}

interface EvaluationResult {
  overallScore: number
  categoryScores: {
    clarity: number
    contextualRichness: number
    reasoningElicitation: number
    modelAgnostic: number
    ambiguityBias: number
  }
  detailedFeedback: {
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  summary: string
}

export function LabInterface({ apiKeyConfig, onApiKeyChange }: LabInterfaceProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState<"gemini-2.5-pro" | "gpt-4" | "gpt-3.5-turbo">("gemini-2.5-pro")
  const [isGenerating, setIsGenerating] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getAvailableModels = () => {
    if (!apiKeyConfig) return []

    const models = []
    if (apiKeyConfig.provider === "gemini") {
      models.push(
        { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (최신)", provider: "gemini" },
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "gemini" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (빠름)", provider: "gemini" },
      )
    }
    if (apiKeyConfig.provider === "openai") {
      models.push(
        { value: "gpt-4", label: "GPT-4 (최고 품질)", provider: "openai" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (빠름)", provider: "openai" },
      )
    }
    return models
  }

  const generateResponse = async () => {
    if (!prompt.trim() || !apiKeyConfig) return

    setIsGenerating(true)
    setError(null)
    const startTime = Date.now()

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          apiConfig: apiKeyConfig,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "생성 실패")
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      const newResult: TestResult = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        response: data.response,
        model: selectedModel,
        provider: apiKeyConfig.provider,
        timestamp: new Date().toLocaleString("ko-KR"),
        responseTime,
        tokenCount: data.tokenCount,
        isEvaluating: true,
      }

      setTestResults((prev) => [newResult, ...prev])

      // 자동 평가 시작
      evaluateResponse(newResult)
    } catch (err) {
      console.error("Generation failed:", err)
      setError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }

  // 새로운 평가 함수 추가
  const evaluateResponse = async (result: TestResult) => {
    try {
      const response = await fetch("/api/evaluate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: result.prompt,
          response: result.response,
          model: result.model,
          apiConfig: apiKeyConfig,
        }),
      })

      if (!response.ok) {
        throw new Error("평가 실패")
      }

      const data = await response.json()

      setTestResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, evaluation: data.evaluation, isEvaluating: false } : r)),
      )
    } catch (error) {
      console.error("Evaluation failed:", error)
      setTestResults((prev) => prev.map((r) => (r.id === result.id ? { ...r, isEvaluating: false } : r)))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadResult = (result: TestResult) => {
    const content = `프롬프트: ${result.prompt}\n\n응답:\n${result.response}\n\n모델: ${result.model}\n시간: ${result.timestamp}\n응답 시간: ${result.responseTime}ms`
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `lab-result-${result.id}.txt`
    link.click()
  }

  const clearResults = () => {
    if (confirm("모든 실험 결과를 삭제하시겠습니까?")) {
      setTestResults([])
    }
  }

  const getModelBadgeColor = (provider: string) => {
    switch (provider) {
      case "gemini":
        return "bg-blue-100 text-blue-800"
      case "openai":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FlaskConical className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">AI 실험실</h2>
        </div>
        <p className="text-slate-600">개선된 프롬프트를 실제 AI 모델로 테스트해보세요</p>
      </div>

      {/* API Key Status */}
      {!apiKeyConfig && (
        <Alert className="border-orange-200 bg-orange-50">
          <Key className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>API 키 필요:</strong> 실험실을 사용하려면 API 키를 설정해주세요.
              </span>
              <Button size="sm" variant="outline" onClick={() => setShowSettings(true)} className="ml-4">
                <Settings className="w-4 h-4 mr-1" />
                설정
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {apiKeyConfig && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>연결됨:</strong> {apiKeyConfig.provider === "gemini" ? "Google Gemini" : "OpenAI"} API 사용 가능
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API 키 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApiKeySettings onApiKeyChange={onApiKeyChange} currentConfig={apiKeyConfig} />
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                설정 완료
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      {apiKeyConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                프롬프트 테스트
              </CardTitle>
              <CardDescription>개선된 프롬프트를 입력하고 AI 모델의 응답을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">AI 모델 선택</label>
                <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableModels().map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getModelBadgeColor(model.provider))}>{model.provider}</Badge>
                          {model.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">프롬프트</label>
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="테스트할 프롬프트를 입력하세요..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button onClick={generateResponse} disabled={!prompt.trim() || isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    AI 응답 생성
                  </>
                )}
              </Button>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  실험 결과 ({testResults.length})
                </CardTitle>
                {testResults.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    전체 삭제
                  </Button>
                )}
              </div>
              <CardDescription>AI 모델의 응답 결과를 확인하고 비교하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>아직 실험 결과가 없습니다.</p>
                  <p className="text-sm">프롬프트를 입력하고 테스트해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {testResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getModelBadgeColor(result.provider)}>{result.model}</Badge>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {result.responseTime}ms
                          </div>
                          {result.evaluation && (
                            <Badge className="bg-purple-100 text-purple-800">
                              평가: {result.evaluation.overallScore.toFixed(1)}/10
                            </Badge>
                          )}
                          {result.isEvaluating && <Badge className="bg-yellow-100 text-yellow-800">평가 중...</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(result.response)}
                            className="h-7 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadResult(result)}
                            className="h-7 px-2"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-medium text-slate-600 mb-1">프롬프트:</div>
                          <div className="text-sm bg-slate-50 p-2 rounded text-slate-700 max-h-20 overflow-y-auto">
                            {result.prompt}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-600 mb-1">AI 응답:</div>
                          <div className="text-sm bg-blue-50 p-2 rounded text-slate-800 max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {result.response}
                          </div>
                        </div>

                        {/* 평가 결과 표시 */}
                        {result.evaluation && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div className="text-xs font-medium text-purple-800 mb-2">AI 품질 평가</div>

                            {/* 카테고리별 점수 */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="text-xs">
                                <span className="text-slate-600">명확성:</span>
                                <span className="font-medium ml-1">{result.evaluation.categoryScores.clarity}/10</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-600">맥락 풍부성:</span>
                                <span className="font-medium ml-1">
                                  {result.evaluation.categoryScores.contextualRichness}/10
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-600">추론 유도:</span>
                                <span className="font-medium ml-1">
                                  {result.evaluation.categoryScores.reasoningElicitation}/10
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-600">범용성:</span>
                                <span className="font-medium ml-1">
                                  {result.evaluation.categoryScores.modelAgnostic}/10
                                </span>
                              </div>
                            </div>

                            {/* 요약 */}
                            <div className="text-xs text-purple-700 bg-white p-2 rounded">
                              <strong>요약:</strong> {result.evaluation.summary}
                            </div>

                            {/* 개선 제안 */}
                            {result.evaluation.detailedFeedback.improvements.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-purple-800 mb-1">개선 제안:</div>
                                <ul className="text-xs text-purple-700 space-y-1">
                                  {result.evaluation.detailedFeedback.improvements.map((improvement, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-purple-500">•</span>
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 border-t pt-2">
                        {result.timestamp}
                        {result.tokenCount && ` • ${result.tokenCount} 토큰`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
