import React, { useState, useEffect } from "react";
import axios from "axios"; // Ensure Axios is installed
import { useProductContext } from "./ProductContext";
import { useCartContext } from "./CartContext";
import { Link } from "react-router-dom";
import Modal from "react-modal"; // Import Modal component

const BusinessMarketplace = () => {
  const { products } = useProductContext();
  const { cart, addToCart } = useCartContext();
  const [qualityFilter, setQualityFilter] = useState("");
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProductReviews, setModalProductReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const apiURL = process.env.REACT_APP_API_NAME;

  // Decode user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserId(decodedToken.userId);
      } catch (error) {
        console.error("Error decoding token:", error.message);
      }
    }
  }, []);

  // Fetch product reviews
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${apiURL}/api/orders/transactions/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setReviews(response.data.reviews);
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
      });
  }, [apiURL]);


  // Fetch notifications on component mount
  useEffect(() => {
    if (!userId) return; // Prevent fetching if userId is not available
  
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiURL}/api/products/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
  
        // Mark unread notifications as read
        response.data.forEach(async (notification) => {
          if (!notification.read) {
            await axios.put(
              `${apiURL}/api/products/notifications/${notification._id}/read`,
              null,
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
  
    fetchNotifications();
  }, [apiURL, userId]);

    // Filter unread notifications for the count
    const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  

  const filteredProducts = products.filter(
    (product) =>
      product.status === "Approved" &&
      (!qualityFilter || product.grade === qualityFilter)
  );

  const getReviewsForProduct = (productId) => {
    return reviews
      .filter((review) => review.productId === productId)
      .map((review) => review.reviews)
      .flat();
  };

  const calculateAverageRating = (productReviews) => {
    if (productReviews.length === 0) return 0;
    const totalRating = productReviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );
    return (totalRating / productReviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStars = Math.floor(rating * 2) % 2;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <i key={i} className="fa fa-star" style={{ color: "gold" }}></i>
        );
      } else if (i === fullStars && halfStars === 1) {
        stars.push(
          <i key={i} className="fa fa-star-half" style={{ color: "gold" }}></i>
        );
      } else {
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

  const handleOpenNotificationsModal = () => {
    setIsNotificationsModalOpen(true);
  };

  const handleCloseNotificationsModal = () => {
    setIsNotificationsModalOpen(false);
  };
  return (
    <div className="container mt-5">
      {/* Notification Icon */}
      <div
        className="position-fixed m-3"
        style={{
          left: 0,
          top: "20%",
          transform: "translateY(-50%)",
          zIndex: 1000,
        }}
      >
        <button
          className="btn btn-success btn-lg"
          onClick={handleOpenNotificationsModal}
          title="View Notifications"
        >
          <i className="fa fa-bell"></i> Notifications ({unreadNotifications}) {/* Display only unread notifications count */}
        </button>
      </div>

      <div
        className="position-fixed m-3"
        style={{
          right: 0,
          top: "20%",
          transform: "translateY(-50%)",
          zIndex: 1000,
        }}
      >
        <Link to="/add-to-cart" className="btn btn-success btn-lg" title="View Cart">
          <i className="fa fa-shopping-cart"></i> Cart ({cart.length})
        </Link>
      </div>

      <div className="mb-4">
        <br/>
        <br/>
        <br/>
        <h4>Filter by Quality:</h4>
        <div className="btn-group">
          {["", "Underripe", "Ripe", "Overripe", "About to spoil"].map((quality) => (
            <button
              key={quality}
              className={`btn btn-success ${qualityFilter === quality ? "active" : ""}`}
              onClick={() => setQualityFilter(quality)}
            >
              {quality || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        {filteredProducts.map((product) => {
          const productReviews = getReviewsForProduct(product._id);
          const avgRating = calculateAverageRating(productReviews);

          return (
            <div className="col-md-3 col-lg-3 mb-4" key={product._id}>
              <div className="card shadow-sm border-light" style={{ height: "100%" }}>
                <img
                  src={`${product.image}`}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-center" style={{ fontSize: "1.2rem" }}>
                    {product.name}
                  </h5>
                  <p className="card-text" style={{ fontSize: "0.9rem", color: "#555" }}>
                    <strong>Quantity:</strong> {product.quantity} kg<br />
                    <strong>Quality:</strong> {product.grade}<br />
                    <strong>Location:</strong> {product.location}<br />
                    <strong>Price (per kg):</strong> LKR {product.price}</p>
                    <div>
                    <h6>Average Rating:</h6>
                      <div>{renderStars(avgRating)}</div>
                      <p>{avgRating} out of 5</p>
                    </div>
                   
                  <button
                    className="btn btn-outline-success btn-block mt-3"
                    onClick={() => handleOpenModal(product._id)}
                  >
                    View Reviews
                  </button>
                  <button
                    className="btn btn-success btn-block mt-3"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Reviews */}
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
      <br/>
      <br/>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotificationsModalOpen}
        onRequestClose={handleCloseNotificationsModal}
        contentLabel="Notifications"
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
            padding: "30px",
            borderRadius: "10px",
            maxHeight: "450px", // Limit the height
            overflowY: "auto", 
            
          },
        }}
      >
        <h5 className="text-center my-3 text-primary">Notifications</h5>
        <div
          className="notifications-container mt-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const parsedMessage = JSON.parse(notification.message); // Parse the JSON string
              const { text, details } = parsedMessage; // Extract text and details
              return (
                <div
                  key={notification._id}
                  className={`notification card shadow-sm mb-3 ${!notification.read ? 'bg-light' : ''}`}
                  style={{
                    borderRadius: "8px",
                    overflow: "hidden",
                    fontSize: "0.9rem",
                  }}
                >
                  <div className="row g-0">
                    {/* Image Section */}
                    <div className="col-md-3">
                      <img
                        src={details.image}
                        alt={details.name}
                        className="img-fluid rounded-start"
                        style={{
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px 0 0 8px", // Rounded corners
                        }}
                      />
                    </div>

                    {/* Text and Details Section */}
                    <div className="col-md-9">
                      <div
                        className="card-body"
                        style={{ padding: "0.5rem 0.8rem", fontSize: "0.85rem" }}
                      >
                        <h6 className="card-title text-info mb-1">{details.name}</h6>
                        <p className="card-text mb-1">
                          <strong>{text}</strong>
                        </p>
                        <p className="mb-1">
                          <strong>Product Name:</strong> {details.name}
                        </p>
                        <p className="mb-1">
                          <strong>Quality:</strong> {details.quality}
                        </p>
                        <p className="mb-1">
                          <strong>Quantity:</strong> {details.quantity} KG
                        </p>
                        <p className="mb-1">
                          <strong>Address:</strong> {details.address}, {details.location}
                        </p>

                        {/* Notification Timestamp & Status */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <small className="text-muted">
                            {notification.timestamp &&
                              new Date(notification.timestamp).toLocaleString()}
                          </small>
                          {!notification.read && (
                            <span
                              className="badge bg-success text-white"
                              style={{ fontSize: "0.7rem" }}
                            >
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted">No notifications available.</p>
          )}
          {/* Close Button */}
          <div className="text-center mt-3">
            <button className="btn btn-danger" onClick={handleCloseNotificationsModal}>
              Close
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default BusinessMarketplace;
