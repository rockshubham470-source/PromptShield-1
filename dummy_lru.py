class LRU:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.keys = []

    def __getitem__(self, key):
        return self.cache[key]

    def __setitem__(self, key, value):
        if key in self.cache:
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                # evict least-recently used
                lru_key = self.keys.pop(0)
                del self.cache[lru_key]
            self.cache[key] = value
            self.keys.append(key)

    def __contains__(self, key):
        return key in self.cache

    def clear(self):
        self.cache.clear()
        self.keys.clear()

    def __len__(self):
        return len(self.cache)
