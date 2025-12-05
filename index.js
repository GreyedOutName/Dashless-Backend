const { createClient } = require('@supabase/supabase-js');
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

//supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
module.exports = supabase;

// Endpoint to create a PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await payrexClient.paymentIntents.create({
      amount,
      currency: 'PHP',
      payment_methods: ['qrph','maya'],
    });

    res.json({ clientSecret: paymentIntent.clientSecret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Optional health check
app.get('/', (req, res) => res.send('PayRex backend running!'));

//Get Orders Table
app.get('/orders_table', async (req, res) => {
  const { data, error } = await supabase.from('orders_table').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

//Change Order Status
app.post('/order-status', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase.from('orders_table').insert([{ name, email }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
