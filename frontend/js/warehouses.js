/* =========================================
   LOGIFLOW - WAREHOUSE MANAGEMENT
   Browser storage demo implementation
========================================= */

"use strict";

const STORAGE_KEY = "logiflow.warehouses.v1";

const sampleWarehouses = [
    {
        id: "wh_001",
        name: "North Distribution Centre",
        code: "WH-GGN-01",
        type: "Distribution",
        city: "Gurugram",
        state: "Haryana",
        address: "Sector 18, Industrial Area, Gurugram, Haryana",
        capacity: 2500,
        occupied: 1760,
        manager: "Operations Team",
        status: "Active",
        createdAt: "2026-09-15T09:00:00.000Z",
        updatedAt: "2026-09-15T09:00:00.000Z"
    },
    {
        id: "wh_002",
        name: "Delhi Central Storage",
        code: "WH-DEL-02",
        type: "General Storage",
        city: "New Delhi",
        state: "Delhi",
        address: "Okhla Industrial Estate, New Delhi",
        capacity: 1800,
        occupied: 1250,
        manager: "Warehouse Team",
        status: "Active",
        createdAt: "2026-09-18T09:00:00.000Z",
        updatedAt: "2026-09-18T09:00:00.000Z"
    },
    {
        id: "wh_003",
        name: "Chandigarh Cold Storage",
        code: "WH-CHD-03",
        type: "Cold Storage",
        city: "Chandigarh",
        state: "Chandigarh",
        address: "Industrial Area Phase II, Chandigarh",
        capacity: 1200,
        occupied: 1080,
        manager: "Cold Storage Team",
        status: "Maintenance",
        createdAt: "2026-09-20T09:00:00.000Z",
        updatedAt: "2026-09-20T09:00:00.000Z"
    },
    {
        id: "wh_004",
        name: "Lucknow Transit Hub",
        code: "WH-LKO-04",
        type: "Cross-Dock",
        city: "Lucknow",
        state: "Uttar Pradesh",
        address: "Transport Nagar, Lucknow, Uttar Pradesh",
        capacity: 2000,
        occupied: 730,
        manager: "Transit Operations",
        status: "Active",
        createdAt: "2026-09-22T09:00:00.000Z",
        updatedAt: "2026-09-22T09:00:00.000Z"
    },
    {
        id: "wh_005",
        name: "Jaipur Retail Storehouse",
        code: "WH-JPR-05",
        type: "Retail Storage",
        city: "Jaipur",
        state: "Rajasthan",
        address: "Sitapura Industrial Area, Jaipur",
        capacity: 1500,
        occupied: 0,
        manager: "",
        status: "Inactive",
        createdAt: "2026-09-25T09:00:00.000Z",
        updatedAt: "2026-09-25T09:00:00.000Z"
    }
];

const VALID_TYPES = [
    "Distribution",
    "Cold Storage",
    "General Storage",
    "Retail Storage",
    "Cross-Dock"
];

const VALID_STATUSES = [
    "Active",
    "Maintenance",
    "Inactive"
];

let warehouses = [];
let selectedWarehouseId = null;


/* =========================================
   DOM ELEMENTS
========================================= */

const warehouseForm = document.getElementById("warehouse-form");

const warehouseModal = document.getElementById("warehouse-modal");

const warehouseDetailsModal = document.getElementById(
    "warehouse-details-modal"
);

const warehouseTableBody = document.getElementById(
    "warehouse-table-body"
);

const warehouseSearch = document.getElementById("warehouse-search");

const statusFilter = document.getElementById(
    "warehouse-status-filter"
);

const typeFilter = document.getElementById(
    "warehouse-type-filter"
);

const formError = document.getElementById("warehouse-form-error");

const totalCapacityInput = document.getElementById(
    "warehouse-capacity"
);

const occupiedCapacityInput = document.getElementById(
    "warehouse-occupied"
);


