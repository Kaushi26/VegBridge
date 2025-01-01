const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const axios = require('axios');
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

router.get('/transactions/:identifier/:role', authenticateToken, asyncHandler(async (req, res) => {
  const { identifier, role } = req.params;
  const validRoles = ['admin', 'farmer', 'business'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided.' });
  }

  try {
    let transactions;
    if (role === 'admin') {
      transactions = await Order.find(); // Fetch all orders for admin
    } else if (role === 'farmer') {
      transactions = await Order.find({
        'farmers.farmerDetails.farmerName': identifier,
      }); // Fetch orders that include the farmer
    } else if (role === 'business') {
      transactions = await Order.find({
        'buyerDetails.email': identifier,
      }); // Fetch orders by business email
    }

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found.' });
    }

    // Filter relevant products for the farmer
    if (role === 'farmer') {
      transactions = transactions.map(transaction => ({
        ...transaction.toObject(),
        farmers: transaction.farmers.filter(farmer => farmer.farmerDetails.farmerName === identifier),
      })).filter(transaction => transaction.farmers.length > 0); // Remove transactions with no relevant products
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


const apiKey  = process.env.OPENROUTE_API_KEY;

async function getDistance(origin, destination) {
  if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    throw new Error('Invalid coordinates for distance calculation');
  }

  // Handle case where origin and destination are the same
  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    return 0; // No distance to calculate
  }

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}`;
  const body = {
    coordinates: [
      [origin.lng, origin.lat], 
      [destination.lng, destination.lat], 
    ],
  };

  try {
    const response = await axios.post(url, body);
    const distance = response.data.routes[0]?.summary?.distance; // Distance in meters

    if (!distance) {
      throw new Error('No valid distance found');
    }
    return (distance / 1000).toFixed(2); // Convert to kilometers
  } catch (error) {
    console.error('Error fetching distance:', error.message);
    throw new Error('Error fetching distance');
  }
}

async function getCoordinates(city) {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${city}`;

  try {
    const response = await axios.get(url);
    const coordinates = response.data.features[0]?.geometry.coordinates; 

    if (coordinates) {
      return { lat: coordinates[1], lng: coordinates[0] }; 
    } else {
      throw new Error(`City "${city}" not found or API error`);
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error.message);
    throw new Error(`Error fetching coordinates for city "${city}"`);
  }
}

function calculateShippingRate(distance) {
  if (distance <= 50) {
    return 350; 
  } else if (distance <= 100) {
    return 700; 
  } else {
    return 1200; 
  }
}

function calculateShippingRateByCity(originCity, destinationCity, distance) {
  if (originCity.toLowerCase() === destinationCity.toLowerCase()) {
    return 250; 
  } else {
    return calculateShippingRate(distance);
  }
}
router.post('/shipping/rates', async (req, res) => {
  try {
    const { origin, destination, packageDetails } = req.body;

    if (!origin || !destination || !packageDetails || packageDetails.length === 0) {
      return res.status(400).json({
        message: 'Missing or invalid required parameters.',
      });
    }

    const packagesGroupedBySenderCity = packageDetails.reduce((groups, pkg) => {
      const senderCity = pkg.senderCity || origin.city;
      if (!groups[senderCity]) {
        groups[senderCity] = [];
      }
      groups[senderCity].push(pkg);
      return groups;
    }, {});

    let totalTransportCost = 0;

    // Calculate the shipping rate for each distinct senderCity
    const shippingRatePromises = Object.keys(packagesGroupedBySenderCity).map(async (senderCity) => {
      const receiverCity = destination.city;

      const senderCoordinates = await getCoordinates(senderCity);
      const receiverCoordinates = await getCoordinates(receiverCity);

      const distance = await getDistance(senderCoordinates, receiverCoordinates);

      const shippingRate = calculateShippingRateByCity(senderCity, receiverCity, parseFloat(distance));

      totalTransportCost += shippingRate;
    });

    await Promise.all(shippingRatePromises);

    return res.json({
      totalTransportCost,
      message: 'Total shipping cost successfully calculated.',
    });
  } catch (error) {
    console.error('Error fetching shipping rates:', error.message);

    return res.status(500).json({
      message: 'Error fetching shipping rates.',
      error: error.message,
    });
  }
});

const SHIPENGINE_API_BASE = process.env.SHIPENGINE_API_BASE;
const SHIPENGINE_API_KEY = process.env.SHIPENGINE_API_KEY; 

const createShipment = async (orderData) => {

  const shipTo = {
    name: orderData.buyerDetails.name || 'Default Name',
    address_line1: orderData.buyerDetails.address,
    city_locality: orderData.buyerDetails.city,
    postal_code: '00000', 
    country_code: 'LK', 
    phone: orderData.buyerDetails.phone || '0000000000', 
    email: orderData.buyerDetails.email || 'default@email.com', 
    instructions: '', 
  };

  const shipFrom = {
    name: orderData.farmers[0].farmerDetails.name || 'Default Name', 
    address_line1: orderData.farmers[0].farmerDetails.farmerAddress,
    city_locality: orderData.farmers[0].farmerDetails.location,
    postal_code: '00000', // Adjust if needed
    country_code: 'LK', // Sri Lanka
    phone: orderData.farmers[0].farmerDetails.phone || '0000000000',
    email: orderData.farmers[0].farmerDetails.email || 'default@email.com', 
    instructions: '', 
  };

  if (shipTo.name && shipTo.name.split(' ').length < 2) {
    shipTo.name = 'Default Full Name'; 
  }

  if (shipFrom.name && shipFrom.name.split(' ').length < 2) {
    shipFrom.name = 'Default Full Name'; 
  }

  // Shipment payload
  const shipmentPayload = {
    shipments: [
      {
        validate_address: 'no_validation',
        carrier_id: 'se-1488525', 
        service_code: 'usps_priority_mail',
        ship_to: shipTo,
        ship_from: shipFrom,
        return_to: shipFrom,
        customs: {
          contents: 'merchandise', 
          contents_explanation: 'Excess rice for sale',
          non_delivery: 'return_to_sender', 
          terms_of_trade_code: 'exw', 
          declaration: 'This is a shipment of excess rice for sale.', 
          invoice_additional_details: {
            freight_charge: {
              currency: 'USD',
              amount: 1,
            },
            insurance_charge: {
              currency: 'USD',
              amount: 1,
            },
            discount: {
              currency: 'USD',
              amount: 1,
            },
            other_charge: {
              currency: 'USD',
              amount: 1,
            },
            other_charge_description: '',
          },
          importer_of_record: {
            name: 'John Doe',
            phone: '0000000000',
            email: 'defaultimporter@email.com', 
            address_line1: '1999 Bishop Grandin Blvd.', 
            city_locality: 'Winnipeg',
            postal_code: '78756-3717',
            country_code: 'CA', 
          },
          customs_items: [
            {
              description: 'Excess rice',
              quantity: 1, 
              weight: {
                value: 1, 
                unit: 'pound', 
              },
              value: {
                currency: 'USD', 
                amount: 10, 
              },
              hs_tariff_number: '10063000', 
              origin_country: 'LK', 
            },
          ],
        },
        packages: [
          {
            weight: {
              value: 1, 
              unit: 'pound',
            },
            dimensions: {
              length: 10, 
              width: 10,
              height: 10,
              unit: 'inch', 
            },
            insured_value: {
              currency: 'USD',
              amount: 10, 
            },
            content_description: 'Excess rice for sale',
          },
        ],
        advanced_options: {
          bill_to_account: null,
          bill_to_country_code: 'LK',
          contains_alcohol: false,
          dangerous_goods: false,
          dry_ice: false,
          dry_ice_weight: {
            value: 0,
            unit: 'pound',
          },
          third_party_consignee: false,
        },
      },
    ],
  };

  try {
    const response = await fetch(`${SHIPENGINE_API_BASE}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': SHIPENGINE_API_KEY,
      },
      body: JSON.stringify(shipmentPayload),
    });

    const data = await response.json();

    if (response.ok) {
    } else {
      console.error('Error creating shipment:', data.errors);
    }
  } catch (error) {
    console.error('Error creating shipment:', error);
  }
};


router.post('/payment-success', authenticateToken, async (req, res) => {
  try {
    const orderData = req.body.orderDetails;

    if (!orderData.paymentDetails) {
      return res.status(400).json({ message: 'Payment details are missing' });
    }

    if (!orderData.paymentDetails.paymentId || orderData.paymentDetails.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'Invalid or incomplete payment details' });
    }

    // Save the order to the database
    const newOrder = new Order({ ...orderData });
    await newOrder.save();

    // Check if transportation/delivery is chosen
    if (orderData.transportation === 'Delivery') {
      try {
        const shipment = await createShipment(orderData);

        newOrder.shippingDetails = shipment;
        await newOrder.save();

      } catch (error) {
        console.error('Error creating shipment:', error.message);
        return res.status(500).json({ message: 'Error creating shipment.', error: error.message });
      }
    }

    res.status(201).json({ message: 'Order placed and shipment created successfully.', order: newOrder });
  } catch (error) {
    console.error('Error processing payment and shipment:', error.message);
    res.status(500).json({ message: 'Error processing payment or creating shipment.', error: error.message });
  }
});


router.post("/send-link", authenticateToken, asyncHandler(async (req, res) => {
  const { orderId, farmerName, farmerEmail, totalAmount } = req.body;

  if (!farmerEmail) {
    return res.status(400).json({ message: "Farmer email is required." });
  }

  if (!totalAmount) {
    return res.status(400).json({ message: "Farmer total amount is required." });
  }

  try {
    const order = await Order.findById(orderId).populate('farmers.products');
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    
    const conversionRate = 300; 
    const convertedPrice = (totalAmount / conversionRate).toFixed(2); 

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: 'USD',  
          value: convertedPrice,
        },
        description: "Payment for order",
        custom_id: orderId, 
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    });

    const payment = await client.execute(request);

    const approvalLink = payment.result.links.find(link => link.rel === 'approve');
    if (!approvalLink) {
      console.error("Approval URL not found:", payment.result.links);
      return res.status(500).json({ message: "Approval URL not found in PayPal response." });
    }

    const paymentLink = approvalLink.href;

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
             <p>This link will expire in 1 hour. Total amount due: LKR ${totalAmount}</p>`,
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

// POST /api/orders/submit-review/:orderId/:productId
router.post('/submit-review/:orderId/:productId', async (req, res) => {
  const { orderId, productId } = req.params;
  const { rating, comment, reviewerName } = req.body;

  try {   
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order not found for orderId: ${orderId}`);
      return res.status(404).json({ message: "Order not found" });
    }
        
    const product = order.farmers
      .flatMap(farmer => farmer.products) 
      .find(p => p._id && p._id.toString() === productId); 
    
    if (!product) {
      console.log(`Product not found for productId: ${productId}`);
      return res.status(404).json({ message: "Product not found" });
    }
    
    const review = { rating, comment, reviewerName };
        
    product.reviews.push(review);

    await order.save();

    res.status(200).json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get('/transactions/reviews', authenticateToken, async (req, res) => {
  try {
    const { productId, reviewerName } = req.query;

    const transactions = await Order.find();

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found.');
      return res.status(404).json({ message: 'No transactions found.' });
    }

    let productReviews = transactions
      .flatMap(transaction =>
        transaction.farmers.flatMap(farmer =>
          farmer.products.map(product => {
            return {
              productId: product.productId, 
              productName: product.name, 
              reviews: product.reviews.map(review => ({
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                createdAt: review.createdAt,
              })),
            };
          })
        )
      );

    if (productId) {
      productReviews = productReviews.filter(product => product.productId === productId);
    }
    if (reviewerName) {
      productReviews = productReviews
        .map(product => ({
          ...product,
          reviews: product.reviews.filter(review => review.reviewerName === reviewerName),
        }))
        .filter(product => product.reviews.length > 0);
    }

    if (productReviews.length === 0) {
      console.log('No product reviews found after filtering.');
      return res.status(404).json({ message: 'No product reviews found.' });
    }

    res.status(200).json({ reviews: productReviews });
  } catch (err) {
    console.error('Error fetching reviews:', err.message);
    res.status(500).json({ message: 'Error fetching reviews. Please try again later.', error: err.message });
  }
});

module.exports = router;
