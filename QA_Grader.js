/**
 * THE AUTO-GRADER (V2: Amount Aware)
 * Now using the correct loop structure for async/await.
 */
async function runAutoGrader() {
  const testSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("QA_Dashboard");
  const groundTruth = getGroundTruthData(); 
  
  console.log(`Starting Grade for ${groundTruth.length} items...`);

  // ✅ Use for...of instead of .forEach
  for (const item of groundTruth) {
    console.log(`Testing: ${item.description} ($${item.amount})`);

    // 1. Now this WILL wait for Gemini to respond
    const aiResponse = await callGeminiForCategory(item.description, item.amount);
    
    // 2. Normalize both to lowercase so "Groceries" matches "groceries"
    const isCorrect = (aiResponse.toLowerCase().trim() === item.correctCategory.toLowerCase().trim());
    
    // 3. Log to the dashboard
    testSheet.appendRow([
      new Date(), 
      item.description, 
      item.amount, 
      item.correctCategory, 
      aiResponse, 
      isCorrect ? "✅ PASS" : "❌ FAIL"
    ]);

    // Small pause to avoid hitting API rate limits too fast
    Utilities.sleep(500); 
  }
  
  console.log("Grading Complete!");
}

/**
 * Fetches the manually verified transaction data from 2025.
 * This serves as our "Answer Key" for the Auto-Grader.
 */
function getGroundTruthData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Ensure this name matches your tab exactly! 
  const sheet = ss.getSheetByName("Ground_Truth"); 
  
  if (!sheet) {
    throw new Error("Could not find the 'Ground_Truth' tab. Please create it or check the name.");
  }

  // Get all data starting from row 2 (skipping headers)
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // No data to test
  
  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  // Map the raw rows into an array of clean "Test Case" objects
  return data
    .filter(row => row[0] !== "" && row[2] !== "") // Skip rows missing Desc or Category
    .map(row => {
      return {
        description: row[0].toString().trim(),
        amount: parseFloat(row[1]) || 0, // Ensure amount is a clean number
        correctCategory: row[2].toString().trim()
      };
    });
}