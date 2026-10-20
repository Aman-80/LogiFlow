
/* =========================================
   LOGIFLOW INVENTORY
   Product management, stock adjustments,
   SKU correction and stock history
========================================= */

const STORAGE_KEY = "logiflow.inventory.v1";
const API_BASE_URL = "http://localhost:8000";

async function fetchProductsFromApi() {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch products: HTTP ${response.status}`
        );
    }

    const apiProducts = await response.json();

    return apiProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        sku: product.sku,
        stock: product.quantity,
        warehouse: product.warehouse,
        unitPrice: Number(product.unit_price)
    }));
}

async function createProductInApi(product) {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sku: product.sku,
            name: product.name,
            category: product.category,
            warehouse: product.warehouse,
            quantity: product.stock,
            unit_price: product.unitPrice
        })
    });

    const result = await response.json();

    if (!response.ok) {
        const message =
            typeof result.detail === "string"
                ? result.detail
                : `API request failed: HTTP ${response.status}`;

        throw new Error(message);
    }

    return result;
}


async function updateProductInApi(productId, product) {
    const response = await fetch(
        `${API_BASE_URL}/products/${productId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sku: product.sku,
                name: product.name,
                category: product.category,
                warehouse: product.warehouse,
                quantity: product.stock,
                unit_price: product.unitPrice
            })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        const message =
            typeof result.detail === "string"
                ? result.detail
                : `API request failed: HTTP ${response.status}`;

        throw new Error(message);
    }

    return result;
}

/* =========================================
   ELEMENTS
========================================= */

const addProductButton = document.querySelector("#open-product-modal");

const productModal = document.querySelector("#product-modal");
const closeProductButton = document.querySelector("#close-product-modal");
const cancelProductButton = document.querySelector("#cancel-product");
const productForm = document.querySelector("#product-form");

const productNameInput = document.querySelector("#product-name");
const productCategoryInput = document.querySelector("#product-category");
const productSkuInput = document.querySelector("#product-sku");
const productStockInput = document.querySelector("#product-stock");
const productPriceInput = document.querySelector("#product-price");
const productWarehouseInput = document.querySelector("#product-warehouse");

const productModalTitle = document.querySelector("#product-modal-title");
const productModalDescription =
    productModal.querySelector(".modal-header p");
const productFormNotice = document.querySelector("#product-form-notice");
const saveProductButton =
    productForm.querySelector(".save-product-btn");

const searchInput = document.querySelector("#search-product");
const warehouseFilter = document.querySelector("#warehouse-filter");
const statusFilter = document.querySelector("#status-filter");

const inventoryTable = document.querySelector("#inventory-table-body");
const emptyInventory = document.querySelector("#empty-inventory");

const totalProductsElement = document.querySelector("#total-products");
const totalStockElement = document.querySelector("#total-stock");
const lowStockElement = document.querySelector("#low-stock");
const totalWarehousesElement = document.querySelector("#total-warehouses");


/* STOCK ADJUSTMENT ELEMENTS */

const stockModal = document.querySelector("#stock-adjustment-modal");
const stockForm = document.querySelector("#stock-adjustment-form");
const closeStockButton = document.querySelector("#close-stock-adjustment");
const cancelStockButton = document.querySelector("#cancel-stock-adjustment");

const adjustmentProductName =
    document.querySelector("#adjustment-product-name");
const adjustmentSku = document.querySelector("#adjustment-sku");
const adjustmentCurrentStock =
    document.querySelector("#adjustment-current-stock");
const adjustmentType = document.querySelector("#adjustment-type");
const adjustmentQuantity =
    document.querySelector("#adjustment-quantity");
const adjustmentQuantityLabel =
    document.querySelector("#adjustment-quantity-label");
const adjustmentReason = document.querySelector("#adjustment-reason");
const adjustmentNotes = document.querySelector("#adjustment-notes");


/* SKU CORRECTION ELEMENTS */

const skuModal = document.querySelector("#sku-change-modal");
const skuForm = document.querySelector("#sku-change-form");
const closeSkuButton = document.querySelector("#close-sku-change");
const cancelSkuButton = document.querySelector("#cancel-sku-change");

const skuChangeProductName =
    document.querySelector("#sku-change-product-name");
const skuChangeCurrent = document.querySelector("#sku-change-current");
const skuChangeNew = document.querySelector("#sku-change-new");
const skuChangeReason = document.querySelector("#sku-change-reason");
const skuChangeNotes = document.querySelector("#sku-change-notes");


