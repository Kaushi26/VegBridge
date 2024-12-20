import React, { useState, useEffect } from "react";
import axios from "axios";

const FarmerTransactions = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiURL = process.env.REACT_APP_API_NAME;

  // Fetch user data from localStorage
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
    // Fetch user data when the component mounts
    fetchUserData();
  }, []);

  useEffect(() => {
    // If userDetails are available, fetch transactions
    if (userDetails && userDetails.name) {
      const fetchTransactions = async () => {
        console.log("Fetching transactions for:", userDetails.name);

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${apiURL}/api/orders/transactions/${userDetails.name}/farmer`,
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
  }, [userDetails, apiURL]); // Trigger when userDetails are available/changed

  if (loading) return <div>Loading...</div>;

  // Handle error state
  if (error) {
    return (
      <div className="container mt-5">
        <br/>
        <div className="text-center text-muted mt-5">{error}</div>
      </div>
    );
  }

  // Handle empty transactions
  if (transactions.length === 0) {
    return (
      <div className="container mt-5">
        <br/>
        <br/>
        <div className="text-center mt-5 text-muted">No transactions available for this farmer.</div>
      </div>
    );
  }

  // Group transactions by buyer
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
        totalPrice: transaction.totalPrice,
        createdAt: transaction.createdAt, // Add createdAt for date
        transportation: transaction.transportation,
      });
    });

    return acc;
  }, {});

  return (
    <div className="container mt-5">
        <br />
      <h3 className="text-center mb-4">Farmer Transaction History</h3>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr className="text-center"> {/* Center-align header row */}
              <th>Purchase Date</th>
              <th>Buyer Name</th>
              <th>Product Image</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Quality</th>
              <th>Price (per kg)</th>
              <th>Total Price (Product)</th>
              <th>Transportation</th>
              <th>Total Price (Transaction)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedTransactions).map((buyer) =>
              groupedTransactions[buyer].map((transaction, idx) => {
                const totalTransactionPrice = transaction.products.reduce(
                  (sum, product) => sum + product.price * product.quantity,
                  0
                );

                return transaction.products.map((product, productIdx) => (
                  <tr key={`${buyer}-${idx}-${productIdx}`} className="text-center">
                    {/* Display Buyer, and Date only once */}
                    {productIdx === 0 ? (
                      <>
                        <td rowSpan={transaction.products.length}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td rowSpan={transaction.products.length}>{buyer}</td>
                      </>
                    ) : null}

                    <td>
                      <img
                        src={`${product.image}`}
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

                    {/* Display Transportation only once for each transaction */}
                    {productIdx === 0 && (
                      <td rowSpan={transaction.products.length}>
                        {transaction.transportation}
                      </td>
                    )}

                    {/* Display total price only once for each transaction */}
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

export default FarmerTransactions;
