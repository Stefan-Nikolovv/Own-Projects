// Builds the static site into Vercel's configured output directory.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { config as localConfig } from "./js/config.js";

const OUTPUT_DIR = "public";
const staticEntries = [
  "assets",
  "css",
  "js",
  "pages",
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
];

const config = {
  supabaseUrl: process.env.SUPABASE_URL || localConfig.supabaseUrl,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || localConfig.supabaseAnonKey,
  emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || localConfig.emailjsPublicKey || "",
  emailjsServiceId: process.env.EMAILJS_SERVICE_ID || localConfig.emailjsServiceId || "",
  emailjsTemplateId: process.env.EMAILJS_TEMPLATE_ID || localConfig.emailjsTemplateId || "",
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error("Supabase URL and public key are missing from the environment and js/config.js");
}

const content = `// Auto-generated config file
export const config = ${JSON.stringify(config, null, 2)};
`;

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

staticEntries.forEach((entry) => {
  cpSync(entry, join(OUTPUT_DIR, entry), { recursive: true });
});

writeFileSync(join(OUTPUT_DIR, "js/config.js"), content);
console.log(`Static app built successfully in ${OUTPUT_DIR}/`);
