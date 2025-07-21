import { GoogleGenerativeAI } from "@google/generative-ai"
import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"
import { PromptEngineeringAnalyzer } from "@/lib/prompt-engineering-strategies"

interface EvaluateRequest {
  prompt: string
  response: string
  model: string
  apiConfig: {
    provider: "gemini" | "openai"
    apiKey: string
  }
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

export async function POST(request: NextRequest) {
  try {
    const { prompt, response, model, apiConfig }: EvaluateRequest = await request.json()

    if (!prompt || !response || !apiConfig) {
      return NextResponse.json({ error: "필수 매개변수가 누락되었습니다." }, { status: 400 })
    }

    let evaluation: EvaluationResult

    if (apiConfig.provider === "gemini") {
      evaluation = await evaluateWithGemini(prompt, response, model, apiConfig.apiKey)
    } else if (apiConfig.provider === "openai") {
      evaluation = await evaluateWithOpenAI(prompt, response, model, apiConfig.apiKey)
    } else {
      return NextResponse.json({ error: "지원하지 않는 AI 제공업체입니다." }, { status: 400 })
    }

    return NextResponse.json({
      evaluation,
      evaluatedAt: new Date().toISOString(),
      evaluatorModel: apiConfig.provider,
    })
  } catch (error: any) {
    console.error("Evaluation error:", error)
    return NextResponse.json({ error: error.message || "평가 중 오류가 발생했습니다." }, { status: 500 })
  }
}

async function evaluateWithGemini(
  prompt: string,
  response: string,
  model: string,
  apiKey: string,
): Promise<EvaluationResult> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

  const evaluationPrompt = `
당신은 세계 최고의 AI 응답 품질 평가 전문가입니다.

${PromptEngineeringAnalyzer.getEvaluationCriteria()}

## 평가 대상:
**프롬프트:** "${prompt}"
**AI 응답:** "${response}"
**사용된 모델:** ${model}

## 평가 요청:
위의 프롬프트와 AI 응답을 5가지 기준으로 정확히 평가해주세요.
각 기준별로 10점 만점으로 점수를 매기고, 구체적인 근거를 제시하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "overallScore": 8.2,
  "categoryScores": {
    "clarity": 9,
    "contextualRichness": 8,
    "reasoningElicitation": 7,
    "modelAgnostic": 8,
    "ambiguityBias": 9
  },
  "detailedFeedback": {
    "strengths": [
      "명확하고 구체적인 지시사항 제공",
      "적절한 맥락과 배경 정보 포함"
    ],
    "weaknesses": [
      "단계별 추론 과정 유도 부족",
      "예시나 참고 자료 부족"
    ],
    "improvements": [
      "Chain of Thought 기법 적용 권장",
      "Few-shot 예시 추가 필요"
    ]
  },
  "summary": "전반적으로 우수한 프롬프트이나, 추론 유도 부분에서 개선이 필요합니다."
}

중요:
1. 각 점수는 구체적인 근거를 바탕으로 정확히 매겨야 합니다
2. 전체 점수는 5개 카테고리 점수의 평균입니다
3. 피드백은 구체적이고 실행 가능해야 합니다
4. 프롬프트 엔지니어링 관점에서 전문적으로 평가하세요
`

  const result = await aiModel.generateContent(evaluationPrompt)
  const response_text = await result.response
  const text = response_text.text()

  const cleanedText = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  return JSON.parse(cleanedText)
}

async function evaluateWithOpenAI(
  prompt: string,
  response: string,
  model: string,
  apiKey: string,
): Promise<EvaluationResult> {
  const openai = new OpenAI({ apiKey })

  const evaluationPrompt = `
당신은 세계 최고의 AI 응답 품질 평가 전문가입니다.

${PromptEngineeringAnalyzer.getEvaluationCriteria()}

## 평가 대상:
**프롬프트:** "${prompt}"
**AI 응답:** "${response}"
**사용된 모델:** ${model}

## 평가 요청:
위의 프롬프트와 AI 응답을 5가지 기준으로 정확히 평가해주세요.
각 기준별로 10점 만점으로 점수를 매기고, 구체적인 근거를 제시하세요.

다음 JSON 형식으로만 응답해주세요:
{
  "overallScore": 8.2,
  "categoryScores": {
    "clarity": 9,
    "contextualRichness": 8,
    "reasoningElicitation": 7,
    "modelAgnostic": 8,
    "ambiguityBias": 9
  },
  "detailedFeedback": {
    "strengths": [
      "명확하고 구체적인 지시사항 제공",
      "적절한 맥락과 배경 정보 포함"
    ],
    "weaknesses": [
      "단계별 추론 과정 유도 부족",
      "예시나 참고 자료 부족"
    ],
    "improvements": [
      "Chain of Thought 기법 적용 권장",
      "Few-shot 예시 추가 필요"
    ]
  },
  "summary": "전반적으로 우수한 프롬프트이나, 추론 유도 부분에서 개선이 필요합니다."
}

중요:
1. 각 점수는 구체적인 근거를 바탕으로 정확히 매겨야 합니다
2. 전체 점수는 5개 카테고리 점수의 평균입니다
3. 피드백은 구체적이고 실행 가능해야 합니다
4. 프롬프트 엔지니어링 관점에서 전문적으로 평가하세요
`

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: evaluationPrompt }],
    model: "gpt-4",
    temperature: 0.1,
    max_tokens: 1500,
  })

  const text = completion.choices[0]?.message?.content || ""
  const cleanedText = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  return JSON.parse(cleanedText)
}
