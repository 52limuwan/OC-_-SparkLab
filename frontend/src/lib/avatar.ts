/**
 * 从QQ邮箱提取QQ号
 * @param email QQ邮箱地址
 * @returns QQ号，如果不是QQ邮箱则返回null
 */
export function extractQQNumber(email: string): string | null {
  if (!email) return null
  
  // 匹配 xxx@qq.com 格式
  const match = email.match(/^(\d+)@qq\.com$/i)
  return match ? match[1] : null
}

/**
 * 获取QQ头像URL
 * @param email QQ邮箱地址
 * @param size 头像尺寸，默认640
 * @returns QQ头像URL，如果不是QQ邮箱则返回默认头像
 */
export function getQQAvatar(email: string, size: number = 640): string {
  const qqNumber = extractQQNumber(email)
  
  if (qqNumber) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=${size}`
  }
  
  // 返回默认头像（使用 Material Icons 的占位符）
  return ''
}
