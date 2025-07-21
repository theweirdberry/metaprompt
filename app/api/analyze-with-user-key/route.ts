import { GoogleGenerativeAI } from "@google/generative-ai"
import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"
import { PromptEngineeringAnalyzer } from "@/lib/prompt-engineering-strategies"

interface AnalyzeRequest {
  prompt: string
  preferences: any
  apiConfig?: {
    provider: "gemini" | "openai"
    apiKey: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, preferences, apiConfig }: AnalyzeRequest = body

    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ suggestions: [] })
    }

    // 1단계: 로컬 분석 (공식 가이드 기반)
    const analyzer = new PromptEngineeringAnalyzer()
    const localAnalysis = analyzer.analyzePrompt(prompt, preferences)

    let suggestions = localAnalysis.map((result, index) => ({
      id: `local-${result.source}-${Date.now()}-${index}`,
      type: result.category,
      original: result.original,
      improved: result.improved,
      reason: `${result.reason} (${result.strategy})`,
      confidence: result.confidence,
      position: { start: 0, end: prompt.length },
      strategy: result.strategy,
      source: result.source,
    }))

    // 2단계: 사용자 API 키를 통한 AI 분석
    if (apiConfig && apiConfig.apiKey) {
      try {
        let aiSuggestions = []

        if (apiConfig.provider === "gemini") {
          aiSuggestions = await analyzeWithGemini(prompt, preferences, apiConfig.apiKey)
        } else if (apiConfig.provider === "openai") {
          aiSuggestions = await analyzeWithOpenAI(prompt, preferences, apiConfig.apiKey)
        }

        // 로컬 분석과 AI 분석 결합
        const combinedSuggestions = [...suggestions]
        aiSuggestions.forEach((aiSugg: any) => {
          const isDuplicate = suggestions.some(
            (localSugg) => localSugg.type === aiSugg.type && localSugg.confidence < aiSugg.confidence,
          )
          if (!isDuplicate) {
            combinedSuggestions.push(aiSugg)
          }
        })

        suggestions = combinedSuggestions
      } catch (apiError) {
        console.error("사용자 API 키 분석 오류:", apiError)
        // 로컬 분석 결과만 사용하고 계속 진행
      }
    }

    // 필터링 및 정렬
    const filteredSuggestions = suggestions
      .filter((s) => s.confidence >= preferences.sensitivity)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)

    return NextResponse.json({
      suggestions: filteredSuggestions,
      analysisTime: Date.now(),
      sources: ["OpenAI Official Guide", "Anthropic Claude Guide", "Google Gemini Guide"],
      localAnalysisCount: localAnalysis.length,
      totalSuggestions: filteredSuggestions.length,
      usingUserKey: !!apiConfig?.apiKey,
      provider: apiConfig?.provider,
    })
  } catch (error: any) {
    console.error("분석 오류:", error)

    // 폴백: 기본 로컬 분석
    try {
      const body = await request.json()
      const { prompt, preferences } = body

      const analyzer = new PromptEngineeringAnalyzer()
      const fallbackAnalysis = analyzer.analyzePrompt(prompt, preferences)

      const fallbackSuggestions = fallbackAnalysis.map((result, index) => ({
        id: `fallback-${result.source}-${Date.now()}-${index}`,
        type: result.category,
        original: result.original,
        improved: result.improved,
        reason: result.reason,
        confidence: result.confidence * 0.9,
        position: { start: 0, end: prompt.length },
        strategy: result.strategy,
        source: result.source,
      }))

      return NextResponse.json({
        suggestions: fallbackSuggestions.filter((s) => s.confidence >= preferences.sensitivity),
        analysisTime: Date.now(),
        fallback: true,
        error: "API 오류로 인해 로컬 분석만 사용됨",
      })
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: "분석 중 오류가 발생했습니다.",
          suggestions: [],
        },
        { status: 500 },
      )
    }
  }
}

// LLM 기반 정확한 분석으로 전면 교체

