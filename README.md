# Roomify - MVP

## Environment

Projects are saved and loaded via a Puter Worker (see `lib/puter.action.ts`).

1) Create a `.env.local` file at the project root
2) Add your worker base URL:

```
VITE_PUTER_WORKER_URL=https://<your-worker-subdomain>.puter.site
```

You can use `.env.example` as a starting point.

After changing env vars, restart the dev server.

## Notes

- If you see a React hydration mismatch mentioning extra attributes on `<html>`/`<body>`, it’s commonly caused by browser extensions that inject attributes before React loads.

