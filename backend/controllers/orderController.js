const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail');

const addOrderItems = async (req, res) => {
  try {
    const { items, totalAmount, address, paymentId } = req.body;
    if (items && items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } else {
      const order = new Order({
        userId: req.user._id,
        items,
        totalAmount,
        address,
        paymentId
      });
      const createdOrder = await order.save();

      // Send Order Confirmation Email
      const message = `
        <h2>Order Confirmation</h2>
        <p>Hello ${req.user.name},</p>
        <p>Your order has been successfully placed! Order ID: <strong>${createdOrder._id}</strong></p>
        <p>Total Amount Paid: $${totalAmount.toFixed(2)}</p>
        <p>It will be shipped to: ${address.street}, ${address.city}</p>
        <p>Thank you for shopping with ShopNest!</p>
      `;

      // Email to Customer
const customerMessage = `
<h2>Order Confirmation</h2>

<p>Hello <b>${req.user.name}</b>,</p>

<p>Your order has been placed successfully.</p>

<p><b>Order ID:</b> ${createdOrder._id}</p>

<p><b>Total Amount:</b> ₹${totalAmount}</p>

<p>Shipping Address:</p>

<p>
${address.street}<br>
${address.city}
</p>

<p>Thank you for shopping with <b>ApnaShop</b>.</p>
`;

await sendEmail({
    email: req.user.email,
    subject: "ApnaShop - Order Confirmation",
    message: customerMessage
});

// Email to Admin
const adminMessage = `
<h2>🛒 New Order Received</h2>

<table border="1" cellpadding="8">
<tr>
<td><b>Customer</b></td>
<td>${req.user.name}</td>
</tr>

<tr>
<td><b>Email</b></td>
<td>${req.user.email}</td>
</tr>

<tr>
<td><b>Order ID</b></td>
<td>${createdOrder._id}</td>
</tr>

<tr>
<td><b>Total Amount</b></td>
<td>₹${totalAmount}</td>
</tr>

<tr>
<td><b>Items</b></td>
<td>${items.length}</td>
</tr>
</table>

<p>Please check the Admin Dashboard.</p>
`;

await sendEmail({
    email: process.env.ADMIN_EMAIL,
    subject: "🛒 New Order - ApnaShop",
    message: adminMessage
});

      res.status(201).json(createdOrder);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'id name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addOrderItems, getMyOrders, getOrders, updateOrderStatus };
