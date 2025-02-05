import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Container, Spinner, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${apiURL}/api/orders/transactions/admin/admin`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTransactions(response.data);
      } catch (err) {
        setError("Error fetching transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [apiURL]);

  // Group transactions by date
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

  if (error) {
    return <div className="text-center mt-5 text-danger">{error}</div>;
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  const handlePayNow = async (orderId, farmerName, farmerEmail, totalAmount, farmerIndex) => {
    console.log("Initiating payment process for:", { orderId, farmerName, farmerEmail, totalAmount });

    try {
      const token = localStorage.getItem("token");
      console.log("Using token for authentication:", token);

      const response = await axios.post(
        `${apiURL}/api/orders/send-link`,
        { orderId, farmerName, farmerEmail, totalAmount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the payout status for the farmer that was paid
      const updatedTransactions = [...transactions];
      updatedTransactions.forEach((transaction, tIndex) => {
        if (tIndex === farmerIndex) {
          transaction.farmers.forEach((farmer, fIndex) => {
            if (fIndex === farmerIndex) {
              farmer.payoutStatus = "Link Sent";
            }
          });
        }
      });

      setTransactions(updatedTransactions);
      alert(response.data.message);
    } catch (error) {
      console.error("Error during Pay Now operation:", error.response || error.message);
      alert("Error sending payment link.");
    }
  };

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
              <div>
                <strong>Mode:</strong> {transaction.transportation}
                <br />
                <strong>Cost:</strong> LKR {transaction.transportationCost}
                <br />
                {transaction.transportation === "Pick-up" && (
                  <small className="text-muted">
                    (Pickup from the farmer's location)
                  </small>
                )}
              </div>
              <div className="table-responsive">
                <Table striped bordered hover className="mt-3">
                  <thead>
                    <tr>
                      <th
                        className="text-center align-middle"
                        style={{ width: "10%", minWidth: "100px" }}
                      >
                        Buyer Details
                      </th>
                      <th
                        className="text-center align-middle"
                        style={{ width: "10%", minWidth: "100px" }}
                      >
                        Farmer Details
                      </th>
                      <th
                        className="text-center align-middle"
                        style={{ width: "12.5%", minWidth: "120px" }}
                      >
                        Product Image
                      </th>
                      <th
                        className="text-center align-middle"
                        style={{ width: "25%", minWidth: "200px" }}
                      >
                        Product Info
                      </th>
                      <th
                        className="text-center align-middle"
                        style={{ width: "15%", minWidth: "120px" }}
                      >
                        Reviews
                      </th>
                      <th
                        className="text-center align-middle"
                        style={{ width: "10%", minWidth: "100px" }}
                      >
                        Payout
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.farmers.map((farmer, fIdx) => {
                      const products = farmer.products;
                      const totalAmountForFarmer = products.reduce(
                        (sum, product) => sum + product.price * product.quantity,
                        0
                      );

                      return products.map((product, pIdx) => (
                        <tr key={`${tidx}-${fIdx}-${pIdx}`}>
                          {fIdx === 0 && pIdx === 0 && (
                            <td
                              className="align-middle"
                              rowSpan={transaction.farmers.reduce(
                                (count, farmer) => count + farmer.products.length,
                                0
                              )}
                            >
                              <strong>Name:</strong> {transaction.buyerDetails.name}
                              <br />
                              <strong>Email:</strong> {transaction.buyerDetails.email}
                              <br />
                              <strong>Address:</strong> {transaction.buyerDetails.address},
                              {transaction.buyerDetails.location}
                            </td>
                          )}
                          {pIdx === 0 && (
                            <td className="align-middle" rowSpan={products.length}>
                              <strong>Name:</strong> {farmer.farmerDetails.farmerName}
                              <br />
                              <strong>Email:</strong> {farmer.farmerDetails.farmerEmail}
                              <br />
                              <strong>Address:</strong> {farmer.farmerDetails.farmerAddress},
                              {farmer.farmerDetails.location}
                            </td>
                          )}
                          <td className="text-center">
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: "100%",
                                maxWidth: "120px",
                                height: "auto",
                                objectFit: "cover",
                              }}
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
                            <hr />
                            <strong>Total Price: LKR {product.quantity * product.price}</strong>
                          </td>
                          <td className="text-center align-middle">
                            {product.reviews.length > 0 ? (
                              <div>
                                <strong>Rating:</strong> {product.reviews[0].rating}/5
                                <br />
                                <strong>Comment:</strong> {product.reviews[0].comment}
                              </div>
                            ) : (
                              "No Reviews"
                            )}
                          </td>
                          {pIdx === 0 && (
                            <td className="text-center align-middle" rowSpan={products.length}>
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  handlePayNow(
                                    transaction._id,
                                    farmer.farmerDetails.farmerName,
                                    farmer.farmerDetails.farmerEmail,
                                    totalAmountForFarmer,
                                    fIdx // pass farmer index to update individual farmer's status
                                  )
                                }
                                disabled={farmer.payoutStatus === "Link Sent"}
                              >
                                {farmer.payoutStatus === "Link Sent" ? "Link Sent" : "Pay Now"}
                              </Button>
                            </td>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Container>
  );
};

export default AdminTransactions;
