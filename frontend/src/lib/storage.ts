/** Safe localStorage wrapper. All prototype persistence goes through here. */
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full: prototype continues in memory */
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}
