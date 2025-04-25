import fs from "fs";

export const serverHostname = process.env.SERVER_HOSTNAME!;
export const DATABASE_FILENAME =
  process.env.DATABASE_FILENAME ?? "./database.db";
export const PORT = process.env.PORT ?? 3000;

function readKeyFile(path: string): string | undefined {
  try {
    return fs.readFileSync(path).toString();
  } catch {
    return undefined;
  }
}

let publicKey = readKeyFile("./public.pem") ?? process.env.PUBLIC_KEY;
let privateKey = readKeyFile("./private.pem") ?? process.env.PRIVATE_KEY;

if (!publicKey || !privateKey) {
  console.error(
    "Error: PUBLIC_KEY and PRIVATE_KEY must be provided either in public.pem/private.pem files or as environment variables"
  );
  process.exit(1);
}

// After the check above, we know these are defined
export const PUBLIC_KEY: string = publicKey;
export const PRIVATE_KEY: string = privateKey;
