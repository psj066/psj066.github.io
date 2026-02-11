/**
 * ==========================================
 * Google Apps Script Backend for CCC Sun Profile
 * ==========================================
 * 
 * 1. Google Sheet > Extensions > Apps Script
 * 2. Paste this code.
 * 3. Change configuration below (FOLDER_ID).
 * 4. Run 'setup()' once to create headers.
 * 5. Deploy > New Deployment > Web App > Any one (Everyone)
 */

// CONFIGURATION
const FOLDER_ID = '1b12I1XugJJIja2MJwggEJtXkzVxoVrBw'; // *** PASTE YOUR GOOGLE DRIVE FOLDER ID HERE ***

// SHEET NAMES
const SHEET_SENIORS = 'Seniors';
const SHEET_RESERVATIONS = 'Reservations';
const SHEET_APPLICANTS = 'Applicants';

/**
 * Handle GET requests
 * Action types: 'getSeniors', 'getReservations'
 */
function doGet(e) {
    const action = e.parameter.action;

    if (action === 'getSeniors') {
        return success(getSeniors());
    } else if (action === 'getReservations') {
        return success(getReservations());
    }

    return error('Invalid action');
}

/**
 * Handle POST requests
 * Action types: 'addReservation', 'addSenior', 'updateSenior', 'deleteSenior'
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        const payload = data.payload;

        if (action === 'addReservation') {
            return success(addReservation(payload));
        } else if (action === 'addSenior') {
            return success(addSenior(payload));
        } else if (action === 'updateSenior') {
            return success(updateSenior(payload));
        } else if (action === 'deleteSenior') {
            return success(deleteSenior(payload));
        } else if (action === 'deleteReservation') {
            return success(deleteReservation(payload));
        } else if (action === 'uploadImage') { // Special helper if needed separately
            // Usually handled inside addSenior/updateSenior logic if saving file
        }

        return error('Invalid action');

    } catch (err) {
        return error(err.toString());
    }
}

// ---- Logic ----

function getSeniors() {
    const sheet = getSheet(SHEET_SENIORS);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // remove header

    return data.map(row => {
        return {
            id: row[0],
            name: row[1],
            role: row[2],
            introduction: row[3],
            photo: row[4],
            availableSlots: JSON.parse(row[5] || '[]'),
            gender: row[6] || '남' // Default to Male if missing
        };
    });
}

function getReservations() {
    const sheet = getSheet(SHEET_RESERVATIONS);
    const data = sheet.getDataRange().getValues();
    data.shift();

    return data.map(row => {
        // Row[1] is Date object, Row[2] is Time (Date object or string)
        let dateStr = row[1];
        if (dateStr instanceof Date) {
            // Format to YYYY-MM-DD (reflecting local time in script)
            // Using Utilities.formatDate is safest in GAS
            dateStr = Utilities.formatDate(dateStr, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        let timeStr = row[2];
        if (timeStr instanceof Date) {
            // Format to HH:mm
            timeStr = Utilities.formatDate(timeStr, Session.getScriptTimeZone(), 'HH:mm');
        }

        return {
            seniorId: row[0],
            date: dateStr,
            time: timeStr,
            applicant: JSON.parse(row[3]),
            createdAt: row[4]
        };
    });
}

function addReservation(payload) {
    const sheet = getSheet(SHEET_RESERVATIONS);

    // payload: { seniorId, date, time, applicant: { ... } }

    sheet.appendRow([
        payload.seniorId,
        payload.date,
        payload.time,
        JSON.stringify(payload.applicant),
        new Date().toISOString()
    ]);

    // Also save distinct applicant info
    saveApplicant(payload.applicant);

    return { status: 'created' };
}

function deleteReservation(payload) {
    const sheet = getSheet(SHEET_RESERVATIONS);
    const data = sheet.getDataRange().getValues();
    // payload: { seniorId, date, time }

    for (let i = 1; i < data.length; i++) {
        const row = data[i];

        let dateStr = row[1];
        if (dateStr instanceof Date) {
            dateStr = Utilities.formatDate(dateStr, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        let timeStr = row[2];
        if (timeStr instanceof Date) {
            timeStr = Utilities.formatDate(timeStr, Session.getScriptTimeZone(), 'HH:mm');
        }

        // Compare SeniorID, Date, Time
        if (row[0] == payload.seniorId && dateStr == payload.date && timeStr == payload.time) {
            sheet.deleteRow(i + 1);
            return { status: 'deleted' };
        }
    }
    return { status: 'not_found' };
}

/**
 * Save applicant to Applicants sheet if not exists (by StudentID)
 */
