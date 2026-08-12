// Install required packages first: npm install express body-parser cors
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parsing middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST Endpoint: Receives medical and insurance details from the elderly patient's portal
 * In production, this data would encrypt and push to an EHR/FHIR-compliant system.
 */
app.post('/api/transfer-records', (req, requireResponse) => {
    const { patientName, dob, insuranceProvider, policyNumber, medicalHistory, targetDoctor } = req.body;

    // Validate essential inputs
    if (!patientName || !insuranceProvider || !policyNumber || !targetDoctor) {
        return requireResponse.status(400).json({ 
            success: false, 
            message: "Missing mandatory health or insurance fields." 
        });
    }

    // Format log payload representing successful transfer straight to the provider
    console.log(`[SECURE TRANSFER] New records dispatched to Dr. ${targetDoctor}:`);
    console.log(`Patient: ${patientName} (DOB: ${dob})`);
    console.log(`Insurance: ${insuranceProvider} | Policy: ${policyNumber}`);
    console.log(`Clinical Notes: ${medicalHistory}`);

    // Return success state to update the UI immediately
    return requireResponse.status(200).json({
        success: true,
        message: `Your medical information has been securely transferred to Dr. ${targetDoctor}.`
    });
});

// Start the local development server
app.listen(PORT, () => {
    console.log(`Healthcare portal backend live at: http://localhost:${PORT}`);
});