async function analyzeWithGemini(prompt: string, preferences: any, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const enhancedPrompt = `
당신은 세계 최고의 프롬프트 엔지니어링 전문가입니다. OpenAI, Anthropic, Google의 공식 가이드라인을 완벽히 마스터했습니다.

${PromptEngineeringAnalyzer.getComprehensivePromptGuide()}

## 분석할 프롬프트:
"${prompt}"

## 사용자 선호도:
- 명확성 개선: ${preferences.enableClarity ? "활성화" : "비활성화"}
- 구체성 향상: ${preferences.enableSpecificity ? "활성화" : "비활성화"}  
- 구조 개선: ${preferences.enableStructure ? "활성화" : "비활성화"}
- 도메인 특화: ${preferences.enableDomain ? "활성화" : "비활성화"}

## 분석 요청:
위 프롬프트를 종합적으로 분석하고, 활성화된 선호도에 따라 구체적인 개선 제안을 해주세요.
각 제안은 위의 공식 가이드라인 중 하나 이상을 적용해야 합니다.

다음 JSON 형식으로만 응답해주세요:
{
  "suggestions": [
    {
      "type": "clarity|specificity|structure|domain",
      "strategy": "적용된 구체적 전략명 (예: OpenAI Clear Instructions + Anthropic Role Assignment)",
      "original": "개선이 필요한 원본 부분",
      "improved": "완전히 개선된 전체 프롬프트",
      "reason": "개선 이유와 적용된 공식 가이드라인의 구체적 설명 (어떤 원칙을 어떻게 적용했는지)",
      "confidence": 0.85,
      "source": "google",
      "appliedTechniques": ["technique1", "technique2"]
    }
  ]
}

중요: 
1. 각 제안은 실제 공식 가이드라인을 정확히 적용해야 합니다
2. improved 필드는 완전히 개선된 전체 프롬프트여야 합니다
3. 신뢰도는 적용된 기법의 효과성을 기준으로 정확히 계산하세요
4. 최대 3개의 고품질 제안만 제공하세요
`

    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const text = response.text()

    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    const parsed = JSON.parse(cleanedText)

    return parsed.suggestions.map((s: any, index: number) => ({
      id: `gemini-expert-${Date.now()}-${index}`,
      type: s.type,
      original: s.original,
      improved: s.improved,
      reason: s.reason,
      confidence: s.confidence,
      position: { start: 0, end: prompt.length },
      strategy: s.strategy,
      source: "google",
      appliedTechniques: s.appliedTechniques || [],
    }))
  } catch (error) {
    console.error("Gemini 전문 분석 오류:", error)
    return []
  }
}

async function analyzeWithOpenAI(prompt: string, preferences: any, apiKey: string) {
  try {
    const openai = new OpenAI({ apiKey })

    const enhancedPrompt = `
당신은 세계 최고의 프롬프트 엔지니어링 전문가입니다. OpenAI, Anthropic, Google의 공식 가이드라인을 완벽히 마스터했습니다.

${PromptEngineeringAnalyzer.getComprehensivePromptGuide()}

## 분석할 프롬프트:
"${prompt}"

## 사용자 선호도:
- 명확성 개선: ${preferences.enableClarity ? "활성화" : "비활성화"}
- 구체성 향상: ${preferences.enableSpecificity ? "활성화" : "비활성화"}
- 구조 개선: ${preferences.enableStructure ? "활성화" : "비활성화"}
- 도메인 특화: ${preferences.enableDomain ? "활성화" : "비활성화"}

## 분석 요청:
위 프롬프트를 종합적으로 분석하고, 활성화된 선호도에 따라 구체적인 개선 제안을 해주세요.
각 제안은 위의 공식 가이드라인 중 하나 이상을 적용해야 합니다.

다음 JSON 형식으로만 응답해주세요:
{
  "suggestions": [
    {
      "type": "clarity|specificity|structure|domain",
      "strategy": "적용된 구체적 전략명 (예: OpenAI Clear Instructions + Anthropic Role Assignment)",
      "original": "개선이 필요한 원본 부분", 
      "improved": "완전히 개선된 전체 프롬프트",
      "reason": "개선 이유와 적용된 공식 가이드라인의 구체적 설명 (어떤 원칙을 어떻게 적용했는지)",
      "confidence": 0.85,
      "source": "openai",
      "appliedTechniques": ["technique1", "technique2"]
    }
  ]
}

중요:
1. 각 제안은 실제 공식 가이드라인을 정확히 적용해야 합니다
2. improved 필드는 완전히 개선된 전체 프롬프트여야 합니다  
3. 신뢰도는 적용된 기법의 효과성을 기준으로 정확히 계산하세요
4. 최대 3개의 고품질 제안만 제공하세요
`

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: enhancedPrompt }],
      model: "gpt-4",
      temperature: 0.2,
      max_tokens: 2000,
    })

    const text = completion.choices[0]?.message?.content || ""
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    const parsed = JSON.parse(cleanedText)

    return parsed.suggestions.map((s: any, index: number) => ({
      id: `openai-expert-${Date.now()}-${index}`,
      type: s.type,
      original: s.original,
      improved: s.improved,
      reason: s.reason,
      confidence: s.confidence,
      position: { start: 0, end: prompt.length },
      strategy: s.strategy,
      source: "openai",
      appliedTechniques: s.appliedTechniques || [],
    }))
  } catch (error) {
    console.error("OpenAI 전문 분석 오류:", error)
    return []
  }
}