/* =========================================
   BASIC HELPERS
========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(
        Number(value) || 0
    );
}

function getUtilization(warehouse) {
    const capacity = Number(warehouse.capacity) || 0;
    const occupied = Number(warehouse.occupied) || 0;

    if (capacity <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((occupied / capacity) * 100)
    );
}

function getAvailableCapacity(warehouse) {
    return Math.max(
        0,
        Number(warehouse.capacity) - Number(warehouse.occupied)
    );
}

function getStatusClass(status) {
    const statusClasses = {
        Active: "active",
        Maintenance: "maintenance",
        Inactive: "inactive"
    };

    return statusClasses[status] || "inactive";
}

function getUtilizationClass(percentage) {
    if (percentage >= 100) {
        return "danger";
    }

    if (percentage >= 85) {
        return "warning";
    }

    return "";
}

function generateId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return `wh_${crypto.randomUUID()}`;
    }

    return `wh_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

function isValidWarehouse(warehouse) {
    return (
        warehouse &&
        typeof warehouse.id === "string" &&
        typeof warehouse.name === "string" &&
        typeof warehouse.code === "string" &&
        typeof warehouse.city === "string" &&
        typeof warehouse.state === "string" &&
        typeof warehouse.address === "string" &&
        VALID_TYPES.includes(warehouse.type) &&
        VALID_STATUSES.includes(warehouse.status) &&
        Number.isSafeInteger(Number(warehouse.capacity)) &&
        Number(warehouse.capacity) > 0 &&
        Number.isSafeInteger(Number(warehouse.occupied)) &&
        Number(warehouse.occupied) >= 0 &&
        Number(warehouse.occupied) <= Number(warehouse.capacity)
    );
}


/* =========================================
   LOAD AND SAVE DATA
========================================= */

function loadWarehouses() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            const initialData = JSON.stringify(sampleWarehouses);

            localStorage.setItem(STORAGE_KEY, initialData);

            return sampleWarehouses.map(function (warehouse) {
                return { ...warehouse };
            });
        }

        const parsedData = JSON.parse(savedData);

        // Supports either an array or a versioned object.
        const records = Array.isArray(parsedData)
            ? parsedData
            : parsedData?.warehouses;

        if (
            !Array.isArray(records) ||
            !records.every(isValidWarehouse)
        ) {
            throw new Error("Saved warehouse data has an invalid format.");
        }

        return records.map(function (warehouse) {
            return { ...warehouse };
        });
    } catch (error) {
        console.error("Could not load warehouse data:", error);

        alert(
            "Warehouse data could not be loaded safely. " +
            "The page will use temporary sample data. " +
            "Existing saved data has not been intentionally deleted."
        );

        return sampleWarehouses.map(function (warehouse) {
            return { ...warehouse };
        });
    }
}

function saveWarehouses(nextWarehouses) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextWarehouses)
        );

        warehouses = nextWarehouses;

        return true;
    } catch (error) {
        console.error("Could not save warehouse data:", error);

        alert(
            "Changes could not be saved in browser storage. " +
            "Check browser storage settings before continuing."
        );

        return false;
    }
}


/* =========================================
   STATISTICS AND CAPACITY
========================================= */

function renderStatistics() {
    const totalWarehouses = warehouses.length;

    const activeWarehouses = warehouses.filter(function (warehouse) {
        return warehouse.status === "Active";
    }).length;

    const totalCapacity = warehouses.reduce(function (total, warehouse) {
        return total + Number(warehouse.capacity);
    }, 0);

    const occupiedCapacity = warehouses.reduce(function (total, warehouse) {
        return total + Number(warehouse.occupied);
    }, 0);

    const availableCapacity = Math.max(
        0,
        totalCapacity - occupiedCapacity
    );

    const overallPercentage = totalCapacity > 0
        ? Math.round((occupiedCapacity / totalCapacity) * 100)
        : 0;

    document.getElementById("total-warehouses").textContent =
        formatNumber(totalWarehouses);

    document.getElementById("active-warehouses").textContent =
        formatNumber(activeWarehouses);

    document.getElementById("total-capacity").textContent =
        formatNumber(totalCapacity);

    document.getElementById("capacity-used").textContent =
        `${overallPercentage}%`;

    document.getElementById("occupied-capacity").textContent =
        `${formatNumber(occupiedCapacity)} units`;

    document.getElementById("available-capacity").textContent =
        `${formatNumber(availableCapacity)} units`;

    const progress = document.getElementById("overall-progress");

    const progressFill = document.getElementById(
        "overall-progress-fill"
    );

    progress.setAttribute("aria-valuenow", overallPercentage);

    progressFill.style.width = `${overallPercentage}%`;

    progressFill.title = `${overallPercentage}% of total capacity occupied`;
}


