
/* ================================
   ELEMENTS
================================ */

const openOrderButton = document.querySelector("#open-order-modal");
const orderModal = document.querySelector("#order-modal");
const closeOrderButton = document.querySelector("#close-order-modal");
const cancelOrderButton = document.querySelector("#cancel-order");
const orderForm = document.querySelector("#order-form");

const customerNameInput = document.querySelector("#customer-name");
const customerEmailInput = document.querySelector("#customer-email");
const productInput = document.querySelector("#order-product");
const quantityInput = document.querySelector("#order-quantity");
const amountInput = document.querySelector("#order-amount");
const dateInput = document.querySelector("#order-date");
const statusInput = document.querySelector("#order-status");

const searchInput = document.querySelector("#search-order");
const statusFilter = document.querySelector("#status-filter");

const ordersTable = document.querySelector("#orders-table-body");
const emptyState = document.querySelector("#empty-orders");

const totalOrdersElement = document.querySelector("#total-orders");
const pendingOrdersElement = document.querySelector("#pending-orders");
const processingOrdersElement = document.querySelector("#processing-orders");
const completedOrdersElement = document.querySelector("#completed-orders");


/* ================================
   INITIAL SAMPLE ORDERS
================================ */

let orders = [
    {
        id: "LF-ORD-1001",
        customer: "ABC Ltd",
        email: "orders@abcltd.example",
        product: "Laptop",
        quantity: 5,
        amount: 122500,
        date: "2026-10-01",
        status: "Delivered"
    },
    {
        id: "LF-ORD-1002",
        customer: "XYZ Pvt Ltd",
        email: "purchase@xyz.example",
        product: "Wireless Mouse",
        quantity: 20,
        amount: 12000,
        date: "2026-10-02",
        status: "Pending"
    },
    {
        id: "LF-ORD-1003",
        customer: "Global Traders",
        email: "supply@global.example",
        product: "Mechanical Keyboard",
        quantity: 10,
        amount: 35000,
        date: "2026-10-03",
        status: "Processing"
    },
    {
        id: "LF-ORD-1004",
        customer: "Metro Supplies",
        email: "orders@metro.example",
        product: "Office Chair",
        quantity: 8,
        amount: 64000,
        date: "2026-10-04",
        status: "Shipped"
    },
    {
        id: "LF-ORD-1005",
        customer: "Northstar Retail",
        email: "buying@northstar.example",
        product: "Monitor 24 inch",
        quantity: 4,
        amount: 48000,
        date: "2026-10-05",
        status: "Pending"
    },
    {
        id: "LF-ORD-1006",
        customer: "Prime Office",
        email: "orders@primeoffice.example",
        product: "Barcode Scanner",
        quantity: 3,
        amount: 22500,
        date: "2026-10-06",
        status: "Delivered"
    }
];


/* ================================
   STATUS HELPERS
================================ */

function getStatusClass(status) {
    return status.toLowerCase();
}


/* ================================
   SAFE TABLE CELL
   Avoid inserting user input as HTML
================================ */

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;

    if (className) {
        cell.className = className;
    }

    return cell;
}


/* ================================
   RENDER ORDERS
================================ */

function renderOrders() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm) ||
            order.customer.toLowerCase().includes(searchTerm) ||
            order.product.toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedStatus === "All Status" ||
            order.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    ordersTable.replaceChildren();

    filteredOrders.forEach(order => {
        const row = document.createElement("tr");

        row.appendChild(createCell(order.id, "order-id"));

        const customerCell = document.createElement("td");
        const customerInfo = document.createElement("div");
        customerInfo.className = "customer-info";

        const customerName = document.createElement("strong");
        customerName.textContent = order.customer;

        const customerEmail = document.createElement("span");
        customerEmail.textContent = order.email;

        customerInfo.append(customerName, customerEmail);
        customerCell.appendChild(customerInfo);
        row.appendChild(customerCell);

        row.appendChild(createCell(order.product));
        row.appendChild(createCell(order.quantity));

        row.appendChild(
            createCell(
                order.amount.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2
                })
            )
        );

        row.appendChild(createCell(order.date));

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className =
            `status ${getStatusClass(order.status)}`;

        statusBadge.textContent = order.status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "action-btn";
        viewButton.textContent = "View";
        viewButton.dataset.orderId = order.id;

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        ordersTable.appendChild(row);
    });

    emptyState.hidden = filteredOrders.length !== 0;

    updateOrderStatistics();
}


