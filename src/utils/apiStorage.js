// API Storage Utility - ใช้ API แทน localStorage เพื่อให้ข้อมูลเห็นได้ทุกพอร์ตและทุกโฮสต์
import { API_URL } from '../config';

// Helper function to fetch from API
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API fetch error for ${endpoint}:`, error);
    // Fallback to localStorage if API fails
    throw error;
  }
}

// Online Bills - Offline-First: ดึงจาก localStorage ก่อน แล้วค่อย sync ไป backend
export const billsAPI = {
  async getAll() {
    // 1. ดึงจาก localStorage ก่อน (offline-first)
    let localBills = [];
    try {
      localBills = JSON.parse(localStorage.getItem('online_bills') || '[]');
    } catch (error) {
      console.error('Error reading localStorage:', error);
      localBills = [];
    }
    
    // 2. พยายาม sync ไป backend (ถ้ามี connection)
    try {
      const serverBills = await apiFetch('/api/bills');
      
      // 3. Merge ข้อมูล: รวม localStorage + server (server เป็น source of truth)
      const billsMap = new Map();
      
      // เพิ่ม local bills ก่อน
      localBills.forEach(bill => {
        if (bill.id) {
          billsMap.set(bill.id, bill);
        }
      });
      
      // Merge server bills (server มี priority สูงกว่า)
      serverBills.forEach(bill => {
        if (bill.id) {
          const localBill = billsMap.get(bill.id);
          if (localBill) {
            // ถ้ามีทั้ง local และ server ให้ใช้ server (ใหม่กว่า)
            billsMap.set(bill.id, bill);
          } else {
            // ถ้ามีแค่ server ให้เพิ่ม
            billsMap.set(bill.id, bill);
          }
        }
      });
      
      const mergedBills = Array.from(billsMap.values());
      
      // 4. อัปเดต localStorage ด้วยข้อมูลที่ merge แล้ว
      localStorage.setItem('online_bills', JSON.stringify(mergedBills));
      
      // 5. Sync local bills ไป server (ถ้ามีบิลใหม่ใน local)
      if (localBills.length > 0) {
        // หาบิลที่ยังไม่มีใน server
        const serverBillIds = new Set(serverBills.map(b => b.id));
        const newLocalBills = localBills.filter(b => b.id && !serverBillIds.has(b.id));
        
        if (newLocalBills.length > 0) {
          // Sync แบบ background (ไม่ต้องรอ)
          this.syncToServer(newLocalBills).catch(err => {
            console.warn('Background sync failed:', err);
          });
        }
      }
      
      return mergedBills;
    } catch (error) {
      // ถ้า API ไม่ได้ ให้ใช้ localStorage
      console.warn('API unavailable, using localStorage:', error);
      return localBills;
    }
  },
  
  // Sync bills ไป server (background)
  async syncToServer(bills) {
    try {
      if (!bills || bills.length === 0) return;
      
      // แบ่ง sync เป็นชุด (batch) ถ้ามีบิลเยอะ
      const BATCH_SIZE = 10;
      for (let i = 0; i < bills.length; i += BATCH_SIZE) {
        const batch = bills.slice(i, i + BATCH_SIZE);
        await apiFetch('/api/bills/sync', {
          method: 'POST',
          body: JSON.stringify({ bills: batch })
        });
      }
    } catch (error) {
      console.error('Sync to server failed:', error);
      throw error;
    }
  },

  async save(bill) {
    // 1. บันทึกใน localStorage ก่อน (offline-first)
    try {
      const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
      const index = bills.findIndex(b => b.id === bill.id);
      if (index !== -1) {
        bills[index] = bill;
      } else {
        bills.push(bill);
      }
      localStorage.setItem('online_bills', JSON.stringify(bills));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // 2. พยายาม sync ไป server (ถ้ามี connection)
    try {
      const result = await apiFetch('/api/bills', {
        method: 'POST',
        body: JSON.stringify(bill),
      });
      return result;
    } catch (error) {
      // ถ้า API ไม่ได้ ให้ใช้ localStorage (บันทึกไว้แล้ว)
      console.warn('API unavailable, saved to localStorage only:', error);
      return { success: true, bill };
    }
  },

  async update(id, updates) {
    try {
      return await apiFetch(`/api/bills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      // Fallback to localStorage
      const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
      const index = bills.findIndex(b => b.id === id);
      if (index !== -1) {
        bills[index] = { ...bills[index], ...updates };
        localStorage.setItem('online_bills', JSON.stringify(bills));
      }
      return { success: true };
    }
  },

  async delete(id) {
    try {
      return await apiFetch(`/api/bills/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback to localStorage
      const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
      const filtered = bills.filter(b => b.id !== id);
      localStorage.setItem('online_bills', JSON.stringify(filtered));
      return { success: true };
    }
  },
};

// Shop Data
export const shopDataAPI = {
  async get() {
    try {
      return await apiFetch('/api/shop-data');
    } catch (error) {
      // Fallback to localStorage
      return {
        shop_name: localStorage.getItem('shop_name') || 'โรจน์พาณิชย์ โครงเหล็ก...',
        shop_logo: localStorage.getItem('shop_logo') || 'RP',
        product_card_size: localStorage.getItem('product_card_size') || 'medium',
        nav_categories_count: parseInt(localStorage.getItem('nav_categories_count')) || 5,
        bill_modal_size: localStorage.getItem('bill_modal_size') || 'medium',
        bill_font_size: localStorage.getItem('bill_font_size') || 'small',
      };
    }
  },

  async save(data) {
    try {
      const result = await apiFetch('/api/shop-data', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      // Also save to localStorage as backup
      if (data.shop_name) localStorage.setItem('shop_name', data.shop_name);
      if (data.shop_logo) localStorage.setItem('shop_logo', data.shop_logo);
      if (data.product_card_size) localStorage.setItem('product_card_size', data.product_card_size);
      if (data.nav_categories_count) localStorage.setItem('nav_categories_count', data.nav_categories_count.toString());
      if (data.bill_modal_size) localStorage.setItem('bill_modal_size', data.bill_modal_size);
      if (data.bill_font_size) localStorage.setItem('bill_font_size', data.bill_font_size);
      return result;
    } catch (error) {
      // Fallback to localStorage
      if (data.shop_name) localStorage.setItem('shop_name', data.shop_name);
      if (data.shop_logo) localStorage.setItem('shop_logo', data.shop_logo);
      if (data.product_card_size) localStorage.setItem('product_card_size', data.product_card_size);
      if (data.nav_categories_count) localStorage.setItem('nav_categories_count', data.nav_categories_count.toString());
      if (data.bill_modal_size) localStorage.setItem('bill_modal_size', data.bill_modal_size);
      if (data.bill_font_size) localStorage.setItem('bill_font_size', data.bill_font_size);
      return { success: true, data };
    }
  },
};

// Bank Accounts
export const bankAccountsAPI = {
  async getAll() {
    try {
      return await apiFetch('/api/bank-accounts');
    } catch (error) {
      // Fallback to localStorage
      try {
        return JSON.parse(localStorage.getItem('bank_accounts') || '[]');
      } catch {
        return [];
      }
    }
  },

  async save(account) {
    try {
      const result = await apiFetch('/api/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(account),
      });
      // Also save to localStorage as backup
      try {
        const accounts = JSON.parse(localStorage.getItem('bank_accounts') || '[]');
        const index = accounts.findIndex(a => a.id === account.id);
        if (index !== -1) {
          accounts[index] = account;
        } else {
          accounts.push(account);
        }
        localStorage.setItem('bank_accounts', JSON.stringify(accounts));
      } catch {}
      return result;
    } catch (error) {
      // Fallback to localStorage
      const accounts = JSON.parse(localStorage.getItem('bank_accounts') || '[]');
      const index = accounts.findIndex(a => a.id === account.id);
      if (index !== -1) {
        accounts[index] = account;
      } else {
        accounts.push(account);
      }
      localStorage.setItem('bank_accounts', JSON.stringify(accounts));
      return { success: true, account };
    }
  },

  async delete(id) {
    try {
      return await apiFetch(`/api/bank-accounts/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback to localStorage
      const accounts = JSON.parse(localStorage.getItem('bank_accounts') || '[]');
      const filtered = accounts.filter(a => a.id !== id);
      localStorage.setItem('bank_accounts', JSON.stringify(filtered));
      return { success: true };
    }
  },
};

