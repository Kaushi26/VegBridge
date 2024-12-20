import React, { useState, useEffect } from "react";
import { useProductContext } from "./ProductContext";
import { Link } from "react-router-dom";

const FarmerMarketplace = () => {
  const { products, fetchProducts, deleteProduct } = useProductContext();
  const [qualityFilter, setQualityFilter] = useState("");
  const [userId, setUserId] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        setUserId(decodedToken.userId); // Ensure that decoded token has 'userId' field as userId
      } catch (error) {
        console.error("Error decoding token:", error.message);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts(); // Ensure products are fetched on mount
  }, [fetchProducts]);

  const yourListings = products.filter(
    (product) =>
      product.status === "Approved" &&
      product.userId === userId && // Filter by logged-in farmer's ID
      (!qualityFilter || product.grade === qualityFilter)
  );

  const otherListings = products.filter(
    (product) =>
      product.status === "Approved" &&
      product.userId !== userId && // Exclude logged-in farmer
      (!qualityFilter || product.grade === qualityFilter)
  );

  return (
    <div className="container mt-5 pt-5">
      <div
        className="position-fixed m-3"
        style={{
          right: 0,
          top: "20%",
          transform: "translateY(-50%)",
          zIndex: 1000,
        }}
      >
        <Link to="/add-listing" className="btn btn-success btn-lg">
          <i className="fas fa-plus-circle"></i> Add Listing
        </Link>
      </div>

      <div className="mb-4">
        <h4>Filter by Quality:</h4>
        <div className="btn-group">
          {["", "Underripe", "Ripe", "Overripe", "About to spoil"].map(
            (grade) => (
              <button
                key={grade}
                className={`btn btn-success ${qualityFilter === grade ? "active" : ""}`}
                onClick={() => setQualityFilter(grade)}
              >
                {grade || "All"}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mb-4">
        <h4>Your Listings:</h4>
        <div className="row">
          {yourListings.map((product) => (
            <div className="col-md-3 col-lg-3 mb-4" key={product._id}>
              <div className="card shadow-sm">
                <img
                  src={product.image}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">
                    <strong>Quantity:</strong> {product.quantity} kg <br />
                    <strong>Quality:</strong> {product.grade} <br />
                    <strong>Location:</strong> {product.location} <br />
                    <strong>Price:</strong> LKR {product.price}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteProduct(product._id)} // Call deleteProduct when button is clicked
                  >
                    Delete Listing
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4>Other Listings:</h4>
        <div className="row">
          {otherListings.map((product) => (
            <div className="col-md-3 col-lg-3 mb-4" key={product._id}>
              <div className="card shadow-sm">
                <img
                  src={product.image}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">
                    <strong>Quantity:</strong> {product.quantity} KG <br />
                    <strong>Quality:</strong> {product.grade} <br />
                    <strong>Location:</strong> {product.location} <br />
                    <strong>Price:</strong> LKR {product.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerMarketplace;
