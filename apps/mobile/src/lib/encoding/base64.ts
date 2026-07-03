const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const utf8Encode = (input: string): number[] => {
  const bytes: number[] = []

  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0

    if (codePoint < 0x80) {
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      )
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      )
    }
  }

  return bytes
}

const utf8Decode = (bytes: number[]): string => {
  let result = ''
  let index = 0

  while (index < bytes.length) {
    const byte = bytes[index] ?? 0

    if (byte < 0x80) {
      result += String.fromCodePoint(byte)
      index += 1
    } else if (byte < 0xe0) {
      result += String.fromCodePoint(
        ((byte & 0x1f) << 6) | ((bytes[index + 1] ?? 0) & 0x3f)
      )
      index += 2
    } else if (byte < 0xf0) {
      result += String.fromCodePoint(
        ((byte & 0x0f) << 12) |
          (((bytes[index + 1] ?? 0) & 0x3f) << 6) |
          ((bytes[index + 2] ?? 0) & 0x3f)
      )
      index += 3
    } else {
      result += String.fromCodePoint(
        ((byte & 0x07) << 18) |
          (((bytes[index + 1] ?? 0) & 0x3f) << 12) |
          (((bytes[index + 2] ?? 0) & 0x3f) << 6) |
          ((bytes[index + 3] ?? 0) & 0x3f)
      )
      index += 4
    }
  }

  return result
}

export const encodeBase64 = (input: string): string => {
  const bytes = utf8Encode(input)
  let output = ''

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index] ?? 0
    const byte2 = bytes[index + 1]
    const byte3 = bytes[index + 2]

    output += BASE64_ALPHABET[byte1 >> 2]
    output += BASE64_ALPHABET[((byte1 & 0x03) << 4) | ((byte2 ?? 0) >> 4)]
    output +=
      byte2 === undefined
        ? '='
        : BASE64_ALPHABET[((byte2 & 0x0f) << 2) | ((byte3 ?? 0) >> 6)]
    output += byte3 === undefined ? '=' : BASE64_ALPHABET[byte3 & 0x3f]
  }

  return output
}

export const decodeBase64Url = (input: string): string => {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const bytes: number[] = []

  for (let index = 0; index < padded.length; index += 4) {
    const chunk = [0, 1, 2, 3].map(offset => {
      const char = padded[index + offset]
      return char === '=' || char === undefined
        ? -1
        : BASE64_ALPHABET.indexOf(char)
    })

    const value1 = chunk[0] ?? -1
    const value2 = chunk[1] ?? -1
    const value3 = chunk[2] ?? -1
    const value4 = chunk[3] ?? -1

    bytes.push(((value1 & 0x3f) << 2) | ((value2 & 0x30) >> 4))

    if (value3 >= 0) {
      bytes.push(((value2 & 0x0f) << 4) | ((value3 & 0x3c) >> 2))
    }

    if (value4 >= 0) {
      bytes.push(((value3 & 0x03) << 6) | (value4 & 0x3f))
    }
  }

  return utf8Decode(bytes)
}
