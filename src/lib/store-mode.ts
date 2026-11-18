// Public mode is a product setting, never a secret. Production defaults to demo.
export const storeMode = process.env.NEXT_PUBLIC_STORE_MODE === 'live' ? 'live' : 'demo';
