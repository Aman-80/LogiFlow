
/* =========================================
   LOGIFLOW SHIPMENTS
   Maximum two successful edits per shipment
========================================= */

const STORAGE_KEY = "logiflow.shipments.v1";
const MAX_EDITS = 2;


/* =========================================
   ELEMENTS
========================================= */

const openShipmentButton = document.querySelector("#open-shipment-modal");
const shipmentModal = document.querySelector("#shipment-modal");
const closeShipmentButton = document.querySelector("#close-shipment-modal");
const cancelShipmentButton = document.querySelector("#cancel-shipment");
const shipmentForm = document.querySelector("#shipment-form");

const modalTitle = document.querySelector("#shipment-modal-title");
const modalDescription = document.querySelector(".modal-header p");
const saveShipmentButton = document.querySelector(".save-shipment-btn");

const orderIdInput = document.querySelector("#shipment-order-id");
const carrierInput = document.querySelector("#shipment-carrier");
const trackingInput = document.querySelector("#tracking-number");
const statusInput = document.querySelector("#shipment-status");
const originInput = document.querySelector("#shipment-origin");
const destinationInput = document.querySelector("#shipment-destination");
const dispatchDateInput = document.querySelector("#dispatch-date");
const estimatedDeliveryInput = document.querySelector("#estimated-delivery");

const searchInput = document.querySelector("#search-shipment");
const statusFilter = document.querySelector("#status-filter");

const shipmentsTable = document.querySelector("#shipments-table-body");
const emptyState = document.querySelector("#empty-shipments");

const totalShipmentsElement = document.querySelector("#total-shipments");
const inTransitElement = document.querySelector("#in-transit-count");
const outForDeliveryElement = document.querySelector("#out-for-delivery-count");
const delayedElement = document.querySelector("#delayed-count");


/* =========================================
   INITIAL SAMPLE DATA
========================================= */

const sampleShipments = [
    {
        id: "LF-SHP-2001",
        orderId: "LF-ORD-1001",
        carrier: "Blue Dart",
        trackingNumber: "BD83920145",
        origin: "Delhi Warehouse",
        destination: "Mumbai",
        dispatchDate: "2026-10-06",
        estimatedDelivery: "2026-10-12",
        status: "In Transit",
        editCount: 0
    },
    {
        id: "LF-SHP-2002",
        orderId: "LF-ORD-1002",
        carrier: "Delhivery",
        trackingNumber: "DL52618390",
        origin: "Chandigarh Warehouse",
        destination: "Jaipur",
        dispatchDate: "2026-10-07",
        estimatedDelivery: "2026-10-11",
        status: "In Transit",
        editCount: 0
    },
    {
        id: "LF-SHP-2003",
        orderId: "LF-ORD-1003",
        carrier: "DTDC",
        trackingNumber: "DT71630452",
        origin: "Delhi Warehouse",
        destination: "Gurugram",
        dispatchDate: "2026-10-08",
        estimatedDelivery: "2026-10-10",
        status: "Out for Delivery",
        editCount: 0
    },
    {
        id: "LF-SHP-2004",
        orderId: "LF-ORD-1004",
        carrier: "Blue Dart",
        trackingNumber: "BD60492718",
        origin: "Mumbai Warehouse",
        destination: "Pune",
        dispatchDate: "2026-10-10",
        estimatedDelivery: "2026-10-14",
        status: "Preparing",
        editCount: 0
    },
    {
        id: "LF-SHP-2005",
        orderId: "LF-ORD-1005",
        carrier: "FedEx",
        trackingNumber: "FX29176048",
        origin: "Delhi Warehouse",
        destination: "Lucknow",
        dispatchDate: "2026-10-02",
        estimatedDelivery: "2026-10-06",
        status: "Delivered",
        editCount: 0
    },
    {
        id: "LF-SHP-2006",
        orderId: "LF-ORD-1006",
        carrier: "India Post",
        trackingNumber: "IP40582617",
        origin: "Chandigarh Warehouse",
        destination: "Dehradun",
        dispatchDate: "2026-10-04",
        estimatedDelivery: "2026-10-08",
        status: "Delayed",
        editCount: 0
    }
];


/* =========================================
   STORAGE
========================================= */

function loadShipments() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return structuredClone(sampleShipments);
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            throw new Error("Invalid shipment data.");
        }

        return parsedData.map(shipment => ({
            ...shipment,
            editCount: Math.max(
                0,
                Math.min(MAX_EDITS, Number(shipment.editCount) || 0)
            )
        }));

    } catch (error) {
        console.error("Unable to load shipments:", error);

        alert(
            "Saved shipment data could not be loaded. " +
            "The sample data will be displayed instead."
        );

        return structuredClone(sampleShipments);
    }
}