/* STOCK HISTORY ELEMENTS */

const historyModal = document.querySelector("#stock-history-modal");
const closeHistoryButton = document.querySelector("#close-stock-history");
const closeHistoryBottomButton =
    document.querySelector("#close-stock-history-bottom");
const historyProductTitle =
    document.querySelector("#stock-history-product-title");
const historyTable = document.querySelector("#stock-history-table-body");
const emptyHistory = document.querySelector("#empty-stock-history");


/* =========================================
   SAMPLE PRODUCTS
========================================= */

const sampleProducts = [
    {
        name: "Laptop",
        category: "Electronics",
        sku: "LF-LAP-001",
        stock: 245,
        warehouse: "Delhi Warehouse"
    },
    {
        name: "Wireless Mouse",
        category: "Accessories",
        sku: "LF-MOU-002",
        stock: 86,
        warehouse: "Chandigarh Warehouse"
    },
    {
        name: "Mechanical Keyboard",
        category: "Accessories",
        sku: "LF-KEY-003",
        stock: 132,
        warehouse: "Delhi Warehouse"
    },
    {
        name: "Office Chair",
        category: "Furniture",
        sku: "LF-CHR-004",
        stock: 18,
        warehouse: "Mumbai Warehouse"
    },
    {
        name: "Monitor 24 inch",
        category: "Electronics",
        sku: "LF-MON-005",
        stock: 0,
        warehouse: "Chandigarh Warehouse"
    },
    {
        name: "Barcode Scanner",
        category: "Warehouse Equipment",
        sku: "LF-SCN-006",
        stock: 54,
        warehouse: "Delhi Warehouse"
    }
];


/* =========================================
   STATE
========================================= */

let products = [];
let stockHistory = [];
let editingSku = null;
let adjustingSku = null;
let changingSku = null;
let viewingHistorySku = null;


/* =========================================
   LOAD SAVED DATA
========================================= */

function loadInventoryState() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            return {
                products: structuredClone(sampleProducts),
                stockHistory: []
            };
        }

        const parsed = JSON.parse(savedData);

        /*
           Migration support:
           The previous version stored only an array
           of products under this same storage key.
        */
        const savedProducts = Array.isArray(parsed)
            ? parsed
            : parsed.products;

        const savedHistory = Array.isArray(parsed)
            ? []
            : parsed.stockHistory;

        if (!Array.isArray(savedProducts)) {
            throw new Error("Saved product data is invalid.");
        }

        const productsAreValid = savedProducts.every(product =>
            product &&
            typeof product.name === "string" &&
            typeof product.category === "string" &&
            typeof product.sku === "string" &&
            Number.isInteger(product.stock) &&
            product.stock >= 0 &&
            typeof product.warehouse === "string"
        );

        if (!productsAreValid) {
            throw new Error("One or more saved products are invalid.");
        }

        if (
            savedProducts.some((product, index) =>
                savedProducts.some((other, otherIndex) =>
                    index !== otherIndex &&
                    other.sku.toLowerCase() === product.sku.toLowerCase()
                )
            )
        ) {
            throw new Error("Duplicate SKUs were found in saved inventory.");
        }

        return {
            products: savedProducts,
            stockHistory: Array.isArray(savedHistory) ? savedHistory : []
        };

    } catch (error) {
        console.error("Unable to load inventory:", error);

        alert(
            "Saved inventory data could not be read. " +
            "The existing storage has not been overwritten. " +
            "Check the browser console before continuing."
        );

        /*
           Do not overwrite unreadable saved data automatically.
           The page can still display sample data for diagnosis.
        */
        return {
            products: structuredClone(sampleProducts),
            stockHistory: []
        };
    }
}


const savedState = loadInventoryState();

products = savedState.products;
stockHistory = savedState.stockHistory;


/* =========================================
   SAVE ALL INVENTORY STATE TOGETHER
========================================= */

function persistInventoryState() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 2,
                products,
                stockHistory
            })
        );

        return true;

    } catch (error) {
        console.error("Unable to save inventory:", error);

        alert(
            "Inventory could not be saved in browser storage. " +
            "Your latest change has not been confirmed as saved."
        );

        return false;
    }
}


/* =========================================
   HELPERS
========================================= */

