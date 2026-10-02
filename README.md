# Pixel Perfect Gift Store

A standalone TanStack Start, React, and Vite application. The storefront submits orders through validated server functions; Supabase stores order data and private receipt images. The owner dashboard uses Supabase Auth and server side owner authorization.

## Local setup

1. Install Node.js 22+ and run `npm install`.
2. Copy `.env.example` to `.env` and enter your Supabase project URL, publishable key, and service role key.
3. Apply the SQL files in `supabase/migrations` in filename order in the Supabase SQL Editor. For an existing install, applying the newest migration fixes the owner order access policy.
4. In Supabase Auth, create and verify the store owner account for `hadesarchie@gmail.com`. Disable public signups after creating it.
5. Run `npm run dev`; build with `npm run build`. Deploy to a Node capable Vercel, Netlify, or Nitro host and configure the server environment variables there.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable.
