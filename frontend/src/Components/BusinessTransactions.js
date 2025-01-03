import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table, Spinner, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const BusinessTransactions = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [review, setReview] = useState({ rating: 0, comment: "" });
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch user data from local storage
  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    const { name, city, address, email, id } = user;
    setUserDetails({ name, city, address, email, id });
  };

  const handleReview = (productId, transactionId) => {
    const selectedProduct = transactions
      .flatMap((transaction) => transaction.farmers)
      .flatMap((farmer) => farmer.products)
      .find((product) => product._id === productId);

    if (selectedProduct) {
      setCurrentTransactionId(transactionId);
      setCurrentProduct(selectedProduct._id);
      setShowReviewModal(true);
    } else {
      console.error("Product not found");
    }
  };

  const submitReview = async () => {
    if (!currentProduct || !currentTransactionId) {
      setError("Invalid product or transaction details.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${apiURL}/api/orders/submit-review/${currentTransactionId}/${currentProduct}`,
        {
          rating: review.rating,
          comment: review.comment,
          reviewerName: userDetails.name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      // After successfully submitting the review, update the transactions state
      setTransactions((prevTransactions) => {
        // Find the transaction to update
        return prevTransactions.map((transaction) => {
          if (transaction._id === currentTransactionId) {
            return {
              ...transaction,
              farmers: transaction.farmers.map((farmer) => {
                return {
                  ...farmer,
                  products: farmer.products.map((product) => {
                    if (product._id === currentProduct) {
                      // Add the new review to the product's reviews
                      return {
                        ...product,
                        reviews: [
                          ...product.reviews,
                          {
                            rating: review.rating,
                            comment: review.comment,
                            reviewerName: userDetails.name,
                          },
                        ],
                      };
                    }
                    return product;
                  }),
                };
              }),
            };
          }
          return transaction;
        });
      });
  
      // Close the review modal and reset the review form
      setShowReviewModal(false);
      setReview({ rating: 0, comment: "" });
      setError("");
    } catch (error) {
      setError("Error submitting review. Please try again.");
    }
  };
  

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userDetails && userDetails.email) {
      const fetchTransactions = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${apiURL}/api/orders/transactions/${userDetails.email}/business`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data && response.data.length > 0) {
            setTransactions(response.data);
          } else {
            setError("No transactions found.");
          }
        } catch (err) {
          setError("Error fetching transactions.");
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [userDetails, apiURL]);

  const groupTransactionsByDate = (transactions) => {
    return transactions.reduce((grouped, transaction) => {
      const date = new Date(transaction.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
      return grouped;
    }, {});
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading...</p>
      </div>
    );
  }

  // Handle empty transactions
  if (transactions.length === 0) {
    return (
      <div className="container mt-5">
        <br />
        <br />
        <div className="text-center mt-5 text-muted">No transactions available for this farmer.</div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <Container className="mt-5">
      <br />
      <br />
      <br />
      {Object.entries(groupedTransactions).map(([date, transactions], idx) => (
        <div key={idx} className="mb-5 border p-3">
          <h4 className="text-primary">
            <strong>Date:</strong> {date}
          </h4>
          {transactions.map((transaction, tidx) => (
            <div key={tidx} className="mb-5">
              <h5>
                <strong>Net Total:</strong> LKR {transaction.totalPrice}
              </h5>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Farmer Details</th>
                    <th>Product Image</th>
                    <th>Product Info</th>
                    <th>Total Price of Product</th>
                    <th className="text-center">Transportation</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.farmers.map((farmer, fIdx) =>
                    farmer.products.map((product, pIdx) => {
                      const isFirstProduct = fIdx === 0 && pIdx === 0;
                      const transportationDetails = (
                        <td
                          rowSpan={transaction.farmers.reduce(
                            (count, farmer) => count + farmer.products.length,
                            0
                          )}
                          className="text-center align-middle"
                        >
                          <strong>Mode:</strong> {transaction.transportation}
                          <br />
                          <strong>Cost:</strong> LKR{" "}
                          {transaction.transportationCost}
                          <br />
                          {transaction.transportation === "Pick-up" && (
                            <small className="text-muted">
                              (Pickup from the farmer's location)
                            </small>
                          )}
                        </td>
                      );

                      return (
                        <tr key={`${tidx}-${fIdx}-${pIdx}`}>
                          {pIdx === 0 && (
                            <td
                              rowSpan={farmer.products.length}
                              className="text-center align-middle"
                            >
                              <strong>Name:</strong>{" "}
                              {farmer.farmerDetails.farmerName}
                              <br />
                              <strong>Email:</strong>{" "}
                              {farmer.farmerDetails.farmerEmail}
                              <br />
                              <strong>Address:</strong>{" "}
                              {`${farmer.farmerDetails.farmerAddress}, ${farmer.farmerDetails.location}`}
                            </td>
                          )}
                          <td>
                            <img
                              className="align-center"
                              src={product.image}
                              alt={product.name}
                              style={{ width: "120px", height: "100px", objectFit: "cover" }}
                            />
                          </td>
                          <td>
                            <strong>Product:</strong> {product.name}
                            <br />
                            <strong>Quantity:</strong> {product.quantity} Kg
                            <br />
                            <strong>Grade:</strong> {product.grade}
                            <br />
                            <strong>Price per Kg:</strong> LKR {product.price}
                          </td>
                          <td className="text-center align-middle">LKR {product.quantity * product.price}</td>
                          {isFirstProduct && transportationDetails}
                          <td className="text-center align-middle">
                            {product.reviews.length > 0 ? (
                              <div>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  disabled
                                >
                                  Review Submitted
                                </Button>
                                <div>
                                  <p>
                                    <strong>Rating:</strong> {product.reviews[0].rating}/5
                                    <br />
                                    <strong>Comment:</strong> {product.reviews[0].comment}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleReview(product._id, transaction._id)}
                              >
                                Write Review
                              </Button>
                            )}
                          </td>


                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          ))}
        </div>
      ))}

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formReviewRating">
              <Form.Label>Rating (1-5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                value={review.rating}
                onChange={(e) =>
                  setReview({ ...review, rating: parseInt(e.target.value) })
                }
              />
            </Form.Group>
            <Form.Group controlId="formReviewComment">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={review.comment}
                onChange={(e) =>
                  setReview({ ...review, comment: e.target.value })
                }
              />
            </Form.Group>
            <Button variant="primary" onClick={submitReview}>
              Submit Review
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default BusinessTransactions;
