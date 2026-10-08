const PROVIDERS = [
  { id: "maria", name: "Maria Santos", category: "Home Cleaning", cat: "cleaning", rating: 4.9, reviews: 124, price: 450, location: "North District", badge: "Top Rated", image: "photo-1531746020798-e6953c6e8e04", cover: "photo-1581578731548-c64695cc6952", description: "Eco-friendly home cleaning with meticulous attention to detail.", headline: "A spotless home, without losing your weekend.", services: ["Deep Cleaning", "General Cleaning", "Move-in / Move-out"] },
  { id: "david", name: "David Okafor", category: "Home Cleaning", cat: "cleaning", rating: 4.7, reviews: 89, price: 400, location: "East Side", badge: "Verified", image: "photo-1472099645785-5658abf4ff4e", cover: "photo-1558618666-fcd25c85cd64", description: "Reliable residential cleaning with all equipment included.", headline: "Reliable care for homes that deserve attention.", services: ["General Cleaning", "Deep Cleaning", "Office Cleaning"] },
  { id: "robert", name: "Robert Chen", category: "Home Repair", cat: "repair", rating: 4.8, reviews: 67, price: 650, location: "West Quarter", badge: "Verified Pro", image: "photo-1566492031773-4f4e44671857", cover: "photo-1504148455328-c376907d081c", description: "Licensed carpenter and handyman for repairs and installations.", headline: "Thoughtful repairs, finished properly the first time.", services: ["Carpentry", "Furniture Assembly", "Shelving Installation"] },
  { id: "aisha", name: "Aisha Patel", category: "Tutoring", cat: "tutoring", rating: 5.0, reviews: 53, price: 500, location: "Central", badge: "Top Rated", image: "photo-1573496359142-b8d87734a5a2", cover: "photo-1503676260728-1c00da094a0b", description: "Former teacher offering tailored maths and science sessions.", headline: "Build confidence with lessons shaped around you.", services: ["GCSE Maths", "A-Level Maths", "Science Tutoring"] },
  { id: "thomas", name: "Thomas Wright", category: "Technology Support", cat: "tech", rating: 4.6, reviews: 41, price: 700, location: "North District", badge: "Verified", image: "photo-1560250097-0b93528c311a", cover: "photo-1518770660439-4636190af475", description: "Friendly IT support explained clearly and without jargon.", headline: "Technology fixed, explained, and made less stressful.", services: ["Computer Repair", "Wi-Fi Setup", "Device Setup"] },
  { id: "yuki", name: "Yuki Tanaka", category: "Tutoring", cat: "tutoring", rating: 4.9, reviews: 78, price: 450, location: "South Side", badge: "Top Rated", image: "photo-1580489944761-15a19d654956", cover: "photo-1523240795612-9a054b0db644", description: "Warm, practical English and Japanese language tutoring.", headline: "Language lessons that turn practice into progress.", services: ["English Language", "English Literature", "Beginner Japanese"] },
];

const CURRENCY = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money = (value) => CURRENCY.format(Number(value || 0));

const Cart = {
  key: "bookly-cart-v2",
  get() {
    try {
      const items = JSON.parse(localStorage.getItem(this.key)) || [];
      let migrated = false;
      items.forEach((item) => {
        const provider = PROVIDERS.find((entry) => entry.id === item.providerId);
        if (provider && Number(item.unitPrice || 0) < 200) {
          item.unitPrice = provider.price;
          item.price = provider.price * Math.max(1, Number(item.hours || 1));
          migrated = true;
        }
      });
      if (migrated) localStorage.setItem(this.key, JSON.stringify(items));
      return items;
    }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    updateCartCount();
  },
  add(item) {
    const items = this.get();
    const existing = items.findIndex((entry) => entry.providerId === item.providerId && entry.service === item.service && entry.date === item.date);
    if (existing >= 0) items[existing] = item;
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
    const unitPrice = Number(item.unitPrice || (item.price / Math.max(1, item.hours)));
    item.hours = Math.min(8, Math.max(1, Number(item.hours || 1) + delta));
    item.unitPrice = unitPrice;
    item.price = unitPrice * item.hours;
    this.save(items);
    renderCart();
  },
  clear() { this.save([]); },
};

const Wishlist = {
  key: "bookly-wishlist",
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || ["aisha"]; } catch { return ["aisha"]; } },
  save(ids) { localStorage.setItem(this.key, JSON.stringify(ids)); },
  toggle(id) {
    const ids = this.get();
    const index = ids.indexOf(id);
    if (index >= 0) ids.splice(index, 1); else ids.push(id);
    this.save(ids);
    updateWishlistButtons();
    renderWishlist();
    showToast(index >= 0 ? "Removed from wishlist" : "Saved to wishlist", "neutral");
  },
};

