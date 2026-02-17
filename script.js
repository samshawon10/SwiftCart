(() => {
  const API_BASE = "https://fakestoreapi.com/products";
  const STORAGE_KEY = "swiftcart-cart";
  const MOBILE_BREAKPOINT = 768;

  const state = {
    activeCategory: "all",
    categories: [],
    productCache: new Map(),
    cart: []
  };

  const ui = {
    navCenter: document.getElementById("navCenter"),
    menuToggle: document.getElementById("menuToggle"),
    menuIconOpen: document.getElementById("menuIconOpen"),
    menuIconClose: document.getElementById("menuIconClose"),

    shopNow: document.getElementById("shopNow"),
    categoryList: document.getElementById("categoryList"),
    productGrid: document.getElementById("productGrid"),
    trendingGrid: document.getElementById("trendingGrid"),
    productLoading: document.getElementById("productLoading"),
    trendLoading: document.getElementById("trendLoading"),

    modal: document.getElementById("productModal"),
    modalBody: document.getElementById("modalBody"),
    closeModal: document.getElementById("closeModal"),

    cartDrawer: document.getElementById("cartDrawer"),
    cartPanel: document.getElementById("cartPanel"),
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartItemsCount: document.getElementById("cartItemsCount"),
    cartSubtotal: document.getElementById("cartSubtotal"),
    cartTotal: document.getElementById("cartTotal"),
    checkoutBtn: document.getElementById("checkoutBtn"),

    newsletterForm: document.getElementById("newsletterForm"),
    newsletterFeedback: document.getElementById("newsletterFeedback")
  };
init();

  function init() {
    state.cart = readCartFromStorage();

    setMenuOpen(false);
    bindEvents();

    updateCartCount();
    renderCart();

    ui.categoryList.innerHTML = messageCard("Loading categories...");
    loadCategories();
    loadTrendingProducts();
    loadProducts("all");
  }

  function bindEvents() {
    ui.menuToggle.addEventListener("click", toggleMenu);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (window.innerWidth >= MOBILE_BREAKPOINT || !isMenuOpen()) return;
      const clickedToggle = ui.menuToggle.contains(event.target);
      const clickedMenu = ui.navCenter.contains(event.target);
      if (!clickedToggle && !clickedMenu) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) closeMenu();
    });

    ui.shopNow.addEventListener("click", () => {
      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
    });

    ui.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      loadProducts(button.dataset.category);
    });

    ui.productGrid.addEventListener("click", handleProductCardAction);
    ui.trendingGrid.addEventListener("click", handleProductCardAction);

    ui.modalBody.addEventListener("click", (event) => {
      const addBtn = event.target.closest("button[data-modal-add]");
      if (addBtn) {
        const product = state.productCache.get(Number(addBtn.dataset.id));
        if (product) addToCart(product);
        return;
      }

      const buyBtn = event.target.closest("button[data-modal-buy]");
      if (!buyBtn) return;
      const product = state.productCache.get(Number(buyBtn.dataset.id));
      if (product) buyNow(product);
    });

    ui.closeModal.addEventListener("click", closeModal);
    ui.modal.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-modal")) closeModal();
    });

    ui.openCart.addEventListener("click", openCart);
    ui.closeCart.addEventListener("click", closeCart);
    ui.cartDrawer.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-cart")) closeCart();
    });

    ui.cartItems.addEventListener("click", (event) => {
      const increaseBtn = event.target.closest("button[data-increase]");
      if (increaseBtn) {
        changeCartQuantity(Number(increaseBtn.dataset.increase), 1);
        return;
      }

      const decreaseBtn = event.target.closest("button[data-decrease]");
      if (decreaseBtn) {
        changeCartQuantity(Number(decreaseBtn.dataset.decrease), -1);
        return;
      }

      const removeBtn = event.target.closest("button[data-remove]");
      if (!removeBtn) return;
      removeFromCart(Number(removeBtn.dataset.remove));
    });

    ui.checkoutBtn.addEventListener("click", () => {
      if (!state.cart.length) return;
      alert("Checkout flow is not part of this assignment yet.");
    });

    ui.newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      ui.newsletterFeedback.textContent = "Thanks for subscribing to SwiftCart updates.";
      ui.newsletterForm.reset();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeMenu();
      closeModal();
      closeCart();
    });
  }

  function handleProductCardAction(event) {
    const detailsBtn = event.target.closest("button[data-details]");
    if (detailsBtn) {
      openDetailsModal(Number(detailsBtn.dataset.details));
      return;
    }

    const addBtn = event.target.closest("button[data-add]");
    if (!addBtn) return;
    const product = state.productCache.get(Number(addBtn.dataset.add));
    if (product) addToCart(product);
  }

  async function loadCategories() {
    try {
      const categories = await fetchJSON(`${API_BASE}/categories`);
      state.categories = Array.isArray(categories) ? categories : [];
      renderCategoryButtons();
    } catch (error) {
      ui.categoryList.innerHTML = messageCard("Unable to load categories right now.");
    }
  }

  async function loadProducts(category) {
    state.activeCategory = category;
    setCategoryActiveState(category);
    setLoading(ui.productLoading, true);

    try {
      const endpoint = category === "all"
        ? API_BASE
        : `${API_BASE}/category/${encodeURIComponent(category)}`;

      const products = await fetchJSON(endpoint);
      cacheProducts(products);
      renderProductGrid(ui.productGrid, products);
      setCategoryActiveState(category);
    } catch (error) {
      ui.productGrid.innerHTML = messageCard("Failed to load products. Please try again.");
    } finally {
      setLoading(ui.productLoading, false);
    }
  }

  async function loadTrendingProducts() {
    setLoading(ui.trendLoading, true);

    try {
      const products = await fetchJSON(API_BASE);
      const topRated = products
        .slice()
        .sort((a, b) => getRating(b) - getRating(a))
        .slice(0, 3);

      cacheProducts(topRated);
      renderProductGrid(ui.trendingGrid, topRated, true);
    } catch (error) {
      ui.trendingGrid.innerHTML = messageCard("Trending products are unavailable right now.");
    } finally {
      setLoading(ui.trendLoading, false);
    }
  }

  function renderCategoryButtons() {
    const allCategories = ["all", ...state.categories];

    ui.categoryList.innerHTML = allCategories
      .map((category) => {
        const label = category === "all" ? "All" : category;
        const isActive = state.activeCategory === category;
        return `<button class="${categoryButtonClasses(isActive)}" data-category="${escapeHTML(category)}">${escapeHTML(label)}</button>`;
      })
      .join("");
  }

  function setCategoryActiveState(category) {
    ui.categoryList.querySelectorAll("button[data-category]").forEach((button) => {
      const active = button.dataset.category === category;
      button.className = categoryButtonClasses(active);
    });
  }

  function categoryButtonClasses(active) {
    const base = "rounded-full border px-3.5 py-2 text-sm font-semibold capitalize transition";
    const activeClasses = "border-orange-200 bg-orange-100 text-orange-700 shadow-sm";
    const inactiveClasses = "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
    return `${base} ${active ? activeClasses : inactiveClasses}`;
  }

  function renderProductGrid(target, products, isTrending = false) {
    if (!Array.isArray(products) || !products.length) {
      target.innerHTML = messageCard("No products found in this category.");
      return;
    }

    target.innerHTML = products
      .map((product, index) => (isTrending ? trendingCardHTML(product, index) : productCardHTML(product)))
      .join("");
  }

  function productCardHTML(product) {
    const rating = getRating(product);
    const ratingCount = getRatingCount(product);

    return `
      <article class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-glow">
        <div class="h-[220px] border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
          <img class="h-full w-full rounded-xl border border-slate-200 bg-white p-3 object-contain" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}">
        </div>
        <div class="flex flex-1 flex-col gap-2.5 p-4">
          <span class="inline-flex w-fit rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-teal-700">${escapeHTML(product.category)}</span>
          <h3 class="line-clamp-2 min-h-[48px] text-sm font-semibold text-slate-900">${escapeHTML(truncate(product.title, 52))}</h3>
          <p class="text-xl font-bold text-slate-900">${money(product.price)}</p>
          <p class="flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-flex gap-0.5">${starsHTML(rating)}</span>
            <span>${rating.toFixed(1)} (${ratingCount})</span>
          </p>
          <div class="mt-auto grid grid-cols-2 gap-2">
            <button class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-700" type="button" data-details="${product.id}">Details</button>
            <button class="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-rose-600" type="button" data-add="${product.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function trendingCardHTML(product, index) {
    const rating = getRating(product);
    const ratingCount = getRatingCount(product);
    const rank = index + 1;
    const label = rank === 1 ? "Top Pick" : rank === 2 ? "Hot Right Now" : "Most Loved";

    return `
      <article class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-glow">
        <span class="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">#${rank}</span>
        <div class="h-[220px] border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
          <img class="h-full w-full rounded-xl border border-slate-200 bg-white p-3 object-contain" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}">
        </div>
        <div class="flex flex-1 flex-col gap-2.5 p-4">
          <p class="text-[11px] font-bold uppercase tracking-wide text-teal-700">${label}</p>
          <span class="inline-flex w-fit rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-teal-700">${escapeHTML(product.category)}</span>
          <h3 class="line-clamp-2 min-h-[48px] text-sm font-semibold text-slate-900">${escapeHTML(truncate(product.title, 52))}</h3>
          <p class="text-xl font-bold text-slate-900">${money(product.price)}</p>
          <p class="flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-flex gap-0.5">${starsHTML(rating)}</span>
            <span>${rating.toFixed(1)} (${ratingCount})</span>
          </p>
          <div class="mt-auto grid grid-cols-2 gap-2">
            <button class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-700" type="button" data-details="${product.id}">Details</button>
            <button class="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-rose-600" type="button" data-add="${product.id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  async function openDetailsModal(productId) {
    try {
      let product = state.productCache.get(productId);

      if (!product) {
        product = await fetchJSON(`${API_BASE}/${productId}`);
        cacheProducts([product]);
      }

      const rating = getRating(product);
      const ratingCount = getRatingCount(product);

      ui.modalBody.innerHTML = `
        <div class="grid gap-5 md:grid-cols-[1fr_1.2fr]">
          <div class="grid min-h-[300px] place-items-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <img class="h-full max-h-[320px] w-full max-w-[300px] rounded-2xl border border-slate-200 bg-white p-4 object-contain" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}">
          </div>
          <div class="space-y-3">
            <h3 class="text-2xl font-semibold text-slate-900" id="modalTitle">${escapeHTML(product.title)}</h3>
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-teal-700">${escapeHTML(product.category)}</span>
              <span class="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <span class="inline-flex gap-0.5">${starsHTML(rating)}</span>
                <span>${rating.toFixed(1)} (${ratingCount})</span>
              </span>
            </div>
            <p class="text-2xl font-bold text-slate-900">${money(product.price)}</p>
            <p class="text-sm leading-6 text-slate-600">${escapeHTML(product.description)}</p>
            <div class="flex flex-wrap gap-2 pt-1">
              <button class="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700" type="button" data-modal-add data-id="${product.id}">Add to Cart</button>
              <button class="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-rose-600" type="button" data-modal-buy data-id="${product.id}">Buy Now</button>
            </div>
          </div>
        </div>
      `;

      ui.modal.classList.remove("hidden");
      ui.modal.setAttribute("aria-hidden", "false");
      syncBodyLock();
    } catch (error) {
      alert("Unable to load product details at the moment.");
    }
  }

  
  function closeModal() {
    if (ui.modal.classList.contains("hidden")) return;
    ui.modal.classList.add("hidden");
    ui.modal.setAttribute("aria-hidden", "true");
    syncBodyLock();
  }

  function openCart() {
    ui.cartDrawer.classList.remove("hidden");
    ui.cartDrawer.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      ui.cartPanel.classList.remove("translate-x-full");
      ui.cartPanel.classList.add("translate-x-0");
    });

    syncBodyLock();
  }

  function closeCart() {
    if (ui.cartDrawer.classList.contains("hidden")) return;

    ui.cartPanel.classList.remove("translate-x-0");
    ui.cartPanel.classList.add("translate-x-full");
    ui.cartDrawer.setAttribute("aria-hidden", "true");

    setTimeout(() => {
      ui.cartDrawer.classList.add("hidden");
      syncBodyLock();
    }, 260);
  }

  function syncBodyLock() {
    const modalOpen = !ui.modal.classList.contains("hidden");
    const cartOpen = !ui.cartDrawer.classList.contains("hidden");
    document.body.classList.toggle("overflow-hidden", modalOpen || cartOpen);
  }

  function addToCart(product) {
    const found = state.cart.find((item) => item.id === product.id);

    if (found) {
      found.qty += 1;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        image: product.image,
        price: Number(product.price) || 0,
        qty: 1
      });
    }

    saveCartToStorage();
    updateCartCount();
    renderCart();
  }

  function buyNow(product) {
    addToCart(product);
    closeModal();
    openCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    saveCartToStorage();
    updateCartCount();
    renderCart();
  }

  function changeCartQuantity(productId, delta) {
    const item = state.cart.find((cartItem) => cartItem.id === productId);
    if (!item) return;

    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      removeFromCart(productId);
      return;
    }

    item.qty = nextQty;
    saveCartToStorage();
    updateCartCount();
    renderCart();
  }

  function renderCart() {
    if (!state.cart.length) {
      ui.cartItems.innerHTML = `
        <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-7 text-center">
          <p class="text-sm font-semibold text-slate-800">Your cart is empty</p>
          <p class="mt-1 text-xs text-slate-500">Add products from the catalog to see them here.</p>
        </div>
      `;
      updateCartSummary(0, 0);
      return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    ui.cartItems.innerHTML = state.cart
      .map((item) => {
        const lineTotal = item.price * item.qty;
        totalItems += item.qty;
        totalPrice += lineTotal;

        const minusDisabled = item.qty <= 1;
        const minusClasses = minusDisabled
          ? "rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-300 cursor-not-allowed"
          : "rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

        return `
          <article class="grid grid-cols-[72px_1fr_auto] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <img class="h-[72px] w-[72px] rounded-xl border border-slate-200 bg-white p-2 object-contain" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
            <div>
              <h4 class="line-clamp-2 text-sm font-semibold text-slate-800">${escapeHTML(truncate(item.title, 44))}</h4>
              <p class="text-[11px] text-slate-500">Unit Price: ${money(item.price)}</p>
              <div class="mt-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button class="${minusClasses}" type="button" data-decrease="${item.id}" ${minusDisabled ? "disabled" : ""}><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
                <span class="min-w-[24px] text-center text-xs font-semibold text-slate-700">${item.qty}</span>
                <button class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50" type="button" data-increase="${item.id}"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
              </div>
              <p class="text-xs font-semibold text-slate-700">Subtotal: ${money(lineTotal)}</p>
            </div>
            <button class="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100" type="button" data-remove="${item.id}">Remove</button>
          </article>
        `;
      })
      .join("");

    updateCartSummary(totalItems, totalPrice);
  }

  function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    ui.cartCount.textContent = String(count);
  }

  function updateCartSummary(itemCount, subtotal) {
    const amount = money(subtotal);
    ui.cartItemsCount.textContent = String(itemCount);
    ui.cartSubtotal.textContent = amount;
    ui.cartTotal.textContent = amount;
  }

  function cacheProducts(products) {
    if (!Array.isArray(products)) return;
    products.forEach((product) => {
      if (product && typeof product.id === "number") {
        state.productCache.set(product.id, product);
      }
    });
  }

  function setLoading(target, loading) {
    target.classList.toggle("hidden", !loading);
  }

  function messageCard(text) {
    return `<p class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-600">${escapeHTML(text)}</p>`;
  }

  function isMenuOpen() {
    return !ui.navCenter.classList.contains("hidden");
  }

  function setMenuOpen(open) {
    ui.navCenter.classList.toggle("hidden", !open);
    ui.menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    ui.menuIconOpen.classList.toggle("hidden", open);
    ui.menuIconClose.classList.toggle("hidden", !open);
  }

  function toggleMenu() {
    setMenuOpen(!isMenuOpen());
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  }

  function readCartFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          id: Number(item.id),
          title: String(item.title || ""),
          image: String(item.image || ""),
          price: Number(item.price) || 0,
          qty: Math.max(1, Number(item.qty) || 1)
        }))
        .filter((item) => Number.isFinite(item.id));
    } catch (error) {
      return [];
    }
  }

  function saveCartToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  }

  function getRating(product) {
    const rating = product && product.rating && Number(product.rating.rate);
    return Number.isFinite(rating) ? rating : 0;
  }

  function getRatingCount(product) {
    const count = product && product.rating && Number(product.rating.count);
    return Number.isFinite(count) ? count : 0;
  }

  function starsHTML(rate) {
    const rounded = Math.round(Number(rate) || 0);
    let stars = "";
    for (let i = 1; i <= 5; i += 1) {
      stars += `<i class="fa-solid fa-star ${i <= rounded ? "text-amber-400" : "text-slate-300"}" aria-hidden="true"></i>`;
    }
    return stars;
  }

  function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text || "";
    return `${text.slice(0, maxLength - 3)}...`;
  }

  function money(value) {
    return `$${(Number(value) || 0).toFixed(2)}`;
  }
// use this part and solve the error (use AI to solve the error).
   function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

})();