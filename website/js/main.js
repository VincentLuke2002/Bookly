const FALLBACK_PROVIDERS = [
  {
    id: "maria",
    name: "Maria Santos",
    category: "Home Cleaning",
    cat: "cleaning",
    rating: 4.9,
    reviews: 124,
    price: 450,
    location: "North District",
    badge: "Top Rated",
    image: "photo-1531746020798-e6953c6e8e04",
    cover: "photo-1581578731548-c64695cc6952",
    description:
      "Eco-friendly home cleaning with meticulous attention to detail.",
    headline: "A spotless home, without losing your weekend.",
    bio: "Experienced, detail-focused home care using thoughtful methods and reliable equipment.",
    services: [
      { id: 1, name: "Deep Cleaning", price: 450 },
      { id: 2, name: "General Cleaning", price: 450 },
      { id: 3, name: "Move-in / Move-out", price: 450 },
    ],
  },
  {
    id: "david",
    name: "David Okafor",
    category: "Home Cleaning",
    cat: "cleaning",
    rating: 4.7,
    reviews: 89,
    price: 400,
    location: "East Side",
    badge: "Verified",
    image: "photo-1472099645785-5658abf4ff4e",
    cover: "photo-1558618666-fcd25c85cd64",
    description: "Reliable residential cleaning with all equipment included.",
    headline: "Reliable care for homes that deserve attention.",
    services: [
      { name: "General Cleaning", price: 400 },
      { name: "Deep Cleaning", price: 400 },
      { name: "Office Cleaning", price: 400 },
    ],
  },
  {
    id: "robert",
    name: "Robert Chen",
    category: "Home Repair",
    cat: "repair",
    rating: 4.8,
    reviews: 67,
    price: 650,
    location: "West Quarter",
    badge: "Verified Pro",
    image: "photo-1566492031773-4f4e44671857",
    cover: "photo-1504148455328-c376907d081c",
    description:
      "Licensed carpenter and handyman for repairs and installations.",
    headline: "Thoughtful repairs, finished properly the first time.",
    services: [
      { name: "Carpentry", price: 650 },
      { name: "Furniture Assembly", price: 650 },
      { name: "Shelving Installation", price: 650 },
    ],
  },
  {
    id: "aisha",
    name: "Aisha Patel",
    category: "Tutoring",
    cat: "tutoring",
    rating: 5,
    reviews: 53,
    price: 500,
    location: "Central",
    badge: "Top Rated",
    image: "photo-1573496359142-b8d87734a5a2",
    cover: "photo-1503676260728-1c00da094a0b",
    description: "Former teacher offering tailored maths and science sessions.",
    headline: "Build confidence with lessons shaped around you.",
    services: [
      { name: "GCSE Maths", price: 500 },
      { name: "A-Level Maths", price: 500 },
      { name: "Science Tutoring", price: 500 },
    ],
  },
  {
    id: "thomas",
    name: "Thomas Wright",
    category: "Technology Support",
    cat: "tech",
    rating: 4.6,
    reviews: 41,
    price: 700,
    location: "North District",
    badge: "Verified",
    image: "photo-1560250097-0b93528c311a",
    cover: "photo-1518770660439-4636190af475",
    description: "Friendly IT support explained clearly and without jargon.",
    headline: "Technology fixed, explained, and made less stressful.",
    services: [
      { name: "Computer Repair", price: 700 },
      { name: "Wi-Fi Setup", price: 700 },
      { name: "Device Setup", price: 700 },
    ],
  },
  {
    id: "yuki",
    name: "Yuki Tanaka",
    category: "Tutoring",
    cat: "tutoring",
    rating: 4.9,
    reviews: 78,
    price: 450,
    location: "South Side",
    badge: "Top Rated",
    image: "photo-1580489944761-15a19d654956",
    cover: "photo-1523240795612-9a054b0db644",
    description: "Warm, practical English and Japanese language tutoring.",
    headline: "Language lessons that turn practice into progress.",
    services: [
      { name: "English Language", price: 450 },
      { name: "English Literature", price: 450 },
      { name: "Beginner Japanese", price: 450 },
    ],
  },
];

let PROVIDERS = [...FALLBACK_PROVIDERS];
let CURRENT_USER = null;
const CURRENCY = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const money = (value) => CURRENCY.format(Number(value || 0));
const photo = (id, size = "w=900&h=520&fit=crop&auto=format") =>
  `https://images.unsplash.com/${id}?${size}`;
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );

const API = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  },
  get(path) {
    return this.request(path);
  },
  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  },
  patch(path, body) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};

async function loadSession() {
  try {
    CURRENT_USER = (await API.get("/api/auth/me")).user;
  } catch {
    CURRENT_USER = null;
  }
  return CURRENT_USER;
}

function dashboardUrl(user = CURRENT_USER) {
  if (!user) return "login.html";
  if (user.role === "admin") return "admin.html";
  if (user.role === "provider") return "provider-dashboard.html";
  return "account.html";
}

async function requireRole(role) {
  if (!CURRENT_USER) {
    location.href = `login.html?next=${encodeURIComponent(location.pathname.split("/").pop() + location.search)}`;
    return false;
  }
  if (CURRENT_USER.role !== role) {
    location.href = dashboardUrl();
    return false;
  }
  return true;
}

function setBusy(button, busy, label = "Working...") {
  if (!button) return;
  if (busy) {
    button.dataset.original = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.original || button.textContent;
    button.disabled = false;
  }
}

