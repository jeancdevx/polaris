export type AuthTokensResponse = {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export type SignupResponse = {
  userSub: string
  confirmationRequired: true
  codeDeliveryDestination?: string
}

export type SignupBody = {
  email: string
  password: string
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
