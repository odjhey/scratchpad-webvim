# TODO

## API / Saves
- [ ] Add HTTP Basic Auth protection for `/api/*` via Caddy (instead of header passphrase).
- [ ] Align dev auth with prod (so `pnpm dev` behaves the same as docker/Caddy).
- [ ] Update frontend to authenticate appropriately (may remove custom passphrase prompts).
- [ ] Decide whether to keep `/api/*` passphrase logic in `api/server.mjs` after Basic Auth.

## Frontend UX
- [ ] Add “Load right (API)” button + handler (symmetric with Load left).
- [ ] Add “Save left (API)” button + handler (symmetric with Save right).
- [ ] Improve save/load dialogs (optional): better modal(s) for id + passphrase.

## Hardening / Ops
- [ ] Add optional request size limits + rate limiting if needed.
- [ ] Consider save cleanup/TTL behavior for ephemeral storage.
- [ ] Add Docker-compose example env vars in `deployments/.env-local.example`.
