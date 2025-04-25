import * as Option from "fp-ts/lib/Option";
import { URL as TyperaURL } from "typera-express";

export function validateHostname(hostname: string): boolean {
  try {
    // Remove @ prefix if present
    const cleanHostname = hostname.replace(/^@/, "");
    // Remove domain suffix if present (e.g., @mastofeeder.com)
    const withoutDomain = cleanHostname.split("@")[0];
    // Remove .rss and .xml extensions
    const withoutExt = withoutDomain.replace(/\.(rss|xml)$/, "");
    // Convert slashes to dots
    const normalizedHostname = withoutExt.replace(/\//g, ".");
    // Try to create a URL to validate
    new URL(`https://${normalizedHostname}`);
    return true;
  } catch {
    return false;
  }
}

export function normalizeHostname(hostname: string): string {
  // Remove @ prefix if present
  const cleanHostname = hostname.replace(/^@/, "");
  // Remove domain suffix if present (e.g., @mastofeeder.com)
  const withoutDomain = cleanHostname.split("@")[0];
  // Remove .rss and .xml extensions
  const withoutExt = withoutDomain.replace(/\.(rss|xml)$/, "");
  // Convert slashes to dots
  return withoutExt.replace(/\//g, ".");
}

export const urlParser: TyperaURL.Conversion<string> = (s: string) => {
  try {
    // If it's already a URL, reject it
    new URL(s);
    return Option.none;
  } catch {
    try {
      // Normalize the hostname first
      const normalizedHostname = normalizeHostname(s);
      // Try to parse as a hostname
      new URL(`https://${normalizedHostname}`);
      return Option.some(normalizedHostname);
    } catch {
      return Option.none;
    }
  }
};