/* ================================
   UPDATE STATISTICS
================================ */

function updateOrderStatistics() {
    totalOrdersElement.textContent = orders.length;

    pendingOrdersElement.textContent = orders.filter(
        order => order.status === "Pending"
    ).length;

    processingOrdersElement.textContent = orders.filter(
        order => order.status === "Processing"
    ).length;

    completedOrdersElement.textContent = orders.filter(
        order => order.status === "Delivered"
    ).length;
}


/* ================================
   OPEN AND CLOSE MODAL
================================ */

function openOrderModal() {
    orderModal.classList.add("is-open");
    orderModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    customerNameInput.focus();
}

function closeOrderModal() {
    orderModal.classList.remove("is-open");
    orderModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    orderForm.reset();
}


/* ================================
   CREATE ORDER
================================ */

function createOrder(event) {
    event.preventDefault();

    const customer = customerNameInput.value.trim();
    const email = customerEmailInput.value.trim();
    const product = productInput.value.trim();
    const quantity = Number(quantityInput.value);
    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const status = statusInput.value;

    if (!customer || !email || !product || !date) {
        alert("Please complete all required fields.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        alert("Quantity must be a whole number greater than zero.");
        quantityInput.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Order amount must be greater than zero.");
        amountInput.focus();
        return;
    }

    const validStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    if (!validStatuses.includes(status)) {
        alert("Please select a valid order status.");
        return;
    }

    const orderNumber = Math.max(
        1000,
        ...orders.map(order => {
            const match = order.id.match(/^LF-ORD-(\d+)$/);
            return match ? Number(match[1]) : 1000;
        })
    ) + 1;

    const newOrder = {
        id: `LF-ORD-${orderNumber}`,
        customer,
        email,
        product,
        quantity,
        amount,
        date,
        status
    };

    orders.unshift(newOrder);

    searchInput.value = "";
    statusFilter.value = "All Status";

    renderOrders();
    closeOrderModal();
}


/* ================================
   VIEW ORDER DETAILS
================================ */

function viewOrder(orderId) {
    const order = orders.find(item => item.id === orderId);

    if (!order) {
        return;
    }

    alert(
        `Order ID: ${order.id}\n` +
        `Customer: ${order.customer}\n` +
        `Email: ${order.email}\n` +
        `Product: ${order.product}\n` +
        `Quantity: ${order.quantity}\n` +
        `Amount: ${order.amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR"
        })}\n` +
        `Date: ${order.date}\n` +
        `Status: ${order.status}`
    );
}


/* ================================
   EVENT LISTENERS
================================ */

openOrderButton.addEventListener("click", openOrderModal);

closeOrderButton.addEventListener("click", closeOrderModal);

cancelOrderButton.addEventListener("click", closeOrderModal);

orderForm.addEventListener("submit", createOrder);

searchInput.addEventListener("input", renderOrders);

statusFilter.addEventListener("change", renderOrders);

ordersTable.addEventListener("click", event => {
    const button = event.target.closest(".action-btn");

    if (!button) {
        return;
    }

    viewOrder(button.dataset.orderId);
});

orderModal.addEventListener("click", event => {
    if (event.target === orderModal) {
        closeOrderModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && orderModal.classList.contains("is-open")) {
        closeOrderModal();
    }
});


/* ================================
   INITIALIZE PAGE
================================ */

renderOrders();