// Shipping Companies
export const shippingCompaniesAPI = {
  async getAll() {
    try {
      return await apiFetch('/api/shipping-companies');
    } catch (error) {
      // Fallback to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('shipping_companies') || '[]');
        if (saved.length === 0) {
          // Default companies
          return [
            { id: 'flash', name: 'Flash Express', price: 50, icon: '⚡' },
            { id: 'kerry', name: 'Kerry Express', price: 60, icon: '🚚' },
            { id: 'jt', name: 'J&T Express', price: 45, icon: '📦' },
            { id: 'thaipost', name: 'ไปรษณีย์ไทย', price: 40, icon: '📮' },
            { id: 'scg', name: 'SCG Express', price: 55, icon: '🏢' },
          ];
        }
        return saved;
      } catch {
        return [];
      }
    }
  },

  async save(company) {
    try {
      const result = await apiFetch('/api/shipping-companies', {
        method: 'POST',
        body: JSON.stringify(company),
      });
      // Also save to localStorage as backup
      try {
        const companies = JSON.parse(localStorage.getItem('shipping_companies') || '[]');
        const index = companies.findIndex(c => c.id === company.id);
        if (index !== -1) {
          companies[index] = company;
        } else {
          companies.push(company);
        }
        localStorage.setItem('shipping_companies', JSON.stringify(companies));
      } catch {}
      return result;
    } catch (error) {
      // Fallback to localStorage
      const companies = JSON.parse(localStorage.getItem('shipping_companies') || '[]');
      const index = companies.findIndex(c => c.id === company.id);
      if (index !== -1) {
        companies[index] = company;
      } else {
        companies.push(company);
      }
      localStorage.setItem('shipping_companies', JSON.stringify(companies));
      return { success: true, company };
    }
  },

  async delete(id) {
    try {
      return await apiFetch(`/api/shipping-companies/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback to localStorage
      const companies = JSON.parse(localStorage.getItem('shipping_companies') || '[]');
      const filtered = companies.filter(c => c.id !== id);
      localStorage.setItem('shipping_companies', JSON.stringify(filtered));
      return { success: true };
    }
  },
};

