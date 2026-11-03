
"use strict";

const API_BASE_URL = "http://localhost:8000";

const formatNumber = value =>
    new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const formatCurrency = value =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

function getStatusClass(status) {
    return String(status || "unknown")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function setClickable(element, destination, description) {
    if (!element) return;

    element.setAttribute("role", "link");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", description);
    element.style.cursor = "pointer";

    element.addEventListener("click", () => {
        window.location.href = destination;
    });

    element.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.href = destination;
        }
    });
}

function setupDashboardNavigation() {
    const statCards = document.querySelectorAll(".stats .stat-card");

    const destinations = [
        ["orders.html?status=All%20Status", "Open all orders"],
        ["shipments.html?status=All%20Status", "Open all shipments"],
        ["inventory.html", "Open inventory"],
        ["deliveries.html", "Open all deliveries"]
    ];

    statCards.forEach((card, index) => {
        const destination = destinations[index];

        if (destination) {
            setClickable(card, destination[0], destination[1]);
        }
    });

    const shipmentStatusMap = {
        "in transit": "In Transit",
        "delivered": "Delivered",
        "delayed": "Delayed"
    };

    document.querySelectorAll(
        ".shipment-overview .shipment-item"
    ).forEach(item => {
        const label = item.querySelector("p")?.textContent.trim();
        const status = shipmentStatusMap[label?.toLowerCase()];

        const url = status
            ? `shipments.html?status=${encodeURIComponent(status)}`
            : "shipments.html?status=All%20Status";

        setClickable(
            item,
            url,
            `Open shipments: ${label || "all statuses"}`
        );
    });
}

function renderStatistics(summary) {
    const cards = document.querySelectorAll(".stats .stat-card");

    if (cards.length < 4) {
        console.error("Dashboard statistics cards were not found.");
        return;
    }

    const ordersCard = cards[0];
    const shipmentsCard = cards[1];
    const inventoryCard = cards[2];
    const deliveriesCard = cards[3];

    // Orders
    ordersCard.querySelector("h2").textContent =
        formatNumber(summary.orders.total);

    ordersCard.querySelector("span").textContent =
        `${formatNumber(summary.orders.pending)} pending`;

    // Shipments
    shipmentsCard.querySelector("h2").textContent =
        formatNumber(summary.shipments.total);

    shipmentsCard.querySelector("span").textContent =
        `${formatNumber(summary.shipments.in_transit)} in transit`;

    // Inventory
    inventoryCard.querySelector("h2").textContent =
        formatNumber(summary.inventory.total_stock_units);

    inventoryCard.querySelector("span").textContent =
        `${formatNumber(summary.inventory.products_count)} products · ` +
        `${formatCurrency(summary.inventory.stock_value)} stock value`;

    // Deliveries
    deliveriesCard.querySelector("h2").textContent =
        formatNumber(summary.deliveries.total);

    deliveriesCard.querySelector("span").textContent =
        `${formatNumber(summary.deliveries.delivered)} completed`;
}

function renderRecentOrders(orders) {
    const tbody = document.querySelector(
        ".dashboard-grid .panel table tbody"
    );

    if (!tbody) {
        console.error("Recent Orders table was not found.");
        return;
    }

    tbody.replaceChildren();

    if (!orders.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "No orders yet. Create an order to see it here.";

        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    orders.forEach(order => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = order.id;

        const customerCell = document.createElement("td");
        customerCell.textContent = order.customer;

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className = `status ${getStatusClass(order.status)}`;
        statusBadge.textContent = order.status;
        statusCell.appendChild(statusBadge);

        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(order.amount);

        row.append(idCell, customerCell, statusCell, amountCell);
        tbody.appendChild(row);
    });
}

function renderShipmentOverview(shipments) {
    const items = document.querySelectorAll(
        ".shipment-overview .shipment-item"
    );

    const statusCounts = {
        "in transit": shipments.in_transit,
        "delivered": shipments.delivered,
        "delayed": shipments.delayed
    };

    items.forEach(item => {
        const label = item.querySelector("p")?.textContent
            .trim()
            .toLowerCase();

        if (!(label in statusCounts)) return;

        const count = Number(statusCounts[label]) || 0;
        const numberElement = item.querySelector("strong");
        const progressBar = item.querySelector(".progress-bar");

        if (numberElement) {
            numberElement.textContent = formatNumber(count);
        }

        if (progressBar) {
            const total = Number(shipments.total) || 0;
            const percentage = total > 0
                ? Math.min(100, (count / total) * 100)
                : 0;

            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute("role", "progressbar");
            progressBar.setAttribute("aria-valuemin", "0");
            progressBar.setAttribute("aria-valuemax", "100");
            progressBar.setAttribute(
                "aria-valuenow",
                String(Math.round(percentage))
            );
        }
    });
}

function renderDashboard(summary) {
    renderStatistics(summary);
    renderRecentOrders(summary.recent_orders || []);
    renderShipmentOverview(summary.shipments);
}

async function initializeDashboard() {
    setupDashboardNavigation();

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/summary`);

        if (!response.ok) {
            throw new Error(`Dashboard API returned HTTP ${response.status}`);
        }

        const summary = await response.json();
        renderDashboard(summary);

        console.info("LogiFlow Dashboard connected to live API.");
    } catch (error) {
        console.error("Unable to load dashboard data:", error);

        const tbody = document.querySelector(
            ".dashboard-grid .panel table tbody"
        );

        if (tbody) {
            tbody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent =
                "Dashboard data is unavailable. Check that the API is running.";

            row.appendChild(cell);
            tbody.appendChild(row);
        }
    }
}

initializeDashboard();
