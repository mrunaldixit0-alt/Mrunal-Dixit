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
        timeout: 4000,
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

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
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

/**
 * Convert Firestore document Value fields format into a plain JavaScript object
 */
function fromFirestoreFields(fields) {
  if (!fields || typeof fields !== 'object') return {};
  const obj = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) {
      obj[key] = val.stringValue;
    } else if (val.integerValue !== undefined) {
      obj[key] = parseInt(val.integerValue, 10);
    } else if (val.doubleValue !== undefined) {
      obj[key] = parseFloat(val.doubleValue);
    } else if (val.booleanValue !== undefined) {
      obj[key] = val.booleanValue;
    } else if (val.nullValue !== undefined) {
      obj[key] = null;
    } else if (val.timestampValue !== undefined) {
      obj[key] = val.timestampValue;
    } else if (val.arrayValue !== undefined) {
      obj[key] = (val.arrayValue.values || []).map(item => {
        if (item.mapValue) return fromFirestoreFields(item.mapValue.fields);
        if (item.stringValue !== undefined) return item.stringValue;
        if (item.integerValue !== undefined) return parseInt(item.integerValue, 10);
        if (item.doubleValue !== undefined) return parseFloat(item.doubleValue);
        if (item.booleanValue !== undefined) return item.booleanValue;
        return item;
      });
    } else if (val.mapValue !== undefined) {
      obj[key] = fromFirestoreFields(val.mapValue.fields);
    }
  }
  return obj;
}

/**
 * Fetch all documents from a Cloud Firestore collection
 */
function getDocuments(collection, maxDocs = 300) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}?key=${firebaseConfig.apiKey}&pageSize=${maxDocs}`);
      
      const req = https.request(url, {
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let responseText = '';
        res.on('data', chunk => responseText += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(responseText);
              const docs = (json.documents || []).map(doc => {
                const data = fromFirestoreFields(doc.fields);
                const pathParts = doc.name ? doc.name.split('/') : [];
                const docId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : undefined;
                return { id: docId, ...data };
              });
              resolve({ success: true, documents: docs, count: docs.length });
            } catch (parseErr) {
              console.warn(`Firestore getDocuments parse error [${collection}]:`, parseErr.message);
              resolve({ success: false, error: parseErr.message, documents: [] });
            }
          } else {
            console.warn(`Firestore getDocuments warning [${collection}]: HTTP ${res.statusCode}`, responseText);
            resolve({ success: false, status: res.statusCode, error: responseText, documents: [] });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout', documents: [] });
      });

      req.on('error', (err) => {
        console.warn(`Firestore getDocuments error [${collection}]:`, err.message);
        resolve({ success: false, error: err.message, documents: [] });
      });

      req.end();
    } catch (e) {
      console.warn('Firestore getDocuments exception:', e.message);
      resolve({ success: false, error: e.message, documents: [] });
    }
  });
}

module.exports = {
  firebaseConfig,
  setDocument,
  deleteDocument,
  fromFirestoreFields,
  getDocuments
};