function showToast(message, type = "success") {
  document.querySelector(".toast-bookly")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast-bookly toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${type === "success" ? "✓" : "!"}</span><p>${escapeHtml(message)}</p>`;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function showFormError(form, message = "") {
  let error = form.querySelector(".form-error");
  if (!error) {
    error = document.createElement("div");
    error.className = "form-error";
    error.setAttribute("role", "alert");
    form.prepend(error);
  }
  error.textContent = message;
  error.hidden = !message;
}

const Cart = {
  key: "bookly-cart-v3",
  get() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },
  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    updateCartCount();
  },
  add(item) {
    const items = this.get();
    const index = items.findIndex(
      (x) =>
        x.providerId === item.providerId &&
        x.serviceId === item.serviceId &&
        x.date === item.date,
    );
    if (index >= 0) items[index] = item;
    else items.push(item);
    this.save(items);
    showToast("Booking added to your cart");
  },
  remove(index) {
    const items = this.get();
    items.splice(index, 1);
    this.save(items);
    renderCart();
    showToast("Booking removed", "neutral");
  },
  change(index, delta) {
    const items = this.get();
    const item = items[index];
    if (!item) return;
    item.hours = Math.min(8, Math.max(1, Number(item.hours || 1) + delta));
    item.price = Number(item.unitPrice) * item.hours;
    this.save(items);
    renderCart();
  },
  clear() {
    this.save([]);
  },
};

const Wishlist = {
  key: "bookly-wishlist",
  getLocal() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  },
  saveLocal(ids) {
    localStorage.setItem(this.key, JSON.stringify(ids));
  },
  async ids() {
    if (CURRENT_USER?.role === "customer") {
      try {
        return (await API.get("/api/wishlist")).providers.map((p) => p.id);
      } catch {}
    }
    return this.getLocal();
  },
  async toggle(id) {
    const ids = await this.ids();
    const active = ids.includes(id);
    try {
      if (CURRENT_USER?.role === "customer") {
        await API.request(`/api/wishlist/${id}`, {
          method: active ? "DELETE" : "POST",
        });
      } else {
        const local = this.getLocal();
        active ? local.splice(local.indexOf(id), 1) : local.push(id);
        this.saveLocal(local);
      }
      await updateWishlistButtons();
      if (document.querySelector("#wishlistGrid")) await renderWishlist();
      showToast(
        active ? "Removed from wishlist" : "Saved to wishlist",
        "neutral",
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  },
};

function headerTemplate() {
  const loggedIn = Boolean(CURRENT_USER);
  return `<nav class="site-nav" aria-label="Primary navigation"><div class="container nav-shell">
    <a class="brand" href="index.html" aria-label="Bookly home"><span class="logo">B</span><span>Bookly</span></a>
    <div class="nav-links" id="primaryMenu"><a href="index.html">Home</a><a href="products.html">Services</a><a href="index.html#how">How it works</a><a href="${CURRENT_USER?.role === "provider" ? "provider-dashboard.html" : "register.html?role=provider"}">For providers</a><a href="help.html">Help</a></div>
    <div class="nav-actions"><a class="cart-link" href="cart.html" aria-label="Open booking cart"><span aria-hidden="true">▣</span><span class="cart-label">Cart</span><span class="cart-count" aria-live="polite">0</span></a>${loggedIn ? `<a class="btn-bookly btn-primary account-link" href="${dashboardUrl()}">${escapeHtml(CURRENT_USER.firstName)}</a><button class="nav-logout" id="logoutButton" type="button">Log out</button>` : `<a class="btn-bookly btn-primary account-link" href="login.html">Log in</a>`}<button class="mobile-toggle" type="button" aria-expanded="false" aria-controls="primaryMenu" aria-label="Open navigation">☰</button></div>
  </div></nav>`;
}

function footerTemplate() {
  return `<footer class="site-footer"><div class="container"><div class="footer-grid">
    <div class="footer-intro"><a class="brand brand-light" href="index.html"><span class="logo">B</span>Bookly</a><p>Trusted local services, thoughtfully matched. Book verified professionals in a few confident clicks.</p><div class="social-row"><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="LinkedIn">in</a></div></div>
    <div><div class="footer-title">Explore</div><a href="products.html">All services</a><a href="wishlist.html">Wishlist</a><a href="order-history.html">Order history</a><a href="help.html">Help centre</a></div>
    <div><div class="footer-title">Accounts</div><a href="login.html">Customer login</a><a href="register.html?role=provider">Become a provider</a><a href="provider-dashboard.html">Provider portal</a><a href="admin.html">Admin portal</a></div>
    <div class="newsletter"><div class="footer-title">Useful, not noisy</div><p>A monthly note with practical home tips and standout providers.</p><form class="newsletter-form"><label class="sr-only" for="newsletterEmail">Email address</label><input id="newsletterEmail" class="input-bookly" type="email" required placeholder="Email address"><button class="btn-bookly btn-accent" type="submit">Join</button></form></div>
  </div><div class="footer-bottom"><small>© 2026 Bookly. Local demonstration system.</small><div><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Accessibility</a></div></div></div></footer>`;
}

function initShell() {
  const header = document.querySelector("#siteHeader"),
    footer = document.querySelector("#siteFooter");
  if (header) header.innerHTML = headerTemplate();
  if (footer) footer.innerHTML = footerTemplate();
  const toggle = document.querySelector(".mobile-toggle"),
    menu = document.querySelector(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "×" : "☰";
  });
  document
    .querySelector("#logoutButton")
    ?.addEventListener("click", async () => {
      await API.post("/api/auth/logout", {});
      location.href = "index.html";
    });
  document
    .querySelector(".newsletter-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      event.currentTarget.reset();
      showToast("You’re on the list. Welcome to Bookly!");
    });
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href").split("?")[0].split("#")[0] === page)
      a.classList.add("active");
  });
  updateCartCount();
}

function updateCartCount() {
  const count = Cart.get().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.classList.toggle("is-empty", !count);
  });
}

async function loadProviders() {
  try {
    PROVIDERS = (await API.get("/api/providers")).providers;
  } catch {
    PROVIDERS = [...FALLBACK_PROVIDERS];
  }
  return PROVIDERS;
}

function providerCard(p) {
  const searchable =
    `${p.name} ${p.category} ${p.location} ${p.description}`.toLowerCase();
  return `<div class="col-md-6 col-xl-4 provider-col" data-id="${p.id}" data-cat="${p.cat}" data-search="${escapeHtml(searchable)}" data-price="${p.price}" data-rating="${p.rating}" data-name="${escapeHtml(p.name)}"><article class="provider-card card-bookly"><div class="provider-card-top"><img class="provider-cover" src="${photo(p.cover)}" alt="${escapeHtml(p.category)}"><span class="chip chip-light">${escapeHtml(p.badge)}</span><button class="wishlist-btn" type="button" data-wishlist="${p.id}" aria-label="Save ${escapeHtml(p.name)}">♡</button></div><div class="card-body-bookly"><div class="provider-head"><img class="avatar" src="${photo(p.image, "w=180&h=180&fit=crop&auto=format")}" alt="${escapeHtml(p.name)}"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.category)} · ${escapeHtml(p.location)}</p></div></div><p class="provider-description">${escapeHtml(p.description)}</p><div class="provider-meta"><span><span class="stars">★</span> <strong>${Number(p.rating).toFixed(1)}</strong> <small>(${p.reviews})</small></span><span><strong>${money(p.price)}</strong><small>/hour</small></span></div><a class="btn-bookly btn-primary btn-full" href="product-details.html?id=${encodeURIComponent(p.id)}">View profile <span>→</span></a></div></article></div>`;
}

async function updateWishlistButtons() {
  const saved = await Wishlist.ids();
  document.querySelectorAll("[data-wishlist]").forEach((button) => {
    const active = saved.includes(button.dataset.wishlist);
    button.classList.toggle("active", active);
    button.textContent = active ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(active));
  });
}

async function renderProviders() {
  const grid = document.querySelector("#providerGrid");
  if (!grid) return;
  await loadProviders();
  grid.innerHTML = PROVIDERS.map(providerCard).join("");
  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") || "all";
  const search = document.querySelector("#serviceSearch"),
    sort = document.querySelector("#sortServices");
  if (search) search.value = params.get("q") || "";
  const apply = () => {
    const q = search?.value.trim().toLowerCase() || "";
    let visible = 0;
    grid.querySelectorAll(".provider-col").forEach((card) => {
      const show =
        (cat === "all" || card.dataset.cat === cat) &&
        (!q || card.dataset.search.includes(q));
      card.hidden = !show;
      if (show) visible++;
    });
    document.querySelector("#resultCount").textContent =
      `${visible} trusted provider${visible === 1 ? "" : "s"}`;
    const cards = [...grid.querySelectorAll(".provider-col")];
    cards.sort((a, b) =>
      sort?.value === "rating"
        ? b.dataset.rating - a.dataset.rating
        : sort?.value === "price-low"
          ? a.dataset.price - b.dataset.price
          : sort?.value === "price-high"
            ? b.dataset.price - a.dataset.price
            : sort?.value === "name"
              ? a.dataset.name.localeCompare(b.dataset.name)
              : 0,
    );
    cards.forEach((c) => grid.append(c));
  };
  document.querySelectorAll(".filter-chip[data-cat]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.cat === cat);
    chip.addEventListener("click", () => {
      cat = chip.dataset.cat;
      document
        .querySelectorAll(".filter-chip[data-cat]")
        .forEach((c) => c.classList.toggle("active", c === chip));
      apply();
    });
  });
  search?.addEventListener("input", apply);
  sort?.addEventListener("change", apply);
  grid
    .querySelectorAll("[data-wishlist]")
    .forEach((b) =>
      b.addEventListener("click", () => Wishlist.toggle(b.dataset.wishlist)),
    );
  await updateWishlistButtons();
  apply();
}

async function renderWishlist() {
  const root = document.querySelector("#wishlistGrid");
  if (!root) return;
  let providers = [];
  if (CURRENT_USER?.role === "customer") {
    try {
      providers = (await API.get("/api/wishlist")).providers;
    } catch {}
  } else {
    await loadProviders();
    providers = PROVIDERS.filter((p) => Wishlist.getLocal().includes(p.id));
  }
  root.innerHTML = providers.length
    ? providers.map(providerCard).join("")
    : `<div class="col-12"><div class="empty-state"><span>♡</span><h2>Your wishlist is empty</h2><p>Save providers from the catalog to compare them later.</p><a class="btn-bookly btn-primary" href="products.html">Explore services</a></div></div>`;
  root
    .querySelectorAll("[data-wishlist]")
    .forEach((b) =>
      b.addEventListener("click", () => Wishlist.toggle(b.dataset.wishlist)),
    );
  await updateWishlistButtons();
}

async function initProviderDetail() {
  const form = document.querySelector("#bookingForm");
  if (!form) return;
  const id = new URLSearchParams(location.search).get("id") || "maria";
  let provider;
  try {
    provider = (await API.get(`/api/providers/${encodeURIComponent(id)}`))
      .provider;
  } catch {
    provider =
      FALLBACK_PROVIDERS.find((p) => p.id === id) || FALLBACK_PROVIDERS[0];
  }
  document.title = `${provider.name} — Bookly`;
  document.querySelector(".detail-photo").src = photo(
    provider.cover,
    "w=1200&fit=crop&auto=format",
  );
  const head = document.querySelector(".provider-head");
  head.querySelector("h1").textContent = provider.name;
  head.querySelector(".avatar").src = photo(
    provider.image,
    "w=180&h=180&fit=crop&auto=format",
  );
  head.querySelector("p").innerHTML =
    `${escapeHtml(provider.category)} · ${escapeHtml(provider.location)} · <span class="stars">★</span> ${Number(provider.rating).toFixed(1)} (${provider.reviews} reviews)`;
  head.querySelector(".chip").textContent = provider.badge;
  document.querySelector(".breadcrumb-bookly").textContent =
    `Services / ${provider.category} / ${provider.name}`;
  document.querySelector(".col-lg-7 > h2.h3").textContent = provider.headline;
  document.querySelector(".col-lg-7 > h2.h3 + p").textContent =
    provider.bio || provider.description;
  document.querySelector(".sticky-card .price").textContent = money(
    provider.price,
  );
  const service = document.querySelector("#service");
  service.innerHTML = provider.services
    .map(
      (s) =>
        `<option value="${s.id || ""}" data-price="${s.price || provider.price}">${escapeHtml(s.name || s)}</option>`,
    )
    .join("");
  const date = document.querySelector("#date");
  const submitButton = form.querySelector(
    "button[type='submit'], button:not([type])",
  );
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  date.min = tomorrow.toISOString().slice(0, 10);
  const update = () => {
    const option = service.selectedOptions[0];
    if (!submitButton || !option) return;
    submitButton.textContent =
      `Add booking · ${money(Number(option.dataset.price || provider.price) * Number(document.querySelector("#hours").value || 1))}`;
  };
  service.addEventListener("change", update);
  document.querySelector("#hours").addEventListener("change", update);
  update();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const option = service.selectedOptions[0],
      hours = Number(document.querySelector("#hours").value);
    Cart.add({
      providerId: provider.id,
      name: provider.name,
      serviceId: Number(option.value || 0),
      service: option.textContent,
      date: date.value,
      hours,
      notes: document.querySelector("#notes").value,
      unitPrice: Number(option.dataset.price || provider.price),
      price: Number(option.dataset.price || provider.price) * hours,
      image: provider.image,
    });
    setTimeout(() => (location.href = "cart.html"), 350);
  });
}

function formatDate(date) {
  if (!date) return "Flexible date";
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function renderCart() {
  const root = document.querySelector("#cartItems");
  if (!root) return;
  const items = Cart.get();
  if (!items.length) {
    root.className = "empty-state";
    root.innerHTML = `<span>⌁</span><h2>Your cart is ready when you are</h2><p>Choose a trusted provider to start a booking.</p><a class="btn-bookly btn-primary" href="products.html">Browse services</a>`;
  } else {
    root.className = "card-bookly cart-list";
    root.innerHTML = items
      .map(
        (item, index) =>
          `<article class="cart-item"><img class="avatar" src="${photo(item.image, "w=160&h=160&fit=crop&auto=format")}" alt="${escapeHtml(item.name)}"><div class="cart-item-copy"><span class="chip">${escapeHtml(item.service)}</span><h2>${escapeHtml(item.name)}</h2><p>${formatDate(item.date)} · ${money(item.unitPrice)} per hour</p><div class="quantity-control"><button type="button" data-cart-change="${index}" data-delta="-1">−</button><span>${item.hours} hour${item.hours === 1 ? "" : "s"}</span><button type="button" data-cart-change="${index}" data-delta="1">+</button></div></div><div class="cart-item-actions"><strong>${money(item.price)}</strong><button type="button" data-cart-remove="${index}">Remove</button></div></article>`,
      )
      .join("");
    root
      .querySelectorAll("[data-cart-change]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          Cart.change(Number(b.dataset.cartChange), Number(b.dataset.delta)),
        ),
      );
    root
      .querySelectorAll("[data-cart-remove]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          Cart.remove(Number(b.dataset.cartRemove)),
        ),
      );
  }
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0),
    fee = subtotal ? 99 * items.length : 0;
  setText("#subtotal", money(subtotal));
  setText("#fee", money(fee));
  setText("#total", money(subtotal + fee));
  document
    .querySelector("#checkoutBtn")
    ?.classList.toggle("disabled", !items.length);
}

function renderCheckoutSummary() {
  const form = document.querySelector("#checkoutForm");
  if (!form) return;
  const items = Cart.get(),
    summary = document.querySelector(".checkout-summary"),
    subtotal = items.reduce((s, i) => s + Number(i.price), 0),
    fee = items.length * 99;
  const update = () => {
    const shipping = form.querySelector("input[name='shipping']:checked"),
      cost = Number(shipping?.dataset.cost || 0),
      estimate = shipping?.dataset.estimate || "To be confirmed";
    setText("#deliveryEstimate", estimate);
    summary.innerHTML = `<span class="chip chip-accent">🔒 Database-backed order</span><h2>Order summary</h2><p class="text-muted">${escapeHtml(shipping?.dataset.label || "")} · ${escapeHtml(estimate)}</p><div class="checkout-items">${items.map((i) => `<div><span>${escapeHtml(i.service)}<small>${escapeHtml(i.name)} · ${i.hours} hour${i.hours === 1 ? "" : "s"}</small></span><strong>${money(i.price)}</strong></div>`).join("")}</div><div class="summary-row"><span>Services</span><span>${money(subtotal)}</span></div><div class="summary-row"><span>Booking protection</span><span>${money(fee)}</span></div><div class="summary-row"><span>Delivery / fulfilment</span><span>${cost ? money(cost) : "Free"}</span></div><div class="summary-row total"><span>Total</span><span>${money(subtotal + fee + cost)}</span></div><div class="secure-note"><span>⌾</span><p><strong>Stored securely in local SQLite</strong><br><small>Payment details are validated but never stored.</small></p></div>`;
  };
  form
    .querySelectorAll("input[name='shipping']")
    .forEach((i) => i.addEventListener("change", update));
  const cardFields = document.querySelector("#cardFields");
  form.querySelectorAll("input[name='payment']").forEach((i) =>
    i.addEventListener("change", () => {
      const card =
        form.querySelector("input[name='payment']:checked")?.value === "card";
      cardFields.hidden = !card;
      cardFields.querySelectorAll("input").forEach((f) => (f.required = card));
    }),
  );
  if (CURRENT_USER?.role === "customer") {
    const names = CURRENT_USER.name.split(" ");
    document.querySelector("#firstName").value =
      CURRENT_USER.firstName || names[0] || "";
    document.querySelector("#lastName").value =
      CURRENT_USER.lastName || names.slice(1).join(" ");
    document.querySelector("#checkoutEmail").value = CURRENT_USER.email || "";
    document.querySelector("#checkoutPhone").value = CURRENT_USER.phone || "";
  }
  update();
  if (!items.length)
    form.querySelector("button[type='submit']").disabled = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormError(form, "");
    if (!form.reportValidity()) return;
    if (!CURRENT_USER) {
      sessionStorage.setItem("bookly-next", "checkout.html");
      location.href = "login.html?next=checkout.html";
      return;
    }
    if (CURRENT_USER.role !== "customer") {
      showFormError(form, "Only customer accounts can place bookings.");
      return;
    }
    const button = form.querySelector("button[type='submit']");
    setBusy(button, true, "Saving booking...");
    try {
      const result = await API.post("/api/bookings", {
        items: Cart.get(),
        address: document.querySelector("#serviceAddress").value,
        fulfilment: form.querySelector("input[name='shipping']:checked").value,
        paymentMethod: form.querySelector("input[name='payment']:checked")
          .value,
      });
      Cart.clear();
      document.querySelector("#checkoutMain").innerHTML =
        `<section class="section confirmation-section"><div class="container"><div class="confirmation-card"><span class="confirmation-icon">✓</span><span class="eyebrow">Booking submitted</span><h1>You’re all set.</h1><p>Your confirmation number is <strong>${escapeHtml(result.confirmation)}</strong>. The provider can now review and confirm your booking.</p><div class="confirmation-actions"><a class="btn-bookly btn-primary" href="order-history.html">View order history</a><a class="btn-bookly btn-secondary" href="products.html">Browse more services</a></div></div></div></section>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      showFormError(form, error.message);
    } finally {
      setBusy(button, false);
    }
  });
}

