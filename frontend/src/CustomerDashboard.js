import React, { useState, useEffect, useCallback } from "react";
import "./CustomerDashboard.css";
import Modal from "./components/Modal";

function CustomerDashboard({ setPage }) {
    const [cars, setCars] = useState([]);
    const [rentedCars, setRentedCars] = useState([]);
    const [loading, setLoading] = useState({
        cars: true,
        rentedCars: false,
        action: false
    });
    const [activeTab, setActiveTab] = useState("available");
    const [modelFilter, setModelFilter] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [currentAction, setCurrentAction] = useState({ type: '', id: '', carId: '' });
    const [rentalDates, setRentalDates] = useState({ startDate: "", endDate: "" });
    const [error, setError] = useState("");
    const [rentalConfirmation, setRentalConfirmation] = useState(null); // ✅

    const customerId = localStorage.getItem("customerId");

    const fetchCars = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5000/get-cars");
            const data = await response.json();
            setCars(data);
            setLoading(prev => ({ ...prev, cars: false }));
        } catch (error) {
            console.error("Error fetching cars:", error);
            setError("Failed to load available cars");
            setLoading(prev => ({ ...prev, cars: false }));
        }
    }, []);

    const fetchRentedCars = useCallback(async () => {
        setLoading(prev => ({ ...prev, rentedCars: true }));
        try {
            const response = await fetch(`http://localhost:5000/customer-rentals/${customerId}`);
            const data = await response.json();
            setRentedCars(data);
        } catch (error) {
            console.error("Error fetching rented cars:", error);
            setError("Failed to load rented cars");
        } finally {
            setLoading(prev => ({ ...prev, rentedCars: false }));
        }
    }, [customerId]);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const handleCarAction = (type, id, carId) => {
        setCurrentAction({ type, id, carId });
        if (type === 'rent') {
            setShowDateModal(true);
        } else {
            setShowConfirm(true);
        }
    };

    const processRental = async () => {
        if (!rentalDates.startDate || !rentalDates.endDate) {
            setError("Please select both start and end dates");
            return;
        }

        setLoading(prev => ({ ...prev, action: true }));
        setShowDateModal(false);

        try {
            const response = await fetch("http://localhost:5000/rent-car", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,
                    carId: currentAction.id,
                    startDate: rentalDates.startDate,
                    endDate: rentalDates.endDate
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to rent car");

            const rentedCar = cars.find(c => c.car_id === currentAction.id);
            if (rentedCar) {
                const totalDays = (new Date(rentalDates.endDate) - new Date(rentalDates.startDate)) / 86400000;
                const totalPrice = data.totalPrice || rentedCar.price_per_day * totalDays;

                setRentedCars(prev => [...prev, {
                    ...rentedCar,
                    rental_id: data.rentalId || Date.now(),
                    start_date: rentalDates.startDate,
                    end_date: rentalDates.endDate,
                    total_price: totalPrice
                }]);
                setCars(prev => prev.filter(c => c.car_id !== currentAction.id));

                // ✅ Show confirmation modal
                setRentalConfirmation({
                    model: rentedCar.model,
                    registration_number: rentedCar.registration_number,
                    start_date: rentalDates.startDate,
                    end_date: rentalDates.endDate,
                    total_price: totalPrice
                });
            }

            setRentalDates({ startDate: "", endDate: "" });
        } catch (error) {
            console.error("Rent error:", error);
            setError(error.message || "Failed to rent car");
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const processReturn = async () => {
        setShowConfirm(false);
        setLoading(prev => ({ ...prev, action: true }));

        try {
            const { id: rentalId, carId } = currentAction;
            const response = await fetch("http://localhost:5000/return-car", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rentalId, carId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to return car");

            const returnedCar = rentedCars.find(r => r.rental_id === rentalId);
            if (returnedCar) {
                const pricePerDay = returnedCar.price_per_day || (returnedCar.total_price /
                    ((new Date(returnedCar.end_date) - new Date(returnedCar.start_date)) / 86400000));
                setCars(prev => [...prev, {
                    car_id: returnedCar.car_id,
                    model: returnedCar.model,
                    type: returnedCar.type,
                    price_per_day: pricePerDay
                }]);
                setRentedCars(prev => prev.filter(r => r.rental_id !== rentalId));
            }

        } catch (error) {
            console.error("Return error:", error);
            setError(error.message || "Failed to return car");
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const filteredCars = modelFilter
        ? cars.filter(car => car.type.toLowerCase() === modelFilter.toLowerCase())
        : cars;

    return (
        <div className="dashboard">
            {/* ✅ Rental Confirmation Modal */}
            {rentalConfirmation && (
    <Modal title="Rental Confirmed" onClose={() => setRentalConfirmation(null)}>
        <p><strong>Model:</strong> {rentalConfirmation.model}</p>
        <p><strong>Registration No:</strong> {rentalConfirmation.registration_number}</p>
        <p><strong>Rental Period:</strong> {rentalConfirmation.start_date} to {rentalConfirmation.end_date}</p>
        <p><strong>Total Amount:</strong> ₹{rentalConfirmation.total_price}</p>

        <div className="modal-buttons">
            <button onClick={() => setRentalConfirmation(null)}>Close</button>
        </div>
    </Modal>
)}


            {/* Return Confirmation Modal */}
            {showConfirm && (
                <Modal title="Confirm Return" onClose={() => setShowConfirm(false)}>
                    <p>Are you sure you want to return this car?</p>
                    {error && <p className="error">{error}</p>}
                    <div className="modal-buttons">
                        <button onClick={processReturn} disabled={loading.action}>
                            {loading.action ? "Processing..." : "Yes"}
                        </button>
                        <button onClick={() => {
                            setShowConfirm(false);
                            setError("");
                        }} disabled={loading.action}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {/* Date Selection Modal */}
            {showDateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Select Rental Dates</h3>
                        {error && <p className="error">{error}</p>}
                        <div className="date-inputs">
                            <label>Start Date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={rentalDates.startDate}
                                onChange={(e) => {
                                    setRentalDates({
                                        ...rentalDates,
                                        startDate: e.target.value,
                                        endDate: e.target.value > rentalDates.endDate ? "" : rentalDates.endDate
                                    });
                                    setError("");
                                }}
                            />

                            <label>End Date</label>
                            <input
                                type="date"
                                min={rentalDates.startDate || new Date().toISOString().split('T')[0]}
                                value={rentalDates.endDate}
                                onChange={(e) => {
                                    setRentalDates({ ...rentalDates, endDate: e.target.value });
                                    setError("");
                                }}
                            />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={processRental} disabled={loading.action}>
                                {loading.action ? "Processing..." : "Confirm Rental"}
                            </button>
                            <button onClick={() => {
                                setShowDateModal(false);
                                setError("");
                            }} disabled={loading.action}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="header">
                <h1>Rent Your Car</h1>
                <button
                    className="logout"
                    onClick={() => {
                        localStorage.clear();
                        setPage("login");
                    }}
                    disabled={loading.action}
                >
                    {loading.action ? "Processing..." : "Logout"}
                </button>
            </div>

            {/* Filter */}
            <div className="filter">
                <label htmlFor="modelFilter">Filter by Model Type: </label>
                <select
                    id="modelFilter"
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    disabled={loading.action}
                >
                    <option value="">All</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="MUV">MUV</option>
                    <option value="Coupe">Coupe</option>
                </select>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === "available" ? "active" : ""}`}
                    onClick={() => setActiveTab("available")}
                    disabled={loading.action}
                >
                    Available Cars
                </button>
                <button
                    className={`tab-button ${activeTab === "rented" ? "active" : ""}`}
                    onClick={() => {
                        if (activeTab !== "rented") fetchRentedCars();
                        setActiveTab("rented");
                    }}
                    disabled={loading.action}
                >
                    My Rentals ({rentedCars.length})
                </button>
            </div>

            {/* Error */}
            {error && !showConfirm && !showDateModal && (
                <div className="error-message">{error}</div>
            )}

            {/* Main Content */}
            {activeTab === "available" ? (
                loading.cars ? (
                    <p className="loading">Loading cars...</p>
                ) : filteredCars.length > 0 ? (
                    <div className="car-grid">
                        {filteredCars.map(car => (
                            <div key={car.car_id} className="car-card">
                                <h3>{car.model}</h3>
                                <p><strong>Type:</strong> {car.type}</p>
                                <p><strong>Price per day:</strong> ₹{car.price_per_day}</p>
                                <p><strong>Registration:</strong> {car.registration_number}</p>
                                <button
                                    className="rent-button"
                                    onClick={() => handleCarAction('rent', car.car_id)}
                                    disabled={loading.action}
                                >
                                    {loading.action ? "Renting..." : "Rent Car"}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-cars">No cars available for rent.</p>
                )
            ) : (
                loading.rentedCars ? (
                    <p className="loading">Loading your rentals...</p>
                ) : rentedCars.length > 0 ? (
                    <div className="rented-grid">
                        {rentedCars.map(rental => (
                            <div key={rental.rental_id} className="rented-card">
                                <h3>{rental.model}</h3>
                                <p><strong>Rental Period:</strong> {rental.start_date} to {rental.end_date}</p>
                                <p><strong>Total Price:</strong> ₹{rental.total_price}</p>
                                <p><strong>Registration:</strong> {rental.registration_number}</p>
                                <button
                                    className="return-button"
                                    onClick={() => handleCarAction('return', rental.rental_id, rental.car_id)}
                                    disabled={loading.action}
                                >
                                    {loading.action ? "Returning..." : "Return Car"}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-cars">You haven't rented any cars yet.</p>
                )
            )}
        </div>
    );
}

export default CustomerDashboard;
