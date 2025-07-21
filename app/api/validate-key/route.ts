import { GoogleGenerativeAI } from "@google/generative-ai"
import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"

interface ValidateKeyRequest {
  provider: "gemini" | "openai"
  apiKey: string
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey }: ValidateKeyRequest = await request.json()

    if (!apiKey || !provider) {
      return NextResponse.json({
        success: false,
        error: "API 키와 제공업체를 모두 입력해주세요.",
      })
    }

    // Validate API key format
    if (provider === "gemini" && !apiKey.startsWith("AIza")) {
      return NextResponse.json({
        success: false,
        error: "Gemini API 키는 'AIza'로 시작해야 합니다.",
      })
    }

    if (provider === "openai" && !apiKey.startsWith("sk-")) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API 키는 'sk-'로 시작해야 합니다.",
      })
    }

    // Test the API key
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const result = await model.generateContent('응답: "API 연결 성공"')
      const response = await result.response
      const text = response.text()

      return NextResponse.json({
        success: true,
        message: "Gemini API 키가 유효합니다.",
        provider: "gemini",
        testResponse: text.trim(),
      })
    } else if (provider === "openai") {
      const openai = new OpenAI({ apiKey })

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: '응답: "API 연결 성공"' }],
        model: "gpt-3.5-turbo",
        max_tokens: 50,
      })

      return NextResponse.json({
        success: true,
        message: "OpenAI API 키가 유효합니다.",
        provider: "openai",
        testResponse: completion.choices[0]?.message?.content?.trim() || "",
      })
    }

    return NextResponse.json({
      success: false,
      error: "지원하지 않는 제공업체입니다.",
    })
  } catch (error: any) {
    console.error("API 키 검증 오류:", error)

    let errorMessage = "API 키 검증에 실패했습니다."

    if (error.message?.includes("API key not valid") || error.message?.includes("Incorrect API key")) {
      errorMessage = "유효하지 않은 API 키입니다."
    } else if (error.message?.includes("quota")) {
      errorMessage = "API 사용량 한도를 초과했습니다."
    } else if (error.message?.includes("permission")) {
      errorMessage = "API 키에 필요한 권한이 없습니다."
    } else if (error.message?.includes("billing")) {
      errorMessage = "결제 정보를 확인해주세요."
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error.message,
    })
  }
}
