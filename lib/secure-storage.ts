"use client"

const STORAGE_KEY = "ai-prompt-improver-secure-config"
const SALT_KEY = "ai-prompt-improver-salt" // salt 저장 (선택)

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// 고정된 사용자 키 대신 password 기반 KDF 사용
const getKeyFromPassword = async (password: string, salt: Uint8Array) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

class SecureStorage {
  static password = "user-provided-password-or-static-key" // 보안을 위해 앱 외부에서 주입 권장

  static async encrypt(text: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getKeyFromPassword(this.password, salt)

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text)
    )

    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    result.set(salt, 0)
    result.set(iv, salt.length)
    result.set(new Uint8Array(encrypted), salt.length + iv.length)

    return btoa(String.fromCharCode(...result))
  }

  static async decrypt(encryptedText: string): Promise<string> {
    try {
      const data = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0))
      const salt = data.slice(0, 16)
      const iv = data.slice(16, 28)
      const encrypted = data.slice(28)
      const key = await getKeyFromPassword(this.password, salt)

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
      )

      return decoder.decode(decrypted)
    } catch {
      return ""
    }
  }

  static async saveApiConfig(config: any) {
    try {
      const encrypted = await this.encrypt(JSON.stringify(config))
      localStorage.setItem(STORAGE_KEY, encrypted)
    } catch (error) {
      console.error("Failed to encrypt and save API config:", error)
    }
  }

  static async loadApiConfig(): Promise<any | null> {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY)
      if (!encrypted) return null
      const decrypted = await this.decrypt(encrypted)
      return decrypted ? JSON.parse(decrypted) : null
    } catch (error) {
      console.error("Failed to decrypt and load API config:", error)
      return null
    }
  }

  static clearApiConfig(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  static enableAutoCleanup(): void {
    window.addEventListener("beforeunload", () => {
      this.clearApiConfig()
    })
  }

  static maskApiKey(apiKey: string): string {
    if (!apiKey) return ""
    if (apiKey.length <= 8) return "*".repeat(apiKey.length)
    return `${apiKey.substring(0, 4)}${"*".repeat(apiKey.length - 8)}${apiKey.slice(-4)}`
  }

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
