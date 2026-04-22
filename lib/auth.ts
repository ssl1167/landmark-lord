// 模拟函数，实际项目中应该使用JWT解析
export async function getUserIdFromToken(token: string): Promise<string | null> {
  // 这里简单返回一个固定的用户ID，实际项目中应该解析JWT token
  // 由于没有安装jsonwebtoken，暂时使用模拟数据
  return '1' // 假设用户ID为1
}