/* =========================================
   FILTER AND SEARCH
========================================= */

function getFilteredWarehouses() {
    const query = warehouseSearch.value.trim().toLowerCase();

    const selectedStatus = statusFilter.value;

    const selectedType = typeFilter.value;

    return warehouses.filter(function (warehouse) {
        const searchableText = [
            warehouse.name,
            warehouse.code,
            warehouse.city,
            warehouse.state,
            warehouse.address,
            warehouse.type,
            warehouse.manager
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesStatus =
            selectedStatus === "all" ||
            warehouse.status === selectedStatus;

        const matchesType =
            selectedType === "all" ||
            warehouse.type === selectedType;

        return matchesSearch && matchesStatus && matchesType;
    });
}


/* =========================================
   RENDER WAREHOUSE TABLE
========================================= */

function renderWarehouses() {
    const filteredWarehouses = getFilteredWarehouses();

    const count = filteredWarehouses.length;

    document.getElementById("warehouse-record-count").textContent =
        `${count} ${count === 1 ? "location" : "locations"}`;

    if (count === 0) {
        warehouseTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No warehouses found. Try changing your search
                    or filters, or add a new warehouse.
                </td>
            </tr>
        `;

        return;
    }

    warehouseTableBody.innerHTML = filteredWarehouses.map(
        function (warehouse) {
            const percentage = getUtilization(warehouse);

            const progressClass = getUtilizationClass(percentage);

            return `
                <tr>
                    <td>
                        <div class="warehouse-identity">
                            <div class="warehouse-avatar" aria-hidden="true">⌂</div>
                            <div>
                                <strong>${escapeHTML(warehouse.name)}</strong>
                                <small>${escapeHTML(warehouse.code)}</small>
                            </div>
                        </div>
                    </td>

                    <td>
                        <div class="location-cell">
                            <strong>${escapeHTML(warehouse.city)}</strong>
                            <small>${escapeHTML(warehouse.state)}</small>
                        </div>
                    </td>

                    <td>
                        <span class="type-label">
                            ${escapeHTML(warehouse.type)}
                        </span>
                    </td>

                    <td>
                        <div class="capacity-cell">
                            <strong>${formatNumber(warehouse.capacity)} units</strong>
                            <small>
                                ${formatNumber(getAvailableCapacity(warehouse))}
                                units free
                            </small>
                        </div>
                    </td>

                    <td>
                        <div class="utilization">
                            <div class="utilization-top">
                                <strong>${percentage}%</strong>
                                <span>
                                    ${formatNumber(warehouse.occupied)}
                                    occupied
                                </span>
                            </div>
                            <div class="mini-progress">
                                <div
                                    class="mini-progress-fill ${progressClass}"
                                    style="width: ${percentage}%"
                                ></div>
                            </div>
                        </div>
                    </td>

                    <td>
                        <span class="status-badge ${getStatusClass(warehouse.status)}">
                            ${escapeHTML(warehouse.status)}
                        </span>
                    </td>

                    <td>
                        <div class="action-group">
                            <button
                                type="button"
                                class="action-btn"
                                data-action="view"
                                data-id="${escapeHTML(warehouse.id)}"
                            >View</button>

                            <button
                                type="button"
                                class="action-btn"
                                data-action="edit"
                                data-id="${escapeHTML(warehouse.id)}"
                            >Edit</button>

                            <button
                                type="button"
                                class="action-btn danger"
                                data-action="delete"
                                data-id="${escapeHTML(warehouse.id)}"
                            >Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    ).join("");
}


/* =========================================
   REFRESH THE PAGE DATA
========================================= */

function renderPage() {
    renderStatistics();
    renderWarehouses();
}


/* =========================================
   ADD / EDIT MODAL
========================================= */

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

function clearFormError() {
    formError.textContent = "";
    formError.hidden = true;
}

function openWarehouseModal(warehouse = null) {
    warehouseForm.reset();
    clearFormError();

    selectedWarehouseId = warehouse ? warehouse.id : null;

    document.getElementById("warehouse-modal-title").textContent =
        warehouse ? "Edit Warehouse" : "Add Warehouse";

    document.getElementById("save-warehouse").textContent =
        warehouse ? "Update Warehouse" : "Save Warehouse";

    document.getElementById("warehouse-id").value =
        warehouse ? warehouse.id : "";

    document.getElementById("warehouse-name").value =
        warehouse ? warehouse.name : "";

    document.getElementById("warehouse-code").value =
        warehouse ? warehouse.code : "";

    document.getElementById("warehouse-type").value =
        warehouse ? warehouse.type : "";

    document.getElementById("warehouse-city").value =
        warehouse ? warehouse.city : "";

    document.getElementById("warehouse-state").value =
        warehouse ? warehouse.state : "";

    document.getElementById("warehouse-address").value =
        warehouse ? warehouse.address : "";

    document.getElementById("warehouse-capacity").value =
        warehouse ? warehouse.capacity : "";

    document.getElementById("warehouse-occupied").value =
        warehouse ? warehouse.occupied : 0;

    document.getElementById("warehouse-manager").value =
        warehouse ? warehouse.manager : "";

    document.getElementById("warehouse-status").value =
        warehouse ? warehouse.status : "Active";

    occupiedCapacityInput.max =
        totalCapacityInput.value || "1000000000";

    warehouseModal.hidden = false;

    document.body.style.overflow = "hidden";

    document.getElementById("warehouse-name").focus();
}

function closeWarehouseModal() {
    warehouseModal.hidden = true;
    restoreBodyScroll();
    clearFormError();
}

function openDetailsModal(warehouse) {
    if (!warehouse) {
        return;
    }

    document.getElementById("warehouse-details-title").textContent =
        warehouse.name;

    document.getElementById("warehouse-details-code").textContent =
        warehouse.code;

    const percentage = getUtilization(warehouse);

    const details = [
        {
            label: "Warehouse Type",
            value: warehouse.type
        },
        {
            label: "Current Status",
            value: warehouse.status
        },
        {
            label: "City",
            value: warehouse.city
        },
        {
            label: "State / Region",
            value: warehouse.state
        },
        {
            label: "Total Capacity",
            value: `${formatNumber(warehouse.capacity)} units`
        },
        {
            label: "Occupied Capacity",
            value: `${formatNumber(warehouse.occupied)} units`
        },
        {
            label: "Available Capacity",
            value: `${formatNumber(getAvailableCapacity(warehouse))} units`
        },
        {
            label: "Utilization",
            value: `${percentage}%`
        },
        {
            label: "Warehouse Manager",
            value: warehouse.manager || "Not assigned"
        },
        {
            label: "Last Updated",
            value: warehouse.updatedAt
                ? new Date(warehouse.updatedAt).toLocaleString("en-IN")
                : "Not available"
        },
        {
            label: "Full Address",
            value: warehouse.address,
            fullWidth: true
        }
    ];

    document.getElementById("warehouse-details-content").innerHTML =
        details.map(function (detail) {
            return `
                <div class="detail-item ${detail.fullWidth ? "full-width" : ""}">
                    <span class="detail-label">
                        ${escapeHTML(detail.label)}
                    </span>
                    <span class="detail-value">
                        ${escapeHTML(detail.value)}
                    </span>
                </div>
            `;
        }).join("");

    selectedWarehouseId = warehouse.id;

    warehouseDetailsModal.hidden = false;

    document.body.style.overflow = "hidden";
}

function closeDetailsModal() {
    warehouseDetailsModal.hidden = true;
    restoreBodyScroll();
}

function restoreBodyScroll() {
    if (
        warehouseModal.hidden &&
        warehouseDetailsModal.hidden
    ) {
        document.body.style.overflow = "";
    }
}


/* =========================================
   FORM VALIDATION AND SAVE
========================================= */

function getFormValues() {
    return {
        name: document.getElementById("warehouse-name").value.trim(),
        code: document.getElementById("warehouse-code").value
            .trim()
            .toUpperCase(),
        type: document.getElementById("warehouse-type").value,
        city: document.getElementById("warehouse-city").value.trim(),
        state: document.getElementById("warehouse-state").value.trim(),
        address: document.getElementById("warehouse-address").value.trim(),
        capacity: Number(totalCapacityInput.value),
        occupied: Number(occupiedCapacityInput.value),
        manager: document.getElementById("warehouse-manager").value.trim(),
        status: document.getElementById("warehouse-status").value
    };
}

function validateWarehouse(data) {
    if (
        !data.name ||
        !data.code ||
        !data.city ||
        !data.state ||
        !data.address
    ) {
        return "Please complete all required fields.";
    }

    if (!VALID_TYPES.includes(data.type)) {
        return "Please select a valid warehouse type.";
    }

    if (!VALID_STATUSES.includes(data.status)) {
        return "Please select a valid warehouse status.";
    }

    if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(data.code)) {
        return (
            "Warehouse code must contain 2–30 letters, numbers, " +
            "hyphens or underscores. It must start with a letter or number."
        );
    }

    if (
        !Number.isSafeInteger(data.capacity) ||
        data.capacity < 1 ||
        data.capacity > 1000000000
    ) {
        return "Total capacity must be a whole number greater than zero.";
    }

    if (
        !Number.isSafeInteger(data.occupied) ||
        data.occupied < 0 ||
        data.occupied > 1000000000
    ) {
        return "Occupied capacity must be a valid non-negative whole number.";
    }

    if (data.occupied > data.capacity) {
        return "Occupied capacity cannot exceed total capacity.";
    }

    const duplicateCode = warehouses.some(function (warehouse) {
        return (
            warehouse.code.toLowerCase() === data.code.toLowerCase() &&
            warehouse.id !== selectedWarehouseId
        );
    });

    if (duplicateCode) {
        return "This warehouse code already exists. Please use a unique code.";
    }

    return "";
}

