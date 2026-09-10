import { afterEach, describe, expect, it } from "vitest";
import {
  createApiRateLimiter,
  requireApiAccess,
  validateAdbEndpoint,
} from "./security";

describe("production security boundaries", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("requires the configured API key and accepts bearer tokens", async () => {
    process.env.NODE_ENV = "production";
    process.env.ASSISTANT_API_KEY = "test-secret";
    const unauthorized = response();
    requireApiAccess(request(), unauthorized.res, () => undefined);
    expect(unauthorized.status).toBe(401);
    const authorized = response();
    requireApiAccess(
      request({ authorization: "Bearer test-secret" }),
      authorized.res,
      () => undefined,
    );
    expect(authorized.status).toBe(200);
  });

  it("rejects unconfigured access outside local development", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ASSISTANT_API_KEY;
    const result = response();
    requireApiAccess(request(), result.res, () => undefined);
    expect(result.status).toBe(401);
  });

  it("validates ADB endpoints", () => {
    expect(validateAdbEndpoint("192.168.1.20", 5555)).toBe("192.168.1.20:5555");
    expect(() => validateAdbEndpoint("not-an-ip", 5555)).toThrow();
    expect(() => validateAdbEndpoint("192.168.1.20", 0)).toThrow();
  });

  it("enforces a bounded request rate", async () => {
    const limiter = createApiRateLimiter(60_000, 1);
    const first = response();
    limiter(request(), first.res, () => undefined);
    expect(first.status).toBe(200);
    const second = response();
    limiter(request(), second.res, () => undefined);
    expect(second.status).toBe(429);
  });
});

function request(headers: Record<string, string> = {}) {
  return {
    ip: "127.0.0.1",
    headers,
    header(name: string) {
      return this.headers[name.toLowerCase()];
    },
  } as never;
}

function response() {
  const result = { status: 200 };
  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    json() {
      return res;
    },
    setHeader() {
      return res;
    },
  } as never;
  return {
    res,
    ...result,
    get status() {
      return result.status;
    },
  };
}
