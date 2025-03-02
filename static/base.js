
// Unhide main page
document.querySelector(".stocktake-btn").addEventListener("click", function() {
    const first_page = document.querySelector(".first_page");
    first_page.classList.add("hidden");

    setTimeout(() => {
        first_page.style.display = "none"; 
        document.querySelector(".main_page").style.display = "block"; 
    }, 400);
});

// tabs
const tabs = document.querySelectorAll('[data-tab-target]')
const tabContents = document.querySelectorAll('[data-tab-content')

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget)
        tabContents.forEach(tabContent => tabContent.classList.remove('active') ) 
        tabs.forEach(tab => tab.classList.remove('active') ) 
        tab.classList.add('active')
        target.classList.add('active')
    }) 
})

// total profit
function updateTotalProfit() {
    let total = 0;
    document.querySelectorAll("#table-body tr").forEach(row => {
        const profitCell = row.cells[5]; // Profit column
        if (profitCell) {
            const profitValue = parseFloat(profitCell.innerText.replace("$", "")) || 0;
            total += profitValue;
        }
    });

    // Update the total profit text
    document.getElementById("total-profit").innerText = `Profit: $${total.toFixed(2)}`;
}

// Add product

document.addEventListener("DOMContentLoaded", () => {
    const addProductBtn = document.querySelector(".add-btn");
    const productModal = document.getElementById("product-modal");
    const closeModal = document.querySelector(".close-btn");
    const productForm = document.getElementById("product-form"); 
    const stockContainer = document.getElementById("stock");
    const tableBody = document.getElementById("table-body");
    const successMessage = document.getElementById("success-message");

    let isEditing = false;
    let editingIndex = null;
    let products = JSON.parse(localStorage.getItem("products")) || [];

    //Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem("products", JSON.stringify(products));
    }

    //Load from localStorage
    function loadProducts() {
        tableBody.innerHTML = "";
        stockContainer.innerHTML = "";
        products.forEach((product, index) => addProductToPage(product, index));
    }

    //Prevent "Remaining" from exceeding "Qty"
    document.getElementById("product-remaining").addEventListener("input", function (e) {
        let qty = parseInt(document.getElementById("product-qty").value);
        let remaining = parseInt(e.target.value);

        if (remaining > qty) {
            alert("Remaining stock cannot be greater than total quantity!");
            e.target.value = qty;
        }
    });

    //Open modal when "Add Product" button is clicked
    addProductBtn.addEventListener("click", function (event) {
        event.preventDefault();
        
        isEditing = false; // Reset editing state
        editingIndex = null; // Clear any previous editing index

        // Reset input fields
        document.getElementById("product-name").value = "";
        document.getElementById("product-price").value = "";
        document.getElementById("product-qty").value = "";
        document.getElementById("product-remaining").value = "";

        productModal.style.display = "flex"; // Show modal
    });


    //Add Product to Page
    function addProductToPage(product, index) {
        const { name, price, qty, remaining } = product;
        const sold = qty - remaining;
        const profit = sold * price;

        //Create Product Card
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");
        productCard.innerHTML = `
            <h3>${name}</h3>
            <p>Price: $${price.toFixed(2)}</p>
            <p>Qty: ${qty}</p>
        `;
        stockContainer.appendChild(productCard);

        //Create Table Row
        const tableRow = document.createElement("tr");
        tableRow.innerHTML = `
            <td>${name}</td>
            <td>$${price.toFixed(2)}</td>
            <td>${qty}</td>
            <td>${sold}</td>
            <td>${remaining}</td>
            <td>$${profit.toFixed(2)}</td>
            <td><button class="remove-btn">🗑 Remove</button></td>
        `;
        tableBody.appendChild(tableRow);

        //Edit Product via Modal
        productCard.addEventListener("click", () => {
            isEditing = true;
            editingIndex = index;

            document.getElementById("product-name").value = name;
            document.getElementById("product-price").value = price;
            document.getElementById("product-qty").value = qty;
            document.getElementById("product-remaining").value = remaining;

            productModal.style.display = "flex"; 
        });

        // Make table cells editable (except Remove button)
        tableRow.querySelectorAll("td:not(:last-child)").forEach((cell, colIndex) => {
            cell.addEventListener("click", function () {
                const currentValue = cell.innerText.replace("$", ""); 
                const input = document.createElement("input");
                input.type = "text";
                input.value = currentValue;
                input.style.width = "80px";
                input.style.textAlign = "center";
                cell.innerHTML = "";
                cell.appendChild(input);
                input.focus();

                input.addEventListener("blur", function () {
                    let newValue = input.value.trim();
                    
                    // Validate Input
                    if (colIndex === 1) { // Price column
                        if (!/^\d+(\.\d{1,2})?$/.test(newValue) || parseFloat(newValue) < 0) {
                            alert("Enter a valid price (positive number with up to 2 decimals)");
                            newValue = currentValue;
                        } else {
                            newValue = `$${parseFloat(newValue).toFixed(2)}`;
                        }
                    } else if (colIndex === 2 || colIndex === 4) { // Qty or Remaining column
                        if (!/^\d+$/.test(newValue) || parseInt(newValue) < 0) {
                            alert("Enter a valid whole number (non-negative)");
                            newValue = currentValue;
                        } else if (colIndex === 4) { // Prevent "Remaining" from exceeding "Qty"
                            const qtyValue = parseInt(tableRow.cells[2].innerText);
                            if (parseInt(newValue) > qtyValue) {
                                alert("Remaining stock cannot be greater than total quantity!");
                                newValue = qtyValue;
                            }
                        }
                    }

                    cell.innerText = newValue;
                    updateProductInStorage(index, tableRow);
                });

                input.addEventListener("keypress", function (event) {
                    if (event.key === "Enter") {
                        input.blur();
                    }
                });
            });
        });

        //Remove Product
        tableRow.querySelector(".remove-btn").addEventListener("click", () => {
            products.splice(index, 1);
            saveToLocalStorage();
            loadProducts();
            updateTotalProfit();
        });

        saveToLocalStorage();
    }

    //Update Product in Storage & Auto-Update Sold + Profit
    function updateProductInStorage(index, row) {
        products[index].price = parseFloat(row.cells[1].innerText.replace("$", ""));
        products[index].qty = parseInt(row.cells[2].innerText);
        products[index].remaining = parseInt(row.cells[4].innerText);

        const sold = products[index].qty - products[index].remaining;
        const profit = sold * products[index].price;

        row.cells[3].innerText = sold;
        row.cells[5].innerText = `$${profit.toFixed(2)}`;

        saveToLocalStorage();
        updateTotalProfit();

    }

    //Add or Edit Product via Modal
    productForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("product-name").value;
        const price = parseFloat(document.getElementById("product-price").value);
        const qty = parseInt(document.getElementById("product-qty").value);
        const remaining = parseInt(document.getElementById("product-remaining").value);

        if (!name || isNaN(price) || isNaN(qty) || isNaN(remaining) || remaining > qty) {
            alert("Please fill all fields correctly! (Remaining cannot exceed Quantity)");
            return;
        }

        if (isEditing) {
            products[editingIndex] = { name, price, qty, remaining };
            isEditing = false;
        } else {
            products.push({ name, price, qty, remaining });
        }

        saveToLocalStorage();
        loadProducts();

        successMessage.style.display = "block";
        setTimeout(() => {
            successMessage.style.display = "none";
        }, 2000);

        productModal.style.display = "none";
        productForm.reset();
        updateTotalProfit();
    });

    // Modal Open & Close 
    productModal.style.display = "none";

    closeModal.addEventListener("click", function () {
        productModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === productModal) {
            productModal.style.display = "none";
        }
    });

    loadProducts();
    updateTotalProfit();
});
