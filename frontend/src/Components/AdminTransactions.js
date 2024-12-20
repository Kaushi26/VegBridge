import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${apiURL}/api/orders/transactions/admin/admin`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add token to the request headers
            },
          }
        );
        setTransactions(response.data);
      } catch (err) {
        setError("Error fetching transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [apiURL]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Group transactions by buyer and farmer
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const buyer = transaction.buyerDetails.name;
    if (!acc[buyer]) {
      acc[buyer] = [];
    }

    transaction.farmers.forEach((farmer) => {
      const farmerName = farmer.farmerDetails.farmerName;
      acc[buyer].push({
        farmerName,
        products: farmer.products,
        transportation: transaction.transportation,
        totalPrice: transaction.totalPrice,
        createdAt: transaction.createdAt, // Add createdAt for date
        payoutStatus: transaction.payoutStatus, // Ensure payoutStatus is included
        orderId: transaction._id, // Add orderId to use for the "Pay Now" link
        farmerEmail: farmer.farmerDetails.farmerEmail, // Store farmer's email
      });
    });

    return acc;
  }, {});

  const handlePayNow = async (orderId, farmerName, farmerEmail) => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Send the POST request with the Authorization header
      const response = await axios.post(
        `${apiURL}/api/orders/send-link`,
        {
          orderId,
          farmerName,
          farmerEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to the request headers
          },
        }
      );
      
      // Handle the response
      alert(response.data.message);
    } catch (error) {
      alert("Error sending payment link.");
    }
  };
  
  

  return (
    <div className="container mt-5">
      <br />
      <h3 className="text-center mb-4">Admin Transaction History</h3>
      {Object.keys(groupedTransactions).length === 0 ? (
        <p className="text-center">No transactions found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="text-center">
              <tr>
                <th>Purchase Date</th>
                <th>Buyer</th>
                <th>Farmer Name</th>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Quality</th>
                <th>Price (per kg)</th>
                <th>Total Price (Product)</th>
                <th>Transportation</th>
                <th>Total Price (Transaction)</th>
                <th>Payout Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedTransactions).map((buyer) =>
                groupedTransactions[buyer].map((transaction, idx) => {
                  const totalTransactionPrice = transaction.products.reduce(
                    (sum, product) => sum + product.price * product.quantity,
                    0
                  );

                  return (
                    <>
                      {idx > 0 && (
                        <tr>
                          <td colSpan={13} style={{ height: "10px", backgroundColor: "#f2f2f2" }}></td>
                        </tr>
                      )}
                      {transaction.products.map((product, productIdx) => (
                        <tr key={`${buyer}-${idx}-${productIdx}`} className="text-center">
                          {productIdx === 0 ? (
                            <>
                              <td rowSpan={transaction.products.length}>
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </td>
                              <td rowSpan={transaction.products.length}>{buyer}</td>
                              <td rowSpan={transaction.products.length}>
                                {transaction.farmerName}
                              </td>
                            </>
                          ) : null}
                          <td>
                            <img
                              src={`${product.image}`}
                              alt={product.name}
                              className="img-fluid rounded"
                              style={{ width: "100px", height: "auto", objectFit: "contain" }}
                            />
                          </td>
                          <td>{product.name}</td>
                          <td>{product.quantity} Kg</td>
                          <td>{product.grade}</td>
                          <td>LKR {product.price}</td>
                          <td>LKR {product.price * product.quantity}</td>
                          {productIdx === 0 && (
                            <>
                              <td rowSpan={transaction.products.length}>
                                {transaction.transportation}
                              </td>
                              <td rowSpan={transaction.products.length}>
                                LKR {totalTransactionPrice}
                              </td>
                            </>
                          )}
                          {productIdx === 0 && (
                            <>
                              <td rowSpan={transaction.products.length}>
                                {transaction.payoutStatus || "Pending"}
                              </td>
                              <td rowSpan={transaction.products.length}>
                                {transaction.payoutStatus === "Paid" ? (
                                  <span>Paid</span>
                                ) : (
                                  <button
                                    onClick={() => handlePayNow(transaction.orderId, transaction.farmerName, transaction.farmerEmail)}
                                    className="btn btn-secondary"
                                  >
                                    Pay Now
                                  </button>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
