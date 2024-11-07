import { compareSync, genSaltSync, hashSync } from 'bcryptjs';

/**
 * Convert original text to hash text
 *
 * @param text
 * @param salt default 10
 * @returns The hash text
 */
export const hashValue = (text: string, salt = 10) => {
  return hashSync(text, genSaltSync(salt));
};

/**
 * Compare hash
 *
 * @param text
 * @param hashText
 * @returns result
 */
export const compareHash = (text: string, hashText: string) => {
  return compareSync(text, hashText);
};

export const convertStringBoolean = (boolean: string) => {
  return boolean === 'true';
};
