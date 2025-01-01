import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const RegisterForm = () => {
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [sortingQuality, setSortingQuality] = useState({
    underripe: false,
    ripe: false,
    overripe: false,
    spoil: false
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiURL = process.env.REACT_APP_API_NAME;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleSortingQualityChange = (e) => {
    setSortingQuality({
      ...sortingQuality,
      [e.target.id]: e.target.checked
    });
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters long, include a number, and a special character';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!role) newErrors.role = 'Please select a role';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await axios.post(`${apiURL}/api/register`, {
          ...formData,
          role,
          sortingQuality,
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          console.log('Registration successful');
          navigate('/login');
          setFormData({ name: '', address: '', city: '', dob: '', email: '', password: '', confirmPassword: '' });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <section className="d-flex align-items-center py-5" style={{ backgroundColor: '#e6e6e6' }}>
      <div className="container">
        <div className="row d-flex justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card" style={{ backgroundColor: '#333', color: '#fff' }}>
              <div className="card-body p-4">
                <h3 className="my-3 text-uppercase text-center">Registration Form</h3>

                <form id="registrationForm" onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && <small className="text-danger">{errors.name}</small>}
                  </div>

                  {/* Location Address */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Location Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.address && <small className="text-danger">{errors.address}</small>}
                  </div>

                  {/* City */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.city && <small className="text-danger">{errors.city}</small>}
                  </div>

                  {/* Date of Birth */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.dob && <small className="text-danger">{errors.dob}</small>}
                  </div>

                  {/* Email */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Email ID</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && <small className="text-danger">{errors.email}</small>}
                  </div>

                  {/* Password */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.password && <small className="text-danger">{errors.password}</small>}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-outline mb-3">
                    <label className="form-label fw-bold">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      onChange={handleInputChange}
                      required
                    />
                    {errors.confirmPassword && <small className="text-danger">{errors.confirmPassword}</small>}
                  </div>

                  {/* Role Selection */}
                  <div className="mb-3">
                    <h6 className="mb-2 fw-bold">Role:</h6>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="roleOptions"
                        id="farmerRole"
                        value="farmer"
                        onChange={handleRoleChange}
                        required
                      />
                      <label className="form-check-label" htmlFor="farmerRole">Farmer</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="roleOptions"
                        id="businessRole"
                        value="business"
                        onChange={handleRoleChange}
                        required
                      />
                      <label className="form-check-label" htmlFor="businessRole">Business</label>
                    </div>
                    {errors.role && <small className="text-danger">{errors.role}</small>}
                  </div>

                  {/* Sorting Quality (only for business) */}
                  {role === 'business' && (
                    <div className="mb-3">
                      <h6 className="mb-2 fw-bold">Sorting Quality:</h6>
                      {['Underripe', 'Ripe', 'Overripe', 'About to spoil'].map((quality) => (
                        <div className="form-check" key={quality}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={quality}
                            checked={sortingQuality[quality]}
                            onChange={handleSortingQualityChange}
                          />
                          <label className="form-check-label" htmlFor={quality}>{quality.charAt(0).toUpperCase() + quality.slice(1)}</label>
                        </div>
                      ))}
                    </div>
                  )}

                  <button type="submit" className="btn btn-success w-100" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterForm;
