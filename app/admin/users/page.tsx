"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Ban, Trash2, Search, Filter, Download } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  lastActive: string
  status: "active" | "inactive" | "banned"
  suggestionsAccepted: number
  apiUsage: number
  plan: "free" | "pro" | "enterprise"
}

export default function UsersPage() {
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
      plan: "pro",
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
      plan: "enterprise",
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
      plan: "free",
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesPlan = planFilter === "all" || user.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-yellow-100 text-yellow-800"
      case "banned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
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

  const exportUsers = () => {
    const csvContent = [
      ["이름", "이메일", "상태", "플랜", "가입일", "마지막 활동", "수락한 제안", "API 사용량"],
      ...filteredUsers.map((user) => [
        user.name,
        user.email,
        user.status,
        user.plan,
        user.createdAt,
        user.lastActive,
        user.suggestionsAccepted.toString(),
        user.apiUsage.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "users.csv"
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
          <p className="text-gray-600">등록된 사용자를 관리하고 모니터링할 수 있습니다.</p>
        </div>
        <Button onClick={exportUsers} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          CSV 내보내기
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="banned">차단됨</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="플랜 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 플랜</SelectItem>
                <SelectItem value="free">무료</SelectItem>
                <SelectItem value="pro">프로</SelectItem>
                <SelectItem value="enterprise">엔터프라이즈</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({filteredUsers.length}명)</CardTitle>
          <CardDescription>필터링된 사용자 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                    <Badge className={getPlanColor(user.plan)}>{user.plan}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    가입일: {user.createdAt} | 마지막 활동: {user.lastActive}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    수락한 제안: {user.suggestionsAccepted}개 | API 사용량: {user.apiUsage}회
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, "view")} className="h-8">
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
    </div>
  )
}
