"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Server,
  Eye,
  Ban,
  Trash2,
  RefreshCw,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSuggestions: number
  acceptedSuggestions: number
  apiCalls: number
  errorRate: number
}

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  lastActive: string
  status: "active" | "inactive" | "banned"
  suggestionsAccepted: number
  apiUsage: number
}

interface SuggestionLog {
  id: string
  userId: string
  type: "clarity" | "specificity" | "structure" | "domain"
  originalPrompt: string
  improvedPrompt: string
  accepted: boolean
  confidence: number
  timestamp: string
}

interface SystemHealth {
  apiStatus: "healthy" | "degraded" | "down"
  dbStatus: "healthy" | "degraded" | "down"
  responseTime: number
  uptime: string
  memoryUsage: number
  cpuUsage: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1247,
    activeUsers: 89,
    totalSuggestions: 15432,
    acceptedSuggestions: 12108,
    apiCalls: 8934,
    errorRate: 2.3,
  })
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      email: "user1@example.com",
      name: "김철수",
      createdAt: "2024-01-15",
      lastActive: "2024-01-20 14:30",
      status: "active",
      suggestionsAccepted: 45,
      apiUsage: 120,
    },
    {
      id: "2",
      email: "user2@example.com",
      name: "이영희",
      createdAt: "2024-01-10",
      lastActive: "2024-01-19 09:15",
      status: "active",
      suggestionsAccepted: 78,
      apiUsage: 203,
    },
    {
      id: "3",
      email: "user3@example.com",
      name: "박민수",
      createdAt: "2024-01-05",
      lastActive: "2024-01-18 16:45",
      status: "inactive",
      suggestionsAccepted: 23,
      apiUsage: 67,
    },
  ])
  const [suggestionLogs, setSuggestionLogs] = useState<SuggestionLog[]>([
    {
      id: "1",
      userId: "1",
      type: "clarity",
      originalPrompt: "웹사이트 만들어줘",
      improvedPrompt: "반응형 웹사이트를 만들어주세요. 모던한 디자인과 사용자 친화적인 인터페이스를 포함해주세요.",
      accepted: true,
      confidence: 0.89,
      timestamp: "2024-01-20 14:25",
    },
    {
      id: "2",
      userId: "2",
      type: "specificity",
      originalPrompt: "앱 개발해줘",
      improvedPrompt:
        "React Native를 사용한 모바일 앱을 개발해주세요. iOS와 Android 호환성을 고려하고, 사용자 인증 기능을 포함해주세요.",
      accepted: true,
      confidence: 0.92,
      timestamp: "2024-01-20 13:15",
    },
    {
      id: "3",
      userId: "1",
      type: "structure",
      originalPrompt: "데이터베이스 설계하고 API 만들고 프론트엔드도 만들어줘",
      improvedPrompt:
        "프로젝트 요구사항:\n1. 데이터베이스 설계 (PostgreSQL)\n2. RESTful API 개발 (Node.js)\n3. 프론트엔드 구현 (React)\n\n각 단계별 상세 요구사항을 명시해주세요.",
      accepted: false,
      confidence: 0.76,
      timestamp: "2024-01-20 12:30",
    },
  ])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiStatus: "healthy",
    dbStatus: "healthy",
    responseTime: 245,
    uptime: "99.8%",
    memoryUsage: 67,
    cpuUsage: 23,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "healthy":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "degraded":
        return "bg-yellow-100 text-yellow-800"
      case "banned":
      case "down":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case "clarity":
        return "bg-blue-100 text-blue-800"
      case "specificity":
        return "bg-green-100 text-green-800"
      case "structure":
        return "bg-purple-100 text-purple-800"
      case "domain":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleUserAction = (userId: string, action: "view" | "ban" | "delete") => {
    switch (action) {
      case "view":
        alert(`사용자 ${userId} 상세 정보 보기`)
        break
      case "ban":
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: "banned" as const } : user)))
        break
      case "delete":
        if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
          setUsers((prev) => prev.filter((user) => user.id !== userId))
        }
        break
    }
  }

  const refreshData = () => {
    // 실제 구현에서는 API 호출
    alert("데이터를 새로고침했습니다.")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600">AI 프롬프트 개선 서비스 관리</p>
          </div>
          <Button onClick={refreshData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
        </div>

        {/* 시스템 상태 알림 */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>시스템 정상:</strong> 모든 서비스가 정상적으로 작동 중입니다. (가동률: {systemHealth.uptime})
          </AlertDescription>
        </Alert>

        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">활성 사용자: {stats.activeUsers}명</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 제안</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuggestions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                수락률: {Math.round((stats.acceptedSuggestions / stats.totalSuggestions) * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API 호출</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.apiCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">오류율: {stats.errorRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">응답 시간</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">평균 응답 시간</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 메뉴 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="suggestions">제안 로그</TabsTrigger>
            <TabsTrigger value="system">시스템 상태</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    사용량 추이
                  </CardTitle>
                  <CardDescription>최근 7일간 주요 지표</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">일일 활성 사용자</span>
                      <span className="font-medium">+12.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">제안 수락률</span>
                      <span className="font-medium">+8.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API 응답 시간</span>
                      <span className="font-medium">-15.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    제안 유형별 통계
                  </CardTitle>
                  <CardDescription>각 제안 유형의 성과</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">명확성</Badge>
                      </div>
                      <span className="font-medium">89% 수락률</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">구체성</Badge>
                      </div>
                      <span className="font-medium">76% 수락률</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">구조</Badge>
                      </div>
                      <span className="font-medium">68% 수락률</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">도메인</Badge>
                      </div>
                      <span className="font-medium">82% 수락률</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>사용자 목록</CardTitle>
                <CardDescription>등록된 모든 사용자를 관리할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          가입일: {user.createdAt} | 마지막 활동: {user.lastActive}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          수락한 제안: {user.suggestionsAccepted}개 | API 사용량: {user.apiUsage}회
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, "view")}
                          className="h-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, "ban")}
                          className="h-8"
                          disabled={user.status === "banned"}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, "delete")}
                          className="h-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 제안 로그 탭 */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>제안 로그</CardTitle>
                <CardDescription>모든 제안 활동을 실시간으로 모니터링할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestionLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getSuggestionTypeColor(log.type)}>{log.type}</Badge>
                          <Badge className={log.accepted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {log.accepted ? "수락됨" : "거부됨"}
                          </Badge>
                          <span className="text-sm text-gray-500">신뢰도: {Math.round(log.confidence * 100)}%</span>
                        </div>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">원본 프롬프트:</span>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">{log.originalPrompt}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">개선된 프롬프트:</span>
                          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded mt-1">{log.improvedPrompt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시스템 상태 탭 */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    서비스 상태
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API 서버</span>
                    <Badge className={getStatusColor(systemHealth.apiStatus)}>{systemHealth.apiStatus}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">데이터베이스</span>
                    <Badge className={getStatusColor(systemHealth.dbStatus)}>{systemHealth.dbStatus}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">가동률</span>
                    <span className="font-medium">{systemHealth.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">평균 응답 시간</span>
                    <span className="font-medium">{systemHealth.responseTime}ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    리소스 사용량
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">메모리 사용량</span>
                      <span className="font-medium">{systemHealth.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemHealth.memoryUsage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CPU 사용량</span>
                      <span className="font-medium">{systemHealth.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemHealth.cpuUsage}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>최근 시스템 이벤트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">시스템 정상 작동</p>
                      <p className="text-xs text-gray-600">2024-01-20 15:30 - 모든 서비스가 정상적으로 작동 중</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">API 응답 시간 개선</p>
                      <p className="text-xs text-gray-600">2024-01-20 14:15 - 평균 응답 시간이 15% 개선됨</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">높은 트래픽 감지</p>
                      <p className="text-xs text-gray-600">2024-01-20 13:45 - 평소보다 높은 API 호출량 감지</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