function roleRedirect(user) {
  const next =
    new URLSearchParams(location.search).get("next") ||
    sessionStorage.getItem("bookly-next");
  sessionStorage.removeItem("bookly-next");
  if (next && user.role === "customer") location.href = next;
  else location.href = dashboardUrl(user);
}

function initAuthForms() {
  const login = document.querySelector("#loginForm");
  login?.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormError(login, "");
    const button = login.querySelector("button[type='submit']");
    setBusy(button, true, "Signing in...");
    try {
      const result = await API.post("/api/auth/login", {
        email: document.querySelector("#loginEmail").value,
        password: document.querySelector("#loginPassword").value,
      });
      roleRedirect(result.user);
    } catch (error) {
      showFormError(login, error.message);
    } finally {
      setBusy(button, false);
    }
  });
  const register = document.querySelector("#registerForm");
  if (register) {
    const role = document.querySelector("#regRole"),
      providerFields = document.querySelector("#providerFields");
    const toggle = () => (providerFields.hidden = role.value !== "provider");
    role.addEventListener("change", toggle);
    if (new URLSearchParams(location.search).get("role") === "provider")
      role.value = "provider";
    toggle();
    register.addEventListener("submit", async (event) => {
      event.preventDefault();
      showFormError(register, "");
      if (
        document.querySelector("#regPassword").value !==
        document.querySelector("#regConfirm").value
      ) {
        showFormError(register, "Passwords do not match.");
        return;
      }
      const button = register.querySelector("button[type='submit']");
      setBusy(button, true, "Creating account...");
      try {
        const result = await API.post("/api/auth/register", {
          firstName: document.querySelector("#regFirst").value,
          lastName: document.querySelector("#regLast").value,
          email: document.querySelector("#regEmail").value,
          password: document.querySelector("#regPassword").value,
          role: role.value,
          phone: document.querySelector("#regPhone").value,
          category: document.querySelector("#regCategory")?.value,
          location: document.querySelector("#regLocation")?.value,
          bio: document.querySelector("#regBio")?.value,
          hourlyRate: Number(document.querySelector("#regRate")?.value || 500),
        });
        if (result.pending) {
          register.reset();
          toggle();
          showFormError(register, result.message);
          button.disabled = true;
        } else roleRedirect(result.user);
      } catch (error) {
        showFormError(register, error.message);
      } finally {
        setBusy(button, false);
      }
    });
  }
  document.querySelectorAll(".password-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "Show" : "Hide";
    }),
  );
}

