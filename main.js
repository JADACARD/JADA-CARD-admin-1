
// ==========================================
// JADACARD - main.js
// Firebase + EmailJS + Admin Functions
// ==========================================

// 1. IMPORTS
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

// 2. FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB5jGFyvFxHY4mlejAvSerYkqqHq_J7YKQ",
  authDomain: "jada-card.firebaseapp.com",
  projectId: "jada-card",
  storageBucket: "jada-card.firebasestorage.app",
  messagingSenderId: "658789024478",
  appId: "1:658789024478:web:78b85f82d87e9cdbf4b84f"
};

// 3. INIT FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. INIT EMAILJS
emailjs.init("I12UIAChWa_pR03-M");

// ==========================================
// CUSTOMER FUNCTIONS
// ==========================================

/**
 * Save customer when they tap "Pay for Card"
 * Sends email alert to admin + saves to Firebase
 */
export async function saveCustomer(customerData) {
  try {
    // 1. Save to Firebase - status pending, winningAmount 0
    const docRef = await addDoc(collection(db, "customers"), {
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      cardNumber: customerData.cardNumber,
      amountPaid: customerData.amountPaid || 0,
      status: "pending",
      winningAmount: 0,
      date: new Date()
    });

    // 2. Send email alert to admin
    await emailjs.send("service_93u3", "template_8lpidat", {
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_email: customerData.email,
      card_number: customerData.cardNumber,
      amount_paid: customerData.amountPaid || 0,
      time: new Date().toLocaleString()
    });

    console.log("Customer saved + Email sent. ID:", docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error("Error saving customer:", error);
    throw error;
  }
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

/**
 * Get all customers for admin panel
 */
export async function getAllCustomers() {
  try {
    const snapshot = await getDocs(collection(db, "customers"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting customers:", error);
    return [];
  }
}

/**
 * Approve customer - Admin sets winning amount manually
 * @param {string} customerId - Firebase doc ID
 * @param {number} amount - Amount admin types
 */
export async function approveWithAmount(customerId, amount) {
  try {
    if (!amount || amount <= 0) {
      throw new Error("Enter winning amount first!");
    }
    
    await updateDoc(doc(db, "customers", customerId), { 
      status: "active",
      winningAmount: parseInt(amount)
    });
    
    console.log(`Customer ${customerId} approved with UGX ${amount}`);
    
  } catch (error) {
    console.error("Error approving:", error);
    throw error;
  }
}

/**
 * Reject customer - Card disappears
 * @param {string} customerId - Firebase doc ID
 */
export async function rejectCustomer(customerId) {
  try {
    await updateDoc(doc(db, "customers", customerId), { 
      status: "rejected"
    });
    
    console.log(`Customer ${customerId} rejected`);
    
  } catch (error) {
    console.error("Error rejecting:", error);
    throw error;
  }
}

// Export Firebase app if needed
export { app };
