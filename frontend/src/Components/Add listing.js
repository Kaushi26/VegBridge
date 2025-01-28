import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddListing = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    grade: "",
    price: "",
    location: "",
    userId: "",  // Added userId to formData
    farmerName: "",  // Added farmerName to formData
    farmerAddress: "",  // Added farmerAddress to formData
    farmerEmail: ""  // Added farmerEmail to formData
  });

  const [image, setImage] = useState(null);
  const [userData, setUserData] = useState({
    name: "",
    address: "",
    email: "",
    city: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch logged-in user's data on component mount
  useEffect(() => {
    const fetchUserData = () => {
      // Get user data from local storage
      const user = JSON.parse(localStorage.getItem("userDetails"));

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const { name, city, address, email, id } = user;  // Assume user data contains an 'id'
      setUserData({ name, city, address, email });
      setFormData((prevData) => ({
        ...prevData,
        location: city,  // Use city from the user data as location
        userId: id,  // Add userId to formData
        farmerName: name,  // Set farmer name
        farmerAddress: address,  // Set farmer address
        farmerEmail: email,  // Set farmer email
      }));
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (file && !allowedTypes.includes(file.type)) {
      setError("Please upload a valid image file.");
      setImage(null);
      return;
    }
    setImage(file);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (formData.quantity <= 0 || formData.price <= 0) {
      setError("Quantity and price must be greater than 0.");
      return;
    }
  
    setError(null);
  
    const formDataWithImage = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataWithImage.append(key, formData[key]);
    });
  
    // Add image if exists
    if (image) {
      formDataWithImage.append("image", image);
    }
  
    setLoading(true);
  
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to add a listing.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(
        `${apiURL}/api/products`,
        formDataWithImage,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log("Product added:", response.data);
      navigate("/farmer-marketplace"); // Redirect on success
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Error uploading listing";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Add New Listing</h2>
      <div className="row mb-4">
        <div className="col-md-12 shadow p-3 mb-5 bg-body-tertiary rounded">
          <h5 className="text-primary">Farmer Details</h5>
          <div>
            <label><strong>Name:</strong></label>
            <input
              type="text"
              value={userData.name}
              readOnly
              className="form-control"
            />
          </div>
          <div>
            <label><strong>City:</strong></label>
            <input
              type="text"
              value={userData.city}
              readOnly
              className="form-control"
            />
          </div>
          <div>
            <label><strong>Address:</strong></label>
            <input
              type="text"
              value={userData.address}
              readOnly
              className="form-control"
            />
          </div>
          <div>
            <label><strong>Email:</strong></label>
            <input
              type="text"
              value={userData.email}
              readOnly
              className="form-control"
            />
          </div>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="row g-3 shadow p-3 mb-5 bg-body-tertiary rounded"
      >
        <div className="col-md-6">
          <label className="form-label">Product Name</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Quantity (kg)</label>
          <input
            type="number"
            name="quantity"
            className="form-control"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Quality</label>
          <div className="dropdown">
            <button
              className=" dropdown-toggle w-100"  // Green success button
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {formData.grade || "Select Quality"}
            </button>
            <ul className="dropdown-menu w-100" aria-labelledby="dropdownMenuButton">
              <li
                className="dropdown-item"
                onClick={() => handleChange({ target: { name: "grade", value: "Ripe" } })}
              >
                <strong>Ripe</strong>: <span className="text-muted">Fresh and ready to be consumed</span>
              </li>
              <li
                className="dropdown-item"
                onClick={() => handleChange({ target: { name: "grade", value: "Underripe" } })}
              >
                <strong>Underripe</strong>: <span className="text-muted">Not fully matured but still usable</span>
              </li>
              <li
                className="dropdown-item"
                onClick={() => handleChange({ target: { name: "grade", value: "Overripe" } })}
              >
                <strong>Overripe</strong>: <span className="text-muted">Past its peak freshness</span>
              </li>
              <li
                className="dropdown-item"
                onClick={() => handleChange({ target: { name: "grade", value: "About to spoil" } })}
              >
                <strong>About to Spoil</strong>: <span className="text-muted">Nearing spoilage, may have some damage</span>
              </li>
            </ul>
          </div>
        </div>


        <div className="col-md-6">
          <label className="form-label">Price per kg</label>
          <input
            type="number"
            name="price"
            className="form-control"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-12">
          <label className="form-label">Upload Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/jpeg, image/png, image/gif, image/webp"
            onChange={handleImageChange}
            required
          />
        </div>
        {error && <p className="text-danger">{error}</p>}
        <div className="col-12">
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? "Uploading..." : "Add Listing"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddListing;
