require('dotenv').config();
const express = require('express');
const cors = require('cors');
const payrex = require('payrex-node');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PayRex client
const payrexSecretApiKey = process.env.PAYREX_SECRET_KEY;
const payrexClient = payrex(payrexSecretApiKey);

// Endpoint to create a PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await payrexClient.paymentIntents.create({
      amount,
      currency: 'PHP',
      payment_methods: ['qrph'],
    });

    res.json({ clientSecret: paymentIntent.clientSecret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Optional health check
app.get('/', (req, res) => res.send('PayRex backend running!'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
