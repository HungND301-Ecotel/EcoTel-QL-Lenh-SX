import { atomWithStorage } from 'jotai/vanilla/utils'
import { User } from '../types'
export const userAtom = atomWithStorage<any | null>('user', null)