function handleWarehouseSubmit(event) {
    event.preventDefault();

    clearFormError();

    const data = getFormValues();

    const validationError = validateWarehouse(data);

    if (validationError) {
        showFormError(validationError);
        return;
    }

    const currentTime = new Date().toISOString();

    if (selectedWarehouseId) {
        const existingWarehouse = warehouses.find(function (warehouse) {
            return warehouse.id === selectedWarehouseId;
        });

        if (!existingWarehouse) {
            showFormError(
                "This warehouse could not be found. Refresh the page and try again."
            );
            return;
        }

        const updatedWarehouse = {
            ...existingWarehouse,
            ...data,
            updatedAt: currentTime
        };

        const nextWarehouses = warehouses.map(function (warehouse) {
            return warehouse.id === selectedWarehouseId
                ? updatedWarehouse
                : warehouse;
        });

        if (saveWarehouses(nextWarehouses)) {
            closeWarehouseModal();
            renderPage();
        }
    } else {
        const newWarehouse = {
            id: generateId(),
            ...data,
            createdAt: currentTime,
            updatedAt: currentTime
        };

        const nextWarehouses = [...warehouses, newWarehouse];

        if (saveWarehouses(nextWarehouses)) {
            closeWarehouseModal();
            renderPage();
        }
    }
}