function getStatus(stock) {
    if (stock === 0) {
        return "Out of Stock";
    }

    if (stock <= 100) {
        return "Low Stock";
    }

    return "In Stock";
}


function getStatusClass(status) {
    if (status === "In Stock") {
        return "in-stock";
    }

    if (status === "Low Stock") {
        return "low-stock";
    }

    return "out-stock";
}


function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = String(value);

    if (className) {
        cell.className = className;
    }

    return cell;
}


function createActionButton(label, action, sku, disabled = false) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "action-btn";
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.sku = sku;
    button.disabled = disabled;

    return button;
}


function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString();
}


function getProductBySku(sku) {
    return products.find(product => product.sku === sku);
}


/* =========================================
   RENDER INVENTORY
========================================= */

function renderProducts() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const selectedWarehouse = warehouseFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredProducts = products.filter(product => {
        const matchesSearch = [
            product.name,
            product.sku,
            product.category,
            product.warehouse
        ].some(value =>
            value.toLowerCase().includes(searchValue)
        );

        const matchesWarehouse =
            selectedWarehouse === "All Warehouses" ||
            product.warehouse === selectedWarehouse;

        const matchesStatus =
            selectedStatus === "All Status" ||
            getStatus(product.stock) === selectedStatus;

        return matchesSearch && matchesWarehouse && matchesStatus;
    });

    inventoryTable.replaceChildren();

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        /* PRODUCT */
        const productCell = document.createElement("td");
        const productInfo = document.createElement("div");
        productInfo.className = "product-info";

        const nameElement = document.createElement("strong");
        nameElement.textContent = product.name;

        const categoryElement = document.createElement("span");
        categoryElement.textContent = product.category;

        productInfo.append(nameElement, categoryElement);
        productCell.appendChild(productInfo);
        row.appendChild(productCell);

        /* SKU, STOCK, WAREHOUSE */
        row.appendChild(createCell(product.sku));
        row.appendChild(createCell(product.stock));
        row.appendChild(
            createCell(
                Number(product.unitPrice ?? 0).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2
                })
            )
        );
        row.appendChild(createCell(product.warehouse));

        /* STATUS */
        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        const status = getStatus(product.stock);

        statusBadge.className = `status ${getStatusClass(status)}`;
        statusBadge.textContent = status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        /* ACTIONS */
        const actionCell = document.createElement("td");
        const actionContainer = document.createElement("div");

        actionContainer.className = "inventory-actions";

        actionContainer.append(
            createActionButton("View", "view", product.sku),
            createActionButton("Edit", "edit", product.sku),
            createActionButton("Adjust Stock", "adjust", product.sku),
            createActionButton("Change SKU", "change-sku", product.sku),
            createActionButton("History", "history", product.sku)
        );

        actionCell.appendChild(actionContainer);
        row.appendChild(actionCell);

        inventoryTable.appendChild(row);
    });

    emptyInventory.hidden = filteredProducts.length !== 0;

    updateStatistics();
}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {
    totalProductsElement.textContent =
        products.length.toLocaleString();

    const totalStock = products.reduce(
        (sum, product) => sum + product.stock,
        0
    );

    totalStockElement.textContent =
        totalStock.toLocaleString();

    const lowStockCount = products.filter(
        product => product.stock > 0 && product.stock <= 100
    ).length;

    lowStockElement.textContent =
        lowStockCount.toLocaleString();

    const warehouses = new Set(
        products.map(product => product.warehouse)
    );

    totalWarehousesElement.textContent =
        warehouses.size.toLocaleString();
}


/* =========================================
   MODAL HELPERS
========================================= */

function openModal(modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}


function closeModal(modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}


function closeAllModals() {
    closeProductModal();
    closeStockAdjustmentModal();
    closeSkuChangeModal();
    closeStockHistoryModal();
}


/* =========================================
   ADD / EDIT PRODUCT FORM
========================================= */

function resetProductForm() {
    editingSku = null;

    productForm.reset();

    productSkuInput.readOnly = false;
    productStockInput.disabled = false;

    productModalTitle.textContent = "Add New Product";
    productModalDescription.textContent =
        "Add a product to your inventory";

    productFormNotice.textContent =
        "New products require a unique SKU. Existing product stock is managed separately.";

    saveProductButton.textContent = "Add Product";
}


function openAddProductModal() {
    resetProductForm();

    openModal(productModal);
    productNameInput.focus();
}


