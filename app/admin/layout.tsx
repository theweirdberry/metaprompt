import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "관리자 대시보드 - AI 프롬프트 개선 서비스",
  description: "AI 프롬프트 개선 서비스의 관리자 대시보드",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">AI 프롬프트 개선 서비스</h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">관리자</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">관리자님, 안녕하세요!</span>
              <button className="text-sm text-blue-600 hover:text-blue-700">로그아웃</button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
