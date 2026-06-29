export type AuthTokensResponse = {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export type SigninBody = {
  email: string
  password: string
}

export type RefreshBody = {
  refreshToken: string
}

export type LogoutBody = {
  accessToken?: string
}

export type MessageResponse = {
  message: string
}
