import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_DASHBOARD_API_KEY || "rev-recovery-dev-secret-key-2025";

export async function fetchDashboard() {
  const response = await axios.get(`${API_BASE}/api/dashboard`, {
    headers: { "x-api-key": API_KEY },
  });
  return response.data;
}

export async function checkHealth() {
  const response = await axios.get(`${API_BASE}/health`);
  return response.data;
}

export async function simulateWebhookEvent(scenario, amountPaise, customerId, customPaymentId) {
  const response = await axios.post(`${API_BASE}/api/dev/simulate-webhook`, {
    scenario,
    amount_paise: amountPaise,
    customer_id: customerId,
    custom_payment_id: customPaymentId
  });
  return response.data;
}

export async function seedDemoData() {
  const response = await axios.post(`${API_BASE}/api/dev/seed-demo-data`);
  return response.data;
}

export async function loginAdmin(username, passkey, role = "admin") {
  const response = await axios.post(`${API_BASE}/api/auth/login`, {
    username: username || (role === 'admin' ? 'Administrator' : 'Support Agent'),
    passkey: passkey,
    role: role
  });
  return response.data;
}

export async function resetDatabase(adminPasskey) {
  const response = await axios.delete(`${API_BASE}/api/dev/reset-data`, {
    headers: { 
      "x-admin-passkey": adminPasskey || "",
      "x-api-key": adminPasskey || API_KEY 
    }
  });
  return response.data;
}

// ── Indian Support Automation APIs ──

export async function triggerUpiCollectPush({ payment_id, vpa, amount_inr, customer_id, customer_name, auto_capture = true }) {
  const response = await axios.post(`${API_BASE}/api/support/upi-collect`, {
    payment_id,
    vpa,
    amount_inr,
    customer_id,
    customer_name,
    auto_capture
  }, {
    headers: { "x-api-key": API_KEY }
  });
  return response.data;
}

export async function manageCartGuard({ payment_id, action, locked_price_inr, duration_hours = 24, sku_code }) {
  const response = await axios.post(`${API_BASE}/api/support/cart-guard`, {
    payment_id,
    action,
    locked_price_inr,
    duration_hours,
    sku_code
  }, {
    headers: { "x-api-key": API_KEY }
  });
  return response.data;
}

export async function fetchCartGuards() {
  const response = await axios.get(`${API_BASE}/api/support/cart-guards`, {
    headers: { "x-api-key": API_KEY }
  });
  return response.data;
}

export async function generateVernacularScript({ payment_id, amount_inr, error_code, error_description, customer_name, language = "hindi" }) {
  const response = await axios.post(`${API_BASE}/api/support/vernacular-script`, {
    payment_id,
    amount_inr,
    error_code,
    error_description,
    customer_name,
    language
  }, {
    headers: { "x-api-key": API_KEY }
  });
  return response.data;
}

