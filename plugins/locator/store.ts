export default class {
  private readonly map = new Map<string, object>();

  lazyService<T extends object>(name: string, generate: () => T): () => T {
    return () => {
      if (this.map.has(name)) return this.map.get(name)! as T;
      const obj = generate();
      this.map.set(name, obj);
      return obj;
    };
  }

  service<T extends object>(name: string, generate: () => T): () => T {
    this.map.set(name, generate());

    return () => {
      return this.map.get(name)! as T;
    };
  }
}
