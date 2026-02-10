
/**
 * VISION MODULE: The Brain
 * Accepts a file from the Librarian and extracts data via AI.
 */
function extractTransactionsFromFile(file) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty('GEMINI_API_KEY');
  
  // 1. Prepare the file (No folder searching needed!)
  const blob = file.getBlob();
  const base64Data = Utilities.base64Encode(blob.getBytes());
  const mimeType = blob.getContentType();

  // 2. Configure the AI Brain
// Change your URL line to this:
  // New URL for 2026 Beta standards
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
    Analyze this bank statement and extract ALL individual transactions.
    Return the data strictly as a JSON array of objects.
    
    Each object must have these exact keys:
    "date": "YYYY-MM-DD",
    "description": "Full merchant name",
    "amount": numerical value,
    "category": "One word category (Groceries, Gas, Restaurants, Leisure, Restaurants, Subscriptions, Misc)",
    "bank": "Name of the bank",
    "confidence": A number between 0 and 1 representing your certainty (1 is absolute certainty).

    If a merchant name is vague (e.g., "SQUARE" or "ZELLE"), lower the confidence score.
    If description key is named "AUTOPAY" or similar, do not extract it.
    Return ONLY the raw JSON array.
  `;

  const payload = {
    "contents": [{
      "parts": [
        { "text": prompt },
        { "inline_data": { "mime_type": mimeType, "data": base64Data } }
      ]
    }],
    "generationConfig": { "responseMimeType": "application/json" }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  // 3. Execution
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      console.log(`Token Usage for ${file.getName()}: ${result.usageMetadata.totalTokenCount}`);
      
      const transactions = JSON.parse(result.candidates[0].content.parts[0].text);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      // 1. Find where to start
      let startRow = sheet.getLastRow() + 1;
      if (startRow < 3) startRow = 3; // Force it to start at Row 3 if sheet is empty

      const startColumn = 2; // This is Column B
      // 2. Loop and Place
      transactions.forEach((t, index) => {
        const currentRow = startRow + index;
  
        // Define the data for this row
        const rowData = [[t.date, t.description, t.amount, t.category, t.bank, t.confidence]];
  
        // Set the values starting at Column B (2)
        sheet.getRange(currentRow, startColumn, 1, 6).setValues(rowData);
  
        // 3. Keep your confidence highlighting logic
        if (t.confidence < 0.8) {
          sheet.getRange(currentRow, startColumn, 1, 6).setBackground("#fff2f2"); 
        }
      });
      return true; // SUCCESS: Tell the loop it's okay to archive this file.
    } else {
      console.error("API Error: " + result.error.message);
      return false; // FAILURE
    }
  } catch (e) {
    console.error("Critical Error: " + e.toString());
    return false; // FAILURE
  }
}