function headerTemplate() {
  return `<nav class="site-nav" aria-label="Primary navigation"><div class="container nav-shell">
    <a class="brand" href="index.html" aria-label="Bookly home"><span class="logo">B</span><span>Bookly</span></a>
    <div class="nav-links" id="primaryMenu"><a href="index.html">Home</a><a href="products.html">Services</a><a href="index.html#how">How it works</a><a href="index.html#promo">For providers</a><a href="design-system.html">Design system</a></div>
    <div class="nav-actions"><a class="cart-link" href="cart.html" aria-label="Open booking cart"><span aria-hidden="true">▣</span><span class="cart-label">Cart</span><span class="cart-count" aria-live="polite">0</span></a><a class="btn-bookly btn-primary account-link" href="account.html">My account</a><button class="mobile-toggle" type="button" aria-expanded="false" aria-controls="primaryMenu" aria-label="Open navigation">☰</button></div>
  </div></nav>`;
}

function footerTemplate() {
  return `<footer class="site-footer"><div class="container"><div class="footer-grid">
    <div class="footer-intro"><a class="brand brand-light" href="index.html"><span class="logo">B</span>Bookly</a><p>Trusted local services, thoughtfully matched. Book verified professionals in a few confident clicks.</p><div class="social-row"><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="LinkedIn">in</a></div></div>
    <div><div class="footer-title">Explore</div><a href="products.html">All services</a><a href="wishlist.html">Wishlist</a><a href="order-history.html">Order history</a><a href="help.html">Help centre</a></div>
    <div><div class="footer-title">Project</div><a href="index.html#how">How it works</a><a href="wireframes.html">Wireframes</a><a href="admin.html">Admin wireframe</a><a href="design-system.html">Design system</a></div>
    <div class="newsletter"><div class="footer-title">Useful, not noisy</div><p>A monthly note with practical home tips and standout providers.</p><form class="newsletter-form"><label class="sr-only" for="newsletterEmail">Email address</label><input id="newsletterEmail" class="input-bookly" type="email" required placeholder="Email address"><button class="btn-bookly btn-accent" type="submit">Join</button></form></div>
  </div><div class="footer-bottom"><small>© 2026 Bookly. All rights reserved.</small><div><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Accessibility</a></div></div></div></footer>`;
}

function initShell() {
  const header = document.querySelector("#siteHeader");
  const footer = document.querySelector("#siteFooter");
  if (header) header.innerHTML = headerTemplate();
  if (footer) footer.innerHTML = footerTemplate();
  const toggle = document.querySelector(".mobile-toggle");
  const menu = document.querySelector(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "×" : "☰";
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-nav") && menu?.classList.contains("open")) {
      menu.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
      if (toggle) toggle.textContent = "☰";
    }
  });
  const pageName = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const target = link.getAttribute("href").split("#")[0];
    const isExactPage = target === pageName && !link.getAttribute("href").includes("#");
    if (isExactPage || (pageName === "product-details.html" && target === "products.html")) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
  document.querySelector(".newsletter-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("You’re on the list. Welcome to Bookly!");
  });
}

function updateCartCount() {
  const count = Cart.get().length;
  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = count;
    element.classList.toggle("is-empty", count === 0);
  });
}

