// Copy this file to config.js and replace with your actual values
// config.js is gitignored and won't be committed to GitHub

export const config = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  ownerEmail: "YOUR_OWNER_EMAIL",

  // EmailJS — https://www.emailjs.com
  // 1. Create a free account, add an Email Service, and create a Template.
  // 2. Template variables used: {{to_email}}, {{to_name}}, {{day_name}}, {{date_label}}, {{slot_time}}
  emailjsPublicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  emailjsServiceId: "YOUR_EMAILJS_SERVICE_ID",
  emailjsTemplateId: "YOUR_EMAILJS_TEMPLATE_ID",
};