async function initCustomerAccount() {
  if (!document.querySelector("#customerAccount")) return;
  if (!(await requireRole("customer"))) return;
  setText("#accountGreeting", `Good day, ${CURRENT_USER.firstName}.`);
  document.querySelector("#profileFirst").value = CURRENT_USER.firstName;
  document.querySelector("#profileLast").value = CURRENT_USER.lastName;
  document.querySelector("#profileEmail").value = CURRENT_USER.email;
  document.querySelector("#profilePhone").value = CURRENT_USER.phone || "";
  const data = await API.get("/api/customer/bookings");
  const upcoming = data.bookings.filter((b) =>
      ["pending", "confirmed"].includes(b.status),
    ),
    past = data.bookings.filter(
      (b) => !["pending", "confirmed"].includes(b.status),
    );
  document.querySelector("#upcomingBookings").innerHTML = bookingRows(
    upcoming,
    "No upcoming bookings yet.",
  );
  document.querySelector("#pastBookings").innerHTML = bookingRows(
    past,
    "No past bookings yet.",
  );
  document
    .querySelector("#profileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const result = await API.patch("/api/auth/profile", {
          firstName: document.querySelector("#profileFirst").value,
          lastName: document.querySelector("#profileLast").value,
          phone: document.querySelector("#profilePhone").value,
        });
        CURRENT_USER = result.user;
        showToast("Profile saved");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  document.querySelectorAll("[data-panel]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-panel]")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".dash-panel")
        .forEach((p) => p.classList.remove("active"));
      button.classList.add("active");
      document
        .querySelector(`#${button.dataset.panel}`)
        .classList.add("active");
    }),
  );
}

