/**
 * Wide Event Logger — one rich JSON event per request.
 * Accumulates fields throughout request processing, emits once at the end.
 */

export class WideEvent {
  private fields: Record<string, unknown> = {};
  private startTime = performance.now();

  /** Set a field on the event */
  set(key: string, value: unknown): void {
    this.fields[key] = value;
  }

  /** Increment a numeric field */
  incr(key: string, amount = 1): void {
    const current = (this.fields[key] as number) ?? 0;
    this.fields[key] = current + amount;
  }

  /**
   * Time an async operation. Records `${name}_duration_ms` and
   * `${name}_error` if it throws. Returns the result.
   */
  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.fields[`${name}_duration_ms`] = Math.round(performance.now() - start);
      return result;
    } catch (err) {
      this.fields[`${name}_duration_ms`] = Math.round(performance.now() - start);
      this.fields[`${name}_error`] = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  /** Emit the event as a single JSON line to stdout */
  emit(): void {
    this.fields.total_duration_ms = Math.round(performance.now() - this.startTime);
    this.fields.timestamp = new Date().toISOString();
    console.log(JSON.stringify(this.fields));
  }
}
