export class Cedula {
  private constructor(public readonly value: string) {}

  static parse(input: string): Cedula {
    const digits = String(input ?? "").replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 12) {
      throw new InvalidCedulaError(digits);
    }
    return new Cedula(digits);
  }

  static tryParse(input: string): Cedula | null {
    try {
      return Cedula.parse(input);
    } catch {
      return null;
    }
  }

  /** As stored in Airtable's number field. */
  toNumber(): number {
    return Number(this.value);
  }

  toString(): string {
    return this.value;
  }
}

export class InvalidCedulaError extends Error {
  constructor(public readonly raw: string) {
    super(`Cédula inválida: "${raw}"`);
    this.name = "InvalidCedulaError";
  }
}
