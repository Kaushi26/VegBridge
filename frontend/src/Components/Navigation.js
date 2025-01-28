import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Assets/Vegbridge_sl-removebg-preview.png';

const Navbar = () => {
  const buttonStyle = {
    fontSize: '1.2rem',
    padding: '10px 22px',
    margin: '4px 0',
  };

  const mobileButtonStyle = {
    fontSize: '1rem',
    padding: '8px 16px',
    margin: '4px 0',
  };

  return (
    <section className="fixed-top w-100 mb-4">
      <nav className="navbar navbar-expand-lg navbar-light bg-light py-3">
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={Logo}
              alt="VegBridge Logo"
              style={{ height: '60px', marginLeft: '10px' }}
            />
          </Link>

          {/* Mobile Toggler */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navbar Links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-nav ms-auto text-center">
              <Link
                className="btn btn-success mx-1 my-2 w-100"
                to="/"
                style={window.innerWidth <= 768 ? mobileButtonStyle : buttonStyle}
              >
                Home
              </Link>
              <Link
                className="btn btn-success mx-1 my-2 w-100"
                to="/register"
                style={window.innerWidth <= 768 ? mobileButtonStyle : buttonStyle}
              >
                Register
              </Link>
              <Link
                className="btn btn-danger mx-1 my-2 w-100"
                to="/login"
                style={window.innerWidth <= 768 ? mobileButtonStyle : buttonStyle}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </section>
  );
};

export default Navbar;
