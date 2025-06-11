import sgMail from "@sendgrid/mail"
import { config } from "dotenv"

config()

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Generic send email function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log('Attempting to send email:', {
      to,
      subject,
      from: process.env.FROM_EMAIL
    });
    
    const msg = {
      to,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject,
      html
    };

    const result = await sgMail.send(msg);
    console.log('Email sent successfully:', {
      response: result[0].statusCode
    });
    return result;
  } catch (error) {
    console.error('Email sending error:', {
      error: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
}

// Test email function
export const testEmail = async () => {
  try {
    const msg = {
      to: process.env.ADMIN_EMAIL,
      subject: "Test Email - Pizza King",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Pizza King to verify SendGrid configuration.</p>
        <p>If you received this email, your SendGrid setup is working correctly!</p>
      `
    };

    const result = await sendEmail(msg);
    console.log('Test email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Test email error:', error);
    throw error;
  }
}

// Send verification email
export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const msg = {
    to: email,
    subject: "Verify your email - Pizza King",
    html: `
      <h1>Welcome to Pizza King!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  return sendEmail(msg);
}

// Send password reset email
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const msg = {
    to: email,
    subject: "Reset your password - Pizza King",
    html: `
      <h1>Reset Your Password</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  return sendEmail(msg);
}

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  const msg = {
    to: order.user.email,
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order. Here are your order details:</p>
      <h2>Order #${order.orderNumber}</h2>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `
          <li>
            ${item.pizza ? item.pizza.name : "Custom Pizza"} x ${item.quantity}
            (₹${item.price * item.quantity})
          </li>
        `).join("")}
      </ul>
      <p>We'll notify you when your order status changes.</p>
    `
  };

  return sendEmail(msg);
}

// Send order status update email
export const sendOrderStatusUpdateEmail = async (order) => {
  const msg = {
    to: order.user.email,
    subject: `Order Status Updated - #${order.orderNumber}`,
    html: `
      <h1>Order Status Updated</h1>
      <p>Your order status has been updated:</p>
      <h2>Order #${order.orderNumber}</h2>
      <p><strong>New Status:</strong> ${order.status}</p>
      <p>Track your order on our website.</p>
    `
  };

  return sendEmail(msg);
}

// Send low stock alert email
export const sendLowStockAlert = async (items) => {
  const msg = {
    to: process.env.ADMIN_EMAIL,
    subject: "Low Stock Alert - Pizza King",
    html: `
      <h1>Low Stock Alert</h1>
      <p>The following items are running low on stock:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Current Stock</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Threshold</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Supplier</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.name}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.quantity} ${item.unit}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.threshold} ${item.unit}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">
                ${item.supplier.name}<br>
                ${item.supplier.contact}<br>
                ${item.supplier.email}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p style="margin-top: 20px;">Please take necessary action to restock these items.</p>
    `
  };

  return sendEmail(msg);
}