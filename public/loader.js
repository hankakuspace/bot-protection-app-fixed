// public/loader.js
// ローカルにホストする Shopify App Bridge Web Components Loader
(function () {
  console.log("Shopify Web Components loader (local) initialized");
  // 実際のShopify loader.jsの代替。最低限CustomElementを定義してReactクラッシュを防止。
  if (!window.customElements.get('s-app-nav')) {
    customElements.define('s-app-nav', class extends HTMLElement {});
  }
  if (!window.customElements.get('s-nav-menu')) {
    customElements.define('s-nav-menu', class extends HTMLElement {});
  }
  if (!window.customElements.get('s-nav-menu-item')) {
    customElements.define('s-nav-menu-item', class extends HTMLElement {});
  }
})();
