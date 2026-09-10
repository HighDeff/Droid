# Security model

This application controls the local desktop and connected Android devices. The
Express API is therefore a privileged control plane, not a general-purpose
public web API.

## Defaults and deployment requirements

- Production and development bind to `127.0.0.1` by default. Set `HOST` or
  `DEV_HOST` to another interface only behind a trusted reverse proxy/TLS
  boundary.
- Set a long, random `ASSISTANT_API_KEY` for every non-local deployment. Send
  it as `X-API-Key` or `Authorization: Bearer <key>`. Production refuses
  unauthenticated requests even if the key is accidentally omitted.
- `CORS_ORIGINS` is an explicit comma-separated allowlist. It is empty by
  default, so cross-origin browser requests are not enabled.
- API requests are rate limited in memory. This is a safety limit, not a
  replacement for a reverse-proxy rate limiter.

## Protected resources

All `/api` routes except the public health/demo routes are behind the API
authentication boundary. This includes screen capture, AI execution, logs,
assistant state, and ADB operations. ADB host/port and device identifiers are
validated before being passed to the ADB process.

Do not expose the service directly to the Internet or an untrusted LAN. API-key
authentication is intentionally simple for a local desktop application and
does not provide multi-user identity or resource ownership. A deployment that
needs multiple users must add an identity-aware proxy and bind resource records
to its authenticated principal before enabling shared access.
