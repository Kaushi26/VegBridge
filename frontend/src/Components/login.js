import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';

const LoginSection = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiURL = process.env.REACT_APP_API_NAME;

  // Define handleChange to update form data state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  try {
    // Make the POST request with credentials and Authorization header
    const response = await axios.post(`${apiURL}/api/login`, formData, {
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header if using token-based authentication
        'Authorization': `Bearer ${localStorage.getItem('token')}`, // if needed
      },
      withCredentials: true,  // Ensure credentials (cookies, etc.) are included in the request
    });

    // Log the response data directly
    console.log("API Response:", response.data);

    if (response.status === 400 || response.status === 401) {
      setErrors({ general: response.data.message });
    } else if (response.status !== 200) {
      setErrors({ general: "Unexpected error occurred." });
    } else {
      const { token, role, userDetails } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userDetails", JSON.stringify(userDetails));
      console.log("Logged in user details:", userDetails);

      onLoginSuccess(role);

      // Redirect based on user role
      if (role === "farmer") {
        navigate("/farmer-marketplace");
      } else if (role === "business") {
        navigate("/business-marketplace");
      } else if (role === "admin") {
        navigate("/admin-marketplace");
      } else {
        navigate("/");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    setErrors({ general: "An error occurred. Please try again later." });
  } finally {
    setLoading(false);
  }
};

  return (
    <section className="d-flex align-items-center py-5">
      <div className="container">
        <div className="row d-flex justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card" style={{ backgroundColor: "#333", color: "#fff" }}>
              <div className="card-body p-4">
                <h3 className="my-3 text-uppercase text-center">Login</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-outline mb-3">
                    <label htmlFor="username" className="form-label fw-bold">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}  // This is now correctly defined
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-outline mb-3">
                    <label htmlFor="password" className="form-label fw-bold">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}  // This is now correctly defined
                      className="form-control"
                      required
                    />
                  </div>
                  {errors.general && (
                    <div className="alert alert-danger" role="alert">
                      {errors.general}
                    </div>
                  )}
                  <button type="submit" className="btn btn-success w-100" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <p>
                    Don't have an account?{" "}
                    <Link to="/register" style={{ color: "#0dcaf0" }}>
                      Register here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;
