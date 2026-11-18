# Supabase CA

Before public deployment, download the CA from your authenticated Supabase
Dashboard → Database Settings → SSL Configuration. Place the public CA at
`certs/supabase-ca.pem` for the provided Docker Compose example.

It is mounted read-only at `/app/certs/supabase-ca.pem`. Use
`sslmode=require&sslaccept=strict&sslcert=/app/certs/supabase-ca.pem` in the
Prisma 6 connection URL. For bare Node.js, supply the real absolute path on
that host instead. Confirm connectivity with `npm run db:check`.

Do not put private keys here. Certificate/key files are excluded from source
archives, Git and the Docker build context. No certificate has been invented
or trusted automatically from an unverified network connection.
