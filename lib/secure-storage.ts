"use client"

// 암호화를 위한 간단한 유틸리티
class SecureStorage {
  private static readonly STORAGE_KEY = "ai-prompt-improver-secure-config"
  private static readonly ENCRYPTION_KEY = "ai-prompt-improver-2024"

  // 간단한 XOR 암호화 (실제 운영환경에서는 더 강력한 암호화 사용 권장)
  private static encrypt(text: string): string {
    const key = this.ENCRYPTION_KEY
    let result = ""
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return btoa(result) // Base64 인코딩
  }

  private static decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText) // Base64 디코딩
      const key = this.ENCRYPTION_KEY
      let result = ""
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
      }
      return result
    } catch {
      return ""
    }
  }

  static saveApiConfig(config: any): void {
    try {
      const encrypted = this.encrypt(JSON.stringify(config))
      localStorage.setItem(this.STORAGE_KEY, encrypted)
    } catch (error) {
      console.error("Failed to save API config:", error)
    }
  }

  static loadApiConfig(): any | null {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY)
      if (!encrypted) return null

      const decrypted = this.decrypt(encrypted)
      return decrypted ? JSON.parse(decrypted) : null
    } catch (error) {
      console.error("Failed to load API config:", error)
      return null
    }
  }

  static clearApiConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // 세션 종료 시 자동 삭제 옵션
  static enableAutoCleanup(): void {
    window.addEventListener("beforeunload", () => {
      this.clearApiConfig()
    })
  }

  // API 키 마스킹
  static maskApiKey(apiKey: string): string {
    if (!apiKey) return ""
    if (apiKey.length <= 8) return "*".repeat(apiKey.length)

    const start = apiKey.substring(0, 4)
    const end = apiKey.substring(apiKey.length - 4)
    const middle = "*".repeat(apiKey.length - 8)

    return `${start}${middle}${end}`
  }

  // API 키 유효성 검사 (형식)
  static validateApiKeyFormat(provider: string, apiKey: string): boolean {
    switch (provider) {
      case "gemini":
        return /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey)
      case "openai":
        return /^sk-[A-Za-z0-9]{48}$/.test(apiKey)
      default:
        return false
    }
  }
}

export default SecureStorage
