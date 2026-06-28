import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common'

type CognitoServiceException = {
  name: string
  message?: string
}

const isCognitoServiceException = (
  error: unknown
): error is CognitoServiceException =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  typeof error.name === 'string'

export const mapCognitoError = (error: unknown): never => {
  if (!isCognitoServiceException(error)) {
    throw new InternalServerErrorException('Authentication service unavailable')
  }

  const message = error.message ?? 'Authentication failed'

  switch (error.name) {
    case 'UsernameExistsException':
      throw new ConflictException('Email already registered')
    case 'InvalidPasswordException':
    case 'InvalidParameterException':
      throw new BadRequestException(message)
    case 'NotAuthorizedException':
    case 'PasswordResetRequiredException':
      throw new UnauthorizedException('Invalid email or password')
    case 'UserNotConfirmedException':
      throw new ForbiddenException('Email confirmation required')
    case 'UserNotFoundException':
      throw new UnauthorizedException('Invalid email or password')
    case 'TooManyRequestsException':
    case 'LimitExceededException':
      throw new HttpException(
        'Too many authentication attempts',
        HttpStatus.TOO_MANY_REQUESTS
      )
    default:
      throw new InternalServerErrorException(
        'Authentication service unavailable'
      )
  }
}
