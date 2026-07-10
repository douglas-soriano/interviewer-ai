export class Score {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(`Score must be between 0 and 100. Received ${value}.`);
    }

    this.value = Math.round(value);
  }

  static clamp(value: number): Score {
    return new Score(Math.max(0, Math.min(100, value)));
  }

  toNumber(): number {
    return this.value;
  }
}
