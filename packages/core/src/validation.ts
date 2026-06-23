export function normalizeId(value: string, subject: string): string {
  const id = value.trim();
  if (!id) {
    throw new Error(`${subject} id is required.`);
  }

  return id;
}

export function validatePositiveInteger(subject: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${subject} must be a positive integer. Received ${value}.`);
  }
}

export function validateNonNegativeInteger(subject: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${subject} must be a non-negative integer. Received ${value}.`);
  }
}

export function assertUniqueIds<T extends { id: string }>(subject: string, items: T[]): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error(`${subject} has duplicate id "${item.id}".`);
    }
    ids.add(item.id);
  }
}
