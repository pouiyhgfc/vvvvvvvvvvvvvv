// Testomgeving voor Node: een nep-IndexedDB voor Dexie en een in-memory
// localStorage (die heeft Node niet, en de startmigratie leest eruit).
import "fake-indexeddb/auto";

class MemoryStorage {
  #items = new Map();
  get length() {
    return this.#items.size;
  }
  key(i) {
    return [...this.#items.keys()][i] ?? null;
  }
  getItem(k) {
    return this.#items.has(k) ? this.#items.get(k) : null;
  }
  setItem(k, v) {
    this.#items.set(k, String(v));
  }
  removeItem(k) {
    this.#items.delete(k);
  }
  clear() {
    this.#items.clear();
  }
}

globalThis.localStorage = new MemoryStorage();
