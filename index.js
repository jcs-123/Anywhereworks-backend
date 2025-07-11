require('dotenv').config();
const express = require('express');
const cors = require('cors');
const router = require('./router');
const path = require('path');
require('./connection');

const Anywhereworks = express();

Anywhereworks.use(cors());
Anywhereworks.use(express.json());

// ✅ Serve uploaded files
Anywhereworks.use('/uploads', express.static(path.join(__dirname, 'upload')));

// ✅ Mount the router
Anywhereworks.use('/', router);

// Base route
Anywhereworks.get('/', (req, res) => {
  res.send('Get Request Received');
});

// Start server
const PORT = process.env.PORT || 4000;
Anywhereworks.listen(PORT, () => {
  console.log(`Server is running successfully at PORT ${PORT}`);
});
