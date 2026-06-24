// ==========================================
// JADACARD - main.js FINAL COMPLETE
// Firebase Firestore + EmailJS + Admin Control
// Stripe link only - No app payments
// Requires: currentUser + showCustomerCard() from HTML
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 1. FIREBASE CONFIG - YOUR REAL KEYS
const firebaseConfig = {
  apiKey: "AIzaSyB5jGFyvFxHY4mlejAvSerYkqqHq_J7YKQ",
  authDomain: "jada-card.firebaseapp.com",
  projectId: "jada-card",
  storageBucket: "jada-card.firebasestorage.app",
  messagingSenderId: "658789024478",
  appId: "1:658789024478:web:78b85f82d87e9cdbf4b84f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. EMAILJS INIT - YOUR KEYS FROM SCREENSHOT
emailjs.init("I12UIAChWa_pR03-M");

// 3. STRIPE PAYMENT LINK - REPLACE WITH YOUR LINK
const STRIPE_LINK = "https://buy.stripe.com/5kQ4gz20Ugcm2ADgZZes000";

// ==========================================
// FUNCTION 1: CUSTOMER TAPS "PAY FOR CARD"
// - Creates card as PENDING immediately 
// - Saves all details to Firestore "customers" collection
// - Sends instant email alert to admin via EmailJS
// - Returns Firestore document ID
// ==========================================
window.logCustomerAttempt = async function(customerData) {
  try {
    const cardNumber = 'CARD-' + Date.now();
    const docRef = await addDoc(collection(db, "customers"), {
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || '',
      cardNumber: cardNumber,
      amountPaid: customerData.amountPaid || 5000,
      status: "pending", // Pending until you approve manually
      winningAmount: 0,  // You set this in admin panel
      withdrawalMethod: "", // MTN, 【entity-Airtel¦canonical_name=Airtel】, Solana
      withdrawalDetails: "", // Phone number or wallet address
      tappedPayAt: new Date(),
      approvedAt: null
    });

    // EMAIL ALERT TO ADMIN - Service ID + Template ID from your screenshot
    await emailjs.send("service_93u3", "template_8lpidat", {
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_email: customerData.email || 'No email',
      card_number: cardNumber,
      amount_paid: customerData.amountPaid || 5000,
      time: new Date().toLocaleString(),
      message: 'Customer tapped Pay for Card. Check Stripe dashboard to confirm payment.'
    });

    console.log("Customer logged successfully. Firestore ID:", docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error("Error logging customer:", error);
    throw error;
  }
}

// ==========================================
// FUNCTION 2: ADMIN REALTIME LISTENER
// - Watches "customers" collection in Firestore
// - Updates admin panel automatically when new customer taps Pay
// - Shows PENDING cards for you to approve/reject
// ==========================================
window.getAllCustomersRealtime = function(callback) {
  const q = query(collection(db, "customers"), orderBy("tappedPayAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(customers);
  });
}

// ==========================================
// FUNCTION 3: ADMIN APPROVE CUSTOMER
// - You enter winning amount UGX in admin panel
// - Status changes to "active" 
// - Customer can now tap card to reveal winning amount
// ==========================================
window.approveCustomer = async function(customerId, amount) {
  try {
    if (!amount || amount <= 0) {
      throw new Error("Enter winning amount first before approving!");
    }
    
    await updateDoc(doc(db, "customers", customerId), { 
      status: "active",
      winningAmount: parseInt(amount),
      approvedAt: new Date()
    });
    
    console.log(`Customer ${customerId} approved with UGX ${amount}`);
    alert(`Customer approved with UGX ${amount}`);
    
  } catch (error) {
    console.error("Error approving customer:", error);
    alert("Error: " + error.message);
    throw error;
  }
}

// ==========================================
// FUNCTION 4: ADMIN REJECT CUSTOMER  
// - Status changes to "rejected"
// - Card disappears from customer dashboard
// ==========================================
window.rejectCustomer = async function(customerId) {
  try {
    await updateDoc(doc(db, "customers", customerId), { 
      status: "rejected"
    });
    console.log(`Customer ${customerId} rejected`);
    alert("Customer rejected");
  } catch (error) {
    console.error("Error rejecting customer:", error);
    alert("Error: " + error.message);
    throw error;
  }
}

// ==========================================
// FUNCTION 5: CUSTOMER SAVE WITHDRAWAL DETAILS
// - Customer enters MTN number, Airtel number, or Solana wallet
// - Saved to their Firestore document
// - You see it in admin panel to send money manually
// ==========================================
window.saveWithdrawalDetails = async function(customerId, method, details) {
  try {
    if (!method || !details) {
      throw new Error("Select method and enter details");
    }
    
    await updateDoc(doc(db, "customers", customerId), {
      withdrawalMethod: method,
      withdrawalDetails: details
    });
    console.log(`Withdrawal details saved for ${customerId}: ${method} - ${details}`);
    alert("Withdrawal details saved! Admin will send your money.");
  } catch (error) {
    console.error("Error saving withdrawal:", error);
    alert("Error: " + error.message);
    throw error;
  }
}

// ==========================================
// FUNCTION 6: PAY BUTTON HANDLER
// - Called when customer clicks "Pay for Card via Stripe"
// - Checks if user registered first
// - Logs customer to Firestore + EmailJS
// - Shows PENDING card immediately
// - Opens Stripe link in new tab for payment
// NOTE: This needs currentUser + showCustomerCard() from your HTML
// ==========================================
window.pay = async function() {
  if (typeof currentUser === 'undefined' || !currentUser) {
    alert("Please register with your name and phone first");
    return;
  }
  
  const customerData = {
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email || '',
    amountPaid: 5000 // Your card price UGX
  };
  
  try {
    const docId = await logCustomerAttempt(customerData);
    currentUser.id = docId;
    currentUser.cardNumber = 'CARD-' + Date.now();
    currentUser.status = 'pending';
    currentUser.winningAmount = 0;
    
    // This function must exist in your HTML PART 4
    if (typeof showCustomerCard === 'function') {
      showCustomerCard();
    }
    
    // Open Stripe checkout
    window.open(STRIPE_LINK, '_blank');
    
    alert("Card issued as PENDING! Complete payment on Stripe. Admin will approve you after confirming payment.");
    
  } catch (err) {
    console.error("Pay error:", err);
    alert("Error: " + err.message);
  }
}

export { app, db };
