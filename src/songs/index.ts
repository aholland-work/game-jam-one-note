import { brahmsLullaby } from './brahmsLullaby'
import { deckTheHalls } from './deckTheHalls'
import { eineKleine } from './eineKleine'
import { entertainer } from './entertainer'
import { frereJacques } from './frereJacques'
import { furElise } from './furElise'
import { jingleBells } from './jingleBells'
import { mapleLeafRag } from './mapleLeafRag'
import { maryLamb } from './maryLamb'
import { minuetInG } from './minuetInG'
import { mountainKing } from './mountainKing'
import { odeToJoy } from './odeToJoy'
import { takeMeOut } from './takeMeOut'
import { twinkleTwinkle } from './twinkleTwinkle'
import type { Song } from './types'

/** Every song in the game, easiest first. Add a song by writing its file and listing it here. */
export const songs: Song[] = [
  twinkleTwinkle,
  maryLamb,
  frereJacques,
  odeToJoy,
  jingleBells,
  brahmsLullaby,
  takeMeOut,
  deckTheHalls,
  minuetInG,
  furElise,
  eineKleine,
  mapleLeafRag,
  mountainKing,
  entertainer,
]
