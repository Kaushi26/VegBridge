import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCartContext } from "./CartContext";
import PayPalPayment from "./PayPalPayment";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useMemo(() => location.state?.cartItems || [], [location.state?.cartItems]);

  const [transportation, setTransportation] = useState("Pick-up");
  const [transportationCost, setTransportationCost] = useState(0);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false); // Track PayPal button loading
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    const { name, city, address, email, id } = user;
    setBuyerDetails({ name, city, address, email, id });
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.selectedQuantity, 0);
  };

  const calculateFinalTotal = () => calculateTotal() + transportationCost;

  const handleTransportationChange = (e) => {
    const option = e.target.value;
    setTransportation(option);
    setTransportationCost(option === "Delivery" ? 350 : 0);
  };

  const groupedItems = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const email = item.farmerEmail;
      (acc[email] = acc[email] || []).push(item);
      return acc;
    }, {});
  }, [cartItems]);

  const { clearCart } = useCartContext();

  const handlePaymentSuccess = async (details) => {
    try {
      setPaymentLoading(true);
      console.log("Payment Details:", details);

      const paymentId = details.paymentId;
      const paymentStatus = details.paymentStatus;
      const paymentAmount = totalInUSD;

      if (!buyerDetails) {
        setError("Buyer details are missing.");
        return;
      }

      if (!cartItems.length) {
        setError("Cart is empty.");
        return;
      }

      if (!paymentId) {
        setError("Payment ID is missing.");
        return;
      }

      const farmers = Object.keys(groupedItems).map((farmerEmail) => ({
        farmerDetails: {
          farmerEmail,
          farmerName: groupedItems[farmerEmail][0].farmerName,
          farmerAddress: groupedItems[farmerEmail][0].farmerAddress,
          location: groupedItems[farmerEmail][0].location,
        },
        products: groupedItems[farmerEmail].map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.selectedQuantity,
          price: item.price,
          grade: item.grade,
          image: item.image,
        })),
      }));

      const orderData = {
        buyerDetails,
        farmers,
        transportation,
        transportationCost,
        totalPrice: calculateFinalTotal(),
        userId: buyerDetails.id,
        paymentDetails: {
          paymentId,
          paymentMethod: "PayPal",
          paymentDate: new Date(),
          amount: paymentAmount,
          paymentStatus,
        },
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiURL}/api/orders/payment-success`,
        { orderDetails: orderData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Order placed successfully:", response.data);
      clearCart();
      navigate("/business-marketplace");
    } catch (err) {
      setError("Error placing order.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentLoading(false);
  };

  const totalInUSD = Number((calculateFinalTotal() / 300).toFixed(2));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5 p-3">
      <br />
      <br />
      <br />
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow p-4 mb-4">
            <h5 className="mb-4">Buyer Information</h5>
            {error && <p className="text-danger">{error}</p>}
            {buyerDetails ? (
              <>
                <p><strong>Name:</strong> {buyerDetails.name}</p>
                <p><strong>Email:</strong> {buyerDetails.email}</p>
                <p><strong>Address:</strong> {buyerDetails.address}, {buyerDetails.city}</p>
              </>
            ) : (
              <p>Loading buyer details...</p>
            )}
          </div>

          <div className="card shadow p-4 mb-4">
            <h5 className="mb-4">Cart Items</h5>
            {cartItems.length === 0 ? (
              <p>Your cart is empty!</p>
            ) : (
              <table className="table">
              <thead>
                <tr className="text-center">
                  <th>Farmer Details</th>
                  <th>Product Image</th>
                  <th>Product Name</th>
                  <th>Grade</th>
                  <th>Quantity</th>
                  <th>Price (LKR)</th>
                  <th>Total (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedItems).map((farmerEmail) => {
                  const farmerGroup = groupedItems[farmerEmail];
                  const farmerDetails = farmerGroup[0];
                  return (
                    <React.Fragment key={farmerEmail}>
                      {farmerGroup.map((item, index) => (
                        <tr key={item.id}>
                          {index === 0 && (
                            <td className="text-justify" rowSpan={farmerGroup.length}>
                              <strong>{farmerDetails.farmerName}</strong><br />
                              <span>{farmerDetails.farmerEmail}</span><br />
                              <span>
                                {farmerDetails.farmerAddress}, {farmerDetails.location}
                              </span>
                            </td>
                          )}
                          <td>
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: "100px" }}
                            />
                          </td>
                          <td className="text-center">{item.name}</td>
                          <td className="text-center">{item.grade}</td>
                          <td className="text-center">{item.selectedQuantity}</td>
                          <td className="text-center">{item.price}</td>
                          <td className="text-center">{(item.price * item.selectedQuantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            
            )}
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow p-4 mb-4">
            <h5 className="mb-4">Shipping & Payment</h5>
            <div className="mb-3">
              <label htmlFor="transportation" className="form-label">
                Transportation
              </label>
              <select
                id="transportation"
                className="form-select"
                value={transportation}
                onChange={handleTransportationChange}
              >
                <option value="Pick-up">Pick-up</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
            <p><strong>Transportation Cost:</strong> LKR {transportationCost}</p>
            <p><strong>Total Price (LKR):</strong> LKR {calculateFinalTotal().toFixed(2)}</p>
            <p><strong>Total Price (USD):</strong> ${totalInUSD}</p>
            <div>
              {paymentLoading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <PayPalPayment
                  totalUSD={parseFloat(totalInUSD)}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentCancel={handlePaymentCancel}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
