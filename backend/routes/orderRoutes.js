const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const paypal = require('@paypal/checkout-server-sdk');
const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');  // Ensure this is at the top of your file
require('dotenv').config();  

// PayPal environment setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Middleware: Authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Access Denied. Token is missing.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Route to fetch transactions for farmer, admin, or business
router.get('/transactions/:identifier/:role', authenticateToken, asyncHandler(async (req, res) => {
  const { identifier, role } = req.params;
  const validRoles = ['admin', 'farmer', 'business'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided.' });
  }

  let transactions;
  try {
    if (role === 'admin') {
      transactions = await Order.find();  // Fetch all orders for admin
    } else if (role === 'farmer') {
      transactions = await Order.find({ 'farmers.farmerDetails.farmerName': identifier });  // Filter by farmer name
    } else if (role === 'business') {
      transactions = await Order.find({ 'buyerDetails.email': identifier });  // Filter by business email
    }

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found.' });
    }

    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ message: 'Error fetching transactions. Please try again later.', error: err.message });
  }
}));

// Route for handling PayPal payment cancellation
router.get('/cancel', (req, res) => {
  res.send('Payment cancelled');
});

router.post('/payment-success', authenticateToken, async (req, res) => {
  try {
    const orderData = req.body.orderDetails;

    // Validate if paymentDetails is provided
    if (!orderData.paymentDetails) {
      return res.status(400).json({ success: false, message: 'Payment details are missing' });
    }

    // Validate if paymentId is provided in paymentDetails
    if (!orderData.paymentDetails.paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is missing' });
    }

    if (orderData.paymentDetails.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Payment not verified' });
    }
    

    // Save the order to the database
    const newOrder = new Order({
      ...orderData,
    });

    await newOrder.save();
    res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error saving order:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving order' });
  }
});



router.post("/send-link", authenticateToken, asyncHandler(async (req, res) => {
  const { orderId, farmerName, farmerEmail } = req.body;

  if (!farmerEmail) {
    return res.status(400).json({ message: "Farmer email is required." });
  }

  try {
    // Fetch the order and populate related farmer products
    const order = await Order.findById(orderId).populate('farmers.products');
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Calculate total price
    const totalPrice = order.farmers.reduce((sum, farmer) => {
      const farmerTotal = farmer.products.reduce(
        (productSum, product) => productSum + product.price * product.quantity,
        0
      );
      return sum + farmerTotal + order.transportationCost;
    }, 0);


    // Set up the PayPal order creation request
    const conversionRate = 300; // Example conversion rate for currency conversion, adjust as needed
    const convertedPrice = (totalPrice / conversionRate).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: 'USD',  // Change to your desired currency code
          value: convertedPrice,
        },
        description: "Payment for order",
        custom_id: orderId,  // Associate with the order ID
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    });

    // Execute the PayPal order creation request
    const payment = await client.execute(request);

    // Check if the approval_url exists
    const approvalLink = payment.result.links.find(link => link.rel === 'approve');
    if (!approvalLink) {
      console.error("Approval URL not found:", payment.result.links);
      return res.status(500).json({ message: "Approval URL not found in PayPal response." });
    }

    const paymentLink = approvalLink.href;

    // Send the email with the payment link to the farmer
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: farmerEmail,
      subject: "Payment Link for Your Order",
      html: `<p>Dear ${farmerName},</p>
             <p>Please click the link below to receive your payout:</p>
             <a href="${paymentLink}">Receive Payment</a>
             <p>This link will expire in 1 hour. Total amount due: LKR ${totalPrice}</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Payment link sent successfully." });
  } catch (error) {
    console.error("Error sending payment link:", error.message);
    res.status(500).json({ message: "Error sending payment link.", error: error.message });
  }
}));


router.post(
  "/update-payout-status",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { orderId, payoutStatus } = req.body;

    if (!["Paid", "Pending"].includes(payoutStatus)) {
      return res.status(400).json({ message: "Invalid payout status." });
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }

      order.payoutStatus = payoutStatus;
      await order.save();

      res.status(200).json({ message: "Payout status updated successfully.", order });
    } catch (error) {
      console.error("Error updating payout status:", error.message);
      res.status(500).json({ message: "Error updating payout status.", error: error.message });
    }
  })
);



module.exports = router;
