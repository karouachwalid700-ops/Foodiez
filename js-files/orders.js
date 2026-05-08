const ordersManager = {
  currentFilter: "all",

  init() {
    const filterBtns = document.querySelectorAll(".filter-btn");

    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.currentFilter = btn.dataset.filter;

        filterBtns.forEach(b => {
          b.classList.remove("bg-primary", "text-white");
          b.classList.add("bg-stone-800", "text-textMuted");
        });

        btn.classList.add("bg-primary", "text-white");

        this.render(app.orders);
      });
    });
  },

  getFilteredOrders(orders) {
    if (this.currentFilter === "all") {
      return orders;
    }

    return orders.filter(
      order => order.status === this.currentFilter
    );
  },

  render(orders) {
    const grid = document.getElementById("orders-grid");
    const empty = document.getElementById("orders-empty");

    grid.innerHTML = "";

    const filteredOrders = this.getFilteredOrders(orders);

    if (filteredOrders.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    filteredOrders.forEach(order => {
      const card = document.createElement("div");

      card.className =
        "bg-cardBg p-5 rounded-2xl border border-stone-700";

      card.innerHTML = `
        <h3 class="text-xl font-bold mb-2">
          ${order.customerName}
        </h3>

        <p class="text-sm text-gray-400 mb-3">
          ${order.items.join(", ")}
        </p>

        <p class="text-green-400 font-bold mb-3">
          $${order.totalPrice}
        </p>

        <select 
          onchange="ordersManager.changeStatus('${order.id}', this.value)"
          class="mb-3 w-full bg-stone-900 p-2 rounded"
        >
          <option value="pending" ${order.status==="pending" ? "selected":""}>Pending</option>
          <option value="accepted" ${order.status==="accepted" ? "selected":""}>Accepted</option>
          <option value="completed" ${order.status==="completed" ? "selected":""}>Completed</option>
          <option value="rejected" ${order.status==="rejected" ? "selected":""}>Rejected</option>
        </select>

        <button
          onclick="ordersManager.deleteOrder('${order.id}')"
          class="bg-red-500 w-full py-2 rounded"
        >
          Delete
        </button>
      `;

      grid.appendChild(card);
    });
  },

  async changeStatus(id, status) {
    await api.updateOrderStatus(id, status);
    await app.loadOrders();
  },

  async deleteOrder(id) {
    await api.deleteOrder(id);
    await app.loadOrders();
  }
};