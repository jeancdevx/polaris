import { describe, expect, it } from 'vitest'

import {
  displayMessageForAllowed,
  displayMessageForDenied
} from './display-messages.js'

describe('display messages', () => {
  it('shows walk-in entry copy', () => {
    expect(
      displayMessageForAllowed({
        readerLocation: 'entry',
        accessType: 'walk_in'
      })
    ).toEqual({
      line1: 'Bienvenido',
      line2: 'Busque plaza libre'
    })
  })

  it('shows exit copy on allowed exit scans', () => {
    expect(
      displayMessageForAllowed({
        readerLocation: 'exit',
        accessType: 'walk_in'
      })
    ).toEqual({
      line1: 'Hasta pronto',
      line2: 'Salida autorizada'
    })
  })

  it('maps denial reasons to LCD copy', () => {
    expect(displayMessageForDenied('parking_full')).toEqual({
      line1: 'Estacionamiento lleno',
      line2: 'Intente mas tarde'
    })
    expect(displayMessageForDenied('session_already_open')).toEqual({
      line1: 'Ya ingreso',
      line2: 'Use la salida primero'
    })
  })
})