function showToast(message, type = "success") {
  document.querySelector(".toast-bookly")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast-bookly toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${type === "success" ? "✓" : "i"}</span><p>${message}</p>`;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 250); }, 2800);
}

function providerCard(provider) {
  const searchable = `${provider.name} ${provider.category} ${provider.location} ${provider.description}`.toLowerCase();
  return `<div class="col-md-6 col-xl-4 provider-col" data-id="${provider.id}" data-cat="${provider.cat}" data-search="${searchable}" data-price="${provider.price}" data-rating="${provider.rating}" data-name="${provider.name}"><article class="provider-card card-bookly">
    <div class="provider-card-top"><img class="provider-cover" src="https://images.unsplash.com/${provider.cover}?w=900&h=520&fit=crop&auto=format" alt="${provider.category}"><span class="chip chip-light">${provider.badge}</span><button class="wishlist-btn" type="button" data-wishlist="${provider.id}" aria-label="Save ${provider.name} to wishlist">♡</button></div>
    <div class="card-body-bookly"><div class="provider-head"><img class="avatar" src="https://images.unsplash.com/${provider.image}?w=180&h=180&fit=crop&auto=format" alt="${provider.name}"><div><h3>${provider.name}</h3><p>${provider.category} · ${provider.location}</p></div></div><p class="provider-description">${provider.description}</p><div class="provider-meta"><span><span class="stars">★</span> <strong>${provider.rating.toFixed(1)}</strong> <small>(${provider.reviews})</small></span><span><strong>${money(provider.price)}</strong><small>/hour</small></span></div><a class="btn-bookly btn-primary btn-full" href="product-details.html?id=${provider.id}">View profile <span>→</span></a></div>
  </article></div>`;
}

function renderProviders() {
  const grid = document.querySelector("#providerGrid");
  if (!grid) return;
  grid.innerHTML = PROVIDERS.map(providerCard).join("");
  const params = new URLSearchParams(location.search);
  let activeCategory = params.get("cat") || "all";
  const search = document.querySelector("#serviceSearch");
  const sort = document.querySelector("#sortServices");
  if (search) search.value = params.get("q") || "";
  const applyFilters = () => {
    const query = search?.value.trim().toLowerCase() || "";
    let visible = 0;
    document.querySelectorAll(".provider-col").forEach((card) => {
      const show = (activeCategory === "all" || card.dataset.cat === activeCategory) && (!query || card.dataset.search.includes(query));
      card.hidden = !show;
      if (show) visible += 1;
    });
    const count = document.querySelector("#resultCount");
    if (count) count.textContent = `${visible} trusted provider${visible === 1 ? "" : "s"}`;
    document.querySelector("#emptyProviders")?.remove();
    if (!visible) {
      grid.insertAdjacentHTML("afterend", `<div id="emptyProviders" class="empty-state"><span>⌕</span><h2>No exact matches yet</h2><p>Try a broader search or browse all categories.</p><button class="btn-bookly btn-primary" id="clearFilters">Clear filters</button></div>`);
      document.querySelector("#clearFilters").addEventListener("click", () => {
        activeCategory = "all";
        if (search) search.value = "";
        document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.cat === "all"));
        applyFilters();
      });
    }
    const cards = [...grid.querySelectorAll(".provider-col")];
    cards.sort((a, b) => {
      if (sort?.value === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
      if (sort?.value === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort?.value === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
      if (sort?.value === "name") return a.dataset.name.localeCompare(b.dataset.name);
      return PROVIDERS.findIndex((p) => p.id === a.dataset.id) - PROVIDERS.findIndex((p) => p.id === b.dataset.id);
    });
    cards.forEach((card) => grid.appendChild(card));
  };
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.cat === activeCategory);
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      document.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });
  });
  search?.addEventListener("input", applyFilters);
  sort?.addEventListener("change", applyFilters);
  grid.querySelectorAll("[data-wishlist]").forEach((button) => button.addEventListener("click", () => Wishlist.toggle(button.dataset.wishlist)));
  updateWishlistButtons();
  applyFilters();
}

function updateWishlistButtons() {
  const saved = Wishlist.get();
  document.querySelectorAll("[data-wishlist]").forEach((button) => {
    const active = saved.includes(button.dataset.wishlist);
    button.classList.toggle("active", active);
    button.textContent = active ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderWishlist() {
  const root = document.querySelector("#wishlistGrid");
  if (!root) return;
  const providers = PROVIDERS.filter((provider) => Wishlist.get().includes(provider.id));
  root.innerHTML = providers.length ? providers.map(providerCard).join("") : `<div class="col-12"><div class="empty-state"><span>♡</span><h2>Your wishlist is empty</h2><p>Save providers from the catalog to compare them later.</p><a class="btn-bookly btn-primary" href="products.html">Explore services</a></div></div>`;
  root.querySelectorAll("[data-wishlist]").forEach((button) => button.addEventListener("click", () => Wishlist.toggle(button.dataset.wishlist)));
  updateWishlistButtons();
}

function selectedProvider() {
  const id = new URLSearchParams(location.search).get("id") || "maria";
  return PROVIDERS.find((provider) => provider.id === id) || PROVIDERS[0];
}

function initProviderDetail() {
  const form = document.querySelector("#bookingForm");
  if (!form) return;
  const provider = selectedProvider();
  document.title = `${provider.name} — Bookly`;
  const detailPhoto = document.querySelector(".detail-photo");
  if (detailPhoto) { detailPhoto.src = `https://images.unsplash.com/${provider.cover}?w=1200&fit=crop&auto=format`; detailPhoto.alt = `${provider.category} by ${provider.name}`; }
  const profileName = document.querySelector(".provider-head h1");
  const profileImage = document.querySelector(".provider-head .avatar");
  const profileMeta = document.querySelector(".provider-head p");
  const badge = document.querySelector(".provider-head .chip");
  const headline = document.querySelector(".col-lg-7 > h2.h3");
  const breadcrumb = document.querySelector(".breadcrumb-bookly");
  const notesLabel = document.querySelector("label[for='notes']");
  if (profileName) profileName.textContent = provider.name;
  if (profileImage) { profileImage.src = `https://images.unsplash.com/${provider.image}?w=180&h=180&fit=crop&auto=format`; profileImage.alt = provider.name; }
  if (profileMeta) profileMeta.innerHTML = `${provider.category} · ${provider.location} · <span class="stars">★</span> ${provider.rating.toFixed(1)} (${provider.reviews} reviews)`;
  if (badge) badge.textContent = provider.badge;
  if (headline) headline.textContent = provider.headline;
  if (breadcrumb) breadcrumb.textContent = `Services / ${provider.category} / ${provider.name}`;
  if (notesLabel) notesLabel.textContent = `Anything ${provider.name.split(" ")[0]} should know?`;
  const detailContent = {
    cleaning: {
      features: ["Kitchen and bathroom sanitising", "Floors vacuumed and mopped", "Dusting and surface care", "Eco-friendly products and equipment"],
      review: "Punctual, warm, and extraordinarily thorough. The whole house felt lighter.",
      reviewer: "Priya K.",
    },
    repair: {
      features: ["Full task and safety assessment", "Professional tools included", "Careful installation and clean-up", "Clear advice before extra work"],
      review: "Robert explained every step, completed the repair beautifully, and left the workspace spotless.",
      reviewer: "Nina R.",
    },
    tutoring: {
      features: ["Personal learning plan", "Focused one-to-one guidance", "Practice resources included", "Progress notes after each lesson"],
      review: "Patient, encouraging, and brilliant at turning difficult ideas into something easy to understand.",
      reviewer: "Ben H.",
    },
    tech: {
      features: ["Plain-language diagnosis", "Device and network check", "Secure troubleshooting", "Simple prevention guidance"],
      review: "The problem was fixed quickly and explained without jargon. I finally understand what went wrong.",
      reviewer: "Margaret S.",
    },
  }[provider.cat];
  const bios = {
    cleaning: "Experienced, detail-focused home care using thoughtful methods and reliable equipment. Every visit is planned around the customer’s priorities.",
    repair: "A licensed carpenter and practical problem-solver with twelve years of experience, from small household fixes to careful custom installations.",
    tutoring: "Supportive one-to-one teaching shaped around each learner’s goals, pace, and preferred way of understanding difficult ideas.",
    tech: "Friendly technical help for homes and small businesses, with every fix explained clearly and without unnecessary jargon.",
  };
  const bio = headline?.nextElementSibling;
  if (bio?.matches("p")) bio.textContent = bios[provider.cat];
  const featureList = document.querySelector(".feature-list");
  if (featureList) featureList.innerHTML = detailContent.features.map((feature) => `<li>${feature}</li>`).join("");
  const reviewCard = document.querySelector(".col-lg-7 .card-bookly.p-4");
  if (reviewCard) reviewCard.innerHTML = `<div class="stars">★★★★★</div><p class="mt-2">“${detailContent.review}”</p><small class="text-muted">${detailContent.reviewer} · August 2026</small>`;
  const rate = document.querySelector(".sticky-card .price");
  if (rate) rate.textContent = money(provider.price);
  const serviceSelect = document.querySelector("#service");
  serviceSelect.innerHTML = provider.services.map((service) => `<option>${service}</option>`).join("");
  const dateInput = document.querySelector("#date");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); dateInput.min = tomorrow.toISOString().slice(0, 10);
  const updateButton = () => {
    const hours = Number(document.querySelector("#hours").value || 1);
    form.querySelector("button").textContent = `Add booking · ${money(provider.price * hours)}`;
  };
  document.querySelector("#hours")?.addEventListener("change", updateButton); updateButton();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const hours = Number(document.querySelector("#hours").value || 1);
    Cart.add({ providerId: provider.id, name: provider.name, service: serviceSelect.value, date: dateInput.value, hours, unitPrice: provider.price, price: provider.price * hours, image: provider.image });
    setTimeout(() => { location.href = "cart.html"; }, 450);
  });
}

