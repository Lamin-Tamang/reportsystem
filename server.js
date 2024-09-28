// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://lamintamang945:codersformula9@cluster0.vjsph.mongodb.net/scamdb?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Report Schema and Model
const reportSchema = new mongoose.Schema({
    username: String,
    issue: String,
    reporting: String,  
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Setup email transporter using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send notification to the user
const sendUserNotification = (email, reporting, issue) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Thank You for Your Report Regarding ${reporting}`,
        text: `Dear User,\n\nThank you for submitting your report regarding "${reporting}".\n\nYour report has been successfully received and logged. Our team will review the details and take the necessary actions.\n\nReport Summary:\n- Reporting: ${reporting}\n- Issue: ${issue}\n- Date: ${new Date().toLocaleDateString()}\n\nBest regards,\nScam Aggregator Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error sending user notification email: ${error}`);
        } else {
            console.log(`User notification email sent: ${info.response}`);
        }
    });
};

// Function to send report to the cyber bureau
const sendReportToCyberBureau = (reports, reporting, issue) => {
    const reportDetails = reports.map((report, index) => (
        `${index + 1}. Report by ${report.username}\n` +
        ` - Reporting: ${report.reporting}\n` +
        ` - Issue: ${report.issue}\n` +
        ` - Date: ${report.createdAt.toLocaleDateString()}\n`
    )).join('\n');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'regmirasad53@gmail.com', // Replace with actual cyber bureau email
        subject: `Cyber Bureau Report - Multiple Reports on ${reporting}`,
        text: `To the Cyber Bureau,\n\nThis is to inform you that we have received five or more unique reports regarding a possible issue with "${reporting}". Below are the details:\n\nTotal Reports: ${reports.length}\n\nReport Details:\n${reportDetails}\n\nWe recommend investigating the reported issue further and taking the necessary actions to prevent any damage or malicious activity.\n\nBest regards,\nScam Aggregator Team`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error sending report to cyber bureau: ${error}`);
        } else {
            console.log(`Report sent to cyber bureau: ${info.response}`);
        }
    });
};

// API endpoint to add a report
app.post('/reports', async (req, res) => {
    const { username, issue, reporting, userEmail } = req.body;

    try {
        // Check if the report already exists in the database
        const existingReport = await Report.findOne({
            username,
            issue,
            reporting
        });

        if (existingReport) {
            return res.status(400).json({ message: "You have already reported this issue." });
        }

        const newReport = new Report({
            username,
            issue,
            reporting
        });

        await newReport.save();

        // Send notification to the user
        sendUserNotification(userEmail, reporting, issue);

        // Find unique reports by distinct users on the same report name
        const reports = await Report.aggregate([
            { $match: { reporting: reporting } },
            { $group: { _id: "$username", count: { $sum: 1 } } }
        ]);

        // Check if there are 5 or more unique users who reported the same issue
        if (reports.length >= 5) {
            const uniqueReports = await Report.find({ reporting: reporting });
            sendReportToCyberBureau(uniqueReports, reporting, issue);  // Send report to the cyber bureau
        }

        res.json({ message: "Report added and notification sent." });
    } catch (error) {
        res.status(500).json({ message: "Error adding report", error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});