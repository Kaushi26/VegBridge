import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Container, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const FarmerTransactions = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch user data from localStorage
  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    const { name, location, address, email, id } = user;
    setUserDetails({ name, location, address, email, id });
  };

  // Fetch transactions based on user name
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userDetails && userDetails.name) {
      const fetchTransactions = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${apiURL}/api/orders/transactions/${userDetails.name}/farmer`,
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
                    <th className="text-center align-middle" style={{ width: "15%" }}>
                      Buyer Details
                    </th>
                    <th className="text-center align-middle" style={{ width: "15%" }}>
                      Product Image
                    </th>
                    <th className="text-center align-middle" style={{ width: "20%" }}>
                      Product Info
                    </th>
                    <th className="text-center align-middle" style={{ width: "12.5%" }}>
                      Total Price of Product
                    </th>
                    <th className="text-center align-middle" style={{ width: "15%" }}>
                      Transportation
                    </th>
                    <th className="text-center align-middle" style={{ width: "27.5%" }}>
                      Reviews
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.farmers.map((farmer, fIdx) => {
                    const products = farmer.products;
                    return products.map((product, pIdx) => (
                      <tr key={`${tidx}-${fIdx}-${pIdx}`}>
                        {pIdx === 0 && (
                          <td
                            className="align-middle"
                            rowSpan={products.length}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <strong>Name:</strong> {transaction.buyerDetails.name}
                            <br />
                            <strong>Email:</strong> {transaction.buyerDetails.email}
                            <br />
                            <strong>Address:</strong> {transaction.buyerDetails.address}
                          </td>
                        )}
                        <td className="text-center">
                          <img
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
                        <td className="text-center align-middle">
                          LKR {product.quantity * product.price}
                        </td>
                        {pIdx === 0 && (
                          <td
                            className="align-middle text-center"
                            rowSpan={products.length}
                          >
                            <strong>Mode:</strong> {transaction.transportation}
                            <br />
                            <strong>Cost:</strong> LKR {transaction.transportationCost}
                          </td>
                        )}
                        
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

                      </tr>
                    ));
                  })}
                </tbody>
              </Table>
            </div>
          ))}
        </div>
      ))}
    </Container>
  );
};

export default FarmerTransactions;
