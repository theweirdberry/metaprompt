import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY environment variable is not set",
        instructions: "Please add GEMINI_API_KEY=your_api_key_here to your .env.local file",
      })
    }

    if (apiKey === "your_gemini_api_key_here" || apiKey === "your_actual_api_key_here") {
      return NextResponse.json({
        success: false,
        error: "Please replace the placeholder API key with your actual Gemini API key",
        instructions: "Get your API key from https://makersuite.google.com/app/apikey",
      })
    }

    // Validate API key format (Gemini API keys typically start with "AI")
    if (!apiKey.startsWith("AI")) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key format. Gemini API keys should start with 'AI'",
        instructions: "Please check your API key from https://makersuite.google.com/app/apikey",
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Using flash model for testing

    const result = await model.generateContent('Respond with exactly: "API connection successful"')
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      message: "Gemini API connection successful",
      response: text.trim(),
      model: "gemini-1.5-flash",
    })
  } catch (error: any) {
    console.error("Gemini API test failed:", error)

    let errorMessage = "Unknown error occurred"
    let instructions = "Please check your API key and try again"

    if (error.message?.includes("API key not valid")) {
      errorMessage = "Invalid API key provided"
      instructions =
        "Please get a valid API key from https://makersuite.google.com/app/apikey and add it to your .env.local file"
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded"
      instructions = "Please check your Gemini API usage limits"
    } else if (error.message?.includes("permission")) {
      errorMessage = "API access denied"
      instructions = "Please ensure your API key has the necessary permissions"
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      instructions,
      details: error.message,
    })
  }
}
