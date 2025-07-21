import { NextResponse } from "next/server"

// 실제 구현에서는 데이터베이스에서 데이터를 가져옵니다
export async function GET() {
  try {
    // 모의 데이터 - 실제로는 데이터베이스 쿼리
    const stats = {
      totalUsers: 1247,
      activeUsers: 89,
      totalSuggestions: 15432,
      acceptedSuggestions: 12108,
      apiCalls: 8934,
      errorRate: 2.3,
      dailyStats: [
        { date: "2024-01-14", users: 78, suggestions: 234, accepted: 189 },
        { date: "2024-01-15", users: 82, suggestions: 267, accepted: 201 },
        { date: "2024-01-16", users: 91, suggestions: 298, accepted: 234 },
        { date: "2024-01-17", users: 87, suggestions: 276, accepted: 218 },
        { date: "2024-01-18", users: 94, suggestions: 312, accepted: 251 },
        { date: "2024-01-19", users: 89, suggestions: 289, accepted: 227 },
        { date: "2024-01-20", users: 96, suggestions: 324, accepted: 268 },
      ],
      suggestionTypes: {
        clarity: { total: 4521, accepted: 4023, rate: 89 },
        specificity: { total: 3876, accepted: 2946, rate: 76 },
        structure: { total: 3234, accepted: 2199, rate: 68 },
        domain: { total: 3801, accepted: 3117, rate: 82 },
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("통계 데이터 조회 실패:", error)
    return NextResponse.json({ error: "통계 데이터를 가져올 수 없습니다" }, { status: 500 })
  }
}