function saveApplicant(applicant) {
    if (!applicant || !applicant.studentId) return;

    const sheet = getSheet(SHEET_APPLICANTS);
    const data = sheet.getDataRange().getValues();

    // Check if studentId (Col 1 => index 0) exists
    // Start from 1 to skip header
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == applicant.studentId) {
            // Already exists
            return;
        }
    }

    // Append new
    sheet.appendRow([
        applicant.studentId,
        applicant.name,
        applicant.age,
        applicant.gender,
        applicant.introduction,
        '', // Photo column empty
        new Date().toISOString()
    ]);
}

function addSenior(payload) {
    const sheet = getSheet(SHEET_SENIORS);
    const id = 'senior_' + Date.now();

    let photoUrl = '';
    if (payload.photo && payload.photo.startsWith('data:')) {
        photoUrl = saveImage(payload.photo, id);
    } else {
        photoUrl = payload.photo;
    }

    const row = [
        id,
        payload.name,
        payload.role,
        payload.introduction,
        photoUrl,
        JSON.stringify(payload.availableSlots),
        payload.gender || '남' // Add Gender
    ];

    sheet.appendRow(row);
    return { id, photo: photoUrl };
}

function updateSenior(payload) {
    const sheet = getSheet(SHEET_SENIORS);
    const data = sheet.getDataRange().getValues();

    // Find row by ID (index 0)
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {

            let photoUrl = data[i][4]; // Keep old photo by default
            if (payload.photo && payload.photo.startsWith('data:')) {
                photoUrl = saveImage(payload.photo, payload.id);
            }

            // Update cells (1-based index)
            // Columns: ID(1), Name(2), Role(3), Intro(4), Photo(5), Slots(6), Gender(7)
            sheet.getRange(i + 1, 2).setValue(payload.name);
            sheet.getRange(i + 1, 3).setValue(payload.role);
            sheet.getRange(i + 1, 4).setValue(payload.introduction);
            sheet.getRange(i + 1, 5).setValue(photoUrl);
            sheet.getRange(i + 1, 6).setValue(JSON.stringify(payload.availableSlots));
            sheet.getRange(i + 1, 7).setValue(payload.gender || '남');

            return { id: payload.id, photo: photoUrl };
        }
    }
    throw new Error('Senior not found');
}

function deleteSenior(payload) {
    const sheet = getSheet(SHEET_SENIORS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {
            sheet.deleteRow(i + 1);
            return { status: 'deleted' };
        }
    }
    return { status: 'not_found' };
}

// ---- Helpers ----

/**
 * Save Base64 image to Drive and return public link
 */
function saveImage(base64Data, filename) {
    try {
        const split = base64Data.split(',');
        const type = split[0].split(';')[0].split(':')[1];
        const bytes = Utilities.base64Decode(split[1]);
        const blob = Utilities.newBlob(bytes, type, filename);

        const folder = DriveApp.getFolderById(FOLDER_ID);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        // We need the direct download/view link, usually 'webContentLink' or constructing it
        // 'getDownloadUrl' works but sometimes requires auth. 
        // Best for <img> tags is: https://lh3.googleusercontent.com/d/FILE_ID
        return `https://lh3.googleusercontent.com/d/${file.getId()}`;
    } catch (e) {
        return ''; // Fail gracefully
    }
}

function getSheet(name) {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(name);
    if (!sheet) {
        sheet = doc.insertSheet(name);
    }
    return sheet;
}

function success(data) {
    return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        data: data
    })).setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
    return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: msg
    })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this function once manually to set up sheets
 */
function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();

    let s1 = getSheet(SHEET_SENIORS);
    if (s1.getLastRow() === 0) s1.appendRow(['ID', 'Name', 'Role', 'Introduction', 'PhotoURL', 'AvailableSlots', 'Gender']);

    let s2 = getSheet(SHEET_RESERVATIONS);
    if (s2.getLastRow() === 0) s2.appendRow(['SeniorID', 'Date', 'Time', 'ApplicantJSON', 'CreatedAt']);

    let s3 = getSheet(SHEET_APPLICANTS);
    if (s3.getLastRow() === 0) s3.appendRow(['StudentID', 'Name', 'Age', 'Gender', 'Introduction', 'Photo', 'CreatedAt']);
}
