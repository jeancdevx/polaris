export const readGraphqlError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    if (
      'errors' in error &&
      Array.isArray((error as { errors: unknown }).errors)
    ) {
      const first = (error as { errors: { message?: string }[] }).errors[0]

      if (first?.message) {
        return first.message
      }
    }

    if (
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message
    }
  }

  return 'No se pudo cargar el dashboard.'
}