function bookingRows(rows, empty) {
  if (!rows.length)
    return `<div class="empty-inline">${escapeHtml(empty)}</div>`;
  return rows
    .map(
      (b) =>
        `<div class="booking-row"><div><span class="status ${b.status}">${escapeHtml(b.status)}</span><h3 class="h5 mt-2">${escapeHtml(b.service_name)} with ${escapeHtml(b.provider_name)}</h3><p class="text-muted mb-0">${formatDate(b.scheduled_date)} · ${b.hours} hour${b.hours === 1 ? "" : "s"} · ${escapeHtml(b.fulfilment)}</p></div><strong>${money(b.total)}</strong></div>`,
    )
    .join("");
}

async function renderOrderHistory() {
  const root = document.querySelector("#orderHistory");
  if (!root) return;
  if (!(await requireRole("customer"))) return;
  const rows = (await API.get("/api/customer/bookings")).bookings;
  const render = (filter = "all", query = "") => {
    const filtered = rows.filter(
      (b) =>
        (filter === "all" ||
          (filter === "upcoming" &&
            ["pending", "confirmed"].includes(b.status)) ||
          b.status === filter) &&
        (!query || b.confirmation.toLowerCase().includes(query.toLowerCase())),
    );
    root.innerHTML = filtered.length
      ? filtered
          .map(
            (b) =>
              `<article class="order-card card-bookly"><div class="order-head"><div><span><small>Order number</small><strong>${escapeHtml(b.confirmation)}</strong></span><span><small>Scheduled</small><strong>${formatDate(b.scheduled_date)}</strong></span><span><small>Total</small><strong>${money(b.total)}</strong></span></div><span class="status ${b.status}">${escapeHtml(b.status)}</span></div><div class="order-body"><div class="order-item-inline"><img class="avatar" src="${photo(b.image, "w=140&h=140&fit=crop")}" alt="${escapeHtml(b.provider_name)}"><div><strong>${escapeHtml(b.service_name)}</strong><small class="d-block text-muted">${escapeHtml(b.provider_name)} · ${escapeHtml(b.fulfilment)}</small></div></div><div class="order-actions">${["pending", "confirmed"].includes(b.status) ? `<button class="btn-bookly btn-secondary" data-cancel="${b.id}">Cancel</button>` : ""}<a class="btn-bookly btn-primary" href="product-details.html?id=${b.provider_id}">Book again</a></div></div></article>`,
          )
          .join("")
      : `<div class="empty-state"><span>▣</span><h2>No matching bookings</h2></div>`;
    root.querySelectorAll("[data-cancel]").forEach((button) =>
      button.addEventListener("click", async () => {
        if (!confirm("Cancel this booking?")) return;
        try {
          await API.patch(
            `/api/customer/bookings/${button.dataset.cancel}/cancel`,
            {},
          );
          location.reload();
        } catch (error) {
          showToast(error.message, "error");
        }
      }),
    );
  };
  let filter = "all";
  document.querySelectorAll(".history-toolbar .filter-chip").forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.status;
      document
        .querySelectorAll(".history-toolbar .filter-chip")
        .forEach((b) => b.classList.toggle("active", b === button));
      render(filter, document.querySelector("#orderSearch").value);
    }),
  );
  document
    .querySelector("#orderSearch")
    .addEventListener("input", (e) => render(filter, e.target.value));
  render();
}

