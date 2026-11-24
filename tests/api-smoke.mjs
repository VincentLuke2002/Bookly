import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const port = 5591;
const root = resolve(import.meta.dirname, "..");
const dbPath = resolve(root, "data", `bookly-test-${process.pid}.db`);
const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port), BOOKLY_DB: dbPath },
  stdio: ["ignore", "pipe", "pipe"]
});

let cookie = "";
const base = `http://127.0.0.1:${port}`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {})
    }
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${body.error || response.status}`);
  return body;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { return await request("/api/health"); }
    catch { await new Promise((resolveWait) => setTimeout(resolveWait, 100)); }
  }
  throw new Error("Local server did not start.");
}

try {
  const health = await waitForServer();
  assert(health.database === "sqlite", "SQLite health check failed.");

  const registration = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Smoke", lastName: "Customer",
      email: `smoke-${process.pid}@bookly.local`, password: "Smoke123!", role: "customer"
    })
  });
  assert(registration.user.role === "customer", "Customer registration failed.");

  const catalog = await request("/api/providers");
  assert(catalog.providers.length >= 3, "Seeded provider catalog is missing.");
  const provider = catalog.providers[0];
  assert(provider.services.length > 0, "Provider services are missing.");

  const future = new Date();
  future.setDate(future.getDate() + 20);
  const booking = await request("/api/bookings", {
    method: "POST",
    body: JSON.stringify({
      address: "123 Test Street, Manila",
      fulfilment: "standard",
      paymentMethod: "cod",
      items: [{
        providerId: provider.id,
        serviceId: provider.services[0].id,
        service: provider.services[0].name,
        date: future.toISOString().slice(0, 10),
        hours: 2,
        notes: "Automated smoke test"
      }]
    })
  });
  assert(booking.confirmation.startsWith("BK-"), "Booking confirmation was not created.");
  const customerBookings = await request("/api/customer/bookings");
  assert(customerBookings.bookings.length === 1, "Customer order history was not persisted.");

  await request("/api/auth/logout", { method: "POST", body: "{}" });
  const providerLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: provider.email, password: "Provider123!" })
  });
  assert(providerLogin.user.role === "provider", "Provider login failed.");
  const providerDashboard = await request("/api/provider/dashboard");
  assert(providerDashboard.bookings.some((row) => row.confirmation === booking.confirmation), "Provider did not receive the booking.");
  const bookingId = providerDashboard.bookings.find((row) => row.confirmation === booking.confirmation).id;
  await request(`/api/provider/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify({ status: "confirmed" }) });

  await request("/api/auth/logout", { method: "POST", body: "{}" });
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@bookly.local", password: "Admin123!" })
  });
  assert(adminLogin.user.role === "admin", "Admin login failed.");
  const adminDashboard = await request("/api/admin/dashboard");
  assert(adminDashboard.summary.openOrders >= 1, "Admin dashboard did not include the booking.");

  console.log("PASS: customer, provider, admin, SQLite, and booking flows are working.");
} finally {
  server.kill();
  await new Promise((resolveWait) => server.once("exit", resolveWait));
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = dbPath + suffix;
    if (existsSync(file)) rmSync(file);
  }
}
