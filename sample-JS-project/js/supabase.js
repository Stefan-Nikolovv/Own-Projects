import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { config } from "./config.js";

export const OWNER_EMAIL = config.ownerEmail;

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
