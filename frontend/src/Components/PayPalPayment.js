import React, { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalPayment = ({ totalUSD, onPaymentSuccess }) => {
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    const { name, city, address, email, id } = user;
    setBuyerDetails({ name, city, address, email, id });
  }, []);

  const onPaymentCancel = () => {
    console.log("Payment was canceled.");
  };

  const submitOrder = async (paymentData) => {
    try {
      // Send only payment data to Checkout for database submission
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
    <PayPalScriptProvider
      options={{
        "client-id": 'AZjXeKRPq2jic0aFC1rmjpskBpVf9uN1k0BkWoMXfsa9VmgrDkG0oGJs2ZZsS82DonmJUV0opBnUZiwO',
        "currency": "USD",
      }}
    >
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

        // In the onApprove method:
        onApprove={(data, actions) => {
          return actions.order.capture().then(async (details) => {
            const paymentStatus = details.status;

            if (paymentStatus === "COMPLETED") {
              console.log("Payment completed successfully:", details);

              const paymentData = {
                paymentId: details.id,
                paymentStatus: paymentStatus,
                amount: totalUSD, // Total order amount
                paymentMethod: "PayPal", // Or use dynamic method if needed
                paymentDate: new Date(), // Set the payment date
              };

              await submitOrder(paymentData); // Send only payment-related details to Checkout
            } else {
              console.warn("Payment not completed:", paymentStatus);
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
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;
