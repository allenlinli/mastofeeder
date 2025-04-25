import * as Option from "fp-ts/lib/Option";
import { URL as TyperaURL } from "typera-express";

export function validateHostname(hostname: string): boolean {
  try {
    new URL(`https://${hostname}`);
    return true;
  } catch {
    return false;
  }
}

export const urlParser: TyperaURL.Conversion<string> = (s: string) => {
  try {
    // If it's already a URL, reject it
    new URL(s);
    return Option.none;
  } catch {
    try {
      // Try to parse as a hostname
      const url = new URL(`https://${s}`);
      return Option.some(s);
    } catch {
      return Option.none;
    }
  }
};
