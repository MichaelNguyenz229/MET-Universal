/**
 * QA AUTOMATION SUITE: MET-Universal Pipeline
 * Simulates the Optimus QA testing methodology for data ingestion.
 */

// ==========================================
// 1. QA FRAMEWORK (The "Assert" Functions)
// ==========================================
function assertCondition(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${testName} | Condition was not met.`);
    return false;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ PASS: ${testName}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${testName} | Expected: ${expected} | Actual: ${actual}`);
    return false;
  }
}

// ==========================================
// 2. THE TEST CASES
// ==========================================

async function runRegressionSuite() {
  console.log("🚀 STARTING AUTOMATED REGRESSION SUITE...");
  let passedTests = 0;
  let totalTests = 0;

  // ---------------------------------------------------------
  // TEST CASE 01: Verify PDF Trimmer handles small files safely
  // ---------------------------------------------------------
  totalTests++;
  try {
    console.log("Running Test 01: PDF Trimmer Safe Fallback...");
    // Simulate a fake file object that is too short to trim
    const mockSmallFile = {
      getBlob: () => Utilities.newBlob("fake data", "application/pdf", "small.pdf")
    };
    
    // We expect it to fallback and return the original blob, not crash.
    const resultBlob = await getTrimmedPDFBlob(mockSmallFile);
    
    const passed = assertCondition(resultBlob !== null, "TC-01: Trimmer returned a valid Blob instead of crashing");
    if (passed) passedTests++;
  } catch (e) {
    console.error(`❌ FAIL: TC-01 crashed. Error: ${e.message}`);
  }

  // ---------------------------------------------------------
  // TEST CASE 02: Prompt Adherence (Autopay Exclusion)
  // ---------------------------------------------------------
  totalTests++;
  try {
    console.log("Running Test 02: Negative Constraint Adherence (Autopay)...");
    
    // Simulate what Gemini returns if it accidentally captures an Autopay
    const mockGeminiResponse = [
      { date: "12/15", description: "UBER *TRIP", amount: 39.31 },
      { date: "12/20", description: "AUTOPAY AUTO-PMT", amount: 1200.00 } // This is the bug!
    ];
    
    // QA Logic: Scan the output to ensure NO description contains "AUTOPAY"
    const hasAutopay = mockGeminiResponse.some(t => t.description.includes("AUTOPAY"));
    
    // We expect hasAutopay to be FALSE. If it's true, the prompt regressed!
    const passed = assertEqual(hasAutopay, false, "TC-02: Output contains forbidden AUTOPAY transactions");
    if (passed) passedTests++;
  } catch (e) {
    console.error(`❌ FAIL: TC-02 crashed. Error: ${e.message}`);
  }

  // ==========================================
  // 3. QA REPORTING
  // ==========================================
  console.log(`\n📊 REGRESSION RUN COMPLETE`);
  console.log(`Results: ${passedTests} / ${totalTests} Passed.`);
  
  if (passedTests === totalTests) {
    console.log("🟢 STATUS: GO FOR DEPLOYMENT");
  } else {
    console.error("🔴 STATUS: DEPLOYMENT HALTED. Fix failing tests.");
  }
}