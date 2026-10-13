// Import the database connection pool
import { pool } from "./database.js";
// Import the product database model
import { ProductModel } from "./model.js";

// Create new instance of the product model
const productModel = new ProductModel(pool);

// Controller for fetching all products
const getAllProducts = async (req, res) => {
    // Try block for fetching products
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        // Get the search keyword from the url query
        const { name } = req.query;

        // Fetch the products from the database
        const products = await productModel.getAll(userId, name);
        // Send the products to the frontend
        res.json({ products });
    // Catch any errors that happen
    } catch (error) {
        // Print error to the console
        console.error(error);
        // Return error for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for fetching a single product
const getProductById = async (req, res) => {
    // Try block for fetching a product
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        // Get the product id from the url parameters
        const id = Number(req.params.id);

        // Search the product in the database
        const foundProduct = await productModel.getById(id, userId);
        
        // Check if the product was not found
        if (!foundProduct) {
            // Return error status for missing product
            return res.status(404).json({ message: "Product not found." });
        }

        // Send the product to the frontend
        res.json({ product: foundProduct });
    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for adding a new product
const addProduct = async (req, res) => {
    // Try block for adding a product
    try {
        // Get the user id from the login token
        const userId = req.user.userId;

        // Check if the product name is missing or not text
        if (typeof req.body.name !== "string" || !req.body.name.trim()) {
            // Return error status for missing name
            return res.status(400).json({ message: "Product name is required" });
        }
        // Make the name uppercase and remove extra spaces
        const formattedName = req.body.name.toUpperCase().trim();

        // Set the default price to zero
        let price = 0;
        // Check if the frontend sent a price
        if (req.body.price !== undefined) {
            // Convert the price into a number
            price = Number(req.body.price);
            // Check if the price is invalid or a negative number
            if (isNaN(price) || price < 0) {
                // Return error status for invalid price
                return res.status(400).json({ message: "Price must be a valid non-negative number" });
            }
        }

        // Set the default stock to zero
        let stock = 0;
        // Check if the frontend sent a stock value
        if (req.body.stock !== undefined) {
            // Convert the stock into a number
            stock = Number(req.body.stock);
            // Check if the stock is invalid or a decimal number
            if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
                // Return error status for invalid stock
                return res.status(400).json({ message: "Stock must be a valid non-negative integer" });
            }
        }

        // Query the database to check if the product name exists
        const existingProduct = await productModel.getByName(userId, formattedName);
        // Check if the product is already taken
        if (existingProduct) {
            // Return error status for duplicate product
            return res.status(400).json({ message: "Product already exists" });
        }

        // Save the new product to the database
        const newProduct = await productModel.create(userId, formattedName, price, stock);

        // Return success status with the created product data
        res.status(201).json({
            message: "Product added successfully",
            product: newProduct
        });
    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for selling a product
const sellProduct = async (req, res) => {
    // Try block for selling a product
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        // Get the product id from the url parameters
        const id = Number(req.params.id);

        // Subtract stock and add to the sold count
        const success = await productModel.sell(id, userId);
        
        // Check if the product is out of stock or missing
        if (!success) {
            // Return error status for failed sale
            return res.status(400).json({ 
                message: "Cannot sell: Item is out of stock or does not exist." 
            });
        }
        
        // Fetch the updated product details from the database
        const updatedProduct = await productModel.getById(id, userId);

        // Send success message and the updated product to the frontend
        res.json({
            message: "Item sold successfully!",
            product: updatedProduct
        });
    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for updating a product
const updateProduct = async (req, res) => {
    // Try block for updating a product
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        // Get the product id from the url parameters
        const id = Number(req.params.id);

        // Search the product in the database
        const foundProduct = await productModel.getById(id, userId);
        
        // Check if the product was not found
        if (!foundProduct) {
            // Return error status for missing product
            return res.status(404).json({ message: "Product not found." });
        }

        // Extract name, price, and stock from the request body
        const { name, price, stock } = req.body;

        // Keep the old name if no new name is provided
        let updatedName = foundProduct.name;
        // Keep the old price if no new price is provided
        let updatedPrice = foundProduct.price;
        // Keep the old stock if no new stock is provided
        let updatedStock = foundProduct.stock;

        // Check if a new name was provided
        if (name !== undefined) {
            // Check if the name is missing or not text
            if (typeof name !== "string" || !name.trim()) {
                // Return error status for invalid name
                return res.status(400).json({ message: "Name is required and must be a string" });
            }
            // Make the new name uppercase and remove extra spaces
            const formattedName = name.toUpperCase().trim();

            // Check if another product already uses this name
            const duplicateCheck = await productModel.getByNameExcludingId(userId, formattedName, id);
            
            // Check if the name is already taken
            if (duplicateCheck) {
                // Return error status for duplicate name
                return res.status(400).json({ message: "Product name already exists" });
            }

            // Apply the new name
            updatedName = formattedName;
        }

        // Check if a new price was provided
        if (price !== undefined) {
            // Convert the price into a number
            const parsedPrice = Number(price);
            // Check if the price is invalid or a negative number
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                // Return error status for invalid price
                return res.status(400).json({ message: "Price must be a valid non-negative number" });
            }
            // Apply the new price
            updatedPrice = parsedPrice;
        }

        // Check if a new stock was provided
        if (stock !== undefined) {
            // Convert the stock into a number
            const parsedStock = Number(stock);
            // Check if the stock is invalid or a decimal number
            if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
                // Return error status for invalid stock
                return res.status(400).json({ message: "Stock must be a valid non-negative integer" });
            }
            // Apply the new stock
            updatedStock = parsedStock;
        }

        // Save the updated product to the database
        const updatedProduct = await productModel.update(id, userId, updatedName, updatedPrice, updatedStock);

        // Send success message and updated product to the frontend
        res.json({
            message: "Product updated successfully",
            product: updatedProduct
        });

    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for deleting a product
const deleteProduct = async (req, res) => {
    // Try block for deleting a product
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        // Get the product id from the url parameters
        const id = Number(req.params.id);

        // Delete the product from the database
        const deleted = await productModel.delete(id, userId);
        
        // Check if the product was not found
        if (!deleted) {
            // Return error status for missing product
            return res.status(404).json({ message: "Product not found" });
        }

        // Send success message to the frontend
        res.json({
            message: "Product deleted successfully"
        });

    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for saving daily history
const resetDailyStats = async (req, res) => {
    // Try block for resetting daily stats
    try {
        // Get the user id from the login token
        const userId = req.user.userId;
        
        // Fetch the current sales totals from the database
        const stats = await productModel.getOverallStats(userId);
        
        // Check if no items were sold today
        if (stats.total_sold == 0) {
            // Return error status for empty sales
            return res.status(400).json({ message: "Nothing to reset. No items sold yet." });
        }

        // Fetch the specific items sold today
        const itemsSold = await productModel.getItemsSoldToday(userId);
        // Convert the array into a JSON string to store in the database
        const itemsDetailsString = JSON.stringify(itemsSold);
        
        // Save the totals and the item breakdown string to the history table
        await productModel.saveDailyHistory(userId, stats.total_sold, stats.total_earnings, itemsDetailsString);
        
        // Reset all product sold counts back to zero
        await productModel.resetSoldCounts(userId);
        
        // Send success message to the frontend
        res.json({ message: "Daily stats reset successfully and saved to history." });
        
    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Controller for fetching sales history
const getHistory = async (req, res) => {
    // Try block for fetching history
    try {
        // Get the user id from the login token
        const userId = req.user.userId;

        // Fetch the history records from the database
        const history = await productModel.getHistory(userId);

        // Send the history to the frontend
        res.json({ history });

    // Catch any errors that happen
    } catch (error) {
        // Print the error to the console
        console.error(error);
        // Return error status for server failures
        res.status(500).json({ message: "Database error", error: error.message });
    }
};

// Export all the controller functions
export default {
    getAllProducts,
    getProductById,
    addProduct,
    sellProduct,
    updateProduct,
    deleteProduct,
    resetDailyStats,
    getHistory
};