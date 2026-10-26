export function normalizeContainerNumber(value: string): string {
  if (!value) return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hasInvalidContainerNumber(value: string): boolean {
  const normalized = normalizeContainerNumber(value);
  if (!normalized) return false; // Vide n'est pas invalide, c'est juste vide

  // Un conteneur valide fait 11 caractères (4 lettres, 6 chiffres, 1 chiffre de contrôle)
  if (normalized.length !== 11) return true;

  // Vérification du format (4 lettres puis 7 chiffres)
  if (!/^[A-Z]{4}\d{7}$/.test(normalized)) return true;

  // Calcul de la clé de contrôle ISO 6346
  const letterValues: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
    J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
    S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
  };

  const letters = normalized.slice(0, 4);
  const numbers = normalized.slice(4, 10);
  const checkDigit = parseInt(normalized[10], 10);

  let sum = 0;
  for (let i = 0; i < 4; i++) {
    sum += letterValues[letters[i]] * Math.pow(2, i);
  }
  for (let i = 0; i < 6; i++) {
    sum += parseInt(numbers[i], 10) * Math.pow(2, i + 4);
  }

  const calculatedCheckDigit = (sum % 11) % 10;
  return calculatedCheckDigit !== checkDigit;
}