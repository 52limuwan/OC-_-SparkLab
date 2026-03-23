// 认证工具函数

export interface User {
  id: number
  email: string
  username?: string
  createdAt: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// 获取存储的 token
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

// 设置 token
export const setToken = (token: string): void => {
  localStorage.setItem('token', token)
}

// 移除 token
export const removeToken = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// 获取当前用户信息
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// 设置用户信息
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user))
}

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken()
}

// 登出
export const logout = (): void => {
  removeToken()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