function formatDate(date) {
  if (!date) return "Flexible date";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
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
    root.innerHTML = items.map((item, index) => `<article class="cart-item"><img class="avatar" src="https://images.unsplash.com/${item.image}?w=160&h=160&fit=crop&auto=format" alt="${item.name}"><div class="cart-item-copy"><span class="chip">${item.service}</span><h2>${item.name}</h2><p>${formatDate(item.date)} · ${money(item.unitPrice || item.price / Math.max(1, item.hours))} per hour</p><div class="quantity-control" aria-label="Adjust booked hours"><button type="button" onclick="Cart.change(${index},-1)" aria-label="Decrease hours">−</button><span>${item.hours} hour${item.hours === 1 ? "" : "s"}</span><button type="button" onclick="Cart.change(${index},1)" aria-label="Increase hours">+</button></div></div><div class="cart-item-actions"><strong>${money(item.price)}</strong><button type="button" onclick="Cart.remove(${index})">Remove</button></div></article>`).join("");
  }
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const fee = subtotal ? 99 : 0;
  setText("#subtotal", money(subtotal)); setText("#fee", money(fee)); setText("#total", money(subtotal + fee));
  document.querySelector("#checkoutBtn")?.classList.toggle("disabled", !items.length);
}

function renderCheckoutSummary() {
  const form = document.querySelector("#checkoutForm");
  if (!form) return;
  const items = Cart.get();
  const summary = document.querySelector(".checkout-summary");
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const fee = subtotal ? 99 : 0;
  const updateSummary = () => {
    const shipping = form.querySelector("input[name='shipping']:checked");
    const shippingCost = Number(shipping?.dataset.cost || 0);
    const estimate = shipping?.dataset.estimate || "To be confirmed";
    setText("#deliveryEstimate", estimate);
    if (summary && items.length) summary.innerHTML = `<span class="chip chip-accent">🔒 Protected order</span><h2>Order summary</h2><p class="text-muted">${shipping?.dataset.label || "Fulfilment method"} · ${estimate}</p><div class="checkout-items">${items.map((item) => `<div><span>${item.service}<small>${item.name} · ${item.hours} hour${item.hours === 1 ? "" : "s"}</small></span><strong>${money(item.price)}</strong></div>`).join("")}</div><div class="summary-row"><span>Services</span><span>${money(subtotal)}</span></div><div class="summary-row"><span>Booking protection</span><span>${money(fee)}</span></div><div class="summary-row"><span>Delivery / fulfilment</span><span>${shippingCost ? money(shippingCost) : "Free"}</span></div><div class="summary-row total"><span>Total</span><span>${money(subtotal + fee + shippingCost)}</span></div><div class="secure-note"><span>⌾</span><p><strong>Secure demonstration checkout</strong><br><small>No payment information is transmitted.</small></p></div>`;
  };
  form.querySelectorAll("input[name='shipping']").forEach((input) => input.addEventListener("change", updateSummary));
  const cardFields = document.querySelector("#cardFields");
  form.querySelectorAll("input[name='payment']").forEach((input) => input.addEventListener("change", () => {
    const needsCard = form.querySelector("input[name='payment']:checked")?.value === "card";
    cardFields.hidden = !needsCard;
    cardFields.querySelectorAll("input").forEach((field) => { field.required = needsCard; });
  }));
  updateSummary();
  if (!items.length) { form.querySelector("button[type='submit']").disabled = true; showToast("Your cart is empty. Add a booking first.", "neutral"); }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity() || !Cart.get().length) return;
    const shipping = form.querySelector("input[name='shipping']:checked");
    const payment = form.querySelector("input[name='payment']:checked");
    const order = { id: `BK-${Date.now().toString().slice(-6)}`, date: new Date().toISOString(), total: subtotal + fee + Number(shipping.dataset.cost || 0), shipping: shipping.dataset.label, payment: payment.value, status: "Confirmed", items };
    const orders = JSON.parse(localStorage.getItem("bookly-orders") || "[]");
    localStorage.setItem("bookly-orders", JSON.stringify([order, ...orders]));
    Cart.clear();
    document.querySelector("#checkoutMain").innerHTML = `<section class="section confirmation-section"><div class="container"><div class="confirmation-card"><span class="confirmation-icon">✓</span><span class="eyebrow">Order confirmed</span><h1>You’re all set.</h1><p>Your confirmation number is <strong>${order.id}</strong>. Fulfilment: <strong>${order.shipping}</strong>. We sent the details to your email and added the order to your account.</p><div class="confirmation-actions"><a class="btn-bookly btn-primary" href="order-history.html">View order history</a><a class="btn-bookly btn-secondary" href="products.html">Browse more services</a></div></div></div></section>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initAccountTabs() {
  document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-panel]").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".dash-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active"); document.querySelector(`#${button.dataset.panel}`)?.classList.add("active");
  }));
  document.querySelector("#profile .btn-bookly")?.addEventListener("click", () => showToast("Profile changes saved"));
}

