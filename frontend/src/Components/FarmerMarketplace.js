import React, { useState, useEffect } from "react";
import { useProductContext } from "./ProductContext";
import { Link } from "react-router-dom";
import Modal from "react-modal"; // Import Modal component
import axios from "axios"; // Import axios

const FarmerMarketplace = () => {
  const { products, fetchProducts, deleteProduct } = useProductContext();
  const [qualityFilter, setQualityFilter] = useState("");
  const [userId, setUserId] = useState("");
  const [reviews, setReviews] = useState([]); // Store reviews
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [modalProductReviews, setModalProductReviews] = useState([]); // Reviews for modal

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

    // Fetch reviews when the component mounts
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${apiURL}/api/orders/transactions/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setReviews(response.data.reviews); // Assuming response has a reviews array
        })
        .catch((error) => {
          console.error("Error fetching reviews:", error);
        });
    }
  }, [fetchProducts, apiURL]);

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

  const getReviewsForProduct = (productId) => {
    return reviews
      .filter((review) => review.productId === productId)
      .map((review) => review.reviews)
      .flat(); // Flatten to get all reviews for the product
  };

  const calculateAverageRating = (productReviews) => {
    if (productReviews.length === 0) return 0;
    const totalRating = productReviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );
    return (totalRating / productReviews.length).toFixed(1); // Return with one decimal point
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating); // Full stars
    const halfStars = Math.floor(rating * 2) % 2; // Half stars (checking the remainder when doubled)
    const quarterStars = Math.round((rating - fullStars) * 4); // Quarter stars based on precision
  
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full gold stars
        stars.push(
          <i key={i} className="fa fa-star" style={{ color: "gold" }}></i>
        );
      } else if (i === fullStars && halfStars === 1) {
        // Half star (if the remainder is 0.5, 1.5, 2.5, etc.)
        stars.push(
          <i key={i} className="fa fa-star-half" style={{ color: "gold" }}></i>
        );
      } else if (i === fullStars && quarterStars === 1) {
        // Quarter star (if the remainder is like 0.25, 0.75)
        stars.push(
          <i key={i} className="fa fa-star-half" style={{ color: "gold" }}></i>
        );
      } else {
        // Empty gray stars
        stars.push(
          <i key={i} className="fa fa-star" style={{ color: "#ccc" }}></i>
        );
      }
    }
    return stars;
  };
  
  // Open modal with reviews for a specific product
  const handleOpenModal = (productId) => {
    const productReviews = getReviewsForProduct(productId);
    setModalProductReviews(productReviews);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

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
          <i className="fa fa-plus-circle"></i> Add <br/>Listing
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
          {yourListings.map((product) => {
            const productReviews = getReviewsForProduct(product._id);
            const avgRating = calculateAverageRating(productReviews);

            return (
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
                    <div>
                      <h6>Average Rating:</h6>
                      <div>{renderStars(avgRating)}</div>
                      <p>{avgRating} out of 5</p>
                      <button
                        className="btn btn-outline-success btn-block mt-3"
                        style={{width: "100%"}}
                        onClick={() => handleOpenModal(product._id)} // Open modal on button click
                      >
                        Read Reviews
                      </button>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-block mt-3"
                      style={{width: "100%"}}
                      onClick={() => deleteProduct(product._id)} // Call deleteProduct when button is clicked
                    >
                      Delete Listing
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h4>Other Listings:</h4>
        <div className="row">
          {otherListings.map((product) => {
            const productReviews = getReviewsForProduct(product._id);
            const avgRating = calculateAverageRating(productReviews);

            return (
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
                    <div>
                      <h6>Average Rating:</h6>
                      <div>{renderStars(avgRating)}</div>
                      <p>{avgRating} out of 5</p>
                      <button
                        className="btn btn-outline-success mt-2"
                        style={{width: "100%"}}
                        onClick={() => handleOpenModal(product._id)} // Open modal on button click
                      >
                        Read Reviews
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for displaying reviews */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Product Reviews"
        ariaHideApp={false}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: "600px",
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <h2>Product Reviews</h2>
        {modalProductReviews.length > 0 ? (
          modalProductReviews.map((review, index) => (
            <div key={index}>
              <div>
                <strong>Reviewer Name: </strong>{review.reviewerName} {/* Corrected closing tag */}
                <br/>
                <strong>Rating:</strong> {renderStars(Number(review.rating))}
                <p>{review.comment}</p>
              </div>
              <hr />
            </div>
          ))
        ) : (
          <p>No reviews available.</p>
        )}
        <button className="btn btn-danger" onClick={handleCloseModal}>
          Close
        </button>
      </Modal>
    </div>
  );
};

export default FarmerMarketplace;