function openEditProductModal(sku) {
    const product = getProductBySku(sku);

    if (!product) {
        alert("Product not found.");
        return;
    }

    resetProductForm();

    editingSku = product.sku;

    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productSkuInput.value = product.sku;
    productWarehouseInput.value = product.warehouse;
    productPriceInput.value = product.unitPrice ?? 0;
    productStockInput.value = product.stock;

    /*
       SKU stays fixed in the normal edit form.
       Stock can only be changed through Adjust Stock.
    */
    productSkuInput.readOnly = true;
    productStockInput.disabled = true;

    productModalTitle.textContent = "Edit Product";
    productModalDescription.textContent =
        "Update product details. SKU correction and stock changes are separate actions.";

    productFormNotice.textContent =
        "SKU cannot be changed here. Use Change SKU for a correction. Use Adjust Stock to change quantities.";

    saveProductButton.textContent = "Save Changes";

    openModal(productModal);
    productNameInput.focus();
}


function closeProductModal() {
    closeModal(productModal);
    resetProductForm();
}


async function saveProduct(event) {
    event.preventDefault();

    const name = productNameInput.value.trim();
    const category = productCategoryInput.value;
    const sku = productSkuInput.value.trim().toUpperCase();
    const warehouse = productWarehouseInput.value;
    const stockText = productStockInput.value;
    const stock = Number(stockText);


        const priceText = productPriceInput.value;
    const unitPrice = Number(priceText);

    if (
        priceText.trim() === "" ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
    ) {
        alert("Please enter a valid unit price of zero or greater.");
        productPriceInput.focus();
        return;
    }

    if (!name || !category || !sku || !warehouse) {
        alert("Please complete all required fields.");
        return;
    }

    /* EDIT EXISTING PRODUCT */
    if (editingSku !== null) {
        const index = products.findIndex(
            product => product.sku === editingSku
        );

        if (index === -1) {
            alert("The product could not be found.");
            return;
        }

        const previousProduct = products[index];

                const updatedProduct = {
            ...previousProduct,
            name,
            category,
            warehouse,
            unitPrice
        };

        const hasChanges =
            updatedProduct.name !== previousProduct.name ||
            updatedProduct.category !== previousProduct.category ||
            updatedProduct.warehouse !== previousProduct.warehouse ||
            Number(updatedProduct.unitPrice) !==
                Number(previousProduct.unitPrice ?? 0);

        if (!hasChanges) {
            alert("No changes detected. Nothing was saved.");
            closeProductModal();
            return;
        }

        const accepted = confirm(
            "Save these product detail changes?\n\n" +
            `Product: ${previousProduct.name}\n` +
            `SKU: ${previousProduct.sku}\n\n` +
            "The SKU and stock quantity will remain unchanged."
        );

        if (!accepted) {
            return;
        }

        try {
            const savedProduct = await updateProductInApi(
                previousProduct.id,
                updatedProduct
            );

            products[index] = {
                id: savedProduct.id,
                sku: savedProduct.sku,
                name: savedProduct.name,
                category: savedProduct.category,
                warehouse: savedProduct.warehouse,
                stock: savedProduct.quantity,
                unitPrice: Number(savedProduct.unit_price)
            };

            closeProductModal();
            renderProducts();

            alert("Product details updated successfully in the database.");

        } catch (error) {
            console.error("Unable to update product:", error);
            alert(`Product details could not be saved: ${error.message}`);
        }

        return;
    }

    /* CREATE NEW PRODUCT */
    if (
        stockText === "" ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        alert("Stock must be a whole number that is zero or greater.");
        productStockInput.focus();
        return;
    }

    const skuExists = products.some(
        product => product.sku.toLowerCase() === sku.toLowerCase()
    );

    if (skuExists) {
        alert("This SKU already exists. Please use a unique SKU.");
        productSkuInput.focus();
        return;
    }

        const newProduct = {
            name,
            category,
            sku,
            stock,
            warehouse,
            unitPrice
        };
    try {
        const savedProduct = await createProductInApi(newProduct);

        products.unshift({
            id: savedProduct.id,
            name: savedProduct.name,
            category: savedProduct.category,
            sku: savedProduct.sku,
            stock: savedProduct.quantity,
            warehouse: savedProduct.warehouse,
            unitPrice: Number(savedProduct.unit_price)
        });

        searchInput.value = "";
        warehouseFilter.value = "All Warehouses";
        statusFilter.value = "All Status";

        closeProductModal();
        renderProducts();

        alert("Product added successfully and saved to the database.");

    } catch (error) {
        console.error("Unable to create product:", error);
        alert(`Product could not be saved: ${error.message}`);
    }
}


