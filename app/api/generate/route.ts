import { GoogleGenerativeAI } from "@google/generative-ai"
import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"

interface GenerateRequest {
  prompt: string
  model: string
  apiConfig: {
    provider: "gemini" | "openai"
    apiKey: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, apiConfig }: GenerateRequest = await request.json()

    if (!prompt || !model || !apiConfig) {
      return NextResponse.json({ error: "필수 매개변수가 누락되었습니다." }, { status: 400 })
    }

    if (apiConfig.provider === "gemini") {
      return await generateWithGemini(prompt, model, apiConfig.apiKey)
    } else if (apiConfig.provider === "openai") {
      return await generateWithOpenAI(prompt, model, apiConfig.apiKey)
    } else {
      return NextResponse.json({ error: "지원하지 않는 AI 제공업체입니다." }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: error.message || "생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}

async function generateWithGemini(prompt: string, model: string, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // 모델 매핑
    let geminiModel = "gemini-1.5-pro"
    if (model === "gemini-2.5-pro") {
      geminiModel = "gemini-2.0-flash-exp" // 2.5 Pro가 아직 정식 출시되지 않았으므로 최신 모델 사용
    } else if (model === "gemini-1.5-flash") {
      geminiModel = "gemini-1.5-flash"
    }

    const aiModel = genAI.getGenerativeModel({ model: geminiModel })

    const result = await aiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 토큰 수 계산 (근사치)
    const tokenCount = Math.ceil(text.length / 4)

    return NextResponse.json({
      response: text,
      model: geminiModel,
      provider: "gemini",
      tokenCount,
    })
  } catch (error: any) {
    console.error("Gemini generation error:", error)

    let errorMessage = "Gemini API 오류가 발생했습니다."
    if (error.message?.includes("API key not valid")) {
      errorMessage = "유효하지 않은 Gemini API 키입니다."
    } else if (error.message?.includes("quota")) {
      errorMessage = "Gemini API 사용량 한도를 초과했습니다."
    } else if (error.message?.includes("safety")) {
      errorMessage = "안전 필터에 의해 차단된 콘텐츠입니다."
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function generateWithOpenAI(prompt: string, model: string, apiKey: string) {
  try {
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content || ""
    const tokenCount = completion.usage?.total_tokens || 0

    return NextResponse.json({
      response,
      model,
      provider: "openai",
      tokenCount,
    })
  } catch (error: any) {
    console.error("OpenAI generation error:", error)

    let errorMessage = "OpenAI API 오류가 발생했습니다."
    if (error.message?.includes("Incorrect API key")) {
      errorMessage = "유효하지 않은 OpenAI API 키입니다."
    } else if (error.message?.includes("quota")) {
      errorMessage = "OpenAI API 사용량 한도를 초과했습니다."
    } else if (error.message?.includes("billing")) {
      errorMessage = "OpenAI 계정의 결제 정보를 확인해주세요."
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
