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

// Supabase Signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Supabase Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });

    if (!data.session || !data.user) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    res.json(data);
  } catch (err) {
    console.error("Unexpected login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Get Orders Table
app.get('/orders_table', async (req, res) => {
  const { data, error } = await supabase.from('orders_table').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

//Add New Order
app.post('/order-add', async (req, res) => {
  try {
    const {
      rider_id,customer_name,customer_address,cod_amount,status
    } = req.body;

    // Insert into Supabase table
    const { data, error } = await supabase.from('orders_table').insert([
      {
        rider_id,          // optional, can be null
        customer_name,     // optional, defaults to 'default-text' if not provided
        customer_address,  // optional
        cod_amount,        // optional, defaults to 0 if not provided
        status             // optional, defaults to 'default-text' if not provided
      }
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Return the inserted row(s)
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Change Order Status
app.put('/order-status/', async (req, res) => {
  try {
    const { id } = req.params;          // Get order id from URL
    const { status } = req.body;        // Get new status from request body

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Update the order with the matching id
    const { data, error } = await supabase
      .from('orders_table')
      .update({ status })
      .eq('id', id);  // Filter by primary key

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