function setText(selector, value) { const element = document.querySelector(selector); if (element) element.textContent = value; }

function fixCategoryPhotography() {
  const images = {
    "Home Cleaning": "photo-1581578731548-c64695cc6952",
    "Home cleaning": "photo-1581578731548-c64695cc6952",
    "Cleaning": "photo-1581578731548-c64695cc6952",
    "Home Repair": "photo-1504148455328-c376907d081c",
    "Home repair": "photo-1504148455328-c376907d081c",
    "Repair": "photo-1504148455328-c376907d081c",
    "Tutoring": "photo-1503676260728-1c00da094a0b",
    "Tech support": "photo-1518770660439-4636190af475",
  };
  document.querySelectorAll(".hero-tile img, .card-bookly > .card-img").forEach((image) => {
    const id = images[image.alt];
    if (id) image.src = `https://images.unsplash.com/${id}?w=900&fit=crop&auto=format`;
  });
}

function renderOrderHistory() {
  const root = document.querySelector("#orderHistory");
  if (!root) return;
  const saved = JSON.parse(localStorage.getItem("bookly-orders") || "[]");
  const sample = [
    { id: "BK-204851", date: "2026-10-06", total: 999, shipping: "Standard home visit", payment: "card", status: "Confirmed", items: [{ name: "Maria Santos", service: "Deep Cleaning", hours: 2, image: "photo-1531746020798-e6953c6e8e04" }] },
    { id: "BK-198420", date: "2026-09-18", total: 799, shipping: "Remote session", payment: "ewallet", status: "Completed", items: [{ name: "Thomas Wright", service: "Wi-Fi Setup", hours: 1, image: "photo-1560250097-0b93528c311a" }] },
  ];
  const orders = saved.length ? saved : sample;
  root.innerHTML = orders.map((order) => {
    const item = order.items[0];
    return `<article class="order-card card-bookly"><div class="order-head"><div><span><small>Order number</small><strong>${order.id}</strong></span><span><small>Placed</small><strong>${formatDate(order.date.slice(0,10))}</strong></span><span><small>Total</small><strong>${money(order.total)}</strong></span></div><span class="status ${order.status.toLowerCase() === "confirmed" ? "confirmed" : "completed"}">${order.status}</span></div><div class="order-body"><div class="order-item-inline"><img class="avatar" src="https://images.unsplash.com/${item.image}?w=140&h=140&fit=crop" alt="${item.name}"><div><strong>${item.service}</strong><small class="d-block text-muted">${item.name} · ${order.shipping}</small></div></div><div class="order-actions"><button class="btn-bookly btn-secondary" data-demo-action="Receipt prepared for download">Receipt</button><a class="btn-bookly btn-primary" href="product-details.html">Book again</a></div></div></article>`;
  }).join("");
}

function initDemoInteractions() {
  document.querySelectorAll(".demo-form").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    showToast(form.dataset.success || "Saved successfully");
    if (form.closest(".auth-card")) setTimeout(() => { location.href = "account.html"; }, 700);
    else form.reset();
  }));
  document.querySelectorAll(".password-toggle").forEach((button) => button.addEventListener("click", () => {
    const input = button.parentElement.querySelector("input");
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "Show" : "Hide";
  }));
  document.querySelectorAll("[data-demo-action]").forEach((button) => button.addEventListener("click", () => showToast(button.dataset.demoAction)));
}

function initAdmin() {
  document.querySelectorAll("[data-admin-panel]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-panel], .admin-panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#admin-${button.dataset.adminPanel}`)?.classList.add("active");
    setText("#adminBreadcrumb", button.textContent.trim().replace(/^[^A-Za-z]+/, ""));
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  initShell(); fixCategoryPhotography(); updateCartCount(); renderProviders(); renderWishlist(); initProviderDetail(); renderCart(); renderCheckoutSummary(); renderOrderHistory(); initAccountTabs(); initDemoInteractions(); initAdmin();
});
