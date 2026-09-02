const https = require('https');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAen06_VB2yH_RkazVQdhsNil1mPejo0go",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "new-restaurant-system.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "new-restaurant-system",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "new-restaurant-system.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "337795412553",
  appId: process.env.FIREBASE_APP_ID || "1:337795412553:web:fa8b1cc3fe7bff35aa8598",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-RGLXY7H8RC"
};

/**
 * Convert JavaScript object into Firestore Value fields format
 */
function toFirestoreFields(obj) {
  const fields = {};
  if (!obj || typeof obj !== 'object') return fields;

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'object' && item !== null) {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * Write/Update a document in Cloud Firestore
 */
function setDocument(collection, docId, data) {
  return new Promise((resolve) => {
    try {
      const docIdStr = String(docId);
      const url = new URL(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/${docIdStr}?key=${firebaseConfig.apiKey}`);
      const postData = JSON.stringify({ fields: toFirestoreFields(data) });

      const req = https.request(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let responseText = '';
        res.on('data', chunk => responseText += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, docId: docIdStr });
          } else {
            console.warn(`Firestore sync warning [${collection}/${docIdStr}]: HTTP ${res.statusCode}`, responseText);
            resolve({ success: false, status: res.statusCode, error: responseText });
          }
        });
      });

      req.on('error', (err) => {
        console.warn(`Firestore sync error [${collection}/${docIdStr}]:`, err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    } catch (e) {
      console.warn('Firestore setDocument exception:', e.message);
      resolve({ success: false, error: e.message });
    }
  });
}

/**
 * Delete a document from Cloud Firestore
 */
function deleteDocument(collection, docId) {
  return new Promise((resolve) => {
    try {
      const docIdStr = String(docId);
      const url = new URL(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/${docIdStr}?key=${firebaseConfig.apiKey}`);

      const req = https.request(url, {
        method: 'DELETE'
      }, (res) => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300 });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

module.exports = {
  firebaseConfig,
  setDocument,
  deleteDocument
};