/* =========================================
   VIEW / EDIT / DELETE ACTIONS
========================================= */

function findWarehouse(id) {
    return warehouses.find(function (warehouse) {
        return warehouse.id === id;
    });
}

function deleteWarehouse(id) {
    const warehouse = findWarehouse(id);

    if (!warehouse) {
        alert("Warehouse not found.");
        return;
    }

    const confirmed = confirm(
        `Delete "${warehouse.name}" (${warehouse.code})?\n\n` +
        "This removes the warehouse from this browser's LogiFlow demo data. " +
        "This action cannot be undone from this page."
    );

    if (!confirmed) {
        return;
    }

    const nextWarehouses = warehouses.filter(function (item) {
        return item.id !== id;
    });

    if (saveWarehouses(nextWarehouses)) {
        if (selectedWarehouseId === id) {
            closeDetailsModal();
        }

        renderPage();
    }
}

function handleTableAction(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;

    const id = button.dataset.id;

    const warehouse = findWarehouse(id);

    if (!warehouse) {
        alert("Warehouse not found. Refresh the page and try again.");
        return;
    }

    if (action === "view") {
        openDetailsModal(warehouse);
    }

    if (action === "edit") {
        openWarehouseModal(warehouse);
    }

    if (action === "delete") {
        deleteWarehouse(id);
    }
}


