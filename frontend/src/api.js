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

export async function loginAdmin(username, passkey) {
  const response = await axios.post(`${API_BASE}/api/auth/login`, {
    username: username || "admin",
    passkey: passkey
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