/* =========================================
   VIEW PRODUCT
========================================= */

function viewProduct(sku) {
    const product = getProductBySku(sku);

    if (!product) {
        alert("Product not found.");
        return;
    }

    alert(
        `Product: ${product.name}\n\n` +
        `Category: ${product.category}\n` +
        `SKU: ${product.sku}\n` +
        `Current Stock: ${product.stock}\n` +
        `Warehouse: ${product.warehouse}\n` +
        `Status: ${getStatus(product.stock)}`
    );
}


/* =========================================
   STOCK ADJUSTMENT
========================================= */

function openStockAdjustmentModal(sku) {
    const product = getProductBySku(sku);

    if (!product) {
        alert("Product not found.");
        return;
    }

    adjustingSku = product.sku;

    stockForm.reset();

    adjustmentProductName.value = product.name;
    adjustmentSku.value = product.sku;
    adjustmentCurrentStock.value = product.stock;

    adjustmentType.value = "add";
    adjustmentQuantity.min = "1";
    adjustmentQuantityLabel.textContent = "Quantity to Add";

    openModal(stockModal);
    adjustmentQuantity.focus();
}


function closeStockAdjustmentModal() {
    closeModal(stockModal);
    stockForm.reset();
    adjustingSku = null;
}


function updateAdjustmentQuantityLabel() {
    if (adjustmentType.value === "add") {
        adjustmentQuantityLabel.textContent = "Quantity to Add";
        adjustmentQuantity.min = "1";
        adjustmentQuantity.placeholder = "Units to add";

    } else if (adjustmentType.value === "remove") {
        adjustmentQuantityLabel.textContent = "Quantity to Remove";
        adjustmentQuantity.min = "1";
        adjustmentQuantity.placeholder = "Units to remove";

    } else {
        adjustmentQuantityLabel.textContent = "Actual Counted Stock";
        adjustmentQuantity.min = "0";
        adjustmentQuantity.placeholder = "Enter physical count";
    }

    adjustmentQuantity.value = "";
}

