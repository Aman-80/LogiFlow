const addProductButton = document.querySelector("#open-product-modal");
const modal = document.querySelector("#product-modal");
const closeModalButton = document.querySelector("#close-product-modal");
const cancelButton = document.querySelector("#cancel-product");

const productForm = document.querySelector("#product-form");

const productNameInput = document.querySelector("#product-name");
const productCategoryInput = document.querySelector("#product-category");
const productSkuInput = document.querySelector("#product-sku");
const productStockInput = document.querySelector("#product-stock");
const productWarehouseInput = document.querySelector("#product-warehouse");

const inventoryTable = document.querySelector("#inventory-table-body");

const searchInput = document.querySelector("#search-product");
const warehouseFilter = document.querySelector("#warehouse-filter");
const statusFilter = document.querySelector("#status-filter");

const totalProductsElement = document.querySelector("#total-products");
const totalStockElement = document.querySelector("#total-stock");
const lowStockElement = document.querySelector("#low-stock");
const totalWarehousesElement = document.querySelector("#total-warehouses");


/* ================================
   INITIAL PRODUCTS
================================ */

let products = [
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
        name: "Monitor 24\"",
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


/* ================================
   PRODUCT STATUS
================================ */

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


/* ================================
   RENDER PRODUCTS
================================ */

function renderProducts() {

    const searchValue =
        searchInput.value.trim().toLowerCase();

    const selectedWarehouse =
        warehouseFilter.value;

    const selectedStatus =
        statusFilter.value;


    const filteredProducts = products.filter(product => {

        const matchesSearch =
            product.name.toLowerCase().includes(searchValue) ||
            product.sku.toLowerCase().includes(searchValue) ||
            product.category.toLowerCase().includes(searchValue);


        const matchesWarehouse =
            selectedWarehouse === "All Warehouses" ||
            product.warehouse === selectedWarehouse;


        const productStatus =
            getStatus(product.stock);


        const matchesStatus =
            selectedStatus === "All Status" ||
            productStatus === selectedStatus;


        return (
            matchesSearch &&
            matchesWarehouse &&
            matchesStatus
        );
    });


    inventoryTable.innerHTML = "";


    filteredProducts.forEach(product => {

        const status = getStatus(product.stock);

        const row = document.createElement("tr");


        row.innerHTML = `
            <td>

                <div class="product-info">

                    <strong>
                        ${product.name}
                    </strong>

                    <span>
                        ${product.category}
                    </span>

                </div>

            </td>


            <td>
                ${product.sku}
            </td>


            <td>
                ${product.stock}
            </td>


            <td>
                ${product.warehouse}
            </td>


            <td>

                <span class="status ${getStatusClass(status)}">
                    ${status}
                </span>

            </td>


            <td>

                <button
                    class="action-btn"
                    data-sku="${product.sku}"
                >
                    View
                </button>

            </td>
        `;


        inventoryTable.appendChild(row);
    });


    updateStatistics();
}


/* ================================
   UPDATE STATISTICS
================================ */

function updateStatistics() {

    const totalProducts = products.length;


    const totalStock = products.reduce(
        (total, product) => {
            return total + product.stock;
        },
        0
    );


    const lowStock = products.filter(
        product => product.stock > 0 && product.stock <= 100
    ).length;


    const warehouses = new Set(
        products.map(product => product.warehouse)
    );


    totalProductsElement.textContent =
        totalProducts.toLocaleString();


    totalStockElement.textContent =
        totalStock.toLocaleString();


    lowStockElement.textContent =
        lowStock.toLocaleString();


    totalWarehousesElement.textContent =
        warehouses.size.toLocaleString();
}


/* ================================
   OPEN MODAL
================================ */

function openModal() {

    modal.style.display = "flex";

    document.body.style.overflow = "hidden";

    productNameInput.focus();
}


/* ================================
   CLOSE MODAL
================================ */

function closeModal() {

    modal.style.display = "none";

    document.body.style.overflow = "";

    productForm.reset();
}


/* ================================
   ADD PRODUCT
================================ */

function addProduct(event) {

    event.preventDefault();


    const name =
        productNameInput.value.trim();


    const category =
        productCategoryInput.value;


    const sku =
        productSkuInput.value.trim().toUpperCase();


    const stock =
        Number(productStockInput.value);


    const warehouse =
        productWarehouseInput.value;


    /* VALIDATION */

    if (!name || !category || !sku || !warehouse) {

        alert("Please fill in all required fields.");

        return;
    }


    if (
        productStockInput.value === "" ||
        stock < 0 ||
        !Number.isInteger(stock)
    ) {

        alert("Please enter a valid stock quantity.");

        return;
    }


    /* CHECK DUPLICATE SKU */

    const skuExists = products.some(
        product =>
            product.sku.toLowerCase() === sku.toLowerCase()
    );


    if (skuExists) {

        alert(
            "This SKU already exists. Please use a unique SKU."
        );

        return;
    }


    /* CREATE PRODUCT */

    const newProduct = {

        name: name,

        category: category,

        sku: sku,

        stock: stock,

        warehouse: warehouse
    };


    products.push(newProduct);


    /* UPDATE TABLE */

    renderProducts();


    /* CLOSE FORM */

    closeModal();


    alert("Product added successfully.");
}


/* ================================
   VIEW PRODUCT
================================ */

function viewProduct(sku) {

    const product = products.find(
        item => item.sku === sku
    );


    if (!product) {
        return;
    }


    const status =
        getStatus(product.stock);


    alert(
        "Product: " + product.name +
        "\n\n" +

        "Category: " + product.category +
        "\n" +

        "SKU: " + product.sku +
        "\n" +

        "Stock: " + product.stock +
        "\n" +

        "Warehouse: " + product.warehouse +
        "\n" +

        "Status: " + status
    );
}


/* ================================
   EVENT LISTENERS
================================ */

addProductButton.addEventListener(
    "click",
    openModal
);


closeModalButton.addEventListener(
    "click",
    closeModal
);


cancelButton.addEventListener(
    "click",
    closeModal
);


productForm.addEventListener(
    "submit",
    addProduct
);


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


/* ================================
   TABLE ACTION
================================ */

inventoryTable.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(".action-btn");


        if (!button) {
            return;
        }


        const sku =
            button.dataset.sku;


        viewProduct(sku);
    }
);


/* ================================
   CLOSE MODAL
   WHEN CLICKING OUTSIDE
================================ */

modal.addEventListener(
    "click",
    event => {

        if (event.target === modal) {
            closeModal();
        }
    }
);


/* ================================
   ESC KEY
================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            modal.style.display === "flex"
        ) {

            closeModal();
        }
    }
);


/* 
   INITIAL LOAD
 */

renderProducts();