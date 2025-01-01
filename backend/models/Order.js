const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerDetails: {
    name: String,
    email: String,
    address: String,
    location: String,
  },
  farmers: [
    {
      farmerDetails: {
        farmerName: String,
        farmerEmail: String,
        farmerAddress: String,
        location: String,
      },
      products: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Use MongoDB _id
          name: String,
          quantity: Number,
          price: Number,
          grade: String,
          image: String,
          reviews: [
            {
              rating: { type: Number, min: 1, max: 5 },
              comment: String,
              createdAt: { type: Date, default: Date.now },
              reviewerName: { type: String, default: function() { return this.buyerDetails.name; } },
            }
          ]
        },
      ],
    },
  ],
  transportation: String,
  transportationCost: Number,
  totalPrice: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  paymentDetails: {
    paymentId: String, 
    paymentMethod: String,
    paymentDate: Date,
    amount: Number,
    paymentStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  },
});

module.exports = mongoose.model('Order', orderSchema);