function initSecurity() {
  const form = document.querySelector("#passwordForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError(form, "");
    const button = form.querySelector("button");
    setBusy(button, true, "Updating...");
    try {
      await API.patch("/api/auth/password", {
        currentPassword: document.querySelector("#currentPassword").value,
        newPassword: document.querySelector("#newPassword").value,
      });
      form.reset();
      showToast("Password updated successfully");
    } catch (error) {
      showFormError(form, error.message);
    } finally {
      setBusy(button, false);
    }
  });
}

function initPanelNavigation(attribute, prefix) {
  document.querySelectorAll(`[${attribute}]`).forEach((button) =>
    button.addEventListener("click", () => {
      const target = button.getAttribute(attribute);
      document
        .querySelectorAll(`[${attribute}], .${prefix}-panel`)
        .forEach((el) => el.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`#${prefix}-${target}`)?.classList.add("active");
      setText(
        `#${prefix}Breadcrumb`,
        button.textContent.trim().replace(/^[^A-Za-z]+/, ""),
      );
    }),
  );
}

async function initAdminDashboard() {
  if (!document.querySelector("#adminApp")) return;
  if (!(await requireRole("admin"))) return;
  setText("#adminName", CURRENT_USER.name);
  initPanelNavigation("data-admin-panel", "admin");
  const refresh = async () => {
    const [dash, providers, orders, users] = await Promise.all([
      API.get("/api/admin/dashboard"),
      API.get("/api/admin/providers"),
      API.get("/api/admin/bookings"),
      API.get("/api/admin/users"),
    ]);
    setText("#kpiRevenue", money(dash.summary.revenue));
    setText("#kpiOrders", dash.summary.openOrders);
    setText("#kpiProviders", dash.summary.activeProviders);
    setText("#kpiPending", dash.summary.pendingProviders);
    document.querySelector("#recentOrders").innerHTML =
      dash.recent
        .map(
          (b) =>
            `<div class="mini-order"><span>${escapeHtml(b.confirmation)}</span><strong>${escapeHtml(b.service_name)}</strong><small>${money(b.total)} · ${escapeHtml(b.status)}</small></div>`,
        )
        .join("") || "<p>No bookings yet.</p>";
    document.querySelector("#adminProvidersRows").innerHTML =
      providers.providers
        .map(
          (p) =>
            `<div class="admin-table-row provider-admin-row"><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.email)}</small></span><span>${escapeHtml(p.category)}</span><span>${money(p.price)}/hr</span><span>${escapeHtml(p.status)}</span><select data-provider-status="${p.id}"><option ${p.status === "active" ? "selected" : ""}>active</option><option ${p.status === "pending" ? "selected" : ""}>pending</option><option ${p.status === "inactive" ? "selected" : ""}>inactive</option></select><button data-provider-delete="${p.id}">Disable</button></div>`,
        )
        .join("");
    document.querySelector("#adminOrdersRows").innerHTML = orders.bookings
      .map(
        (b) =>
          `<div class="admin-table-row"><span><strong>${escapeHtml(b.confirmation)}</strong><small>${formatDate(b.scheduled_date)}</small></span><span>${escapeHtml(b.customer_name)}</span><span>${escapeHtml(b.provider_name)}</span><span>${money(b.total)}</span><select data-booking-status="${b.id}">${["pending", "confirmed", "declined", "completed", "cancelled"].map((s) => `<option ${b.status === s ? "selected" : ""}>${s}</option>`).join("")}</select><span>${escapeHtml(b.fulfilment)}</span></div>`,
      )
      .join("");
    document.querySelector("#adminUsersRows").innerHTML = users.users
      .map(
        (u) =>
          `<div class="admin-table-row"><span><strong>${escapeHtml(`${u.first_name} ${u.last_name}`)}</strong><small>${escapeHtml(u.email)}</small></span><span>${escapeHtml(u.role)}</span><span>${u.bookings}</span><span>${escapeHtml(u.created_at.slice(0, 10))}</span><select data-user-status="${u.id}" ${u.id === CURRENT_USER.id ? "disabled" : ""}>${["active", "pending", "suspended"].map((s) => `<option ${u.status === s ? "selected" : ""}>${s}</option>`).join("")}</select><span></span></div>`,
      )
      .join("");
    document.querySelectorAll("[data-provider-status]").forEach((s) =>
      s.addEventListener("change", async () => {
        await API.patch(`/api/admin/providers/${s.dataset.providerStatus}`, {
          status: s.value,
        });
        showToast("Provider status updated");
        refresh();
      }),
    );
    document.querySelectorAll("[data-provider-delete]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Disable this provider account?")) return;
        await API.delete(`/api/admin/providers/${b.dataset.providerDelete}`);
        showToast("Provider disabled");
        refresh();
      }),
    );
    document.querySelectorAll("[data-booking-status]").forEach((s) =>
      s.addEventListener("change", async () => {
        await API.patch(`/api/admin/bookings/${s.dataset.bookingStatus}`, {
          status: s.value,
        });
        showToast("Booking updated");
        refresh();
      }),
    );
    document.querySelectorAll("[data-user-status]").forEach((s) =>
      s.addEventListener("change", async () => {
        await API.patch(`/api/admin/users/${s.dataset.userStatus}`, {
          status: s.value,
        });
        showToast("Account status updated");
        refresh();
      }),
    );
  };
  document
    .querySelector("#openProviderDialog")
    .addEventListener("click", () =>
      document.querySelector("#providerDialog").showModal(),
    );
  document
    .querySelector("#closeProviderDialog")
    .addEventListener("click", () =>
      document.querySelector("#providerDialog").close(),
    );
  document
    .querySelector("#adminProviderForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await API.post(
          "/api/admin/providers",
          Object.fromEntries(new FormData(e.currentTarget)),
        );
        e.currentTarget.reset();
        document.querySelector("#providerDialog").close();
        showToast("Provider account created");
        refresh();
      } catch (error) {
        showFormError(e.currentTarget, error.message);
      }
    });
  await refresh();
}

