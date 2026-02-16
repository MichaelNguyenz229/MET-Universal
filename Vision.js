/**
 * VISION MODULE: Main Entry Point
 * Robust version that handles both File objects and Blobs.
 */
async function extractTransactionsFromFile(file) {
  // FEATURE FLAG: Set to false to verify "Vanilla" performance
  const ENABLE_SLICING = true; 

  try {
    const startTime = new Date().getTime();
    let blobToSend;

    // --- STEP 1: PRE-PROCESS (TRIMMING) ---
    if (ENABLE_SLICING) {
      try {
        const result = await getTrimmedPDFBlob(file);
        
        // UNIVERSAL ADAPTER: Coerce the result into a standardized Blob
        if (result && typeof result.getBlob === 'function') {
          // If it's a Drive File object, unwrap it
          blobToSend = result.getBlob();
        } else if (result && typeof result.getBytes === 'function') {
          // If it's already a Blob, use it
          blobToSend = result;
        } else {
          // If it's weird (null/undefined/unknown), fallback to original
          console.warn("Trimmer returned invalid object. Using original.");
          blobToSend = file.getBlob();
        }
      } catch (trimErr) {
        console.error("Trimming crashed. Fallback active. Error: " + trimErr);
        blobToSend = file.getBlob();
      }
    } else {
      blobToSend = file.getBlob();
    }

    // --- STEP 2: NETWORK CALL ---
    // Now blobToSend is GUARANTEED to be a Blob (or the script would have failed in the catch)
    const response = await callGeminiAPI(blobToSend);
    
    const endTime = new Date().getTime();
    const latency = ((endTime - startTime) / 1000).toFixed(2);

    if (!response || response.error) throw new Error(response.error?.message || "API Fail");

    // --- STEP 3: DATA EXTRACTION ---
    const usage = response.usageMetadata;
    const transactions = JSON.parse(response.candidates[0].content.parts[0].text);

    // --- STEP 4: UI OUTPUT ---
    writeTransactionsToSheet(transactions, usage.totalTokenCount, latency, file.getName());

    return true;
  } catch (e) {
    console.error("Pipeline Error: " + e.message);
    return false;
  }
}

/**
 * VISION HELPER: Networking
 */
async function callGeminiAPI(trimmedBlob) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  // Now trimmedBlob is a real Blob, getBytes() will succeed
  const base64Data = Utilities.base64Encode(trimmedBlob.getBytes());
  
  const payload = {
    "contents": [{
      "parts": [
        { "text": "JSON array: [{date, description, amount, category, bank, confidence}]. Categories: [Groceries, Gas, Restaurants, Leisure, Subscriptions, Misc]. Exclude 'AUTOPAY'." },
        { "inline_data": { "mime_type": "application/pdf", "data": base64Data } }
      ]
    }],
    "generationConfig": {
      "responseMimeType": "application/json",
      "temperature": 0.1,
      "media_resolution": "MEDIA_RESOLUTION_LOW",
    }
  };
  
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload) };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

/**
 * VISION HELPER: UI / Writing
 */
function writeTransactionsToSheet(transactions, tokens, latency, fileName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const monthName = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM yyyy");
  let sheet = ss.getSheetByName(monthName) || ss.getActiveSheet();

  let startRow = sheet.getLastRow() + 1;
  if (startRow < 3) startRow = 3;

  transactions.forEach((t, index) => {
    const currentRow = startRow + index;
    const rowData = [[
      t.date, t.description, t.amount, t.category, t.bank, t.confidence,
      (index === 0 ? tokens : ""), (index === 0 ? latency + "s" : "")
    ]];

    sheet.getRange(currentRow, 2, 1, 8).setValues(rowData);
    if (t.confidence < 0.8) sheet.getRange(currentRow, 2, 1, 8).setBackground("#fff2f2");
  });
  
  console.log(`Processed ${fileName}: ${tokens} tokens, ${latency}s`);
}

/**
 * Specialized mini-call for the Auto-Grader.
 * Pulls the API key directly from Script Properties.
 */
async function callGeminiForCategory(description, amount) {
  // Use the same logic you use in callGeminiAPI
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in Script Properties.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Categorize this transaction. Return ONLY the category name from this list: [Groceries, Gas, Restaurants, Leisure, Subscriptions, Misc].
  
  Description: ${description}
  Amount: $${amount}`;

  const payload = {
    "contents": [{ "parts": [{ "text": prompt }] }],
    "generationConfig": { 
      "responseMimeType": "text/plain", // Ensuring simple text return
      "temperature": 0.1 
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    // Defensive check for the API response structure
    if (json.candidates && json.candidates[0].content.parts[0].text) {
      return json.candidates[0].content.parts[0].text.trim();
    } else {
      console.warn("Gemini returned unexpected format: ", json);
      return "Format Error";
    }
  } catch (e) {
    console.error("Gemini Guess Failed: " + e.message);
    return "Network Error";
  }
}