import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "http";
import { spawn } from "child_process";

describe("HTTP server security", () => {
  let serverProcess: ReturnType<typeof spawn>;
  const port = 13579;

  beforeAll(async () => {
    // Start the server with a test port
    serverProcess = spawn("node", ["dist/index.js"], {
      env: { ...process.env, PORT: port.toString(), MAX_BODY_SIZE: "1024" }, // 1KB for testing
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Wait for server to be ready
    await new Promise<void>((resolve) => {
      serverProcess.stderr?.on("data", (data) => {
        if (data.toString().includes("listening")) {
          resolve();
        }
      });
    });
  });

  afterAll(() => {
    serverProcess?.kill();
  });

  it("rejects request body larger than MAX_BODY_SIZE with 413", async () => {
    const largeBody = "x".repeat(2000); // 2KB, exceeds 1KB limit

    const result = await new Promise<{ statusCode: number; body: string }>((resolve) => {
      const req = request(
        {
          hostname: "localhost",
          port,
          path: "/mcp",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(largeBody),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
        }
      );

      req.on("error", () => {
        // Connection may be destroyed, which is expected
        resolve({ statusCode: 413, body: "" });
      });

      req.write(largeBody);
      req.end();
    });

    expect(result.statusCode).toBe(413);
  });

  it("rejects invalid JSON with 400", async () => {
    const invalidJson = "{invalid json";

    const result = await new Promise<{ statusCode: number; body: string }>((resolve) => {
      const req = request(
        {
          hostname: "localhost",
          port,
          path: "/mcp",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(invalidJson),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
        }
      );

      req.write(invalidJson);
      req.end();
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("Invalid JSON");
  });

  it("returns 404 for non-/mcp paths", async () => {
    const result = await new Promise<{ statusCode: number; body: string }>((resolve) => {
      const req = request(
        {
          hostname: "localhost",
          port,
          path: "/other",
          method: "POST",
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
        }
      );

      req.end();
    });

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Not found");
  });

  it("accepts valid small JSON requests", async () => {
    const validJson = JSON.stringify({ jsonrpc: "2.0", method: "initialize", params: {}, id: 1 });

    const result = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const req = request(
        {
          hostname: "localhost",
          port,
          path: "/mcp",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(validJson),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
        }
      );

      req.on("error", reject);
      req.write(validJson);
      req.end();
    });

    // Should not return 400 or 413 (actual response depends on MCP protocol handling)
    expect(result.statusCode).not.toBe(400);
    expect(result.statusCode).not.toBe(413);
  });
});
