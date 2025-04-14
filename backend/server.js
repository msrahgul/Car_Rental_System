const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "***********",
    database: "car_rental_system",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL database.");
});

// ✅ Promise wrapper for queries
const queryAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// 📌 USER LOGIN
app.post("/login", async (req, res) => {
    try {
        const { userType, identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: "Identifier and password are required" });
        }

        if (userType === "customer") {
            const results = await queryAsync(
                "SELECT customer_id, name FROM customers WHERE email = ? AND password = ?",
                [identifier, password]
            );
            if (results.length > 0) {
                return res.json({ 
                    success: true, 
                    message: "Customer login successful!", 
                    userType: "customer", 
                    customerId: results[0].customer_id,
                    customerName: results[0].name
                });
            }
            return res.status(401).json({ error: "Invalid email or password" });

        } else if (userType === "admin") {
            const results = await queryAsync(
                "SELECT admin_id FROM admins WHERE username = ? AND password = ?",
                [identifier, password]
            );
            if (results.length > 0) {
                return res.json({ 
                    success: true, 
                    message: "Admin login successful!", 
                    userType: "admin",
                    adminId: results[0].admin_id
                });
            }
            return res.status(401).json({ error: "Invalid username or password" });

        } else {
            return res.status(400).json({ error: "Invalid user type" });
        }
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Database error" });
    }
});

// 📌 REGISTER
app.post("/register", (req, res) => {
    const { name, mobile, email, address, password } = req.body;
  
    if (!name || !mobile || !email || !address || !password) {
      return res.json({ success: false, error: "All fields are required." });
    }
  
    // Check if mobile or email already exists
    const checkQuery = "SELECT * FROM customers WHERE mobile = ? OR email = ?";
    db.query(checkQuery, [mobile, email], (err, result) => {
      if (err) {
        console.error("Error checking existing user:", err);
        return res.json({ success: false, error: "Database error." });
      }
  
      if (result.length > 0) {
        return res.json({
          success: false,
          error: "Mobile number or email already registered.",
        });
      }
  
      // Insert the new customer
      const insertQuery =
        "INSERT INTO customers (name, mobile, email, address, password) VALUES (?, ?, ?, ?, ?)";
      db.query(insertQuery, [name, mobile, email, address, password], (err2) => {
        if (err2) {
          console.error("Error inserting new user:", err2);
          return res.json({ success: false, error: "Registration failed." });
        }
  
        res.json({ success: true, message: "Registration successful. Please login." });
      });
    });
  });
  
  


// 📌 GET AVAILABLE CARS
app.get("/get-cars", async (req, res) => {
    try {
        const results = await queryAsync("SELECT * FROM cars WHERE status = 'Available'");
        res.json(results);
    } catch (err) {
        console.error("Error fetching cars:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// 📌 GET ALL CARS
app.get("/get-all-cars", async (req, res) => {
    try {
        const results = await queryAsync("SELECT * FROM cars");
        res.json(results);
    } catch (err) {
        console.error("Error fetching all cars:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// 📌 RENT A CAR
app.post('/rent-car', async (req, res) => {
    const connection = db.promise();
    try {
        const { customerId, carId, startDate, endDate } = req.body;

        if (!customerId || !carId || !startDate || !endDate) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({ message: "Start date cannot be in the past" });
        }

        if (end <= start) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        const daysRented = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const [carResult] = await connection.query(
            "SELECT price_per_day FROM cars WHERE car_id = ? AND status = 'Available'", 
            [carId]
        );

        if (carResult.length === 0) {
            return res.status(400).json({ message: "Car not available for rent" });
        }

        const totalPrice = daysRented * carResult[0].price_per_day;

        await connection.beginTransaction();
        await connection.query(
            "INSERT INTO rentals (customer_id, car_id, start_date, end_date, total_price) VALUES (?, ?, ?, ?, ?)", 
            [customerId, carId, startDate, endDate, totalPrice]
        );
        await connection.query(
            "UPDATE cars SET status = 'Rented' WHERE car_id = ?", [carId]
        );
        await connection.commit();

        res.json({ success: true, message: "Car rented successfully!" });
    } catch (err) {
        await db.promise().rollback();
        console.error("Rent car error:", err);
        res.status(500).json({ message: "Error renting car" });
    }
});

// 📌 RETURN A CAR
app.post('/return-car', async (req, res) => {
    const connection = db.promise();
    try {
        const { rentalId, carId } = req.body;

        if (!rentalId || !carId) {
            return res.status(400).json({ message: "Rental ID and Car ID are required" });
        }

        await connection.beginTransaction();

        const [rentalCheck] = await connection.query(
            "SELECT * FROM rentals WHERE rental_id = ? AND car_id = ?", 
            [rentalId, carId]
        );

        if (rentalCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Rental record not found" });
        }

        await connection.query("DELETE FROM rentals WHERE rental_id = ?", [rentalId]);
        await connection.query("UPDATE cars SET status = 'Available' WHERE car_id = ?", [carId]);
        await connection.commit();

        res.json({ success: true, message: "Car returned successfully!" });
    } catch (err) {
        await db.promise().rollback();
        console.error("Return car error:", err);
        res.status(500).json({ message: "Error returning car" });
    }
});

// 📌 RENTED CARS (Admin view)
app.get("/rented-cars", async (req, res) => {
    try {
        const results = await queryAsync(`
            SELECT rentals.rental_id, customers.name AS customer_name, cars.model, 
                   cars.registration_number, cars.type, rentals.start_date, 
                   rentals.end_date, rentals.total_price 
            FROM rentals 
            JOIN customers ON rentals.customer_id = customers.customer_id 
            JOIN cars ON rentals.car_id = cars.car_id`
        );
        res.json(results);
    } catch (err) {
        console.error("Error fetching rented cars:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// 📌 CUSTOMER RENTALS
app.get("/customer-rentals/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;

        const results = await queryAsync(`
            SELECT r.rental_id, c.car_id, c.model, c.type, c.registration_number, 
                   r.start_date, r.end_date, r.total_price
            FROM rentals r
            JOIN cars c ON r.car_id = c.car_id
            WHERE r.customer_id = ? AND c.status = 'Rented'
        `, [customerId]);

        res.json(results);
    } catch (err) {
        console.error("Error fetching customer rentals:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// 📌 ADD A CAR
app.post("/add-car", async (req, res) => {
    try {
        const { registration_number, model, type, price_per_day } = req.body;

        if (!model || !type || price_per_day === undefined || !registration_number) {
            return res.status(400).json({ error: "All fields are required" });
        }

        await queryAsync(
            "INSERT INTO cars (registration_number, model, type, price_per_day, status) VALUES (?, ?, ?, ?, 'Available')",
            [registration_number, model, type, price_per_day]
        );

        res.json({ success: true, message: "Car added successfully!" });
    } catch (err) {
        console.error("Add car error:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// 📌 DELETE A CAR
app.delete("/delete-car/:carId", async (req, res) => {
    try {
        const { carId } = req.params;
        await queryAsync("DELETE FROM cars WHERE car_id = ?", [carId]);
        res.json({ success: true, message: "Car deleted successfully!" });
    } catch (err) {
        console.error("Error deleting car:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
