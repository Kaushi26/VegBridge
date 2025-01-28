import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../Assets/Vegbridge_sl-removebg-preview.png';

const Navbar2 = ({ setIsLoggedIn }) => {
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Check logged-in user role
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        setUserRole(role);
    }, []);

    // Back Button Logic
    const handleBackButtonClick = () => {
        const userRole = localStorage.getItem("userRole");
        const currentPath = location.pathname;

        if (currentPath.includes('/order-summary')) {
            navigate("/checkout");
        } else if (currentPath.includes('/checkout')) {
            navigate("/add-to-cart");
        } else if (currentPath.includes('/add-to-cart')) {
            switch (userRole) {
                case "admin":
                    navigate("/admin-marketplace");
                    break;
                case "business":
                    navigate("/business-marketplace");
                    break;
                case "farmer":
                    navigate("/farmer-marketplace");
                    break;
                default:
                    localStorage.removeItem("userRole");
                    setIsLoggedIn(false);
                    navigate("/login");
            }
        } else {
            switch (userRole) {
                case "admin":
                    navigate("/admin-marketplace");
                    break;
                case "business":
                    navigate("/business-marketplace");
                    break;
                case "farmer":
                    navigate("/farmer-marketplace");
                    break;
                default:
                    localStorage.removeItem("userRole");
                    setIsLoggedIn(false);
                    navigate("/login");
            }
        }
    };

    // Logout Functionality
    const handleLogout = () => {
        localStorage.removeItem("userRole");
        setIsLoggedIn(false);
        navigate("/login");
    };

    return (
        <section className="fixed-top w-100">
            <nav className="navbar navbar-expand-lg navbar-light bg-light py-2">
                <div className="container-fluid">
                    {/* Back Button */}
                    <button
                        className="btn btn-success me-3 px-4 py-2"
                        style={{ fontSize: '1.2rem' }}
                        onClick={handleBackButtonClick}
                    >
                        &#8592; Back
                    </button>

                    {/* Logo */}
                    <Link className="navbar-brand d-flex align-items-center" to="/">
                        <img
                            src={logo}
                            alt="Vegbridge logo"
                            className="d-inline-block align-text-top"
                            style={{ height: '60px' }}
                        />
                    </Link>

                    {/* Toggler Button for Mobile */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                        style={{ backgroundColor: 'transparent', border: '1px solid #ddd', marginBottom: '15px' }}
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Navbar Links */}
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <div className="navbar-nav ms-auto text-center">
                            {/* Role-based Links */}
                            {userRole === "admin" && (
                                <>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/admin-marketplace">
                                        Marketplace
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/admin-transactions">
                                        Transaction History
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/admin-guides">
                                        Guides
                                    </Link>
                                </>
                            )}

                            {userRole === "farmer" && (
                                <>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/farmer-marketplace">
                                        Marketplace
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/stock-dashboard">
                                        Stock Dashboard
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/farmer-transactions">
                                        Transaction History
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/farmer-guides">
                                        Guides
                                    </Link>
                                </>
                            )}

                            {userRole === "business" && (
                                <>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/business-marketplace">
                                        Marketplace
                                    </Link>
                                    <Link className="btn btn-success mx-1 my-2 w-100" to="/business-transactions">
                                        Transaction History
                                    </Link>
                                </>
                            )}

                            {/* Logout Button */}
                            <button
                                className="btn btn-danger mx-1 my-2 w-100"
                                style={{ marginLeft: 'auto' }}
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </section>
    );
};

export default Navbar2;
