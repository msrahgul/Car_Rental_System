import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import Modal from "./components/Modal";

function AdminDashboard({ setPage }) {
    const [cars, setCars] = useState([]);
    const [newCar, setNewCar] = useState({
        registration_number: "",
        model: "",
        type: "",
        price_per_day: "",
    });
    const [rentedCars, setRentedCars] = useState([]);
    const [showRentedCars, setShowRentedCars] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("info"); // 'info' or 'confirm'
    const [onConfirm, setOnConfirm] = useState(null); // function to run if confirmed

    useEffect(() => {
        fetch("http://localhost:5000/get-cars?userType=admin")
            .then((response) => response.json())
            .then((data) => {
                setCars(data);
                setLoading(false);
            })
            .catch((error) => console.error("Error fetching cars:", error));
    }, []);

    const fetchRentedCars = () => {
        fetch("http://localhost:5000/rented-cars")
            .then((response) => response.json())
            .then((data) => setRentedCars(data))
            .catch((error) => console.error("Error fetching rented cars:", error));
    };

    const handleAddCarConfirm = () => {
        fetch("http://localhost:5000/add-car", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCar),
        })
            .then((response) => response.json())
            .then((data) => {
                setModalMessage(data.message || "Car added successfully!");
                setModalType("info");
                setShowModal(true);

                if (data.success) {
                    setCars([...cars, newCar]);
                    setNewCar({ registration_number: "", model: "", type: "", price_per_day: "" });
                }

                setTimeout(() => setShowModal(false), 1500);
            })
            .catch((error) => console.error("Error adding car:", error));
    };

    const addCar = () => {
        const { registration_number, model, type, price_per_day } = newCar;
        if (!registration_number || !model || !type || !price_per_day) {
            alert("All fields are required!");
            return;
        }
        setModalMessage("Are you sure you want to add this car?");
        setModalType("confirm");
        setOnConfirm(() => () => handleAddCarConfirm());
        setShowModal(true);
    };

    const handleDeleteCar = (carId) => {
        fetch(`http://localhost:5000/delete-car/${carId}`, {
            method: "DELETE",
        })
            .then((response) => response.json())
            .then((data) => {
                setModalMessage(data.message || "Car deleted successfully!");
                setModalType("info");
                setShowModal(true);

                if (data.success) {
                    setCars(cars.filter((car) => car.car_id !== carId));
                }

                setTimeout(() => setShowModal(false), 1500);
            })
            .catch((error) => console.error("Error deleting car:", error));
    };

    const deleteCar = (carId) => {
        setModalMessage("Are you sure you want to delete this car?");
        setModalType("confirm");
        setOnConfirm(() => () => handleDeleteCar(carId));
        setShowModal(true);
    };

    return (
        <div className="admin-dashboard">
            {showModal && (
                <Modal title={modalType === "confirm" ? "Please Confirm" : "Success"} onClose={() => setShowModal(false)}>
                    <p>{modalMessage}</p>
                    {modalType === "confirm" ? (
                        <div style={{ marginTop: "1rem" }}>
                            <button className="confirm-btn" onClick={() => { onConfirm(); setShowModal(false); }}>Yes</button>
                            <button className="cancel-btn" onClick={() => setShowModal(false)}>No</button>
                        </div>
                    ) : null}
                </Modal>
            )}

            <h1>Admin Dashboard</h1>
            <button className="logout-btn" onClick={() => { localStorage.clear(); setPage("login"); }}>Logout</button>

            <h2>Add a New Car</h2>
            <input type="text" placeholder="Registration Number" value={newCar.registration_number} onChange={(e) => setNewCar({ ...newCar, registration_number: e.target.value })} />
            <input type="text" placeholder="Model" value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })} />
            <select value={newCar.type} onChange={(e) => setNewCar({ ...newCar, type: e.target.value })}>
                <option value="">Select Type</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="MUV">MUV</option>
                <option value="Coupe">Coupe</option>
            </select>
            <input type="number" placeholder="Price per day" value={newCar.price_per_day} onChange={(e) => setNewCar({ ...newCar, price_per_day: e.target.value })} />
            <button className="add-btn" onClick={addCar}>Add Car</button>

            <h2>Available Cars</h2>
            {loading ? <p>Loading cars...</p> : (cars.length > 0 ? (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Car ID</th>
                            <th>Registration Number</th>
                            <th>Model</th>
                            <th>Type</th>
                            <th>Price per Day</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map(car => (
                            <tr key={car.car_id}>
                                <td>{car.car_id}</td>
                                <td>{car.registration_number}</td>
                                <td>{car.model}</td>
                                <td>{car.type}</td>
                                <td>{car.price_per_day}</td>
                                <td><button className="delete-btn" onClick={() => deleteCar(car.car_id)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>No cars available.</p>)}

            <h2>Rented Cars</h2>
            <button className="toggle-btn" onClick={() => { fetchRentedCars(); setShowRentedCars(!showRentedCars); }}>
                {showRentedCars ? "Hide Rented Cars" : "View Rented Cars"}
            </button>

            {showRentedCars && rentedCars.length > 0 && (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Registration Number</th>
                            <th>Customer Name</th>
                            <th>Model</th>
                            <th>Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rentedCars.map(rental => (
                            <tr key={rental.rental_id}>
                                <td>{rental.rental_id}</td>
                                <td>{rental.registration_number}</td>
                                <td>{rental.customer_name}</td>
                                <td>{rental.model}</td>
                                <td>{rental.type}</td>
                                <td>{rental.start_date}</td>
                                <td>{rental.end_date}</td>
                                <td>{rental.total_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminDashboard;