let shipments = loadShipments();

let editingShipmentId = null;


/*
   Returns false if browser storage is unavailable.
   Do not claim a change was saved if persistence fails.
*/

function persistShipments() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(shipments)
        );

        return true;

    } catch (error) {
        console.error("Unable to save shipments:", error);

        alert(
            "The changes could not be saved in browser storage. " +
            "Please check your browser storage and try again."
        );

        return false;
    }
}


/* =========================================
   HELPERS
========================================= */

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
    if (!dateString) {
        return "Not set";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function getStatusClass(status) {
    return status.toLowerCase().replaceAll(" ", "-");
}


function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;

    if (className) {
        cell.className = className;
    }

    return cell;
}


function getNextShipmentNumber() {
    const highestNumber = shipments.reduce((highest, shipment) => {
        const match = shipment.id.match(/^LF-SHP-(\d+)$/);

        return match
            ? Math.max(highest, Number(match[1]))
            : highest;
    }, 2000);

    return highestNumber + 1;
}


/* =========================================
   RENDER SHIPMENTS
========================================= */

function renderShipments() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredShipments = shipments.filter(shipment => {
        const searchableText = [
            shipment.id,
            shipment.orderId,
            shipment.carrier,
            shipment.trackingNumber,
            shipment.origin,
            shipment.destination
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        const matchesStatus =
            selectedStatus === "All Status" ||
            shipment.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    shipmentsTable.replaceChildren();

    filteredShipments.forEach(shipment => {
        const row = document.createElement("tr");

        row.appendChild(createCell(shipment.id, "shipment-id"));
        row.appendChild(createCell(shipment.orderId));
        row.appendChild(createCell(shipment.carrier));
        row.appendChild(createCell(shipment.trackingNumber));
        row.appendChild(createCell(shipment.destination));
        row.appendChild(createCell(formatDate(shipment.estimatedDelivery)));

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className =
            `status ${getStatusClass(shipment.status)}`;

        statusBadge.textContent = shipment.status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        const actionButtons = document.createElement("div");

        actionButtons.className = "action-buttons";

        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "action-btn";
        viewButton.textContent = "View";
        viewButton.dataset.action = "view";
        viewButton.dataset.shipmentId = shipment.id;

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "action-btn";
        editButton.dataset.action = "edit";
        editButton.dataset.shipmentId = shipment.id;

        if (shipment.editCount >= MAX_EDITS) {
            editButton.textContent = "Locked";
            editButton.disabled = true;
            editButton.title = "This shipment has used both permitted edits.";

        } else if (shipment.editCount === 1) {
            editButton.textContent = "Edit (Final)";
            editButton.title = "One final edit remains.";

        } else {
            editButton.textContent = "Edit";
            editButton.title = "Two edits are available.";
        }

        actionButtons.append(viewButton, editButton);
        actionCell.appendChild(actionButtons);
        row.appendChild(actionCell);

        shipmentsTable.appendChild(row);
    });

    emptyState.hidden = filteredShipments.length !== 0;

    updateShipmentStatistics();
}


/* =========================================
   STATISTICS
========================================= */

function updateShipmentStatistics() {
    totalShipmentsElement.textContent = shipments.length;

    inTransitElement.textContent = shipments.filter(
        shipment => shipment.status === "In Transit"
    ).length;

    outForDeliveryElement.textContent = shipments.filter(
        shipment => shipment.status === "Out for Delivery"
    ).length;

    delayedElement.textContent = shipments.filter(
        shipment => shipment.status === "Delayed"
    ).length;
}


/* =========================================
   FORM MODE
========================================= */

function openNewShipmentForm() {
    editingShipmentId = null;

    shipmentForm.reset();

    modalTitle.textContent = "Create New Shipment";
    modalDescription.textContent =
        "Enter shipment and transportation details";

    saveShipmentButton.textContent = "Create Shipment";

    orderIdInput.disabled = false;

    const today = getLocalDateString(new Date());

    dispatchDateInput.value = today;
    estimatedDeliveryInput.value = getLocalDateString(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    );

    estimatedDeliveryInput.min = today;

    openModal();
}


function openEditShipmentForm(shipment) {
    if (shipment.editCount >= MAX_EDITS) {
        alert(
            "This shipment is permanently locked for editing. " +
            "Both permitted edits have already been used."
        );
        return;
    }

    const nextEditNumber = shipment.editCount + 1;

    if (nextEditNumber === 1) {
        const accepted = confirm(
            "SHIPMENT EDIT NOTICE\n\n" +
            "You are allowed a maximum of 2 successful edits per shipment.\n\n" +
            "This will be edit 1 of 2. One further edit will remain.\n\n" +
            "Shipment ID and Order ID cannot be changed.\n\n" +
            "Do you want to continue?"
        );

        if (!accepted) {
            return;
        }

    } else {
        const accepted = confirm(
            "FINAL SHIPMENT EDIT WARNING\n\n" +
            "This is your FINAL edit: 2 of 2.\n\n" +
            "Once you save a change, the shipment's editable details " +
            "will be permanently locked in this frontend.\n\n" +
            "Shipment ID and Order ID cannot be changed.\n\n" +
            "Continue only if you are sure."
        );

        if (!accepted) {
            return;
        }
    }

    editingShipmentId = shipment.id;

    modalTitle.textContent = "Edit Shipment";
    modalDescription.textContent =
        nextEditNumber === 2
            ? "FINAL EDIT: Saving a change will permanently lock this shipment."
            : "Edit 1 of 2: One further successful edit will remain.";

    saveShipmentButton.textContent =
        nextEditNumber === 2 ? "Save Final Edit" : "Save Changes";

    shipmentForm.reset();

    /*
       Keep Order ID fixed during edits.
       Shipment ID is not a form field.
    */
    orderIdInput.value = shipment.orderId;
    orderIdInput.disabled = true;

    carrierInput.value = shipment.carrier;
    trackingInput.value = shipment.trackingNumber;
    statusInput.value = shipment.status;
    originInput.value = shipment.origin;
    destinationInput.value = shipment.destination;
    dispatchDateInput.value = shipment.dispatchDate;
    estimatedDeliveryInput.value = shipment.estimatedDelivery;

    estimatedDeliveryInput.min = shipment.dispatchDate;

    openModal();
}


function openModal() {
    shipmentModal.classList.add("is-open");
    shipmentModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    if (editingShipmentId) {
        carrierInput.focus();
    } else {
        orderIdInput.focus();
    }
}


/* =========================================
   CLOSE FORM
========================================= */

function closeShipmentModal() {
    shipmentModal.classList.remove("is-open");
    shipmentModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    shipmentForm.reset();

    orderIdInput.disabled = false;
    editingShipmentId = null;
}


/* =========================================
   VALIDATE FORM DATA
========================================= */

function readShipmentForm() {
    const orderId = orderIdInput.value.trim().toUpperCase();
    const carrier = carrierInput.value;
    const trackingNumber = trackingInput.value.trim().toUpperCase();
    const status = statusInput.value;
    const origin = originInput.value.trim();
    const destination = destinationInput.value.trim();
    const dispatchDate = dispatchDateInput.value;
    const estimatedDelivery = estimatedDeliveryInput.value;

    if (
        !orderId ||
        !carrier ||
        !trackingNumber ||
        !origin ||
        !destination ||
        !dispatchDate ||
        !estimatedDelivery
    ) {
        alert("Please complete all required fields.");
        return null;
    }

    if (estimatedDelivery < dispatchDate) {
        alert("Estimated delivery cannot be before the dispatch date.");
        estimatedDeliveryInput.focus();
        return null;
    }

    if (dispatchDate > getLocalDateString(new Date())) {
        alert("Dispatch date cannot be in the future.");
        dispatchDateInput.focus();
        return null;
    }

    const validStatuses = [
        "Preparing",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Delayed"
    ];

    if (!validStatuses.includes(status)) {
        alert("Please select a valid shipment status.");
        return null;
    }

    const duplicateTrackingNumber = shipments.some(shipment =>
        shipment.id !== editingShipmentId &&
        shipment.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
    );

    if (duplicateTrackingNumber) {
        alert("This tracking number already exists. Enter a unique number.");
        trackingInput.focus();
        return null;
    }

    return {
        orderId,
        carrier,
        trackingNumber,
        status,
        origin,
        destination,
        dispatchDate,
        estimatedDelivery
    };
}


/* =========================================
   CREATE OR EDIT SHIPMENT
========================================= */

function saveShipment(event) {
    event.preventDefault();

    const formData = readShipmentForm();

    if (!formData) {
        return;
    }

    /* CREATE MODE */

    if (editingShipmentId === null) {
        const newShipment = {
            id: `LF-SHP-${getNextShipmentNumber()}`,
            ...formData,
            editCount: 0
        };

        shipments.unshift(newShipment);

        if (!persistShipments()) {
            shipments.shift();
            return;
        }

        searchInput.value = "";
        statusFilter.value = "All Status";

        closeShipmentModal();
        renderShipments();

        alert("Shipment created successfully.");
        return;
    }


    /* EDIT MODE */

    const shipmentIndex = shipments.findIndex(
        shipment => shipment.id === editingShipmentId
    );

    if (shipmentIndex === -1) {
        alert("This shipment could not be found.");
        closeShipmentModal();
        return;
    }

    const existingShipment = shipments[shipmentIndex];

    if (existingShipment.editCount >= MAX_EDITS) {
        alert("This shipment has already used both permitted edits.");
        closeShipmentModal();
        renderShipments();
        return;
    }

    /*
       Fixed identifiers always come from the original record.
    */
    const fixedFields = {
        id: existingShipment.id,
        orderId: existingShipment.orderId
    };

    const editableFields = [
        "carrier",
        "trackingNumber",
        "status",
        "origin",
        "destination",
        "dispatchDate",
        "estimatedDelivery"
    ];

    const hasChanges = editableFields.some(
        field => existingShipment[field] !== formData[field]
    );

    if (!hasChanges) {
        alert(
            "No changes were detected. " +
            "Your edit count has not been used."
        );

        closeShipmentModal();
        return;
    }

    /*
       Confirm again before consuming the final edit.
    */
    if (existingShipment.editCount === MAX_EDITS - 1) {
        const finalConfirmation = confirm(
            "FINAL SAVE CONFIRMATION\n\n" +
            "This is your second and final successful edit.\n\n" +
            "Saving these changes will lock this shipment for editing.\n\n" +
            "Are you absolutely sure you want to save?"
        );

        if (!finalConfirmation) {
            return;
        }
    }

    const updatedShipment = {
        ...existingShipment,
        ...formData,
        ...fixedFields,
        editCount: existingShipment.editCount + 1
    };

    shipments[shipmentIndex] = updatedShipment;

    if (!persistShipments()) {
        shipments[shipmentIndex] = existingShipment;
        return;
    }

    const wasFinalEdit = updatedShipment.editCount === MAX_EDITS;

    searchInput.value = "";
    statusFilter.value = "All Status";

    closeShipmentModal();
    renderShipments();

    if (wasFinalEdit) {
        alert(
            "Final edit saved successfully.\n\n" +
            "This shipment is now permanently locked for editing."
        );
    } else {
        alert(
            "Shipment updated successfully.\n\n" +
            "You have used 1 of 2 permitted edits. " +
            "One final edit remains."
        );
    }
}


/* =========================================
   VIEW SHIPMENT
========================================= */

function viewShipment(shipmentId) {
    const shipment = shipments.find(
        item => item.id === shipmentId
    );

    if (!shipment) {
        return;
    }

    const lockedMessage =
        shipment.editCount >= MAX_EDITS
            ? "Editing: LOCKED"
            : `Edits used: ${shipment.editCount} of ${MAX_EDITS}`;

    alert(
        `Shipment ID: ${shipment.id}\n\n` +
        `Order ID: ${shipment.orderId}\n` +
        `Carrier: ${shipment.carrier}\n` +
        `Tracking Number: ${shipment.trackingNumber}\n` +
        `Origin: ${shipment.origin}\n` +
        `Destination: ${shipment.destination}\n` +
        `Dispatch Date: ${formatDate(shipment.dispatchDate)}\n` +
        `Estimated Delivery: ${formatDate(shipment.estimatedDelivery)}\n` +
        `Status: ${shipment.status}\n\n` +
        lockedMessage
    );
}


/* =========================================
   EVENTS
========================================= */

openShipmentButton.addEventListener(
    "click",
    openNewShipmentForm
);

closeShipmentButton.addEventListener(
    "click",
    closeShipmentModal
);

cancelShipmentButton.addEventListener(
    "click",
    closeShipmentModal
);

shipmentForm.addEventListener(
    "submit",
    saveShipment
);

searchInput.addEventListener(
    "input",
    renderShipments
);

statusFilter.addEventListener(
    "change",
    renderShipments
);

shipmentsTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const shipmentId = button.dataset.shipmentId;
    const action = button.dataset.action;

    if (action === "view") {
        viewShipment(shipmentId);
    }

    if (action === "edit") {
        const shipment = shipments.find(
            item => item.id === shipmentId
        );

        if (shipment) {
            openEditShipmentForm(shipment);
        }
    }
});

shipmentModal.addEventListener("click", event => {
    if (event.target === shipmentModal) {
        closeShipmentModal();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        shipmentModal.classList.contains("is-open")
    ) {
        closeShipmentModal();
    }
});

dispatchDateInput.addEventListener("change", () => {
    estimatedDeliveryInput.min = dispatchDateInput.value;

    if (
        estimatedDeliveryInput.value &&
        estimatedDeliveryInput.value < dispatchDateInput.value
    ) {
        estimatedDeliveryInput.value = dispatchDateInput.value;
    }
});


/* =========================================
   INITIALIZE
========================================= */

renderShipments();