async function saveStockAdjustment(event) {
    event.preventDefault();

    const productIndex = products.findIndex(
        product => product.sku === adjustingSku
    );

    if (productIndex === -1) {
        alert("The selected product could not be found.");
        closeStockAdjustmentModal();
        return;
    }

    const product = products[productIndex];
    const quantityText = adjustmentQuantity.value;
    const quantity = Number(quantityText);
    const type = adjustmentType.value;
    const reason = adjustmentReason.value;
    const notes = adjustmentNotes.value.trim();

    if (
        quantityText === "" ||
        !Number.isInteger(quantity) ||
        quantity < (type === "set" ? 0 : 1)
    ) {
        alert(
            type === "set"
                ? "Counted stock must be a whole number of zero or more."
                : "Adjustment quantity must be a positive whole number."
        );

        adjustmentQuantity.focus();
        return;
    }

    if (!reason) {
        alert("Please select a reason for the stock adjustment.");
        adjustmentReason.focus();
        return;
    }

    let newStock;

    if (type === "add") {
        newStock = product.stock + quantity;

    } else if (type === "remove") {
        newStock = product.stock - quantity;

    } else if (type === "set") {
        newStock = quantity;

    } else {
        alert("Invalid adjustment type.");
        return;
    }

    if (newStock < 0) {
        alert(
            `There are only ${product.stock} units available. ` +
            "Stock cannot become negative."
        );
        adjustmentQuantity.focus();
        return;
    }

    if (newStock === product.stock) {
        alert("The adjustment would not change stock. Nothing was saved.");
        return;
    }

    const change = newStock - product.stock;

    const accepted = confirm(
        "Confirm stock adjustment?\n\n" +
        `Product: ${product.name}\n` +
        `Current stock: ${product.stock}\n` +
        `Stock change: ${change > 0 ? "+" : ""}${change}\n` +
        `New stock: ${newStock}\n` +
        `Reason: ${reason}\n\n` +
        "This change will be recorded in stock history."
    );

    if (!accepted) {
        return;
    }

        const previousStock = product.stock;

    const historyRecord = {
        id: `STK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sku: product.sku,
        productName: product.name,
        previousStock,
        change,
        newStock,
        type,
        reason,
        notes,
        timestamp: new Date().toISOString()
    };

    try {
        const savedProduct = await updateProductInApi(
            product.id,
            {
                ...product,
                stock: newStock
            }
        );

        products[productIndex] = {
            id: savedProduct.id,
            sku: savedProduct.sku,
            name: savedProduct.name,
            category: savedProduct.category,
            warehouse: savedProduct.warehouse,
            stock: savedProduct.quantity,
            unitPrice: Number(savedProduct.unit_price)
        };

        stockHistory = [...stockHistory, historyRecord];

        const historySaved = persistInventoryState();

        closeStockAdjustmentModal();
        renderProducts();

        if (historySaved) {
            alert(
                "Stock adjusted successfully.\n\n" +
                `Previous stock: ${previousStock}\n` +
                `New stock: ${savedProduct.quantity}`
            );
        } else {
            alert(
                "Stock was updated in PostgreSQL, but stock history " +
                "could not be saved in browser storage."
            );
        }

    } catch (error) {
        console.error("Unable to adjust stock:", error);

        alert(
            `Stock adjustment could not be saved: ${error.message}`
        );
    }
}


/* =========================================
   SKU CORRECTION
========================================= */

function openSkuChangeModal(sku) {
    const product = getProductBySku(sku);

    if (!product) {
        alert("Product not found.");
        return;
    }

    changingSku = product.sku;

    skuForm.reset();

    skuChangeProductName.value = product.name;
    skuChangeCurrent.value = product.sku;
    skuChangeNew.value = product.sku;

    openModal(skuModal);
    skuChangeNew.focus();
}


function closeSkuChangeModal() {
    closeModal(skuModal);
    skuForm.reset();
    changingSku = null;
}

async function saveSkuChange(event) {
    event.preventDefault();

    const productIndex = products.findIndex(
        product => product.sku === changingSku
    );

    if (productIndex === -1) {
        alert("The selected product could not be found.");
        closeSkuChangeModal();
        return;
    }

    const product = products[productIndex];
    const newSku = skuChangeNew.value.trim().toUpperCase();
    const reason = skuChangeReason.value;
    const notes = skuChangeNotes.value.trim();

    if (!newSku || !reason) {
        alert("Enter a new SKU and select a reason.");
        return;
    }

    if (newSku === product.sku) {
        alert("The new SKU is identical to the current SKU.");
        return;
    }

    const duplicateSku = products.some(
        item => item.sku.toLowerCase() === newSku.toLowerCase()
    );

    if (duplicateSku) {
        alert("This SKU already belongs to another product.");
        skuChangeNew.focus();
        return;
    }

    const accepted = confirm(
        "CONFIRM SKU CORRECTION\n\n" +
        `Product: ${product.name}\n` +
        `Current SKU: ${product.sku}\n` +
        `New SKU: ${newSku}\n` +
        `Reason: ${reason}\n\n` +
        "The product's stock will not change.\n" +
        "This correction will be saved to the database. Stock quantity will not change."
    );

    if (!accepted) {
        return;
    }

        const previousProduct = products[productIndex];

    const historyRecord = {
        id: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sku: newSku,
        previousSku: product.sku,
        productName: product.name,
        previousStock: product.stock,
        change: 0,
        newStock: product.stock,
        type: "sku-correction",
        reason,
        notes: [
            `Previous SKU: ${product.sku}`,
            `New SKU: ${newSku}`,
            notes
        ].filter(Boolean).join(" | "),
        timestamp: new Date().toISOString()
    };

    try {
        const savedProduct = await updateProductInApi(
            previousProduct.id,
            {
                ...previousProduct,
                sku: newSku
            }
        );

        products[productIndex] = {
            id: savedProduct.id,
            sku: savedProduct.sku,
            name: savedProduct.name,
            category: savedProduct.category,
            warehouse: savedProduct.warehouse,
            stock: savedProduct.quantity,
            unitPrice: Number(savedProduct.unit_price)
        };

        stockHistory = [...stockHistory, historyRecord];
        const historySaved = persistInventoryState();

        closeSkuChangeModal();
        renderProducts();

        if (historySaved) {
            alert(
                "SKU corrected successfully in the database.\n\n" +
                `Previous SKU: ${product.sku}\n` +
                `New SKU: ${savedProduct.sku}`
            );
        } else {
            alert(
                "SKU was updated in PostgreSQL, but the local " +
                "stock history could not be saved."
            );
        }

    } catch (error) {
        console.error("Unable to update SKU:", error);
        alert(`SKU correction failed: ${error.message}`);
    }
}


/* =========================================
   STOCK HISTORY
========================================= */

function openStockHistoryModal(sku) {
    const product = getProductBySku(sku);

    if (!product) {
        alert("Product not found.");
        return;
    }

    viewingHistorySku = sku;
    historyProductTitle.textContent =
        `${product.name} · ${product.sku}`;

    renderStockHistory(sku);

    openModal(historyModal);
}


function renderStockHistory(sku) {
    const records = stockHistory
        .filter(record =>
            record.sku === sku ||
            record.previousSku === sku
        )
        .sort((a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );

    historyTable.replaceChildren();

    records.forEach(record => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(formatTimestamp(record.timestamp))
        );

        const skuText = record.previousSku
            ? `${record.previousSku} → ${record.sku}`
            : record.sku;

        row.appendChild(createCell(skuText));

        const changeText = record.type === "sku-correction"
            ? "SKU correction"
            : `${record.change > 0 ? "+" : ""}${record.change}`;

        row.appendChild(createCell(changeText));

        row.appendChild(createCell(record.previousStock));

        row.appendChild(createCell(record.newStock));

        const reasonCell = document.createElement("td");
        reasonCell.textContent = [
            record.reason || "No reason",
            record.notes || ""
        ].filter(Boolean).join(" — ");

        row.appendChild(reasonCell);

        historyTable.appendChild(row);
    });

    emptyHistory.hidden = records.length !== 0;
}


function closeStockHistoryModal() {
    closeModal(historyModal);
    viewingHistorySku = null;
}


/* =========================================
   EVENT LISTENERS
========================================= */

/* Product form */
addProductButton.addEventListener(
    "click",
    openAddProductModal
);

closeProductButton.addEventListener(
    "click",
    closeProductModal
);

cancelProductButton.addEventListener(
    "click",
    closeProductModal
);

productForm.addEventListener(
    "submit",
    saveProduct
);


/* Stock adjustment form */
adjustmentType.addEventListener(
    "change",
    updateAdjustmentQuantityLabel
);

closeStockButton.addEventListener(
    "click",
    closeStockAdjustmentModal
);

cancelStockButton.addEventListener(
    "click",
    closeStockAdjustmentModal
);

stockForm.addEventListener(
    "submit",
    saveStockAdjustment
);


/* SKU correction form */
closeSkuButton.addEventListener(
    "click",
    closeSkuChangeModal
);

cancelSkuButton.addEventListener(
    "click",
    closeSkuChangeModal
);

skuForm.addEventListener(
    "submit",
    saveSkuChange
);


/* Stock history modal */
closeHistoryButton.addEventListener(
    "click",
    closeStockHistoryModal
);

closeHistoryBottomButton.addEventListener(
    "click",
    closeStockHistoryModal
);


/* Search and filters */
searchInput.addEventListener(
    "input",
    renderProducts
);

warehouseFilter.addEventListener(
    "change",
    renderProducts
);

statusFilter.addEventListener(
    "change",
    renderProducts
);


/* Table actions */
inventoryTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const sku = button.dataset.sku;
    const action = button.dataset.action;

    if (action === "view") {
        viewProduct(sku);

    } else if (action === "edit") {
        openEditProductModal(sku);

    } else if (action === "adjust") {
        openStockAdjustmentModal(sku);

    } else if (action === "change-sku") {
        openSkuChangeModal(sku);

    } else if (action === "history") {
        openStockHistoryModal(sku);
    }
});


/* Click outside any modal to close it */
[
    productModal,
    stockModal,
    skuModal,
    historyModal
].forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeAllModals();
        }
    });
});


/* Escape closes active modals */
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAllModals();
    }
});


/* =========================================
   INITIALIZE
========================================= */

async function initializeInventory() {
    try {
        products = await fetchProductsFromApi();

        console.info(
            `Loaded ${products.length} products from LogiFlow API.`
        );
    } catch (error) {
        console.error("Unable to load products from API:", error);

        alert(
            "Could not load inventory from the LogiFlow API. " +
            "Showing saved browser inventory for now. " +
            "Please check that the API is running."
        );
    }

    renderProducts();
}

initializeInventory();
