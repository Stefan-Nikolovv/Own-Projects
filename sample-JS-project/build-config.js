// build-config.js - Generates config.js from environment variables for deployment
import { writeFileSync } from 'fs';

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "YOUR_SUPABASE_URL",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY",
  ownerEmail: process.env.OWNER_EMAIL || "YOUR_OWNER_EMAIL",
};

const content = `// Auto-generated config file
export const config = ${JSON.stringify(config, null, 2)};
`;

writeFileSync('./js/config.js', content);
console.log('✅ config.js generated successfully');
