export class SlidingWindowBucket {
  private timestamps: number[] = [];

  constructor(private windowMs: number, private max: number) {}

  tryAdd(): boolean {
    this.prune();
    if (this.timestamps.length >= this.max) {
      return false;
    }
    this.timestamps.push(Date.now());
    return true;
  }

  get count(): number {
    this.prune();
    return this.timestamps.length;
  }

  get remaining(): number {
    return Math.max(0, this.max - this.count);
  }

  clear(): void {
    this.timestamps = [];
  }

  reset(max: number, windowMs?: number): void {
    this.max = max;
    if (windowMs !== undefined) {
      this.windowMs = windowMs;
    }
    this.clear();
  }

  private prune(): void {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
  }
}