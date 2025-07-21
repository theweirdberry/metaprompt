"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye, Server, Trash2, Timer } from "lucide-react"

export function SecurityNotice() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Shield className="w-5 h-5" />
          보안 및 개인정보 보호
        </CardTitle>
        <CardDescription className="text-green-700">귀하의 API 키는 최고 수준의 보안으로 보호됩니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">로컬 암호화 저장</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">화면 마스킹 처리</span>
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">서버 전송 없음</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">언제든지 삭제 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">세션 종료 시 자동 삭제</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">HTTPS 암호화 통신</span>
            </div>
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <div className="font-medium">보안 수준: 최고 등급</div>
              <div className="text-sm space-y-1">
                <div>• API 키는 브라우저에서만 암호화되어 저장됩니다</div>
                <div>• 서버나 외부로 전송되지 않습니다</div>
                <div>• 개발자도 귀하의 API 키에 접근할 수 없습니다</div>
                <div>• 브라우저 종료 시 자동으로 삭제됩니다</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-green-100 text-green-800">
            <Lock className="w-3 h-3 mr-1" />
            암호화 저장
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="w-3 h-3 mr-1" />
            제로 트러스트
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <Eye className="w-3 h-3 mr-1" />
            완전 비공개
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
