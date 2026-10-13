// Export the product model class
export class ProductModel {
    // Set up the database connection pool
    constructor(pool) {
        this.pool = pool;
    }

    // Fetch all products or search by name
    async getAll(userId, name) {
        // Check if a search name was provided
        if (name) {
            // Search the database for matching product names
            const [rows] = await this.pool.execute(
                "SELECT * FROM products WHERE user_id = ? AND name LIKE ?",
                [userId, `%${name.toUpperCase().trim()}%`]
            );
            // Return the matching products
            return rows;
        }

        // Fetch all products for the user
        const [rows] = await this.pool.execute(
            "SELECT * FROM products WHERE user_id = ? ORDER BY id ASC",
            [userId]
        );
        // Return all the products
        return rows;
    }

    // Find a specific product by its id
    async getById(id, userId) {
        // Fetch the product from the database
        const [rows] = await this.pool.execute(
            "SELECT * FROM products WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        // Return the first matching product
        return rows[0];
    }

    // Search for a product using its exact name
    async getByName(userId, name) {
        // Fetch the product from the database
        const [rows] = await this.pool.execute(
            "SELECT * FROM products WHERE user_id = ? AND name = ?",
            [userId, name]
        );
        // Return the first matching product
        return rows[0];
    }

    // Check if a new name belongs to a different product
    async getByNameExcludingId(userId, name, id) {
        // Search the database for another product with the same name
        const [rows] = await this.pool.execute(
            "SELECT * FROM products WHERE user_id = ? AND name = ? AND id != ?",
            [userId, name, id]
        );
        // Return the first matching product
        return rows[0];
    }

    // Add a new product to the database
    async create(userId, name, price, stock) {
        // Insert the new product details into the database
        const [result] = await this.pool.execute(
            "INSERT INTO products (user_id, name, price, stock) VALUES (?, ?, ?, ?)",
            [userId, name, price, stock]
        );
        // Return the newly created product
        return this.getById(result.insertId, userId);
    }

    // Subtract one from stock and add one to sold
    async sell(id, userId) {
        // Update the product stock and sold count
        const [result] = await this.pool.execute(
            "UPDATE products SET stock = stock - 1, sold = sold + 1 WHERE id = ? AND user_id = ? AND stock > 0",
            [id, userId]
        );
        // Return true if the update was successful
        return result.affectedRows > 0;
    }

    // Update the details of an existing product
    async update(id, userId, name, price, stock) {
        // Save the new details to the database
        await this.pool.execute(
            "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ? AND user_id = ?",
            [name, price, stock, id, userId]
        );
        // Return the updated product
        return this.getById(id, userId);
    }

    // Remove a product from the database
    async delete(id, userId) {
        // Delete the product record from the database
        const [result] = await this.pool.execute(
            "DELETE FROM products WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        // Return true if the deletion was successful
        return result.affectedRows > 0;
    }

    // Calculate the total sold items and earnings
    async getOverallStats(userId) {
        // Fetch the sum of sold items and earnings
        const [rows] = await this.pool.execute(
            `SELECT 
                 IFNULL(SUM(sold), 0) AS total_sold, 
                 IFNULL(SUM(price * sold), 0) AS total_earnings 
             FROM products WHERE user_id = ?`,
            [userId]
        );
        // Return the calculated totals
        return rows[0];
    }

    // Fetch individual items that were sold today
    async getItemsSoldToday(userId) {
        const [rows] = await this.pool.execute(
            "SELECT name, price, sold FROM products WHERE user_id = ? AND sold > 0",
            [userId]
        );
        return rows;
    }

    // Save the daily totals and item details to the history table
    async saveDailyHistory(userId, totalSold, totalEarnings, itemsDetails) {
        // Insert the daily record into the database
        await this.pool.execute(
            `INSERT INTO daily_history (user_id, record_date, total_sold, total_earnings, items_sold_details) 
             VALUES (?, CURDATE(), ?, ?, ?)`,
            [userId, totalSold, totalEarnings, itemsDetails]
        );
    }

    // Reset the sold count of all products to zero
    async resetSoldCounts(userId) {
        // Update all products to have zero sold items
        await this.pool.execute(
            `UPDATE products SET sold = 0 WHERE user_id = ?`,
            [userId]
        );
    }

    // Fetch all history records from the database
    async getHistory(userId) {
        // Fetch the history records ordered by date
        const [rows] = await this.pool.execute(
            `SELECT * FROM daily_history WHERE user_id = ? ORDER BY record_date DESC, created_at DESC`,
            [userId]
        );
        // Return all the history records
        return rows;
    }
}