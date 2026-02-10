

function createProjectFolders() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet(); 
  const parentName = "MET-Universal";
  let parentFolder;
  const parentFolders = DriveApp.getFoldersByName(parentName);
  
  if (parentFolders.hasNext()) {
    parentFolder = parentFolders.next();
  } else {
    parentFolder = DriveApp.createFolder(parentName);
  }

  const dropZoneName = "MET_Drop_Zone";
  let dropZone;
  const dropZones = parentFolder.getFoldersByName(dropZoneName);
  
  if (dropZones.hasNext()) {
    dropZone = dropZones.next();
  } else {
    dropZone = parentFolder.createFolder(dropZoneName);
  }

  
  // 2. Logic from UI.js to build the template
  createMasterTemplate(); 
  
  SpreadsheetApp.getUi().alert("Setup Complete! System is now modular.");

  try {
    // 1. Create or Find the Parent "MET-Universal" Folder
    const parentName = "MET-Universal";
    let parentFolder;
    const parentFolders = DriveApp.getFoldersByName(parentName);
    
    if (parentFolders.hasNext()) {
      parentFolder = parentFolders.next();
    } else {
      parentFolder = DriveApp.createFolder(parentName);
    }

    // 2. Move this Spreadsheet into that Parent Folder
    const file = DriveApp.getFileById(ss.getId());
    const currentFolders = file.getParents();
    
    // Check if it's already in the right folder to avoid duplicates
    let alreadyInFolder = false;
    while (currentFolders.hasNext()) {
      if (currentFolders.next().getId() === parentFolder.getId()) {
        alreadyInFolder = true;
      }
    }

    if (!alreadyInFolder) {
      parentFolder.addFile(file);
      // Remove it from the old location (usually Root/My Drive)
      DriveApp.getRootFolder().removeFile(file); 
    }

    // 3. Create the "Drop_Zone" inside the Parent Folder
    const dropZoneName = "MET_Drop_Zone";
    let dropZone;
    const dropZones = parentFolder.getFoldersByName(dropZoneName);
    
    if (dropZones.hasNext()) {
      dropZone = dropZones.next();
    } else {
      dropZone = parentFolder.createFolder(dropZoneName);
    }

    
  } catch (e) {
    ui.alert("❌ Setup Error: " + e.toString());
  }
}

/**
 * Creates a new sheet for the current month based on a template.
 */
function createMonthlySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const template = ss.getSheetByName("TEMPLATE_DO_NOT_DELETE");
  
  if (!template) {
    SpreadsheetApp.getUi().alert("Error: Template sheet not found!");
    return;
  }

  // Get current Date (e.g., February 2026)
  const date = new Date();
  const monthName = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM yyyy");

  let monthlySheet = ss.getSheetByName(monthName);

  if (!monthlySheet) {
    // Duplicate the template and rename it
    monthlySheet = template.copyTo(ss).setName(monthName).showSheet();
    SpreadsheetApp.getUi().alert(`New sheet created for ${monthName}!`);
  } else {
    SpreadsheetApp.getUi().alert(`Sheet for ${monthName} already exists.`);
  }
  
  // Make this the active sheet so the Vision script hits the right target
  ss.setActiveSheet(monthlySheet);
}
