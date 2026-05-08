// Supabase configuration
// Note: The anon key is safe to expose publicly - RLS policies protect your data

export const config = {
  supabaseUrl: "https://pghirikwblrhemnqcbmw.supabase.co",
  supabaseAnonKey: "sb_publishable_yy_9eYxhcDQGxlIo4jgy3A_1Z165ZNp",
  ownerEmail: "emotioninmotion@gmail.com",

  // EmailJS — https://www.emailjs.com
  // 1. Create a free account, add an Email Service, and create a Template.
  // 2. Template variables used: {{email}}, {{name}}, {{title}}
  emailjsPublicKey: "ay5YPMVbD76MI2VCC",   // Account > API Keys > Public Key
  emailjsServiceId: "service_wa1fj6s",   // Email Services > Service ID
  emailjsTemplateId: "template_8rp4wid",  // Email Templates > Template ID
};
