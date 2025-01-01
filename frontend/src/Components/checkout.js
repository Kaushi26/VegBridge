import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const [shippingDetails] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Overall loading state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false); // Loading for shipping calculation
  const apiURL = process.env.REACT_APP_API_NAME;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }
    const { name, city, address, email, id } = user;
    setBuyerDetails({ name, city, address, email, id });
    setLoading(false);
  }, []);

  const groupedItems = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const email = item.farmerEmail;
      (acc[email] = acc[email] || []).push(item);
      return acc;
    }, {});
  }, [cartItems]);

  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        if (!groupedItems || Object.keys(groupedItems).length === 0) {
          throw new Error("Grouped items are missing or invalid.");
        }

        if (!buyerDetails?.address || !buyerDetails?.city) {
          throw new Error("Buyer details are missing or incomplete.");
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authorization token found.");
          return;
        }

        let totalShippingCost = 0;

        const shippingRatePromises = Object.keys(groupedItems).map(async (farmerEmail) => {
          const farmerDetails = groupedItems[farmerEmail][0];

          if (!farmerDetails?.farmerAddress || !farmerDetails?.location) {
            throw new Error(`Farmer details are missing for ${farmerEmail}`);
          }

          const payload = {
            origin: {
              address: farmerDetails.farmerAddress,
              city: farmerDetails.location,
              countryCode: "LK",
            },
            destination: {
              address: buyerDetails.address,
              city: buyerDetails.city,
              countryCode: "LK",
            },
            packageDetails: [
              {
                weight: 1, // Dummy value, adjust as needed
                dimensions: { length: 10, width: 10, height: 10 }, // Dummy dimensions
              },
            ],
          };

          const response = await axios.post(`${apiURL}/api/orders/shipping/rates`, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response?.data?.totalTransportCost) {
            totalShippingCost += response.data.totalTransportCost;
          }
        });

        setShippingLoading(true);
        await Promise.all(shippingRatePromises);
        setTransportationCost(totalShippingCost);
        setShippingLoading(false);
      } catch (error) {
        console.error("Error fetching shipping rates:", error.message);
        setError("Error fetching shipping rates. Please try again later.");
        setShippingLoading(false);
      }
    };

    if (transportation === "Delivery" && buyerDetails) {
      fetchShippingRates();
    } else {
      setTransportationCost(0);
    }
  }, [transportation, buyerDetails, groupedItems, apiURL]);

  const calculateTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + (item.price || 0) * (item.selectedQuantity || 0),
      0
    );
  }, [cartItems]);

  const calculateFinalTotal = useMemo(() => {
    const itemTotal = calculateTotal();
    const deliveryCost = transportation === "Delivery" ? transportationCost : 0;
    return itemTotal + deliveryCost;
  }, [calculateTotal, transportation, transportationCost]);

  const totalInUSD = useMemo(() => {
    return calculateFinalTotal ? Number((calculateFinalTotal / 300).toFixed(2)) : 0;
  }, [calculateFinalTotal]);

  const handleTransportationChange = (e) => {
    setTransportation(e.target.value);
  };

  const { clearCart } = useCartContext();

  const handlePaymentSuccess = async (details) => {
    try {
      setPaymentLoading(true);

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
          productId: item._id,
          name: item.name,
          quantity: item.selectedQuantity,
          price: item.price,
          grade: item.grade,
          image: item.image,
        })),
      }));

      const orderData = {
        buyerDetails: {
          ...buyerDetails,
          location: buyerDetails.city,
        },
        farmers,
        transportation,
        transportationCost,
        totalPrice: calculateFinalTotal,
        userId: buyerDetails.id,
        paymentDetails: {
          paymentId,
          paymentMethod: "PayPal",
          paymentDate: new Date(),
          amount: paymentAmount,
          paymentStatus,
        },
        shippingDetails, // Include shipping details in the order
      };

      const token = localStorage.getItem("token");
      await axios.post(
        `${apiURL}/api/orders/payment-success`,
        { orderDetails: orderData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      clearCart();
      navigate("/business-marketplace");
      alert("Order placed successfully")
    } catch (err) {
      setError("Error placing order.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5 p-3">
      <br />
      <br />
      <br />
      <div className="row">
        {/* Buyer Information */}
        <div className="col-md-8 mb-4">
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
  
{/* Cart Items */}
<div className="card shadow p-4 mb-4">
  <h5 className="mb-4">Cart Items</h5>
  {cartItems.length === 0 ? (
    <p>Your cart is empty!</p>
  ) : (
    <div className="container">
      {/* Table Layout for larger screens */}
      <div className="d-none d-md-block">
        <table className="table table-bordered table-striped table-hover">
          <thead className="table-success">
            <tr>
              <th scope="col" className="font-weight-bold text-center">Farmer Details</th>
              <th scope="col" className="font-weight-bold text-center">Product Image</th>
              <th scope="col" className="font-weight-bold text-center">Product Details</th>
              <th scope="col" className="font-weight-bold text-center">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedItems).map((farmerEmail) => {
              const farmerGroup = groupedItems[farmerEmail];
              const farmerDetails = farmerGroup[0];
              return (
                <React.Fragment key={farmerEmail}>
                  {/* Farmer Details Row - Span Vertically */}
                  <tr>
                    <td rowSpan={farmerGroup.length} className="text-center align-middle" style={{ padding: '20px' }}>
                      <div>
                        <p className="font-weight-bold">{farmerDetails.farmerName}</p>
                        <p>{farmerDetails.farmerEmail}</p>
                        <p>{farmerDetails.farmerAddress}, {farmerDetails.location}</p>
                      </div>
                    </td>

                    {/* First Product Row */}
                    <td className="text-center" style={{ padding: '20px' }}>
                      <img
                        src={farmerGroup[0].image}
                        alt={farmerGroup[0].name}
                        className="img-fluid align-middle"
                        style={{ maxWidth: '200px', objectFit: 'contain' }}
                      />
                    </td>
                    <td className="text-justify" style={{ padding: '20px' }}>
                      <p><strong>Product Name:</strong> {farmerGroup[0].name}</p>
                      <p><strong>Grade:</strong> {farmerGroup[0].grade}</p>
                      <p><strong>Quantity:</strong> {farmerGroup[0].selectedQuantity}</p>
                      <p><strong>Price:</strong> {farmerGroup[0].price} LKR</p>
                    </td>
                    <td className="text-center" style={{ padding: '20px' }}>
                      <p className="font-weight-bold" style={{ fontSize: '1.1rem' }}>
                        {farmerGroup[0].selectedQuantity * farmerGroup[0].price} LKR
                      </p>
                    </td>
                  </tr>

                  {/* Additional Products from Same Farmer */}
                  {farmerGroup.slice(1).map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td className="text-center" style={{ padding: '20px' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid"
                          style={{ maxWidth: '175px', objectFit: 'contain' }}
                        />
                      </td>
                      <td className="text-justify" style={{ padding: '20px' }}>
                        <p><strong>Product Name:</strong> {item.name}</p>
                        <p><strong>Grade:</strong> {item.grade}</p>
                        <p><strong>Quantity:</strong> {item.selectedQuantity}</p>
                        <p><strong>Price:</strong> {item.price} LKR</p>
                      </td>
                      <td className="text-center" style={{ padding: '20px' }}>
                        <p className="font-weight-bold" style={{ fontSize: '1.1rem' }}>
                          {item.selectedQuantity * item.price} LKR
                        </p>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

{/* Mobile View - Card Layout for smaller screens */}
<div className="d-block d-md-none">
  {Object.keys(groupedItems).map((farmerEmail, farmerIndex) => {
    const farmerGroup = groupedItems[farmerEmail];
    const farmerDetails = farmerGroup[0];
    return (
      <div
        key={farmerEmail}
        style={{
          marginBottom: farmerIndex < Object.keys(groupedItems).length - 1 ? '20px' : '0', // Add space only between farmers
        }}
      >
        {/* Farmer Details */}
        <div className="card" style={{ padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 5px rgba(64, 255, 0, 0.1)' }}>
          <div className="bg-success text-white text-center py-2 mb-3" style={{ borderRadius: '8px 8px 0 0' }}>
            <h5 className="mb-0">Farmer Details</h5>
          </div>
          <div className="text-center">
            <p className="font-weight-bold" style={{ fontSize: '1.1rem' }}>{farmerDetails.farmerName}</p>
            <p style={{ fontSize: '0.9rem' }}>{farmerDetails.farmerEmail}</p>
            <p style={{ fontSize: '0.9rem' }}>{farmerDetails.farmerAddress}, {farmerDetails.location}</p>
          </div>
        </div>


        {/* Product List for Same Farmer */}
        {farmerGroup.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: '1rem',
              border: '1px solid #f0f0f0',
              borderRadius: '0', // No rounding for middle cards
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              marginBottom: '0', // No gap between products
            }}
          >
            <div className="row">
              {/* Product Image */}
              <div className="col-5 text-center align-middle" style={{ padding: '20px' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="img-fluid"
                  style={{ maxWidth: '150px', objectFit: 'contain' }}
                />
              </div>

              {/* Product Details */}
              <div className="col-7" style={{ padding: '10px' }}>
                <p><strong>Product Name:</strong> {item.name}</p>
                <p><strong>Grade:</strong> {item.grade}</p>
                <p><strong>Quantity:</strong> {item.selectedQuantity}</p>
                <p><strong>Price:</strong> {item.price} LKR</p>
              </div>
            </div>

            {/* Subtotal */}
            <hr />
            <div className="text-center">
              <p className="font-weight-bold">
                Subtotal: {item.selectedQuantity * item.price} LKR
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  })}
</div>

    </div>
  )}
</div>



        </div>
  
        {/* Order Summary */}
        <div className="col-md-4 mb-4">
          <div className="card shadow p-4">
            <h5 className="mb-4">Order Summary</h5>
            <div className="form-group">
              <label htmlFor="transportation">Select Transportation:</label>
              <select
                id="transportation"
                className="form-control"
                value={transportation}
                onChange={handleTransportationChange}
              >
                <option value="Pick-up">Pick-up</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
            <div className="mt-4">
              <p><strong>Subtotal:</strong> {calculateTotal()} LKR</p>
              <p><strong>Delivery Cost:</strong> {transportationCost} LKR</p>
              <p><strong>Net Total:</strong> {calculateFinalTotal} LKR</p>
              <p><strong>Total in USD:</strong> ${totalInUSD}</p>
            </div>
  
            <div className="mt-4">
              {shippingLoading ? (
                <div>Calculating shipping...</div>
              ) : (
                <PayPalPayment
                  totalUSD={totalInUSD}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentCancel={handlePaymentCancel}
                  loading={paymentLoading}
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
