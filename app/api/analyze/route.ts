import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { PromptEngineeringAnalyzer } from "@/lib/prompt-engineering-strategies"
import type { AnalysisRequest, Suggestion } from "@/types" // Declare the types here

export async function POST(request: NextRequest) {
  try {
    const { prompt, preferences }: AnalysisRequest = await request.json()

    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ suggestions: [] })
    }

    const apiKey = process.env.GEMINI_API_KEY

    // 1단계: 로컬 프롬프트 엔지니어링 분석 (공식 가이드 기반)
    const analyzer = new PromptEngineeringAnalyzer()
    const localAnalysis = analyzer.analyzePrompt(prompt, preferences)

    let suggestions: Suggestion[] = localAnalysis.map((result, index) => ({
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

    // 2단계: Gemini API를 통한 추가 분석 (API 키가 있는 경우)
    if (apiKey && apiKey !== "your_gemini_api_key_here" && apiKey !== "your_actual_api_key_here") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const enhancedPrompt = `
당신은 OpenAI, Anthropic, Google의 공식 프롬프트 엔지니어링 가이드를 마스터한 전문가입니다.

다음 프롬프트를 분석하고 개선 제안을 해주세요:
"${prompt}"

분석 기준:
- OpenAI 6가지 전략: 명확한 지시, 참고 텍스트 제공, 복잡한 작업 분할, 모델에게 생각할 시간 제공, 외부 도구 사용, 체계적 테스트
- Anthropic 전략: 역할 설정, 단계별 사고, 예시 제공, 명확한 구조
- Google Gemini 전략: 구조화된 출력, Few-shot 학습, 멀티모달 활용

사용자 선호도:
- 명확성 개선: ${preferences.enableClarity ? "활성화" : "비활성화"}
- 구체성 향상: ${preferences.enableSpecificity ? "활성화" : "비활성화"}
- 구조 개선: ${preferences.enableStructure ? "활성화" : "비활성화"}
- 도메인 특화: ${preferences.enableDomain ? "활성화" : "비활성화"}

다음 JSON 형식으로만 응답해주세요:
{
  "suggestions": [
    {
      "type": "clarity|specificity|structure|domain",
      "strategy": "적용된 전략명 (예: OpenAI Clear Instructions)",
      "original": "개선할 부분",
      "improved": "전체 개선된 프롬프트",
      "reason": "개선 이유와 적용된 공식 가이드라인 설명",
      "confidence": 0.85,
      "source": "openai|anthropic|google"
    }
  ]
}

규칙:
1. 활성화된 선호도 유형만 제안
2. 신뢰도 ${preferences.sensitivity} 이상만 포함
3. 최대 3개 제안
4. 실제 공식 가이드라인 기반으로만 제안
5. 한국어로 이유 설명
`

        const result = await model.generateContent(enhancedPrompt)
        const response = await result.response
        const text = response.text()

        try {
          const cleanedText = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim()
          const parsed = JSON.parse(cleanedText)

          const aiSuggestions: Suggestion[] = parsed.suggestions.map((s: any, index: number) => ({
            id: `ai-${s.source || "gemini"}-${Date.now()}-${index}`,
            type: s.type,
            original: s.original,
            improved: s.improved,
            reason: s.reason,
            confidence: s.confidence,
            position: { start: 0, end: prompt.length },
            strategy: s.strategy,
            source: s.source || "google",
          }))

          // 로컬 분석과 AI 분석 결합 (중복 제거)
          const combinedSuggestions = [...suggestions]
          aiSuggestions.forEach((aiSugg) => {
            const isDuplicate = suggestions.some(
              (localSugg) => localSugg.type === aiSugg.type && localSugg.confidence < aiSugg.confidence,
            )
            if (!isDuplicate) {
              combinedSuggestions.push(aiSugg)
            }
          })

          suggestions = combinedSuggestions
        } catch (parseError) {
          console.error("AI 응답 파싱 실패:", text)
          // 로컬 분석 결과만 사용
        }
      } catch (apiError) {
        console.error("Gemini API 오류:", apiError)
        // 로컬 분석 결과만 사용
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
    })
  } catch (error: any) {
    console.error("분석 오류:", error)

    // 폴백: 로컬 분석만 사용
    const analyzer = new PromptEngineeringAnalyzer()
    const fallbackAnalysis = analyzer.analyzePrompt(prompt, preferences)

    const fallbackSuggestions: Suggestion[] = fallbackAnalysis.map((result, index) => ({
      id: `fallback-${result.source}-${Date.now()}-${index}`,
      type: result.category,
      original: result.original,
      improved: result.improved,
      reason: result.reason,
      confidence: result.confidence * 0.9, // 폴백이므로 신뢰도 약간 감소
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
  }
}
