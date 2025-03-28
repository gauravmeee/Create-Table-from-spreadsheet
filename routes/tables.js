const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Table = require('../models/Table');
const path = require('path');

// Initialize Google Sheets API
const sheets = google.sheets('v4');

// Create credentials object from environment variables
const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID || 'revoeai-dashboard-assignment',
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || 'da97e66c8e00aa460463ead81a8f7c1de7dd9a1c',
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL || 'sheet-access@revoeai-dashboard-assignment.iam.gserviceaccount.com',
  client_id: process.env.GOOGLE_CLIENT_ID || '116684013413592560497',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/sheet-access%40revoeai-dashboard-assignment.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Validate required credentials
if (!credentials.private_key) {
  console.error('GOOGLE_PRIVATE_KEY environment variable is not set');
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

// Extract sheet ID from URL
const extractSheetId = (url) => {
  try {
    const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!matches) {
      throw new Error('Invalid Google Sheets URL format');
    }
    return matches[1];
  } catch (error) {
    console.error('Error extracting sheet ID:', error);
    throw new Error('Invalid Google Sheets URL');
  }
};

// Fetch data from Google Sheet
const fetchSheetData = async (sheetId) => {
  try {
    const authClient = await auth.getClient();
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: sheetId,
      range: 'Sheet1',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in sheet');
    }

    // Get headers
    const headers = rows[0];
    
    // Process data rows (skip empty rows)
    const data = rows.slice(1)
      .filter(row => row.some(cell => cell.trim() !== ''))
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          if (row[index] && row[index].trim() !== '') {
            obj[header] = row[index];
          }
        });
        return obj;
      });

    return {
      columns: headers.filter(header => header.trim() !== ''),
      data: data.filter(row => Object.keys(row).length > 0)
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    if (error.message.includes('Unable to parse range')) {
      throw new Error('Invalid sheet range. Please make sure the sheet has data in Sheet1.');
    }
    if (error.message.includes('Requested entity was not found')) {
      throw new Error('Sheet not found. Please check the URL and make sure the sheet is accessible.');
    }
    throw new Error(`Error fetching sheet data: ${error.message}`);
  }
};

// Create new table from Google Sheet
router.post('/', async (req, res) => {
  try {
    const { name, googleSheetUrl } = req.body;
    
    if (!name || !googleSheetUrl) {
      return res.status(400).json({ 
        message: 'Name and Google Sheet URL are required' 
      });
    }

    // Extract sheet ID
    let sheetId;
    try {
      sheetId = extractSheetId(googleSheetUrl);
    } catch (error) {
      return res.status(400).json({ 
        message: error.message 
      });
    }

    // Fetch data from Google Sheet
    let sheetData;
    try {
      sheetData = await fetchSheetData(sheetId);
    } catch (error) {
      return res.status(400).json({ 
        message: error.message 
      });
    }

    // Create new table
    const table = new Table({
      name,
      googleSheetId: sheetId,
      googleSheetUrl,
      columns: sheetData.columns,
      data: sheetData.data,
      owner: req.user.userId
    });

    await table.save();
    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ 
      message: 'Error creating table', 
      error: error.message 
    });
  }
});

// Get all tables for user
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find({ owner: req.user.userId });
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      message: 'Error fetching tables', 
      error: error.message 
    });
  }
});

// Get single table
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ 
      message: 'Error fetching table', 
      error: error.message 
    });
  }
});

// Update table data
router.put('/:id/sync', async (req, res) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Fetch latest data
    const sheetData = await fetchSheetData(table.googleSheetId);

    // Update table
    table.columns = sheetData.columns;
    table.data = sheetData.data;
    table.lastUpdated = new Date();
    await table.save();

    res.json(table);
  } catch (error) {
    console.error('Error syncing table:', error);
    res.status(500).json({ 
      message: 'Error syncing table', 
      error: error.message 
    });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ 
      message: 'Error deleting table', 
      error: error.message 
    });
  }
});

module.exports = router; 