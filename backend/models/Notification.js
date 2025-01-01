const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});
  
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
  