import { appConfig } from "./config";

export function sanitizeStatement(input) {
  const { maxLength, disallowedRegex } = appConfig.validation.statement;
  let cleaned = input.replace(disallowedRegex, "");
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

export function validateStatement(input){
  const { minLength, maxLength}=appConfig.validation.statement;
  const isTooShort = input.length < minLength;
  const isTooLong = input.length > maxLength;
  const isEmpty = input.length === 0;

  return {
    isValid: !isTooShort && !isTooLong && !isEmpty,
    cleaned: input,
    error: isEmpty
      ? "Statement is empty"
      : isTooShort
        ? `Statement must be at least ${minLength} characters`
        : isTooLong
          ? `Statement must be less than ${maxLength} characters`
          : null,
  };
}

export function validatePlayerName(input) {
  const { minLength, maxLength, invalidCharRegex } =
    appConfig.validation.playerName;
  const playerName = input.trim();
  const isEmpty = playerName.length === 0;
  const isTooShort = playerName.length < minLength;
  const isTooLong = playerName.length > maxLength;
  const hasInvalidChars = invalidCharRegex.test(playerName);

  return {
    isValid: !isTooShort && !isTooLong && !hasInvalidChars && !isEmpty,
    cleaned: playerName,
    error: isEmpty
      ? "Name is empty"
      :isTooShort
      ? `Name must be at least ${minLength} characters`
      : isTooLong
        ? `Name must be less than ${maxLength} characters`
        : hasInvalidChars
          ? "Name contains invalid characters"
          : null,
  };
}