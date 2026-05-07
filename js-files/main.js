const app = {
  orders: [],

  async init() {
    await this.loadOrders();

    this.setupNavigation();

    ordersManager.init();
    newOrder.init();

    const settings = await api.getSettings();

    if (settings?.restaurantName) {
      document.getElementById(
        "sidebar-brand"
      ).textContent = settings.restaurantName;
    }
  },

  async loadOrders() {
    this.orders = await api.getOrders();

    this.orders.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    dashboard.render(this.orders);
    ordersManager.render(this.orders);
  },

  setupNavigation() {
    const links = document.querySelectorAll(
      ".nav-link, .mobile-nav-link"
    );

    links.forEach(link => {
      link.addEventListener("click", () => {
        this.switchView(link.dataset.target);
      });
    });
  },

  switchView(viewId) {
    document.querySelectorAll(".view-section")
      .forEach(section => {
        section.classList.add("hidden");
      });

    document
      .getElementById(viewId)
      .classList.remove("hidden");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  app.init();
});