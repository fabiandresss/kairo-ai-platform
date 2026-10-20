import { read, write } from '../lib/storage'
import { sleep, uid } from '../lib/utils'

/**
 * Local persistence for prototype entities. Swap the body of these functions
 * for fetch() calls to the FastAPI backend when it exists; callers don't change.
 */
export function createCollection<T extends { id: string }>(key: string, seed: T[], prefix: string) {
  const storageKey = `kairo.data.${key}`
  const load = (): T[] => read<T[]>(storageKey, seed)
  const save = (items: T[]) => write(storageKey, items)
  return {
    async list(): Promise<T[]> {
      await sleep(180)
      return load()
    },
    async create(data: Omit<T, 'id'>): Promise<T> {
      await sleep(180)
      const item = { ...data, id: uid(prefix) } as T
      save([item, ...load()])
      return item
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      await sleep(120)
      const items = load().map((i) => (i.id === id ? { ...i, ...patch } : i))
      save(items)
      return items.find((i) => i.id === id) as T
    },
    async remove(id: string): Promise<void> {
      await sleep(120)
      save(load().filter((i) => i.id !== id))
    },
    reset() {
      save(seed)
    },
  }
}