/* =========================================
   EVENT LISTENERS
========================================= */

// Open the add form.
document.getElementById("open-warehouse-modal")
    .addEventListener("click", function () {
        openWarehouseModal();
    });

// Close the add / edit form.
document.getElementById("close-warehouse-modal")
    .addEventListener("click", closeWarehouseModal);

document.getElementById("cancel-warehouse")
    .addEventListener("click", closeWarehouseModal);

// Save a new or edited warehouse.
warehouseForm.addEventListener(
    "submit",
    handleWarehouseSubmit
);

// Update filters immediately.
warehouseSearch.addEventListener("input", renderWarehouses);

statusFilter.addEventListener("change", renderWarehouses);

typeFilter.addEventListener("change", renderWarehouses);

// Keep the occupied-capacity input's HTML limit aligned with total capacity.
totalCapacityInput.addEventListener("input", function () {
    occupiedCapacityInput.max =
        totalCapacityInput.value || "1000000000";
});

// Warehouse actions use event delegation.
warehouseTableBody.addEventListener(
    "click",
    handleTableAction
);

// Details modal buttons.
document.getElementById("close-details-modal")
    .addEventListener("click", closeDetailsModal);

document.getElementById("close-details-button")
    .addEventListener("click", closeDetailsModal);

document.getElementById("edit-from-details")
    .addEventListener("click", function () {
        const warehouse = findWarehouse(selectedWarehouseId);

        if (!warehouse) {
            closeDetailsModal();
            return;
        }

        closeDetailsModal();

        openWarehouseModal(warehouse);
    });

// Close a modal when clicking its backdrop.
warehouseModal.addEventListener("click", function (event) {
    if (event.target === warehouseModal) {
        closeWarehouseModal();
    }
});

warehouseDetailsModal.addEventListener("click", function (event) {
    if (event.target === warehouseDetailsModal) {
        closeDetailsModal();
    }
});

// Escape closes whichever modal is open.
document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
        return;
    }

    if (!warehouseModal.hidden) {
        closeWarehouseModal();
    } else if (!warehouseDetailsModal.hidden) {
        closeDetailsModal();
    }
});


/* =========================================
   INITIALIZE WAREHOUSE PAGE
========================================= */

warehouses = loadWarehouses();

renderPage();

console.log(
    `LogiFlow Warehouses initialized: ${warehouses.length} record(s).`
);