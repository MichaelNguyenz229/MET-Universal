/**
 * DRIVE MODULE: The Librarian
 * Responsibility: Finding, fetching, and archiving files.
 */

function getLatestPDF() {
  const folderName = "MET_Drop_Zone";
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (!folders.hasNext()) return null;
  
  const folder = folders.next();
  const files = folder.getFilesByType(MimeType.PDF);
  
  return files.hasNext() ? files.next() : null;
}

function archiveFile(file) {
  const archiveFolderName = "MET_Archive";
  let archiveFolder;
  const folders = DriveApp.getFoldersByName(archiveFolderName);
  
  if (folders.hasNext()) {
    archiveFolder = folders.next();
  } else {
    // Create it if it doesn't exist
    archiveFolder = DriveApp.createFolder(archiveFolderName);
  }
  
  file.moveTo(archiveFolder);
  console.log(`Archived: ${file.getName()}`);
}

/**
 * DRIVE MODULE: Batch Processor
 * Processes PDFs based on folder state rather than just a counter.
 */
function processAllPDFs() {
  const folder = DriveApp.getFoldersByName("MET_Drop_Zone").next();
  const fileIterator = folder.getFilesByType(MimeType.PDF);
  
  // 1. Initial State Check: Is the folder empty?
  if (!fileIterator.hasNext()) {
    SpreadsheetApp.getUi().alert("📁 Folder is empty. Nothing to process!");
    return;
  }

  let workWasPerformed = false;

  // 2. Process the Queue
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    console.log("Processing: " + file.getName());
    
    const success = extractTransactionsFromFile(file); 
    
    if (success) {
      archiveFile(file); 
      workWasPerformed = true; 
    }
  }
  
  // 3. Final Verification
  if (workWasPerformed) {
    SpreadsheetApp.getUi().alert("✅ Batch Complete: All files processed and archived.");
  } else {
    SpreadsheetApp.getUi().alert("⚠️ Files were found, but none were successfully processed. Check your API logs.");
  }
}

/**
 * Archives a processed file into the Archive folder 
 * nested inside the MET-Universal parent folder.
 */
function archiveFile(file) {
  const parentName = "MET-Universal";
  const archiveName = "MET_Archive";
  
  // 1. Find the Parent Folder
  const parentFolders = DriveApp.getFoldersByName(parentName);
  let parentFolder;
  
  if (parentFolders.hasNext()) {
    parentFolder = parentFolders.next();
  } else {
    // If somehow the parent is gone, create it as a fallback
    parentFolder = DriveApp.createFolder(parentName);
  }

  // 2. Find or Create the Archive folder INSIDE the parent
  const archiveFolders = parentFolder.getFoldersByName(archiveName);
  let archiveFolder;

  if (archiveFolders.hasNext()) {
    archiveFolder = archiveFolders.next();
  } else {
    // Crucial change: parentFolder.createFolder instead of DriveApp.createFolder
    archiveFolder = parentFolder.createFolder(archiveName);
  }

  // 3. Move the file
  file.moveTo(archiveFolder);
  console.log(`Successfully archived ${file.getName()} to ${parentName}/${archiveName}`);
}

/**
 * DRIVE MODULE: Search
 * Finds a specific PDF file by name in the Drop Zone.
 */
function getSpecificPDF(fileName) {
  const folderName = "MET_Drop_Zone";
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (!folders.hasNext()) return null;
  
  const folder = folders.next();
  // We search for files with that exact name
  const files = folder.getFilesByName(fileName);
  
  return files.hasNext() ? files.next() : null;
}