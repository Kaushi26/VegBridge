import React, { useContext, useState, useEffect } from "react";
import ProductContext from "./ProductContext";
import axios from "axios";
import Modal from "react-modal";


const AdminMarketplace = () => {
  const { products, handleApprove, handleReject } = useContext(ProductContext);
  const [qualityFilter, setQualityFilter] = useState(""); // State to manage quality filter
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProductReviews, setModalProductReviews] = useState([]);
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${apiURL}/api/orders/transactions/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setReviews(response.data.reviews); // Assuming the response has a reviews array
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
      });
  }, [apiURL]);

  const handleQualityFilterChange = (quality) => {
    setQualityFilter(quality); // Update the filter based on selected quality
  };

  const filteredApprovedProducts = products.filter(
    (product) =>
      product.status === "Approved" &&
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
      <br />
      <br />
      {/* Product Listings */}
      {["Pending", "Approved", "Rejected"].map((status) => (
        <div key={status} className="mb-5">
          <h2 className="mb-3">{status} Products</h2>
          {/* Display quality filter buttons only for "Approved" products */}
          {status === "Approved" && (
            <div className="mb-4">
              <h4>Filter by Quality:</h4>
              <div className="btn-group">
                {["", "Underripe", "Ripe", "Overripe", "About to spoil"].map(
                  (quality) => (
                    <button
                      key={quality}
                      className={`btn btn-success ${
                        qualityFilter === quality ? "active" : ""
                      }`}
                      onClick={() => handleQualityFilterChange(quality)}
                    >
                      {quality || "All"}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
          <div className="row">
            {(
              status === "Approved"
                ? filteredApprovedProducts
                : products.filter((product) => product.status === status)
            ).map((product) => {
              const productReviews = getReviewsForProduct(product._id);
              const avgRating = calculateAverageRating(productReviews);

              return (
                <div className="col-md-3 col-lg-3 mb-4" key={product._id}>
                  <div className="card shadow-sm">
                    <img
                      src={`${product.image}`}
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
                      {product.status === "Pending" && (
                        <div className="d-flex justify-content-between">
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(product._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleReject(product._id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {/* Average rating stars and "Read Reviews" button */}
                      {status === "Approved" && (
                        <div>
                          <h6>Average Rating:</h6>
                          <div>{renderStars(avgRating)}</div>
                          <button
                            className="btn btn-info"
                            onClick={() => handleOpenModal(product._id)}
                          >
                            Read Reviews
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

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
        <button onClick={handleCloseModal} className="btn btn-danger mt-3">
          Close
        </button>
      </Modal>
    </div>
  );
};

export default AdminMarketplace;
