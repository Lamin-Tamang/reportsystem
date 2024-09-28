// models/Report.js
const mongoose = require('mongoose');

// Report Schema
const reportSchema = new mongoose.Schema({
userEmail: {
type: String,
required: true,
},
reportSchema: {
type: String,
required: true,
},
reportType: {
type: String,
required: true, // e.g., Phishing Attempt, Spam, etc.
},
createdAt: {
type: Date,
default: Date.now,
},
});

// Export the model
module.exports = mongoose.model('Report', reportSchema);