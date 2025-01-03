import React, { useEffect, useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";

const PayPalPayment = ({ totalUSD, onPaymentSuccess }) => {
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [error, setError] = useState("");
  const [payPalReady, setPayPalReady] = useState(false); // Track PayPal readiness
  const [loading, setLoading] = useState(true); // Track PayPal loading state

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    const { name, city, address, email, id } = user;
    setBuyerDetails({ name, city, address, email, id });

    // Simulate PayPal loading
    setTimeout(() => {
      setLoading(false); // Set loading to false after simulating load time
      setPayPalReady(true); // Set PayPal ready state to true
    }, 1000); // Simulating a 1-second load time
  }, []);

  const onPaymentCancel = () => {
    console.log("Payment was canceled.");
  };

  const submitOrder = async (paymentData) => {
    try {
      // Send payment data to backend or database
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentData);
      }
    } catch (error) {
      console.error("Error submitting payment data:", error.message);
    }
  };

  if (!buyerDetails) {
    return <div>{error}</div>;
  }

  return (
    <>
      {loading ? (
        <div>Loading PayPal...</div> // Show loading state while PayPal is loading
      ) : (
        <>
          {!payPalReady ? (
            <div>PayPal is not ready yet...</div> // Show message until PayPal is ready
          ) : (
            <PayPalButtons
              style={{ layout: "vertical" }}
              fundingSource="paypal"
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: totalUSD,
                      },
                      custom_id: buyerDetails.id,
                    },
                  ],
                });
              }}
              onApprove={(data, actions) => {
                return actions.order.capture().then(async (details) => {
                  const paymentStatus = details.status;
                  if (paymentStatus === "COMPLETED") {
                    const paymentData = {
                      paymentId: details.id,
                      paymentStatus: paymentStatus,
                      amount: totalUSD,
                      paymentMethod: "PayPal",
                      paymentDate: new Date(),
                    };
                    await submitOrder(paymentData);
                  }
                });
              }}
              onError={(err) => {
                console.error("PayPal payment error:", err);
                onPaymentCancel();
              }}
              onCancel={() => {
                onPaymentCancel();
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default PayPalPayment;
