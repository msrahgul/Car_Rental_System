
# 🚗 Car Rental System - Customer Dashboard

This is the **Customer Dashboard** for the Car Rental System built with **React.js**. It allows customers to view available cars, filter them by type, rent cars, and return rented cars — all in a simple and interactive interface.

---

## ✨ Features

- ✅ **Login & Logout** for customers
- 🚘 **View all available cars**
- 🔎 **Filter cars by type** (Hatchback, Sedan, SUV, MUV, Coupe)
- 📅 **Rent a car** for a specified number of days
- 📋 **Track your current rentals**
- 🔄 **Return rented cars**
- 💡 Clear status messages and loading indicators

---

## 🔧 Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express (for API endpoints)
- **Database**: MySQL
- **Styling**: CSS (`CustomerDashboard.css`)

---

## 📦 Folder Structure

```
CAR_RENTAL_SYSTEM/
│
├── backend/
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   └── server.js            # Node.js server file
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── components/      
│       ├── AdminDashboard.css
│       ├── AdminDashboard.js
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── CustomerDashboard.css
│       ├── CustomerDashboard.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       └── setupTests.js
│
├── .gitignore
├── package-lock.json
└── package.json

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- Backend server running (at `http://localhost:5000`)
- MySQL database set up with car and rental tables

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msrahgul/Car_Rental_System
   cd Car_Rental_System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the React app**
   ```bash
   npm start
   ```

### 🔌 Backend API Endpoints Used

- `GET /get-cars` – Fetch all available cars
- `GET /customer-rentals/:customerId` – Get customer's rented cars
- `POST /rent-car` – Rent a car
- `POST /return-car` – Return a car

Make sure the backend is running and connected to the same database.

---

## 🧑‍💻 Author

Developed by RAHGUL M S 
