import { appConfig } from "./config";

export function sanitizeStatement(input) {
  const { maxLength, disallowedRegex } = appConfig.validation.statement;
  let cleaned = input.replace(disallowedRegex, "");
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

export function validatePlayerName(input) {
  const { minLength, maxLength, invalidCharRegex } =
    appConfig.validation.playerName;
  const playerName = input.trim();
  const isTooShort = playerName.length < minLength;
  const isTooLong = playerName.length > maxLength;
  const hasInvalidChars = invalidCharRegex.test(playerName);

  return {
    isValid: !isTooShort && !isTooLong && !hasInvalidChars,
    cleaned: playerName,
    error: isTooShort
      ? "Name is too short"
      : isTooLong
        ? "Name is too long"
        : hasInvalidChars
          ? "Name contains invalid characters"
          : null,
  };
}