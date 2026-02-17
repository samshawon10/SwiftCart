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


    })();