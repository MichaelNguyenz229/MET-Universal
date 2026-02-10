
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 MET-Universal')
    .addItem('📦 Process All Pending PDFs', 'processAllPDFs')
    .addItem('🆕 Start New Month Sheet', 'createMonthlySheet')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ System Admin')
        .addItem('🛠️ Run Initial Setup', 'createProjectFolders')
        .addItem('🎯 Process Specific File', 'processSpecificFile') // Renamed here too
        .addItem('🧹 Clean Active Sheet', 'resetActiveSheet'))
    .addToUi();
}
/**
 * UI MODULE: The Interior Designer.
 */

/**
 * UI MODULE: The Interior Designer
 * Bootstraps the professional template with Column A and Row 1 as "borders".
 */
function createMasterTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let template = ss.getSheetByName("TEMPLATE_DO_NOT_DELETE");

  if (!template) {
    template = ss.insertSheet("TEMPLATE_DO_NOT_DELETE");
    // --- ADD THIS SECTION ---
  
    // 1. Set Column A (Border) to 25 pixels (1/4 of default 100)
    template.setColumnWidth(1, 25);
  
    // 2. Set Row 1 (Border) to a similar thin size
    template.setRowHeight(1, 25);

    // 3. Pro-Tip: Make Column C (Description) wider while we are at it
    // Most bank descriptions are long, so 300-400px is usually better.
    template.setColumnWidth(3, 350); 

    // 4. Set the rest to a clean standard (optional)
    // [B:2, C:3, D:4, E:5, F:6, G:7]
    template.setColumnWidth(2, 100); // Date
    template.setColumnWidth(4, 100); // Amount
    template.setColumnWidth(5, 150); // Category
    template.setColumnWidth(6, 120); // Bank
    
    // 1. Define the Schema starting at B2
    const headers = [["Date", "Description", "Amount", "Category", "Bank", "Confidence"]];
    const headerRange = template.getRange("B2:G2");
    headerRange.setValues(headers);

    // 2. Header Styling: Light Blue background, Bold White text
    headerRange
      .setBackground("#3498db") // A clean, professional Light Blue
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    // 3. Set the "Borders" (A and 1) to a neutral Dark Grey
    template.getRange("A:A").setBackground("#444444");
    template.getRange("1:1").setBackground("#444444");
    
    // 4. Alternating Row Colors (B3 downwards)
    // We use a Conditional Format rule so it grows with your data
    const dataRange = template.getRange("B3:G1000");
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=ISODD(ROW())")
      .setBackground("#f4f4f4") // Light Grey for alternating rows
      .setRanges([dataRange])
      .build();
    
    const rules = template.getConditionalFormatRules();
    rules.push(rule);
    template.setConditionalFormatRules(rules);

    // 5. Freeze the UI borders and Headers
    template.setFrozenRows(2);
    template.setFrozenColumns(1);
    
    
    template.hideSheet();
    console.log("Master Template Styled: B2 Headers, A/1 Borders, Alternating Rows.");
  }
}

/**
 * UI MODULE: Utility
 * Wipes the data but PROTECTS headers and blue styling.
 */
function resetActiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Safety check: Don't do anything if there's no data below headers
  if (lastRow < 3) return;

  // 1. Target B3 to G (Everything below the header)
  // We use clearContent() so the background colors (zebra stripes) stay!
  const dataRange = sheet.getRange(3, 2, lastRow - 2, 6);
  dataRange.clearContent();
  
  // 2. Optional: If you want to delete the actual rows to reset the scroll bar
  sheet.deleteRows(3, lastRow - 2);
  
  SpreadsheetApp.getUi().alert("🧹 Data cleared. Blue headers preserved!");
}