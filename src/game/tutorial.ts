import { readFlag, writeFlag } from './storage'

const STORAGE_KEY = 'one-note:tutorial-done'

export const hasSeenTutorial = () => readFlag(STORAGE_KEY)

export const markTutorialSeen = () => writeFlag(STORAGE_KEY, true)
