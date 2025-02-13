class CacheService {
  constructor() {
    this.cache = new Map();
    this.expirationTimes = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 1000; // 最多缓存1000条记录
    this.accessCount = new Map(); // 记录访问次数
  }

  set(key, value, ttl = this.defaultTTL) {
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, value);
    this.expirationTimes.set(key, Date.now() + ttl);
    this.accessCount.set(key, 0);
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expirationTime = this.expirationTimes.get(key);
    if (Date.now() > expirationTime) {
      this.delete(key);
      return null;
    }

    // 更新访问计数
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.expirationTimes.delete(key);
    this.accessCount.delete(key);
  }

  clear() {
    this.cache.clear();
    this.expirationTimes.clear();
    this.accessCount.clear();
  }

  // 淘汰最少使用的条目
  evictLeastUsed() {
    let leastUsedKey = null;
    let leastUsedCount = Infinity;

    for (const [key, count] of this.accessCount.entries()) {
      if (count < leastUsedCount) {
        leastUsedCount = count;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.delete(leastUsedKey);
    }
  }

  // 获取当前缓存大小（字节）
  getSize() {
    let size = 0;
    for (const [key, value] of this.cache.entries()) {
      size += this.getObjectSize(key) + this.getObjectSize(value);
    }
    return size;
  }

  // 估算对象大小（字节）
  getObjectSize(obj) {
    const str = JSON.stringify(obj);
    return str.length * 2; // UTF-16 编码，每个字符2字节
  }

  // 生成缓存键
  generateKey(parentId, page) {
    return `nodes_${parentId || 'root'}_${page}`;
  }
}

export const cacheService = new CacheService();
export { CacheService };
