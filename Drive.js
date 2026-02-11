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


/**
 * DRIVE MODULE: PDF Pre-processor
 */

async function getTrimmedPDFBlob(file) {
  try {
    const blob = file.getBlob();
    const pdf = PDFApp.setPDFBlob(blob);
    
    // 1. Get metadata and log it to solve the mystery
    const metadata = await pdf.getMetadata();
    console.log("DEBUG: Raw Metadata Type:", typeof metadata);
    console.log("DEBUG: Raw Metadata Content:", JSON.stringify(metadata));

    // Support both object and string returns
    const metaObj = (typeof metadata === 'string') ? JSON.parse(metadata) : metadata;
    const pageCount = metaObj.pageCount || metaObj.numberOfPages || 0;
    
    console.log(`DEBUG: Detected Page Count: ${pageCount}`);

    let pagesToKeep = [];
    // If it's 4 pages, we skip 1, 2, and 4. We keep page 3.
    if (pageCount >= 3) {
      for (let i = 3; i < pageCount; i++) {
        pagesToKeep.push(i);
      }
    }

    if (pagesToKeep.length > 0) {
      console.log(`Trimming successful. Keeping pages: ${pagesToKeep.join(",")}`);
      const exported = await pdf.exportPages(pagesToKeep);
      return (exported && typeof exported.getBlob === 'function') ? exported.getBlob() : exported;
    } else {
      console.log(`No pages to trim for a ${pageCount}-page PDF. Using original.`);
      return blob;
    }
    
  } catch (err) {
    console.error("Trimming failed, using original: " + err);
    return file.getBlob();
  }
}