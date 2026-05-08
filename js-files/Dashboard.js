const dashboard = {
  renderStats(orders) {

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      accepted: orders.filter(o => o.status === "accepted").length,
      completed: orders.filter(o => o.status === "completed").length,
      rejected: orders.filter(o => o.status === "rejected").length
    };

    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-pending").textContent = stats.pending;
    document.getElementById("stat-accepted").textContent = stats.accepted;
    document.getElementById("stat-completed").textContent = stats.completed;
    document.getElementById("stat-rejected").textContent = stats.rejected;
  },

  renderLatestOrders(orders) {

    const tbody = document.getElementById("latest-orders-tbody");
    const empty = document.getElementById("latest-orders-empty");

    tbody.innerHTML = "";

    const latestOrders = orders.slice(0, 5);

    if (latestOrders.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    latestOrders.forEach(order => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="p-4">#${order.id}</td>
        <td class="p-4">${order.customerName}</td>
        <td class="p-4">$${order.totalPrice}</td>
        <td class="p-4">${order.status}</td>
      `;

      tbody.appendChild(row);
    });
  },

  render(orders) {
    this.renderStats(orders);
    this.renderLatestOrders(orders);
  }
};