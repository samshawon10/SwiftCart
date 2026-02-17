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

    })();