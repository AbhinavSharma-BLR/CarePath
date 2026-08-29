class MemoryRedisStore {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async setEx(key: string, seconds: number, value: string): Promise<string> {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const val = (current ? parseInt(current, 10) : 0) + 1;
    this.store.set(key, { value: String(val), expiresAt: Date.now() + 3600 * 1000 });
    return val;
  }
}

export const redis = new MemoryRedisStore();
