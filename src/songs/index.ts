import { entertainer } from './entertainer'
import { furElise } from './furElise'
import { jingleBells } from './jingleBells'
import { mountainKing } from './mountainKing'
import { odeToJoy } from './odeToJoy'
import { takeMeOut } from './takeMeOut'
import { twinkleTwinkle } from './twinkleTwinkle'
import type { Song } from './types'

/** Every song in the game, easiest first. Add a song by writing its file and listing it here. */
export const songs: Song[] = [
  twinkleTwinkle,
  odeToJoy,
  jingleBells,
  takeMeOut,
  furElise,
  mountainKing,
  entertainer,
]
