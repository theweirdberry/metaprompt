"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff, Key, ExternalLink, CheckCircle, AlertCircle, Trash2, Shield, Timer } from "lucide-react"
import { SecurityNotice } from "./security-notice"
import SecureStorage from "@/lib/secure-storage"

interface ApiKeyConfig {
  provider: "gemini" | "openai"
  apiKey: string
  isValid?: boolean
  lastTested?: string
  autoCleanup?: boolean
}

interface ApiKeySettingsProps {
  onApiKeyChange: (config: ApiKeyConfig | null) => void
  currentConfig: ApiKeyConfig | null
}

export function ApiKeySettings({ onApiKeyChange, currentConfig }: ApiKeySettingsProps) {
  const [provider, setProvider] = useState<"gemini" | "openai">(currentConfig?.provider || "gemini")
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "")
  const [showApiKey, setShowApiKey] = useState(false)
  const [autoCleanup, setAutoCleanup] = useState(currentConfig?.autoCleanup || true)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (currentConfig) {
      setProvider(currentConfig.provider)
      setApiKey(currentConfig.apiKey)
      setAutoCleanup(currentConfig.autoCleanup || true)
    }
  }, [currentConfig])

  // 자동 정리 설정
  useEffect(() => {
    if (autoCleanup) {
      SecureStorage.enableAutoCleanup()
    }
  }, [autoCleanup])

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        isValid: false,
        message: "API 키를 입력해주세요.",
      })
      return
    }

    // 형식 검증
    if (!SecureStorage.validateApiKeyFormat(provider, apiKey.trim())) {
      setValidationResult({
        isValid: false,
        message: `올바른 ${provider === "gemini" ? "Gemini" : "OpenAI"} API 키 형식이 아닙니다.`,
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setValidationResult({
          isValid: true,
          message: `${provider === "gemini" ? "Gemini" : "OpenAI"} API 키가 유효합니다!`,
        })

        // 보안 저장
        const config: ApiKeyConfig = {
          provider,
          apiKey: apiKey.trim(),
          isValid: true,
          lastTested: new Date().toISOString(),
          autoCleanup,
        }

        SecureStorage.saveApiConfig(config)
        onApiKeyChange(config)
      } else {
        setValidationResult({
          isValid: false,
          message: data.error || "API 키 검증에 실패했습니다.",
        })
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "네트워크 오류가 발생했습니다.",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const clearApiKey = () => {
    setApiKey("")
    setValidationResult(null)
    SecureStorage.clearApiConfig()
    onApiKeyChange(null)
  }

  const getApiKeyPlaceholder = () => {
    switch (provider) {
      case "gemini":
        return "AIza... (Gemini API 키)"
      case "openai":
        return "sk-... (OpenAI API 키)"
      default:
        return "API 키를 입력하세요"
    }
  }

  const getProviderInfo = () => {
    switch (provider) {
      case "gemini":
        return {
          name: "Google Gemini",
          url: "https://makersuite.google.com/app/apikey",
          description: "Google AI Studio에서 무료 API 키를 발급받을 수 있습니다.",
          keyFormat: "AIza로 시작하는 39자리 키",
        }
      case "openai":
        return {
          name: "OpenAI",
          url: "https://platform.openai.com/api-keys",
          description: "OpenAI Platform에서 API 키를 발급받을 수 있습니다.",
          keyFormat: "sk-로 시작하는 51자리 키",
        }
    }
  }

  const providerInfo = getProviderInfo()

  return (
    <div className="space-y-6">
      {/* 보안 안내 */}
      <SecurityNotice />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API 키 설정
          </CardTitle>
          <CardDescription>개인 API 키를 사용하여 고급 프롬프트 분석 기능을 활용하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI 제공업체</Label>
            <Select value={provider} onValueChange={(value: "gemini" | "openai") => setProvider(value)}>
              <SelectTrigger>
                <SelectValue placeholder="AI 제공업체를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    Google Gemini (추천)
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    OpenAI GPT
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <div>
                  <strong>{providerInfo.name}</strong>: {providerInfo.description}
                </div>
                <div className="text-sm">형식: {providerInfo.keyFormat}</div>
                <a
                  href={providerInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  API 키 발급받기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </AlertDescription>
          </Alert>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 키</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={getApiKeyPlaceholder()}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 보안 옵션 */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              보안 옵션
            </h4>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-cleanup" className="text-sm">
                  브라우저 종료 시 자동 삭제
                </Label>
                <p className="text-xs text-gray-600">보안을 위해 브라우저를 닫을 때 API 키를 자동으로 삭제합니다</p>
              </div>
              <Switch id="auto-cleanup" checked={autoCleanup} onCheckedChange={setAutoCleanup} />
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={validationResult.isValid ? "text-green-800" : "text-red-800"}>
                {validationResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          {currentConfig && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    연결됨
                  </Badge>
                  <span className="text-sm text-green-700">
                    {currentConfig.provider === "gemini" ? "Google Gemini" : "OpenAI"} 사용 중
                  </span>
                </div>
                <div className="text-xs text-green-600">API 키: {SecureStorage.maskApiKey(currentConfig.apiKey)}</div>
                {currentConfig.autoCleanup && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Timer className="w-3 h-3" />
                    자동 삭제 활성화
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearApiKey}
                className="text-red-600 hover:text-red-700 bg-transparent border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                제거
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={validateApiKey} disabled={isValidating || !apiKey.trim()} className="flex-1">
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  검증 중...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  API 키 검증 및 저장
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