async function initProviderDashboard() {
  if (!document.querySelector("#providerApp")) return;
  if (!(await requireRole("provider"))) return;
  setText("#providerUserName", CURRENT_USER.name);
  initPanelNavigation("data-provider-panel", "provider");
  const refresh = async () => {
    const data = await API.get("/api/provider/dashboard"),
      p = data.provider;
    setText("#providerTotalBookings", data.stats.total || 0);
    setText("#providerPendingBookings", data.stats.pending || 0);
    setText("#providerEarnings", money(data.stats.earnings || 0));
    setText("#providerStatus", p.status);
    document.querySelector("#providerRecentBookings").innerHTML =
      data.bookings
        .slice(0, 5)
        .map(
          (b) =>
            `<div class="mini-order"><span>${escapeHtml(b.confirmation)}</span><strong>${escapeHtml(b.service_name)}</strong><small>${formatDate(b.scheduled_date)} · ${escapeHtml(b.status)}</small></div>`,
        )
        .join("") || "<p>No bookings yet.</p>";
    document.querySelector("#providerServicesRows").innerHTML = p.services
      .map(
        (s) =>
          `<div class="admin-table-row"><span><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.description)}</small></span><span>${money(s.price)}/hr</span><span>Published</span><button data-service-delete="${s.id}">Remove</button></div>`,
      )
      .join("");
    document.querySelector("#providerBookingsRows").innerHTML = data.bookings
      .map(
        (b) =>
          `<div class="admin-table-row"><span><strong>${escapeHtml(b.confirmation)}</strong><small>${formatDate(b.scheduled_date)}</small></span><span>${escapeHtml(b.customer_name)}</span><span>${escapeHtml(b.service_name)}</span><span>${b.hours} hr</span><span>${money(b.total)}</span><select data-provider-booking="${b.id}">${["pending", "confirmed", "declined", "completed"].map((s) => `<option ${b.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>`,
      )
      .join("");
    for (const [id, value] of Object.entries({
      providerCategory: p.category,
      providerLocation: p.location,
      providerRate: p.price,
      providerAvailability: p.availability,
      providerDescription: p.description,
      providerHeadline: p.headline,
      providerBio: p.bio || "",
    })) {
      const el = document.querySelector(`#${id}`);
      if (el) el.value = value;
    }
    document.querySelectorAll("[data-service-delete]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remove this service?")) return;
        await API.delete(`/api/provider/services/${b.dataset.serviceDelete}`);
        showToast("Service removed");
        refresh();
      }),
    );
    document.querySelectorAll("[data-provider-booking]").forEach((s) =>
      s.addEventListener("change", async () => {
        await API.patch(`/api/provider/bookings/${s.dataset.providerBooking}`, {
          status: s.value,
        });
        showToast("Booking status updated");
        refresh();
      }),
    );
  };
  document
    .querySelector("#openServiceDialog")
    .addEventListener("click", () =>
      document.querySelector("#serviceDialog").showModal(),
    );
  document
    .querySelector("#closeServiceDialog")
    .addEventListener("click", () =>
      document.querySelector("#serviceDialog").close(),
    );
  document
    .querySelector("#providerServiceForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await API.post("/api/provider/services", {
          name: document.querySelector("#serviceName").value,
          description: document.querySelector("#serviceDescription").value,
          price: Number(document.querySelector("#servicePrice").value),
        });
        e.currentTarget.reset();
        document.querySelector("#serviceDialog").close();
        showToast("Service added");
        refresh();
      } catch (error) {
        showFormError(e.currentTarget, error.message);
      }
    });
  document
    .querySelector("#providerProfileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await API.patch("/api/provider/profile", {
          category: document.querySelector("#providerCategory").value,
          location: document.querySelector("#providerLocation").value,
          hourlyRate: Number(document.querySelector("#providerRate").value),
          availability: document.querySelector("#providerAvailability").value,
          description: document.querySelector("#providerDescription").value,
          headline: document.querySelector("#providerHeadline").value,
          bio: document.querySelector("#providerBio").value,
        });
        showToast("Provider profile saved");
        refresh();
      } catch (error) {
        showFormError(e.currentTarget, error.message);
      }
    });
  await refresh();
}

function initDemoInteractions() {
  document
    .querySelectorAll("[data-demo-action]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        showToast(button.dataset.demoAction),
      ),
    );
  document.querySelectorAll(".demo-form").forEach((form) =>
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.reset();
      showToast(form.dataset.success || "Submitted successfully.");
    }),
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSession();
  initShell();
  initAuthForms();
  await renderProviders();
  await renderWishlist();
  await initProviderDetail();
  renderCart();
  renderCheckoutSummary();
  await initCustomerAccount();
  await renderOrderHistory();
  initSecurity();
  await initAdminDashboard();
  await initProviderDashboard();
  initDemoInteractions();
});
