import { describe, expect, it } from 'vitest'

import {
  displayMessageForAllowed,
  displayMessageForDenied,
  displayMessageIdle
} from './display-messages.js'

describe('display messages', () => {
  it('shows idle welcome with free spots count', () => {
    expect(displayMessageIdle(7)).toEqual({
      line1: 'Bienvenido',
      line2: 'Libres: 7',
      idle: true,
      freeSpots: 7
    })
  })

  it('shows walk-in entry copy with free spots', () => {
    expect(
      displayMessageForAllowed({
        readerLocation: 'entry',
        accessType: 'walk_in',
        freeSpots: 6
      })
    ).toEqual({
      line1: 'Bienvenido',
      line2: 'Libres: 6',
      freeSpots: 6
    })
  })

  it('shows exit copy on allowed exit scans', () => {
    expect(
      displayMessageForAllowed({
        readerLocation: 'exit',
        accessType: 'walk_in',
        freeSpots: 4
      })
    ).toEqual({
      line1: 'Hasta pronto',
      line2: 'Salida autorizada',
      freeSpots: 4
    })
  })

  it('maps denial reasons to LCD copy', () => {
    expect(displayMessageForDenied('parking_full', 0)).toEqual({
      line1: 'Estacionamiento lleno',
      line2: 'Intente mas tarde',
      freeSpots: 0
    })
    expect(displayMessageForDenied('session_already_open')).toEqual({
      line1: 'Ya ingreso',
      line2: 'Use la salida primero'
    })
  })
})
