import { read, remove, write } from '../lib/storage'
import { sleep, uid } from '../lib/utils'
import type { User } from '../types'

/**
 * DEMO AUTH — only lives in this browser's localStorage. It is NOT a security
 * system: no server, no real sessions. Passwords are salted + PBKDF2-hashed
 * (never stored in plain text) so the data layout can be replaced by a real
 * backend (FastAPI) without touching the UI.
 */
interface StoredUser extends User {
  salt: string
  hash: string
}

const USERS = 'kairo.demo.users'
const SESSION = 'kairo.demo.session'

const toHex = (b: ArrayBuffer) =>
  [...new Uint8Array(b)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(bits)
}

export class AuthError extends Error {}

export function sessionUser(): User | null {
  const persisted = read<User | null>(SESSION, null)
  if (persisted) return persisted
  try {
    const s = sessionStorage.getItem(SESSION)
    return s ? (JSON.parse(s) as User) : null
  } catch {
    return null
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  await sleep(500)
  const users = read<StoredUser[]>(USERS, [])
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    throw new AuthError('Ya existe una cuenta de demostración con ese correo en este navegador.')
  const salt = uid('s') + uid('s')
  const stored: StoredUser = { id: uid('usr'), name, email, salt, hash: await hash(password, salt) }
  write(USERS, [...users, stored])
  return { id: stored.id, name, email }
}

export async function loginUser(email: string, password: string, remember: boolean): Promise<User> {
  await sleep(500)
  const u = read<StoredUser[]>(USERS, []).find((x) => x.email.toLowerCase() === email.toLowerCase())
  if (!u || (await hash(password, u.salt)) !== u.hash) throw new AuthError('Correo o contraseña incorrectos.')
  const user: User = { id: u.id, name: u.name, email: u.email }
  logoutUser()
  if (remember) write(SESSION, user)
  else {
    try {
      sessionStorage.setItem(SESSION, JSON.stringify(user))
    } catch {
      /* noop */
    }
  }
  return user
}

export function logoutUser() {
  remove(SESSION)
  try {
    sessionStorage.removeItem(SESSION)
  } catch {
    /* noop */
  }
}

/** Placeholder: no mail provider is connected, so nothing is actually sent. */
export async function requestPasswordReset(email: string): Promise<void> {
  void email
  await sleep(600)
}
