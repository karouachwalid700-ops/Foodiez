const API_URL = "http://localhost:4000";

const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error("API Error");
      }

      return await response.json();
    } catch (error) {
      console.error(error);
    }
  },

  getOrders() {
    return this.request("/orders");
  },

  createOrder(order) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(order)
    });
  },

  updateOrderStatus(id, status) {
    return this.request(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: "DELETE"
    });
  },

  getSettings() {
    return this.request("/settings");
  }
};