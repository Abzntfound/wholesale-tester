/**
 * Public frontend configuration.
 * Copy from env.example.js and add your Supabase project URL + anon key.
 * Never put service-role keys or payment secrets here.
 */
export const ENV = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  /** 'local' | 'supabase' | 'remote' */
  DATA_SOURCE: 'local',
  /** Set true once payment edge functions are deployed and configured */
  PAYMENT_ENABLED: false
};
