import React, { useState, useEffect } from "react";
import axios from "axios";

const BusinessTransactions = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem('userDetails'));
    if (!user) {
      setError('You must be logged in.');
      return;
    }

    const { name, city, address, email, id } = user;
    setUserDetails({ name, city, address, email, id });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userDetails && userDetails.email) {
      const fetchTransactions = async () => {
        console.log("Fetching transactions for:", userDetails.email);

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${apiURL}/api/orders/transactions/${userDetails.email}/business`,
            {
              headers: {
                Authorization: `Bearer ${token}`, // Add token to the request headers
              },
            }
          );
          console.log("API Response:", response.data);

          if (response.data && response.data.length > 0) {
            setTransactions(response.data);
          } else {
            setError("No transactions found.");
          }
        } catch (err) {
          console.error("Error fetching transactions:", err);
          setError("Error fetching transactions");
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [userDetails, apiURL]);

    // Handle loading state
    if (loading) {
      return <div>Loading...</div>;
    }

  // Handle error state
  if (error) {
    return (
      <div className="container mt-5">
        <br />
        <div className="text-center text-muted mt-5">{error}</div>
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

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    transaction.farmers.forEach((farmer) => {
      const farmerName = farmer.farmerDetails.farmerName;
      if (!acc[farmerName]) {
        acc[farmerName] = [];
      }

      acc[farmerName].push({
        products: farmer.products,
        totalPrice: transaction.totalPrice,
        createdAt: transaction.createdAt,
        transportation: transaction.transportation,
      });
    });

    return acc;
  }, {});

  return (
    <div className="container mt-5">
      <h3 className="text-center mb-4">Business Transaction History</h3>
      <div className="table-responsive">
        <table className="table table-striped table-bordered" style={{ margin: "0 auto", textAlign: "center" }}>
          <thead>
            <tr>
              <th>Purchase Date</th>
              <th>Farmer Name</th>
              <th>Product Image</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Grade</th>
              <th>Price (per kg)</th>
              <th>Total Price (Product)</th>
              <th>Transportation</th>
              <th>Total Price (Transaction)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedTransactions).map((farmer) =>
              groupedTransactions[farmer].map((transaction, idx) => {
                const totalTransactionPrice = transaction.products.reduce(
                  (sum, product) => sum + product.price * product.quantity,
                  0
                );

                return transaction.products.map((product, productIdx) => (
                  <tr key={`${farmer}-${idx}-${productIdx}`}>
                    {productIdx === 0 ? (
                      <>
                        <td rowSpan={transaction.products.length}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td rowSpan={transaction.products.length}>{farmer}</td>
                      </>
                    ) : null}
                    <td>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="img-fluid rounded"
                        style={{
                          width: "100px",
                          height: "auto",
                          objectFit: "contain",
                          display: "block",
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.quantity} Kg</td>
                    <td>{product.grade}</td>
                    <td>LKR {product.price}</td>
                    <td>LKR {product.price * product.quantity}</td>

                    {productIdx === 0 && (
                      <td rowSpan={transaction.products.length}>
                        {transaction.transportation}
                      </td>
                    )}
                    
                    {productIdx === 0 && (
                      <td rowSpan={transaction.products.length}>
                        LKR {totalTransactionPrice}
                      </td>
                    )}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusinessTransactions;
