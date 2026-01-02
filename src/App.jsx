import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  ShoppingBag,
  BarChart2,
  Settings,
  Search,
  Bell,
  Paperclip,
  Send,
  Smile,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  Receipt,
  X,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  LineChart,
  HelpCircle,
  AlertCircle,
  MoreHorizontal,
  Pin,
  Tag,
  Filter,
  Palette,
  Trash2,
  ListFilter,
  Bookmark,
  Menu,
  MessageCircle,
  Flame,
  Download,
  FileSpreadsheet,
  Link as LinkIcon,
  Loader2,
  Globe,
  Key,
  Shield,
  ArrowLeft,
  Copy,
  RefreshCw,
  Save,
  CreditCard,
  User,
  LogOut,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Code,
  Play,
  ExternalLink,
  AlertTriangle,
  Share2,
  Upload,
  Store
} from 'lucide-react';

import SettingsPage from './components/SettingsPage';
import OnlineBillView from './components/OnlineBillView';
import InvoiceList from './components/InvoiceList';
import CustomerShop from './components/CustomerShop'; // New Shop Page
import { API_URL } from './config';
import { billsAPI, shippingCompaniesAPI } from './utils/apiStorage';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'omnichat-demo';

// --- Mock Data: Initial Shops ---
const INITIAL_SHOPS = [
  { id: 'all', name: 'แพลตฟอร์มทั้งหมด', icon: 'all', count: '0', type: 'all', connected: true },
];

// --- Mock Data: Chats (Empty - will load from LINE webhook) ---
const INITIAL_CHATS = [];

const PRODUCTS_CATALOG = [];

const TAG_COLORS = [
  { name: 'Red', class: 'bg-red-100 text-red-600' },
  { name: 'Blue', class: 'bg-blue-100 text-blue-600' },
  { name: 'Green', class: 'bg-green-100 text-green-600' },
  { name: 'Amber', class: 'bg-amber-100 text-amber-600' },
  { name: 'Purple', class: 'bg-purple-100 text-purple-600' },
  { name: 'Gray', class: 'bg-gray-100 text-gray-600' },
];

// --- Helper Components ---

const AppleCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/50 ${className}`}>
    {children}
  </div>
);

// Helper function to get logo URL or SVG
const getLogoUrl = (platform) => {
  switch (platform) {
    case 'shopee': return 'https://logo.clearbit.com/shopee.co.th';
    case 'lazada': return 'https://logo.clearbit.com/lazada.co.th';
    case 'tiktok': return 'https://logo.clearbit.com/tiktok.com';
    case 'facebook': return 'https://logo.clearbit.com/facebook.com';
    case 'line': return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDZDNzU1Ii8+CjxwYXRoIGQ9Ik0xMiA2TDEyLjU0IDkuNzNMMTYgMTBMMTIuNTQgMTAuMjdMMTIgMTRMMTEuNDYgMTAuMjdMOCAxMEwxMS40NiA5LjczTDEyIDZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'; // LINE@ logo (green with @ symbol)
    case 'instagram': return 'https://logo.clearbit.com/instagram.com';
    default: return null;
  }
};

const PlatformIcon = ({ platform }) => {
  const logoUrl = getLogoUrl(platform);

  // Special handling for LINE@ logo
  if (platform === 'line') {
    return (
      <div className="w-4 h-4 rounded-full bg-[#06C755] flex items-center justify-center border border-white shadow-sm">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1L6.545 4.365L9 5L6.545 5.635L6 9L5.455 5.635L3 5L5.455 4.365L6 1Z" fill="white"/>
          <circle cx="6" cy="5" r="2" fill="none" stroke="white" strokeWidth="0.5"/>
        </svg>
      </div>
    );
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={platform}
        className="w-4 h-4 rounded-full border border-white shadow-sm object-cover bg-white"
        onError={(e) => { e.target.style.display = 'none' }} // Fallback if image fails
      />
    );
  }

  // Fallback styles
  const styles = {
    shopee: 'bg-[#EE4D2D]',
    lazada: 'bg-[#0f146d]',
    tiktok: 'bg-black',
    facebook: 'bg-[#1877F2]',
    line: 'bg-[#06C755]'
  };
  return (
    <div className={`w-4 h-4 rounded-full ${styles[platform] || 'bg-gray-400'} flex items-center justify-center text-white text-[8px] font-bold border border-white shadow-sm`}>
      {platform ? platform[0].toUpperCase() : '?'}
    </div>
  );
};

const ShopIcon = ({ type }) => {
  if (type === 'all') return <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><Flame size={16} fill="currentColor" /></div>;

  // Special handling for LINE@ logo
  if (type === 'line') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center border border-gray-100 shadow-sm">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2L10.908 7.275L16 8L10.908 8.725L10 14L9.092 8.725L4 8L9.092 7.275L10 2Z" fill="white"/>
          <circle cx="10" cy="8" r="3" fill="none" stroke="white" strokeWidth="0.8"/>
        </svg>
      </div>
    );
  }

  const logoUrl = getLogoUrl(type);
  if (logoUrl) {
    return <img src={logoUrl} alt={type} className="w-8 h-8 rounded-full border border-gray-100 object-cover bg-white shadow-sm" />;
  }

  return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">?</div>;
}

// --- Page Components ---

const SummaryPage = ({ onAddShopClick, shops, onGoToSettings }) => {
  const [stats, setStats] = useState({
    pendingMessages: 0,
    todayCustomers: 0,
    responseRate: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        
        // Fetch all chats
        const chatsResponse = await fetch(`${API_URL}/api/chats`);
        const chats = await chatsResponse.json();
        
        if (!chats || chats.length === 0) {
          setStats({ pendingMessages: 0, todayCustomers: 0, responseRate: null });
          setLoading(false);
          return;
        }

        // Fetch messages for all chats
        const allMessagesPromises = chats.map(async (chat) => {
          try {
            const messagesResponse = await fetch(`${API_URL}/api/chats/${chat.userId}/messages`);
            const messages = await messagesResponse.json();
            return { userId: chat.userId, messages: messages || [] };
          } catch (error) {
            console.error(`Error fetching messages for ${chat.userId}:`, error);
            return { userId: chat.userId, messages: [] };
          }
        });

        const allMessagesData = await Promise.all(allMessagesPromises);
        
        // Calculate statistics
        let pendingCount = 0;
        let todayCustomersSet = new Set();
        let totalUserMessages = 0;
        let totalRepliedMessages = 0;

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        allMessagesData.forEach(({ userId, messages }) => {
          if (!messages || messages.length === 0) return;

          // Check if last message is from user (pending reply)
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.sender === 'user') {
            pendingCount++;
          }

          // Check for today's customers
          const hasTodayMessage = messages.some(msg => {
            const msgTimestamp = msg.timestamp || (msg.time ? new Date(msg.time).getTime() : 0);
            return msgTimestamp >= today.getTime() && msgTimestamp <= todayEnd.getTime();
          });
          if (hasTodayMessage) {
            todayCustomersSet.add(userId);
          }

          // Calculate response rate
          // Count user messages and check if they were replied to
          messages.forEach((msg, index) => {
            if (msg.sender === 'user') {
              totalUserMessages++;
              // Check if there's an admin reply after this user message
              const hasReply = messages.slice(index + 1).some(nextMsg => nextMsg.sender === 'admin');
              if (hasReply) {
                totalRepliedMessages++;
              }
            }
          });
        });

        // Calculate response rate percentage
        let responseRate = null;
        if (totalUserMessages > 0) {
          responseRate = Math.round((totalRepliedMessages / totalUserMessages) * 100);
        }

        setStats({
          pendingMessages: pendingCount,
          todayCustomers: todayCustomersSet.size,
          responseRate: responseRate
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setStats({ pendingMessages: 0, todayCustomers: 0, responseRate: null });
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchSummaryData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-full font-sans text-[#1D1D1F]">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">Overview</h2>
          <p className="text-[#86868B] text-sm mt-1">สรุปภาพรวมประสิทธิภาพร้านค้าของคุณ</p>
        </div>
        <div className="flex gap-3">
        </div>
        <button
          onClick={onGoToSettings}
          className="bg-[#06C755] text-white px-5 py-2 rounded-full text-sm font-medium shadow-md shadow-green-200 hover:bg-[#05b54d] transition flex items-center gap-2"
        >
          <Globe size={16} /> ตั้งค่า LINE@
        </button>
      </div>

      {/* LINE Quick Setup */}
      <AppleCard className="p-8 mb-6 bg-gradient-to-br from-[#06C755]/5 to-white border border-[#06C755]/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#06C755] rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                <Globe size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#1D1D1F]">LINE Official Account</h3>
                <p className="text-sm text-gray-500">เชื่อมต่อกับ LINE Messaging API</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              ตั้งค่า LINE Webhook เพื่อรับและตอบข้อความอัตโนมัติ รองรับ ngrok สำหรับทดสอบในเครื่อง
            </p>
          </div>
          <button
            onClick={onGoToSettings}
            className="bg-[#06C755] text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 hover:bg-[#05b54d] transition flex items-center gap-2 whitespace-nowrap"
          >
            <Settings size={18} /> ตั้งค่า LINE@
          </button>
        </div>
      </AppleCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AppleCard className="p-6 flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[#86868B]">ข้อความรอตอบกลับ</span>
            <div className="p-2 bg-[#FF3B30]/10 rounded-full text-[#FF3B30] group-hover:bg-[#FF3B30] group-hover:text-white transition-colors"><MessageSquare size={18} /></div>
          </div>
          <div>
            {loading ? (
              <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">...</div>
            ) : (
              <>
                <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight group-hover:scale-105 transition-transform origin-left">{stats.pendingMessages}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  {stats.pendingMessages === 0 ? 'ไม่มีข้อความค้าง' : `${stats.pendingMessages} ข้อความรอตอบกลับ`}
                </div>
              </>
            )}
          </div>
        </AppleCard>

        <AppleCard className="p-6 flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[#86868B]">ผู้ซื้อวันนี้</span>
            <div className="p-2 bg-[#34C759]/10 rounded-full text-[#34C759] group-hover:bg-[#34C759] group-hover:text-white transition-colors"><Smile size={18} /></div>
          </div>
          <div>
            {loading ? (
              <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">...</div>
            ) : (
              <>
                <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight group-hover:scale-105 transition-transform origin-left">{stats.todayCustomers}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  {stats.todayCustomers === 0 ? 'ยังไม่มีข้อมูล' : `${stats.todayCustomers} คน`}
                </div>
              </>
            )}
          </div>
        </AppleCard>

        <AppleCard className="p-6 flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[#86868B]">อัตราการตอบกลับ</span>
            <div className="p-2 bg-[#007AFF]/10 rounded-full text-[#007AFF] group-hover:bg-[#007AFF] group-hover:text-white transition-colors"><Bot size={18} /></div>
          </div>
          <div>
            {loading ? (
              <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight">...</div>
            ) : (
              <>
                <div className="text-4xl font-semibold text-[#1D1D1F] tracking-tight group-hover:scale-105 transition-transform origin-left">
                  {stats.responseRate !== null ? `${stats.responseRate}%` : '-'}
                </div>
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  {stats.responseRate !== null ? 'ของข้อความทั้งหมด' : 'ยังไม่มีข้อมูล'}
                </div>
              </>
            )}
          </div>
        </AppleCard>
      </div>
    </div>
  );
};

// BillCreationModal function declaration (was missing)
const BillCreationModal = ({ selectedProducts, setSelectedProducts, setShowBillModal, handleCreateBill, toggleProductSelection, PRODUCTS_CATALOG: productsCatalog, editingBill, setEditingBill, onViewBill, activeChatId, billPriceLevel, setBillPriceLevel }) => {
  const [billNumber, setBillNumber] = useState(editingBill?.billNumber || `INV-${Date.now().toString().slice(-6)}`);
  const [customerName, setCustomerName] = useState(editingBill?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(editingBill?.customerPhone || '');
  const [shippingAddress, setShippingAddress] = useState(editingBill?.shippingAddress || '');
  const [subDistrict, setSubDistrict] = useState(editingBill?.subDistrict || '');
  const [district, setDistrict] = useState(editingBill?.district || '');
  const [discount, setDiscount] = useState(editingBill?.discount || 0);
  const [shippingCost, setShippingCost] = useState(editingBill?.shippingCost || 0);
  const [billStatus, setBillStatus] = useState(editingBill?.status || 'draft');
  // Convert paymentSlip to array format for backward compatibility
  const getInitialPaymentSlips = () => {
    if (!editingBill?.paymentSlip) return [];
    return Array.isArray(editingBill.paymentSlip) 
      ? editingBill.paymentSlip 
      : [editingBill.paymentSlip];
  };
  const [paymentSlips, setPaymentSlips] = useState(getInitialPaymentSlips());
  const [selectedShipping, setSelectedShipping] = useState(editingBill?.shippingCompany || null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [isSaved, setIsSaved] = useState(false); // Track if bill has been saved
  const [hasChanges, setHasChanges] = useState(false); // Track if there are unsaved changes
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false); // Show custom unsaved changes dialog
  const [showDeleteSlipDialog, setShowDeleteSlipDialog] = useState(false); // Show delete slip dialog
  const [slipToDelete, setSlipToDelete] = useState(null); // Slip to delete
  const [showDeleteShippingDialog, setShowDeleteShippingDialog] = useState(false); // Show delete shipping dialog
  const [shippingToDelete, setShippingToDelete] = useState(null); // Shipping to delete
  const slipInputRef = useRef(null);

  // Function to check if there are unsaved changes
  const checkUnsavedChanges = () => {
    if (isSaved) return false;
    // Check if there's any data entered
    return selectedProducts.length > 0 || customerName.trim() !== '' || customerPhone.trim() !== '' || 
           shippingAddress.trim() !== '' || discount > 0 || shippingCost > 0 || paymentSlips.length > 0;
  };

  // Function to save bill automatically
  const saveBillAutomatically = async () => {
    if (!customerName || selectedProducts.length === 0) {
      return false; // Can't save without required fields
    }

    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const shippingPrice = selectedShipping ? selectedShipping.price : shippingCost;
    const total = subtotal - discount + shippingPrice;

    const billData = {
      id: editingBill?.id || billNumber,
      billNumber: billNumber,
      customerName,
      customerPhone,
      shippingAddress,
      subDistrict,
      district,
      items: selectedProducts,
      subtotal,
      discount,
      shippingCost: shippingPrice,
      shippingCompany: selectedShipping,
      total,
      createdAt: editingBill?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: billStatus,
      paymentSlip: paymentSlips.length > 0 ? (paymentSlips.length === 1 ? paymentSlips[0] : paymentSlips) : null
    };

    // ใช้ billsAPI.save() เพื่อ sync อัตโนมัติ (offline-first)
    try {
      await billsAPI.save(billData);
      loadBills(); // อัปเดต bills state
    } catch (error) {
      console.error('Error saving bill:', error);
      // billsAPI.save() จะบันทึกใน localStorage แล้ว แม้ API จะ fail
      loadBills(); // อัปเดต bills state จาก localStorage
    }
    setIsSaved(true);
    setHasChanges(false);
    return true;
  };

  // Function to handle modal close with confirmation
  const handleCloseModal = () => {
    if (checkUnsavedChanges()) {
      // Show custom dialog instead of browser confirm
      setShowUnsavedDialog(true);
    } else {
      // No unsaved changes, close normally
      closeModalCompletely();
    }
  };

  // Function to close modal completely
  const closeModalCompletely = () => {
    setShowBillModal(false);
    setEditingBill(null);
    setSelectedProducts([]);
    setPaymentSlips([]);
    setSlipPreview(null);
    setIsSaved(false);
    setHasChanges(false);
    setShowUnsavedDialog(false);
  };

  // Handle save and close from dialog
  const handleSaveAndClose = () => {
    if (saveBillAutomatically()) {
      // Show success toast
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      `;
      toast.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>✅ บันทึกข้อมูลเรียบร้อยแล้ว</span>
      `;
      document.body.appendChild(toast);

      // Add animation styles if not exists
      if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);

      closeModalCompletely();
      loadBills(); // อัปเดต bills state แทนการ reload
    } else {
      // Show error dialog
      setShowUnsavedDialog(false);
      const errorToast = document.createElement('div');
      errorToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      `;
      errorToast.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>⚠️ ไม่สามารถบันทึกได้<br/>กรุณากรอกชื่อลูกค้าและเพิ่มสินค้าอย่างน้อย 1 รายการ</span>
      `;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        errorToast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(errorToast), 300);
      }, 3000);
    }
  };

  // Handle discard changes - close without saving
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    // Close modal without saving
    setShowBillModal(false);
    setEditingBill(null);
    setSelectedProducts([]);
    setPaymentSlips([]);
    setSlipPreview(null);
    setIsSaved(false);
    setHasChanges(false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !showShippingModal && !showUnsavedDialog) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showShippingModal, showUnsavedDialog, selectedProducts, customerName, customerPhone, shippingAddress, discount, shippingCost, paymentSlips, isSaved]);

  // Load shipping companies from API
  useEffect(() => {
    const loadShippingCompanies = async () => {
      try {
        const companies = await shippingCompaniesAPI.getAll();
        setShippingCompanies(companies);
      } catch (error) {
        console.error('Error loading shipping companies:', error);
        // Fallback to default
        const defaultCompanies = [
          { id: 'flash', name: 'Flash Express', price: 50, icon: '⚡' },
          { id: 'kerry', name: 'Kerry Express', price: 60, icon: '🚚' },
          { id: 'jt', name: 'J&T Express', price: 45, icon: '📦' },
          { id: 'thaipost', name: 'ไปรษณีย์ไทย', price: 40, icon: '📮' },
          { id: 'scg', name: 'SCG Express', price: 55, icon: '🏢' },
        ];
        setShippingCompanies(defaultCompanies);
      }
    };
    loadShippingCompanies();
  }, []);

  // Load editing bill products
  useEffect(() => {
    if (editingBill && editingBill.items) {
      setSelectedProducts(editingBill.items);
    }
  }, [editingBill]);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    const icon = type === 'success'
      ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    toast.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
        ${icon}
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Add animation styles if not exists
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, type === 'success' ? 2000 : 3000);
  };

  // Handle slip upload
  const handleSlipUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let loadedCount = 0;
    const errors = [];

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`ไฟล์ที่ ${index + 1}: ไม่ใช่ไฟล์รูปภาพ`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`ไฟล์ที่ ${index + 1}: ไฟล์ใหญ่เกินไป (สูงสุด 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        const newSlip = { 
          id: `${Date.now()}-${index}`, 
          imageUrl: imageData, 
          uploadedAt: new Date().toISOString() 
        };
        setPaymentSlips(prev => [...prev, newSlip]);
        loadedCount++;
        
        // Auto change status to paid when slip is uploaded
        if (billStatus === 'draft' || billStatus === 'unpaid') {
          setBillStatus('paid');
        }
        
        // Show success message after all files are loaded
        if (loadedCount === files.length - errors.length) {
          if (errors.length > 0) {
            showToast(`✅ อัพโหลดสำเร็จ ${loadedCount} ไฟล์\n⚠️ มีข้อผิดพลาด ${errors.length} ไฟล์`, 'error');
          } else {
            showToast(`✅ อัพโหลดสลิปชำระเงิน ${loadedCount} ใบเรียบร้อยแล้ว`, 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0 && loadedCount === 0) {
      showToast(`❌ ${errors[0]}`, 'error');
    }
  };

  // Remove slip
  const handleRemoveSlip = (slipId) => {
    setSlipToDelete(slipId);
    setShowDeleteSlipDialog(true);
  };

  // Confirm remove slip
  const handleConfirmRemoveSlip = () => {
    if (slipToDelete !== null) {
      setPaymentSlips(prev => prev.filter(slip => {
        // Handle both object with id and index-based removal
        if (typeof slip === 'object' && slip.id) {
          return slip.id !== slipToDelete;
        }
        // If slipId is a number (index), remove by index
        if (typeof slipToDelete === 'number') {
          return prev.indexOf(slip) !== slipToDelete;
        }
        return true;
      }));
      if (paymentSlips.length === 1) {
        setSlipPreview(null);
      }
      if (slipInputRef.current) {
        slipInputRef.current.value = '';
      }
      setShowDeleteSlipDialog(false);
      setSlipToDelete(null);
      showToast('✅ ลบสลิปเรียบร้อยแล้ว', 'success');
    }
  };

  // Product Selector State
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [posProducts, setPosProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load products from POS database via API
  const loadPosProducts = async () => {
    console.log('🔄 Loading products from POS database...');

    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      
      if (data.success) {
        console.log('📦 Loaded', data.count, 'products from POS database');
        setPosProducts(data.products || []);

        if (data.count === 0) {
          console.log('⚠️ No products found in database');
          console.log('💡 Make sure products.sql file exists in postest/public/sql/');
        }
      } else {
        console.error('❌ Error loading products:', data.error);
        setPosProducts([]);
      }
    } catch (error) {
      console.error('❌ Failed to load products from API:', error);
      console.log(`💡 Make sure backend server is running at ${API_URL}`);
      setPosProducts([]);
    }
  };

  useEffect(() => {
    if (showProductSelector) {
      loadPosProducts();
    }
  }, [showProductSelector]);

  const filteredProducts = posProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProduct = (product) => {
    // Image URL is already fixed by backend API
    let imageUrl = product.image;
    // If image is still a relative path, fix it
    if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
      // Relative path - prepend backend API URL
      const imagePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      imageUrl = `${API_URL}/api/products/images/${imagePath}`;
    }

    const newProduct = {
      id: product.id || product.sku,
      name: product.name,
      price: product.price || 0,
      quantity: 1,
      sku: product.sku,
      image: imageUrl
    };

    // Check if already in cart
    const existingIndex = selectedProducts.findIndex(p => p.id === newProduct.id);
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([...selectedProducts, newProduct]);
    }

    setShowProductSelector(false);
    setSearchTerm('');
  };

  const subtotal = selectedProducts.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const shippingPrice = selectedShipping ? selectedShipping.price : shippingCost;
  const total = subtotal - discount + shippingPrice;
  const invoiceUrl = `https://yourshop.com/invoices/${billNumber.toLowerCase()}`;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showShippingModal) {
          handleCloseModal();
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden relative scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#1D1D1F]">
              {editingBill ? '✏️ แก้ไขบิล' : '➕ สร้างบิลใหม่'} - {billNumber}
            </h3>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${editingBill ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
              }`}>
              {editingBill ? 'กำลังแก้ไข' : 'เตรียมส่ง'}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${billStatus === 'paid' ? 'bg-green-100 text-green-600' :
              billStatus === 'sent' ? 'bg-purple-100 text-purple-600' :
                billStatus === 'preparing' ? 'bg-blue-100 text-blue-600' :
                  billStatus === 'unpaid' ? 'bg-red-100 text-red-600' :
                    billStatus === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                      'bg-gray-100 text-gray-600'
              }`}>
              {billStatus === 'paid' ? '✅ จ่ายแล้ว' :
                billStatus === 'sent' ? '🚚 ส่งแล้ว' :
                  billStatus === 'preparing' ? '📦 เตรียมส่ง' :
                    billStatus === 'unpaid' ? '⏳ ยังไม่จ่าย' :
                      billStatus === 'cancelled' ? '❌ ยกเลิก' :
                        '📝 ร่าง'}
            </span>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - 3 Columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

            {/* Left Column - รายการสินค้า */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-semibold text-[#1D1D1F] text-lg mb-4">📦 รายการสินค้า</h4>

              {/* Product List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">ยังไม่มีสินค้าในบิล</p>
                  </div>
                ) : (
                  selectedProducts.map((product, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg items-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.outerHTML = '<div class="flex items-center justify-center w-full h-full"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></div>';
                            }}
                          />
                        ) : (
                          <ImageIcon size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-[#1D1D1F] truncate">{product.name}</h5>
                        <p className="text-xs text-gray-500 mt-1">{product.price?.toLocaleString()} บาท</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...selectedProducts];
                            if (updated[idx].quantity > 1) {
                              updated[idx].quantity -= 1;
                            } else {
                              // Remove if quantity becomes 0
                              updated.splice(idx, 1);
                            }
                            setSelectedProducts(updated);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[24px] text-center font-semibold text-sm">{product.quantity || 1}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...selectedProducts];
                            updated[idx].quantity = (updated[idx].quantity || 1) + 1;
                            setSelectedProducts(updated);
                          }}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleProductSelection(product)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setShowProductSelector(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#007AFF] hover:text-[#007AFF] transition flex items-center justify-center gap-2"
              >
                <Plus size={18} /> เพิ่มสินค้า
              </button>

              {/* Product Selector Dialog */}
              {showProductSelector && (
                <div 
                  className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" 
                  onClick={() => setShowProductSelector(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowProductSelector(false);
                    }
                  }}
                >
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {/* Header - Sticky */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[#1D1D1F]">🎯 เลือกสินค้าจากคลัง POS</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadPosProducts()}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                            title="รีเฟรชข้อมูลจาก POS"
                          >
                            🔄 รีเฟรช
                          </button>
                          <button
                            onClick={() => setShowProductSelector(false)}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                      {/* Search */}
                      <input
                        type="text"
                        placeholder="🔍 ค้นหาสินค้า: ชื่อ, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                        autoFocus
                      />
                      
                      {/* Price Level Selector */}
                      <div className="flex items-center gap-2 mt-3 bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <span className="text-sm font-medium text-blue-800 ml-1">ราคาขาย:</span>
                        <select 
                          value={billPriceLevel}
                          onChange={(e) => setBillPriceLevel(Number(e.target.value))}
                          className="flex-1 bg-white border border-blue-200 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1.5"
                        >
                          <option value={1}>ราคา 1 (มาตรฐาน)</option>
                          <option value={2}>ราคา 2</option>
                          <option value={3}>ราคา 3</option>
                          <option value={4}>ราคา 4</option>
                          <option value={5}>ราคา 5</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-500">💚 พบสินค้า <strong>{filteredProducts.length}</strong> รายการ</p>
                        {posProducts.length === 0 && (
                          <a
                            href="http://localhost:8081/admin?tab=inventory"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-600 underline"
                          >
                            เปิด POS เพื่อเพิ่มสินค้า →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto p-6 min-h-0">
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
                          <p className="text-lg font-medium text-gray-700">
                            {posProducts.length === 0 ? '📦 ยังไม่มีสินค้าจากโปรแกรม POS' : 'ไม่พบสินค้าที่ค้นหา'}
                          </p>
                          {posProducts.length === 0 ? (
                            <div className="mt-4 space-y-3 max-w-md mx-auto">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                <p className="text-sm text-blue-800 font-medium mb-2">🔧 วิธีแก้ไข:</p>
                                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                  <li>เปิดโปรแกรม POS: <a href="http://localhost:8081/admin?tab=inventory" target="_blank" className="underline font-medium">คลิกที่นี่</a></li>
                                  <li>รอให้โปรแกรม POS โหลดเสร็จ (ข้อมูลจะ sync อัตโนมัติ)</li>
                                  <li>กลับมาหน้านี้แล้วคลิกปุ่ม <strong>🔄 รีเฟรช</strong></li>
                                </ol>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                💡 หรือถ้ายังไม่มีสินค้า ให้ไปเพิ่มสินค้าในโปรแกรม POS ก่อน
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm mt-2 text-gray-500">ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหา</p>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredProducts.map((product) => {
                            // Fix image URL
                            let imageUrl = product.image;
                            if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
                              imageUrl = `http://localhost:8081${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                            }

                            return (
                              <div
                                key={product.id || product.sku}
                                onClick={() => handleSelectProduct(product)}
                                className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#007AFF] hover:shadow-lg transition cursor-pointer group"
                              >
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-gray-400"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>';
                                      }}
                                    />
                                  ) : (
                                    <ShoppingBag size={32} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition">{product.name}</h4>
                                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-lg font-bold text-[#007AFF]">
                                      ฿{(
                                        billPriceLevel === 2 ? (product.price2 || product.price) :
                                        billPriceLevel === 3 ? (product.price3 || product.price) :
                                        billPriceLevel === 4 ? (product.price4 || product.price) :
                                        billPriceLevel === 5 ? (product.price5 || product.price) :
                                        product.price
                                      )?.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500">สต๊อก: {product.stock || 0}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0 bg-white">
                      <button
                        onClick={() => setShowProductSelector(false)}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ยอดรวม</span>
                  <span className="font-medium">{subtotal.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ส่วนลด</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">ค่าจัดส่ง</span>
                    {selectedShipping && (
                      <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md font-medium">
                        {selectedShipping.icon} {selectedShipping.name}
                      </span>
                    )}
                    <button
                      onClick={() => setShowShippingModal(true)}
                      className="text-xs px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-md font-medium transition whitespace-nowrap"
                      title="เลือกบริษัทขนส่ง"
                    >
                      เลือก
                    </button>
                  </div>
                  <input
                    type="number"
                    value={shippingPrice}
                    onChange={(e) => {
                      setShippingCost(Number(e.target.value));
                      setSelectedShipping(null);
                    }}
                    className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>ยอดชำระ</span>
                  <span className="text-[#007AFF]">{total.toLocaleString()} บาท</span>
                </div>
              </div>

              {/* Invoice URL */}
              <div className="pt-4 border-t border-gray-200">
                <label className="text-sm text-gray-600 mb-2 block">ส่งรายละเอียดบิลให้ลูกค้าของคุณ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invoiceUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(invoiceUrl)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                  >
                    <Copy size={16} /> คัดลอก
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Column - การชำระเงิน */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-semibold text-[#1D1D1F] text-lg mb-4">💳 การชำระเงิน</h4>

              {/* Payment Slip Upload & Preview */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 block flex items-center gap-2">
                    📷 สลิปโอนเงิน {paymentSlips.length > 0 && `(${paymentSlips.length} ใบ)`}
                  </label>
                  <button
                    onClick={() => slipInputRef.current?.click()}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Upload size={14} />
                    เพิ่มสลิป
                  </button>
                </div>

                <input
                  ref={slipInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSlipUpload}
                  className="hidden"
                />

                {paymentSlips.length === 0 ? (
                  <div className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center bg-white hover:bg-green-50 transition cursor-pointer"
                    onClick={() => slipInputRef.current?.click()}
                  >
                    <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">คลิกเพื่ออัพโหลดสลิป</p>
                    <p className="text-xs text-gray-500">รองรับ JPG, PNG (สูงสุด 5MB) • สามารถอัพโหลดได้หลายใบ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentSlips.map((slip, index) => (
                      <div key={slip.id || index} className="relative bg-white rounded-lg border-2 border-green-300 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-green-700">สลิปที่ {index + 1}</p>
                          <button
                            onClick={() => handleRemoveSlip(slip.id || index)}
                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            title="ลบสลิป"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <img
                          src={slip.imageUrl || slip}
                          alt={`Payment Slip ${index + 1}`}
                          className="w-full h-auto rounded-lg border border-green-200"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">⚡ เปลี่ยนสถานะด่วน:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBillStatus('unpaid')}
                    className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition"
                  >
                    ⏳ ยังไม่จ่าย
                  </button>
                  <button
                    onClick={() => setBillStatus('paid')}
                    className="py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold transition"
                  >
                    ✅ จ่ายแล้ว
                  </button>
                  <button
                    onClick={() => setBillStatus('preparing')}
                    className="py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    📦 เตรียมส่ง
                  </button>
                  <button
                    onClick={() => setBillStatus('sent')}
                    className="py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition"
                  >
                    🚚 ส่งแล้ว
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - การจัดส่ง */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-semibold text-[#1D1D1F] text-lg mb-4">🚚 การจัดส่ง</h4>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    const billData = {
                      id: editingBill?.id || billNumber,
                      billNumber: billNumber,
                      customerName,
                      customerPhone,
                      shippingAddress,
                      subDistrict,
                      district,
                      items: selectedProducts,
                      subtotal,
                      discount,
                      shippingCost: shippingPrice,
                      shippingCompany: selectedShipping,
                      total,
                      createdAt: editingBill?.createdAt || new Date().toISOString(),
                      status: billStatus,
                      paymentSlips: paymentSlips.length > 0 ? paymentSlips : null
                    };
                    onViewBill(billData);
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> ดูบิลออนไลน์
                </button>
                <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
                  ใบกำกับภาษี
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">ชื่อผู้รับ</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                    placeholder="กรอกชื่อผู้รับ"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">เบอร์ติดต่อ</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                    placeholder="กรอกเบอร์ติดต่อ"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">ที่อยู่จัดส่ง</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition resize-none"
                    placeholder="กรอกที่อยู่"
                    rows="3"
                    maxLength="200"
                  />
                  <p className="text-xs text-gray-400 mt-1">{shippingAddress.length}/200</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">ตำบล/แขวง</label>
                    <input
                      type="text"
                      value={subDistrict}
                      onChange={(e) => setSubDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                      placeholder="กรอกตำบล"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">อำเภอ/เขต</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                      placeholder="กรอกอำเภอ"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={async () => {
                      if (!customerName || selectedProducts.length === 0) {
                        alert('⚠️ กรุณากรอกชื่อลูกค้าและเพิ่มสินค้าอย่างน้อย 1 รายการ');
                        return;
                      }

                      const billData = {
                        id: editingBill?.id || billNumber,
                        billNumber: billNumber,
                        customerName,
                        customerPhone,
                        shippingAddress,
                        subDistrict,
                        district,
                        items: selectedProducts,
                        subtotal,
                        discount,
                        shippingCost: shippingPrice,
                        shippingCompany: selectedShipping,
                        total,
                        createdAt: editingBill?.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        status: billStatus,
                        paymentSlips: paymentSlips.length > 0 ? paymentSlips : null
                      };

                      try {
                        await billsAPI.save(billData);
                        await loadBills(); // อัปเดต bills state
                        setIsSaved(true);
                        setHasChanges(false);
                      } catch (error) {
                        console.error('Error saving bill:', error);
                        alert('❌ เกิดข้อผิดพลาดในการบันทึกบิล');
                      }

                      // Close modal and refresh
                      setShowBillModal(false);
                      setEditingBill(null);
                      setSelectedProducts([]);
                      setPaymentSlips([]);
                      setSlipPreview(null);
                      setIsSaved(false);
                      setHasChanges(false);

                      // Show modern toast notification
                      const toast = document.createElement('div');
                      toast.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 16px 24px;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                        z-index: 10000;
                        font-weight: 600;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        animation: slideIn 0.3s ease-out;
                      `;
                      toast.innerHTML = `
                        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>${editingBill ? '✅ อัพเดตบิลแล้ว' : '✅ บันทึกบิลแล้ว'}</span>
                      `;
                      document.body.appendChild(toast);

                      // Add animation styles
                      if (!document.getElementById('toast-animations')) {
                        const style = document.createElement('style');
                        style.id = 'toast-animations';
                        style.textContent = `
                          @keyframes slideIn {
                            from { transform: translateX(400px); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                          }
                          @keyframes slideOut {
                            from { transform: translateX(0); opacity: 1; }
                            to { transform: translateX(400px); opacity: 0; }
                          }
                        `;
                        document.head.appendChild(style);
                      }

                      // Remove after 2 seconds
                      setTimeout(() => {
                        toast.style.animation = 'slideOut 0.3s ease-out';
                        setTimeout(() => document.body.removeChild(toast), 300);
                      }, 2000);
                    }}
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> {editingBill ? '💾 บันทึกการแก้ไข' : '💾 บันทึกบิล'}
                  </button>
                  <button
                    onClick={handleCreateBill}
                    className="flex-1 py-3 bg-gradient-to-r from-[#34C759] to-[#30D158] text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    ส่งบิลให้ลูกค้า →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Shipping Company Modal */}
      {showShippingModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShippingModal(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowShippingModal(false);
            }
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden m-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">🚚 เลือกบริษัทขนส่ง</h3>
              <button
                onClick={() => setShowShippingModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Shipping Company List */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {shippingCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    setSelectedShipping(company);
                    setShippingCost(company.price);
                    setShowShippingModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-lg transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{company.icon}</span>
                    <span className="font-medium text-gray-900">{company.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600">฿{company.price}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteShippingDialog(true);
                        setShippingToDelete(company);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center"
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  </div>
                </button>
              ))}
            </div>

            {/* Add New Shipping Button */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  const newCompanyForm = document.getElementById('new-shipping-form');
                  if (newCompanyForm.style.display === 'none' || !newCompanyForm.style.display) {
                    newCompanyForm.style.display = 'block';
                  } else {
                    newCompanyForm.style.display = 'none';
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition font-medium"
              >
                ➕ เพิ่มบริษัทขนส่งใหม่
              </button>

              {/* Add New Form */}
              <div id="new-shipping-form" style={{ display: 'none' }} className="mt-3 pt-3 border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newCompany = {
                      id: Date.now().toString(),
                      name: formData.get('name'),
                      price: Number(formData.get('price')),
                      icon: formData.get('icon') || '📦'
                    };

                    const updated = [...shippingCompanies, newCompany];
                    setShippingCompanies(updated);
                    shippingCompaniesAPI.save(newCompany).catch(err => console.error('Error saving shipping company:', err));
                    document.getElementById('new-shipping-form').style.display = 'none';
                    e.target.reset();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อบริษัทขนส่ง</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="เช่น DHL Express"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ค่าจัดส่ง (บาท)</label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ไอคอน (Emoji)</label>
                    <input
                      type="text"
                      name="icon"
                      maxLength="2"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="🚚"
                    />
                    <p className="text-xs text-gray-400 mt-1">กด Win + . เพื่อเลือก Emoji</p>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('new-shipping-form').style.display = 'none';
                      }}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition"
                    >
                      ➕ เพิ่ม
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnsavedDialog(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1D1D1F]">ข้อมูลยังไม่ได้บันทึก</h3>
                  <p className="text-sm text-gray-600 mt-0.5">มีข้อมูลที่ยังไม่ได้บันทึก</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-700 leading-relaxed">
                คุณต้องการบันทึกข้อมูลก่อนปิดหน้าต่างหรือไม่?
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <span>ข้อมูลจะถูกบันทึกอัตโนมัติหากคุณกรอกชื่อลูกค้าและเพิ่มสินค้าครบถ้วน</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleDiscardChanges}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X size={18} />
                ยกเลิก
              </button>
              <button
                onClick={handleSaveAndClose}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Save size={18} />
                บันทึกและปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Slip Dialog */}
      {showDeleteSlipDialog && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteSlipDialog(false);
              setSlipToDelete(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">🗑️ ยืนยันการลบสลิป</h3>
              <p className="text-sm text-gray-600">คุณต้องการลบสลิปนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteSlipDialog(false);
                  setSlipToDelete(null);
                }}
                className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-bl-2xl font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmRemoveSlip}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-br-2xl font-medium hover:shadow-lg transition"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shipping Dialog */}
      {showDeleteShippingDialog && shippingToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteShippingDialog(false);
              setShippingToDelete(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">🗑️ ยืนยันการลบบริษัทขนส่ง</h3>
              <p className="text-sm text-gray-600">คุณต้องการลบ "{shippingToDelete.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteShippingDialog(false);
                  setShippingToDelete(null);
                }}
                className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-bl-2xl font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  const updated = shippingCompanies.filter(c => c.id !== shippingToDelete.id);
                  setShippingCompanies(updated);
                  await shippingCompaniesAPI.delete(shippingToDelete.id).catch(err => console.error('Error deleting shipping company:', err));
                  if (selectedShipping?.id === shippingToDelete.id) {
                    setSelectedShipping(null);
                  }
                  setShowDeleteShippingDialog(false);
                  setShippingToDelete(null);
                  showToast(`✅ ลบ "${shippingToDelete.name}" เรียบร้อยแล้ว`, 'success');
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-br-2xl font-medium hover:shadow-lg transition"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function OmniChatApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const activeTab = location.pathname.slice(1) || 'summary';
  const [activeChatId, setActiveChatId] = useState(null);
  const [showChatSelectionModal, setShowChatSelectionModal] = useState(false);
  const [billToSend, setBillToSend] = useState(null);
  const [availableChats, setAvailableChats] = useState([]);

  // Redirect to /summary if at root, or show bill if viewBill query param exists
  useEffect(() => {
    if (location.pathname === '/') {
      // ตรวจสอบว่ามี query parameter สำหรับดูบิลหรือไม่
      const params = new URLSearchParams(location.search);
      const billId = params.get('viewBill');
      if (billId) {
        // โหลดบิลจาก localStorage และแสดง
        const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
        const bill = bills.find(b => b.id === billId);
        if (bill) {
          setViewBillData(bill);
        }
        // ยังคง navigate ไปที่ summary แต่จะแสดงบิลด้วย
        navigate('/summary', { replace: true });
      } else {
        navigate('/summary', { replace: true });
      }
    }
  }, [location, navigate]);
  const [chats, setChats] = useState([]);
  const [shops, setShops] = useState([
    { id: 'all', name: 'ทั้งหมด', icon: 'all', count: '0', type: 'all', connected: true },
    { id: 'shop_line_1', name: 'LINE Official', icon: 'line', count: '0', type: 'line', connected: true }
  ]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showDeleteBillDialog, setShowDeleteBillDialog] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);

  // State for Filters
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [tagFilter, setTagFilter] = useState('ทั้งหมด');
  const [showTagFilterDropdown, setShowTagFilterDropdown] = useState(false);

  // State for Adding Tags
  const [showAddTagPopover, setShowAddTagPopover] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // State for Billing
  const [showBillModal, setShowBillModal] = useState(false);
  const [billPriceLevel, setBillPriceLevel] = useState(1); // 1-5 for bill creation
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewBillData, setViewBillData] = useState(null);
  const [showSendBillModal, setShowSendBillModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // For image/video preview
  const [editingBill, setEditingBill] = useState(null); // For editing existing bill
  const [billStatusFilter, setBillStatusFilter] = useState('all'); // For filtering bills by status
  const [bills, setBills] = useState([]); // State for bills list

  // Function to load bills - Offline-First: ดึงจาก localStorage ก่อน
  const loadBills = async () => {
    try {
      // 1. ดึงจาก localStorage ก่อน (แสดงทันที)
      const localBills = JSON.parse(localStorage.getItem('online_bills') || '[]');
      if (localBills.length > 0) {
        setBills(localBills); // แสดงทันที
      }
      
      // 2. พยายาม sync กับ server (background)
      try {
        const loadedBills = await billsAPI.getAll(); // จะ merge และ sync อัตโนมัติ
        setBills(loadedBills); // อัปเดตด้วยข้อมูลที่ merge แล้ว
      } catch (error) {
        console.warn('Sync with server failed, using localStorage:', error);
        // ใช้ localStorage ที่โหลดไว้แล้ว
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      setBills([]);
    }
  };

  // Load bills on mount and when activeTab changes to invoices
  useEffect(() => {
    if (activeTab === 'invoices') {
      loadBills();
    }
  }, [activeTab]);
  
  // Auto-sync bills เมื่อเปิดแอป (ทุก 30 วินาที)
  useEffect(() => {
    if (activeTab === 'invoices') {
      const syncInterval = setInterval(() => {
        loadBills(); // Sync อัตโนมัติ
      }, 30000); // 30 วินาที
      
      return () => clearInterval(syncInterval);
    }
  }, [activeTab]);

  // State for Chat Options Menu
  const [showChatOptionsMenu, setShowChatOptionsMenu] = useState(false);

  // State for Connect Shop Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [connectionStep, setConnectionStep] = useState('select'); // 'select', 'input-api', 'connecting', 'success'
  const [apiFormData, setApiFormData] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    const icon = type === 'success'
      ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    toast.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
        ${icon}
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Add animation styles if not exists
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, type === 'success' ? 2000 : 3000);
  };

  // Calculate bill statistics for invoices tab - Offline-First: ใช้ bills state ก่อน
  const savedBills = bills.length > 0 ? bills : (() => {
    // Fallback to localStorage ถ้า bills state ยังว่าง
    try {
      return JSON.parse(localStorage.getItem('online_bills') || '[]');
    } catch {
      return [];
    }
  })();
  const statusCounts = {
    all: savedBills.length,
    draft: savedBills.filter(b => b.status === 'draft').length,
    unpaid: savedBills.filter(b => b.status === 'unpaid').length,
    paid: savedBills.filter(b => b.status === 'paid').length,
    preparing: savedBills.filter(b => b.status === 'preparing').length,
    sent: savedBills.filter(b => b.status === 'sent').length,
    cancelled: savedBills.filter(b => b.status === 'cancelled').length,
  };
  const filteredBills = billStatusFilter === 'all'
    ? savedBills
    : savedBills.filter(b => b.status === billStatusFilter);

  // Initialize Firebase
  useEffect(() => {
    if (firebaseConfig) {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const database = getFirestore(app);
      setDb(database);

      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      };
      initAuth();

      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
    } else {
      setUser({ uid: 'demo-user' });
    }
  }, []);

  // Load LINE config from localStorage and send to backend on startup
  useEffect(() => {
    const loadLineConfig = async () => {
      const saved = localStorage.getItem('line_config');
      if (saved) {
        try {
          const config = JSON.parse(saved);
          // Send to backend
          await fetch(`${API_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelAccessToken: config.channelAccessToken,
              channelSecret: config.channelSecret,
              ngrokUrl: config.ngrokUrl
            })
          });
          console.log('✅ LINE config loaded from localStorage and sent to backend');
        } catch (error) {
          console.error('Failed to load LINE config:', error);
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.error(`❌ Cannot connect to backend at ${API_URL}`);
            console.error('💡 Please check:');
            console.error('   1. Backend service is running on Railway');
            console.error('   2. VITE_API_URL is set correctly in Railway Variables');
            console.error('   3. Backend URL is accessible:', API_URL);
          }
        }
      }
    };
    loadLineConfig();
  }, []);

  // Fetch Chats from Backend
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const fetchChats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chats`);
        const data = await response.json();
        if (data.length > 0) {
          setChats(data);
          // Auto-select first chat if no chat is selected
          if (!activeChatId && data.length > 0) {
            setActiveChatId(data[0].userId);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        // Check if backend is reachable
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error(`❌ Cannot connect to backend at ${API_URL}`);
          console.error('💡 Please check:');
          console.error('   1. Backend service is running on Railway');
          console.error('   2. VITE_API_URL is set correctly in Railway Variables');
          console.error('   3. Backend URL is accessible:', API_URL);
        }
      }
    };

    fetchChats();
    // Poll for new chats every 3 seconds
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [activeTab, activeChatId]);

  // Fetch Messages for active chat
  useEffect(() => {
    if (!activeChatId || activeTab !== 'chat') return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chats/${activeChatId}/messages`);
        const data = await response.json();
        console.log('📩 Fetched messages:', data); // Debug log
        const mappedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          type: msg.type || 'text',
          timestampLabel: msg.time,
          // Media fields
          imageUrl: msg.imageUrl,
          videoUrl: msg.videoUrl,
          audioUrl: msg.audioUrl,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          // Other fields
          stickerId: msg.stickerId,
          packageId: msg.packageId,
          latitude: msg.latitude,
          longitude: msg.longitude
        }));
        console.log('🗺️ Mapped messages:', mappedMessages); // Debug log
        
        // Only update if messages actually changed (prevent unnecessary re-renders)
        setMessages(prevMessages => {
          // Compare by message IDs and content to avoid re-rendering if nothing changed
          if (prevMessages.length === mappedMessages.length) {
            const hasChanged = prevMessages.some((prevMsg, idx) => {
              const newMsg = mappedMessages[idx];
              return !newMsg || 
                     prevMsg.id !== newMsg.id || 
                     prevMsg.text !== newMsg.text ||
                     prevMsg.videoUrl !== newMsg.videoUrl ||
                     prevMsg.imageUrl !== newMsg.imageUrl;
            });
            
            // If nothing changed, return previous to prevent re-render (especially for videos)
            if (!hasChanged) {
              return prevMessages;
            }
          }
          
          return mappedMessages;
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      try {
        fetchMessages();
      } catch (error) {
        console.debug('Error in message polling:', error);
      }
    }, 2000);
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeChatId, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Handle ESC key to close preview
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setPreviewMedia(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // --- Handlers ---

  // Send bill to chat
  const sendBillToChat = async (bill, chatId) => {
    try {
      // สร้าง URL สำหรับดูบิลออนไลน์
      const billUrl = `${window.location.origin}?viewBill=${bill.id}`;
      
      // ส่งลิงก์บิลออนไลน์ผ่าน LINE API
      const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `📄 บิลออนไลน์ของคุณ\n\nเลขที่บิล: ${bill.billNumber}\nยอดรวม: ${bill.total?.toLocaleString()} บาท\n\nดูบิลออนไลน์: ${billUrl}`
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update bill status to 'sent' - ใช้ billsAPI เพื่อ sync อัตโนมัติ
        try {
          await billsAPI.update(bill.id, {
            status: 'sent',
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating bill status:', error);
        }
        
        showToast('✅ ส่งบิลออนไลน์ให้ลูกค้าเรียบร้อยแล้ว', 'success');
        
        // อัปเดต bills state แทนการ reload หน้าเว็บ
        loadBills();
      } else {
        showToast('❌ ไม่สามารถส่งบิลได้: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error sending bill:', error);
      showToast('❌ เกิดข้อผิดพลาดในการส่งบิล\n\nกรุณาตรวจสอบ:\n1. Backend กำลังทำงาน\n2. ngrok กำลังทำงาน\n3. ngrok URL ถูกตั้งค่าใน Settings', 'error');
    }
  };

  const handleSimulateWebhook = (data) => {
    // Basic simulator logic to handle the pasted LINE webhook JSON
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(event => {
        if (event.type === 'message' && event.message.type === 'text') {
          const newMessage = {
            id: event.message.id,
            text: event.message.text,
            sender: 'user', // Simulated user
            type: 'text',
            chatId: activeChatId, // Force inject into current chat for demo
            timestampLabel: new Date(event.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            createdAt: serverTimestamp() // or mocked timestamp
          };

          // Add to local state immediately for demo
          setMessages(prev => [...prev, newMessage]);
        }
      });
    }
  };

  const handleSendMessage = async (type = 'text', content = null) => {
    if ((type === 'text' && !inputText.trim() && !content) || !activeChatId) return;

    let messageText = content || (type === 'text' ? inputText : (type === 'file' ? 'ส่งไฟล์แนบ' : 'ส่งใบสรุปรายการสั่งซื้อ'));
    
    // ถ้าเป็น type 'bill' ให้ส่งลิงก์บิลด้วย
    if (type === 'bill') {
      // ดึงบิลล่าสุดที่สร้างไว้
      const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
      if (bills.length > 0) {
        const latestBill = bills[bills.length - 1];
        const billUrl = `${window.location.origin}?viewBill=${latestBill.id}`;
        messageText = `📄 บิลออนไลน์ของคุณ\n\nเลขที่บิล: ${latestBill.billNumber}\nยอดรวม: ${latestBill.total?.toLocaleString()} บาท\n\nดูบิลออนไลน์: ${billUrl}`;
      }
    }

    try {
      // Send message to LINE via backend
      const response = await fetch(`${API_URL}/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Message sent to LINE user');
        // Message will appear via polling
      } else {
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    if (type === 'text') {
      setInputText('');
      if (content) {
        showToast('✅ ส่งลิงก์ร้านค้าเรียบร้อยแล้ว', 'success');
      }
    }
  };

  // File upload disabled - text only mode to save Railway credit
  const handleFileUpload = async (e) => {
    e.preventDefault();
    alert('การอัปโหลดไฟล์ถูกปิดใช้งานเพื่อประหยัด credit\nกรุณาใช้เฉพาะข้อความเท่านั้น');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to save bill automatically
  const saveBillAutomatically = async (billData) => {
    try {
      await billsAPI.save({
        ...billData,
        createdAt: billData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await loadBills(); // อัปเดต bills state
      const savedBill = bills.find(b => b.id === billData.id) || bills[bills.length - 1];
      
      // Save to customer history if phone exists
      if (savedBill && savedBill.customerPhone) {
        const phoneKey = savedBill.customerPhone.replace(/\s/g, '');
        const customerHistory = JSON.parse(localStorage.getItem('customer_history') || '{}');
        
        if (!customerHistory[phoneKey]) {
          customerHistory[phoneKey] = {
            phone: savedBill.customerPhone,
            name: savedBill.customerName || '',
            address: savedBill.shippingAddress || '',
            lineUserId: savedBill.lineUserId || null,
            totalOrders: 0,
            totalSpent: 0,
            firstOrderDate: new Date().toISOString(),
            lastOrderDate: new Date().toISOString(),
            orders: []
          };
        }
        
        // Update customer history
        customerHistory[phoneKey].name = savedBill.customerName || customerHistory[phoneKey].name;
        customerHistory[phoneKey].address = savedBill.shippingAddress || customerHistory[phoneKey].address;
        
        // Check if this order already exists
        const orderExists = customerHistory[phoneKey].orders.find(o => o.billId === savedBill.id);
        if (!orderExists) {
          customerHistory[phoneKey].totalOrders += 1;
          customerHistory[phoneKey].totalSpent += (savedBill.total || 0);
          customerHistory[phoneKey].orders.push({
            billNumber: savedBill.billNumber,
            billId: savedBill.id,
            date: savedBill.createdAt || new Date().toISOString(),
            total: savedBill.total || 0,
            items: savedBill.items?.length || 0,
            status: savedBill.status || 'draft'
          });
        } else {
          // Update existing order
          const orderIndex = customerHistory[phoneKey].orders.findIndex(o => o.billId === savedBill.id);
          if (orderIndex !== -1) {
            const oldTotal = customerHistory[phoneKey].orders[orderIndex].total;
            customerHistory[phoneKey].totalSpent = customerHistory[phoneKey].totalSpent - oldTotal + (savedBill.total || 0);
            customerHistory[phoneKey].orders[orderIndex] = {
              billNumber: savedBill.billNumber,
              billId: savedBill.id,
              date: savedBill.createdAt || customerHistory[phoneKey].orders[orderIndex].date,
              total: savedBill.total || 0,
              items: savedBill.items?.length || 0,
              status: savedBill.status || 'draft'
            };
          }
        }
        
        customerHistory[phoneKey].lastOrderDate = new Date().toISOString();
        localStorage.setItem('customer_history', JSON.stringify(customerHistory));
      }
      
      return savedBill || billData;
    } catch (error) {
      console.error('Error saving bill automatically:', error);
      return billData;
    }
  };

  const handleCreateBill = async () => {
    // Get current bill data from modal state (need to pass these as props or get from modal)
    // For now, we'll create a basic bill structure
    if (selectedProducts.length === 0) {
      showToast('⚠️ กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'error');
      return;
    }

    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const total = subtotal;
    
    const billData = {
      id: billNumber,
      billNumber: billNumber,
      customerName: '', // Will be filled from modal if available
      customerPhone: '',
      shippingAddress: '',
      subDistrict: '',
      district: '',
      items: selectedProducts,
      subtotal: subtotal,
      discount: 0,
      shippingCost: 0,
      shippingCompany: null,
      total: total,
      status: 'draft',
      paymentSlip: null
    };

    // Save bill automatically
    const savedBill = saveBillAutomatically(billData);
    loadBills(); // อัปเดต bills state
    
    // แสดง modal เลือกแชททุกครั้ง
    try {
      const allChats = await fetch(`${API_URL}/api/chats`).then(r => r.json()).catch(() => []);
      
      if (allChats.length === 0) {
        showToast('ยังไม่มีแชท', 'error');
        // ไม่ปิด modal ถ้าไม่มีแชท
        return;
      }
      
      // แสดง modal เลือกแชท
      setBillToSend(savedBill);
      setAvailableChats(allChats);
      setShowChatSelectionModal(true);
      
      // ปิด modal สร้างบิล (แต่ยังไม่ปิด modal เลือกแชท)
      setShowBillModal(false);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error fetching chats:', error);
      showToast('ไม่สามารถโหลดรายการแชทได้', 'error');
      // ไม่ปิด modal ถ้าเกิด error
    }
  };

  const toggleProductSelection = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      // Apply selected price level
      let finalPrice = product.price;
      if (billPriceLevel === 2) finalPrice = product.price2 || product.price;
      if (billPriceLevel === 3) finalPrice = product.price3 || product.price;
      if (billPriceLevel === 4) finalPrice = product.price4 || product.price;
      if (billPriceLevel === 5) finalPrice = product.price5 || product.price;

      // Create new product object with selected price
      const productWithPrice = { ...product, price: finalPrice };
      setSelectedProducts(prev => [...prev, productWithPrice]);
    }
  };

  // Tag Management Handlers
  const handleAddTag = () => {
    if (!newTagLabel.trim()) return;

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          tags: [...(chat.tags || []), { label: newTagLabel, color: newTagColor.class }]
        };
      }
      return chat;
    }));

    setNewTagLabel('');
    setShowAddTagPopover(false);
  };

  const removeTag = (chatId, tagIndex) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        const newTags = [...chat.tags];
        newTags.splice(tagIndex, 1);
        return { ...chat, tags: newTags };
      }
      return chat;
    }));
  };

  // Export Chat History Handler
  const exportChatHistory = (format) => {
    const activeChat = chats.find(c => c.id === activeChatId);
    const chatName = activeChat ? activeChat.name : 'chat_history';
    let content = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'txt') {
      content = messages.map(m => `[${m.timestampLabel || 'N/A'}] ${m.sender}: ${m.text || (m.type === 'file' ? '[File Attachment]' : '[Bill]')}`).join('\n');
      mimeType = 'text/plain';
      fileExtension = 'txt';
    } else if (format === 'csv') {
      content = 'Time,Sender,Message,Type\n' + messages.map(m => `"${m.timestampLabel || 'N/A'}","${m.sender}","${(m.text || '').replace(/"/g, '""')}","${m.type}"`).join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chatName}_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowChatOptionsMenu(false);
  };

  // Connect Shop Handlers
  const handleSelectPlatform = (platform) => {
    setConnectingPlatform(platform);
    setConnectionStep('input-api');
    setApiFormData({});
  };

  const handleApiSubmit = () => {
    setConnectionStep('connecting');
    // Simulate API Call with the form data
    setTimeout(() => {
      setConnectionStep('success');
      // Add new shop
      const newShop = {
        id: `shop_${connectingPlatform}_new_${Date.now()}`,
        name: `${connectingPlatform.charAt(0).toUpperCase() + connectingPlatform.slice(1)} Shop (API)`,
        icon: connectingPlatform,
        count: '0',
        type: connectingPlatform,
        connected: true
      };
      setShops(prev => [...prev, newShop]);
    }, 2500);
  };

  const closeConnectModal = () => {
    setShowConnectModal(false);
    setConnectionStep('select');
    setConnectingPlatform(null);
    setApiFormData({});
  }

  const renderApiInputs = () => {
    switch (connectingPlatform) {
      case 'lazada':
      case 'shopee':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop ID / Merchant ID</label>
              <div className="relative">
                <input
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                  placeholder="e.g. 12345678"
                  value={apiFormData.shopId || ''}
                  onChange={e => setApiFormData({ ...apiFormData, shopId: e.target.value })}
                />
                <ShoppingBag className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
              <div className="relative">
                <input
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                  placeholder="e.g. 888999"
                  value={apiFormData.partnerId || ''}
                  onChange={e => setApiFormData({ ...apiFormData, partnerId: e.target.value })}
                />
                <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Access Token</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                  placeholder="••••••••••••••••"
                  value={apiFormData.apiKey || ''}
                  onChange={e => setApiFormData({ ...apiFormData, apiKey: e.target.value })}
                />
                <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>
        );
      case 'tiktok':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Key</label>
              <input
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                placeholder="e.g. 7000..."
                value={apiFormData.appKey || ''}
                onChange={e => setApiFormData({ ...apiFormData, appKey: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input
                type="password"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                placeholder="••••••••••••••••"
                value={apiFormData.appSecret || ''}
                onChange={e => setApiFormData({ ...apiFormData, appSecret: e.target.value })}
              />
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">
                ⚠️ สำหรับ LINE Official Account กรุณาไปตั้งค่าที่หน้า Settings แทน
              </p>
              <button
                onClick={() => {
                  closeConnectModal();
                  navigate('/settings');
                }}
                className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                ไปที่หน้า Settings →
              </button>
            </div>
          </div>
        );
      case 'facebook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page ID</label>
              <input
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition"
                placeholder="e.g. 100020003000"
                value={apiFormData.channelId || ''}
                onChange={e => setApiFormData({ ...apiFormData, channelId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Access Token</label>
              <textarea
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition h-24 resize-none"
                placeholder="Paste your long-lived access token here..."
                value={apiFormData.accessToken || ''}
                onChange={e => setApiFormData({ ...apiFormData, accessToken: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-4 text-gray-500">
            Standard OAuth login will be used for this platform.
          </div>
        );
    }
  }


  // Filter Logic
  const getFilteredChats = () => {
    let filtered = chats;

    // Shop/Platform Filter
    if (selectedShopId !== 'all') {
      filtered = filtered.filter(chat => chat.shopId === selectedShopId);
    }

    // Tag Filter
    if (tagFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(chat =>
        chat.tags && chat.tags.some(tag => tag.label === tagFilter)
      );
    }

    // Sort pinned first
    return filtered.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);
  };

  const filteredChats = getFilteredChats();
  const activeChat = chats.find(c => c.id === activeChatId);

  // --- Renderers ---

  // Video refs to prevent reload on polling
  const videoRefs = useRef(new Map());
  // Cache for video elements to prevent re-render
  const videoElementCache = useRef(new Map());

  const renderMessageBubble = (msg) => {
    const isAdmin = msg.sender === 'admin';
    let content;

    // Handle image messages (both from user and admin)
    if (msg.imageUrl) {
      const imageUrl = msg.imageUrl.startsWith('http')
        ? msg.imageUrl
        : `${API_URL}${msg.imageUrl}`;

      content = (
        <div className="max-w-sm">
          <img
            src={imageUrl}
            alt="รูปภาพ"
            className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-90 transition hover:shadow-lg"
            onClick={() => setPreviewMedia({ type: 'image', url: imageUrl })}
            onError={(e) => {
              console.error('Image load error:', imageUrl);
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23ddd" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">📷 รูปภาพ</text></svg>';
            }}
          />
          {msg.text && msg.text !== '📷 ส่งรูปภาพ' && (
            <p className="text-sm mt-2">{msg.text}</p>
          )}
        </div>
      );
    }
    // Handle video messages (both from user and admin)
    else if (msg.videoUrl) {
      const videoUrl = msg.videoUrl.startsWith('http')
        ? msg.videoUrl
        : `${API_URL}${msg.videoUrl}`;
      
      const videoKey = `video-${msg.id || videoUrl}`;
      
      // Use cached video element if available to prevent re-render
      let videoElement = videoElementCache.current.get(videoKey);
      
      if (!videoElement) {
        videoElement = (
          <video
            ref={(el) => {
              if (el) {
                const existingRef = videoRefs.current.get(videoKey);
                if (!existingRef || existingRef !== el) {
                  videoRefs.current.set(videoKey, el);
                  // Only set src if not already set to prevent reload
                  if (!el.src || el.src === '') {
                    el.src = videoUrl;
                  }
                  el.pause();
                  el.currentTime = 0;
                }
              }
            }}
            key={videoKey} // Use stable key to prevent reload
            preload="none" // Don't preload to prevent reload
            className="rounded-xl max-w-full h-auto"
            style={{ maxHeight: '300px' }}
            controls={false}
            playsInline
            muted
            onError={(e) => {
              console.error('Video load error:', videoUrl);
              // Show placeholder if video fails to load
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.video-error')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'video-error bg-gray-100 rounded-xl p-4 text-center';
                errorDiv.innerHTML = '<p class="text-sm text-gray-500">🎥 วิดีโอไม่สามารถโหลดได้</p><p class="text-xs text-gray-400 mt-1">ไฟล์อาจถูกลบหรือไม่สามารถเข้าถึงได้</p>';
                parent.appendChild(errorDiv);
              }
            }}
            onLoadedMetadata={(e) => {
              // Prevent auto-play and ensure video doesn't reload
              e.target.pause();
              e.target.currentTime = 0;
            }}
          />
        );
        videoElementCache.current.set(videoKey, videoElement);
      }

      content = (
        <div className="max-w-sm">
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setPreviewMedia({ type: 'video', url: videoUrl })}
          >
            {videoElement}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <Play size={32} className="text-[#1D1D1F] ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
          {msg.text && msg.text !== '🎥 ส่งวิดีโอ' && (
            <p className="text-sm mt-2">{msg.text}</p>
          )}
        </div>
      );
    }
    // Handle audio messages
    else if (msg.audioUrl) {
      content = (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <audio src={`${API_URL}${msg.audioUrl}`} controls className="max-w-xs" />
        </div>
      );
    }
    // Handle file messages
    else if (msg.fileUrl) {
      const handleFileDownload = async (e) => {
        e.preventDefault();
        try {
          const filename = msg.fileUrl.split('/').pop();
          const response = await fetch(`${API_URL}/api/download/${filename}`);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = msg.fileName || filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error('Download error:', error);
        }
      };

      content = (
        <div
          onClick={handleFileDownload}
          className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-xs cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="w-10 h-10 bg-[#007AFF] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <FileText size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-[#1D1D1F] truncate">{msg.fileName || 'ไฟล์แนบ'}</p>
            <p className="text-[10px] text-gray-400">คลิกเพื่อดาวน์โหลด</p>
          </div>
        </div>
      );
    }
    // Handle bill messages
    else if (msg.type === 'bill') {
      content = (
        <div className="w-64 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
          <div className="bg-[#1D1D1F] p-4 flex justify-between items-center">
            <span className="text-white font-medium flex items-center gap-2 text-sm"><Receipt size={14} /> Invoice</span>
            <span className="text-gray-400 text-xs tracking-wider">{msg.billData.id}</span>
          </div>
          <div className="p-4 space-y-3">
            {msg.billData.items.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs text-[#1D1D1F]">
                <span>{item.name}</span>
                <span className="font-semibold">฿{item.price}</span>
              </div>
            ))}
            {msg.billData.items.length > 2 && <div className="text-xs text-gray-400 italic">+ อีก {msg.billData.items.length - 2} รายการ</div>}
            <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-semibold text-[#1D1D1F]">
              <span>Total</span>
              <span className="text-[#007AFF]">฿{msg.billData.total.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setViewBillData(msg.billData)}
            className="w-full bg-gray-50 hover:bg-gray-100 text-[#007AFF] text-xs py-3 font-medium transition duration-200 border-t border-gray-100"
          >
            View Details
          </button>
        </div>
      );
    }
    // Handle text messages
    else {
      content = <span className="text-[15px] leading-relaxed">{msg.text}</span>;
    }

    const isMedia = msg.imageUrl || msg.videoUrl || msg.audioUrl || msg.fileUrl || msg.type === 'bill';

    return (
      <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-2 group`}>
        <div className={`max-w-[75%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
          <div className={`${isMedia ? '' : 'px-4 py-2.5'} rounded-[20px] shadow-sm relative ${isAdmin
            ? (isMedia ? 'bg-transparent p-0 shadow-none' : 'bg-gradient-to-b from-[#007AFF] to-[#0062CC] text-white rounded-br-none')
            : (isMedia ? 'bg-transparent p-0 shadow-none' : 'bg-[#E9E9EB] text-[#1D1D1F] rounded-bl-none')
            }`}>
            {content}
          </div>
          <span className={`text-[10px] text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            {msg.timestampLabel}
          </span>
        </div>
      </div>
    );
  };

  const SidebarItem = ({ icon: Icon, id, isActive }) => (
    <div
      onClick={() => navigate(`/${id}`)}
      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 relative group ${isActive
        ? 'bg-white text-[#007AFF] shadow-md shadow-gray-200'
        : 'text-gray-400 hover:text-[#1D1D1F] hover:bg-white/50'
        }`}
    >
      <Icon strokeWidth={isActive ? 2.5 : 2} size={22} />
      {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#007AFF] rounded-l-full hidden md:block opacity-0"></div>}
    </div>
  );

  // --- Modals ---

  const handleDownloadMedia = async (url, type) => {
    try {
      const filename = url.split('/').pop();
      const response = await fetch(`${API_URL}/api/download/${filename}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct download
      window.open(`${API_URL}/api/download/${url.split('/').pop()}`, '_blank');
    }
  };

  const ConnectShopModal = () => {
    // Handle ESC key
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeConnectModal();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeConnectModal();
          }
        }}
      >
        <div 
          className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] scale-100 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {connectionStep === 'input-api' && (
              <button onClick={() => setConnectionStep('select')} className="text-gray-500 hover:text-black transition">
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-xl font-bold text-[#1D1D1F]">
              {connectionStep === 'select' ? 'Connect New Shop' :
                connectionStep === 'input-api' ? `Setup ${connectingPlatform ? connectingPlatform.charAt(0).toUpperCase() + connectingPlatform.slice(1) : ''} API` :
                  connectionStep === 'connecting' ? 'Connecting...' : 'Success'}
            </h3>
          </div>
          <button onClick={closeConnectModal} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          {connectionStep === 'select' && (
            <div className="grid grid-cols-3 gap-4">
              {['lazada', 'shopee', 'tiktok', 'line', 'facebook', 'instagram'].map(platform => (
                <div
                  key={platform}
                  onClick={() => handleSelectPlatform(platform)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-lg hover:border-[#007AFF]/20 cursor-pointer transition-all duration-300 group"
                >
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <img
                      src={getLogoUrl(platform)}
                      className="w-14 h-14 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = platform[0]; }}
                    />
                  </div>
                  <span className="font-semibold text-[#1D1D1F] capitalize">{platform}</span>
                  <span className="text-xs text-gray-400 mt-1">Connect</span>
                </div>
              ))}
            </div>
          )}

          {connectionStep === 'input-api' && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center p-3">
                  <img src={getLogoUrl(connectingPlatform)} className="w-full h-full object-contain" />
                </div>
              </div>
              <p className="text-center text-gray-500 text-sm mb-6">
                Please enter your {connectingPlatform} API credentials to authorize OmniChat to manage your store.
              </p>

              {renderApiInputs()}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleApiSubmit}
                  className="w-full py-3.5 bg-[#1D1D1F] text-white rounded-xl font-semibold hover:bg-black transition shadow-lg"
                >
                  Connect Store
                </button>
                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <Shield size={12} /> Data is encrypted and secure
                </p>
              </div>
            </div>
          )}

          {connectionStep === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gray-100"></div>
                <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-[#007AFF] border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={getLogoUrl(connectingPlatform)} className="w-8 h-8 object-contain" />
                </div>
              </div>
              <h4 className="mt-6 text-lg font-semibold text-[#1D1D1F]">Verifying Credentials...</h4>
              <p className="text-gray-500 mt-2">Connecting to {connectingPlatform} API</p>
            </div>
          )}

          {connectionStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-in zoom-in duration-300">
                <Check size={40} strokeWidth={3} />
              </div>
              <h4 className="text-2xl font-bold text-[#1D1D1F]">Connected Successfully!</h4>
              <p className="text-gray-500 mt-2 max-w-sm">
                Your <strong>{connectingPlatform}</strong> store has been linked via API. We are syncing your products and messages now.
              </p>
              <button
                onClick={closeConnectModal}
                className="mt-8 px-8 py-3 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-[#0056b3] transition shadow-lg shadow-blue-200"
              >
                Start Managing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  // --- Main Layout ---

  // MediaPreviewModal Component
  const MediaPreviewModal = () => {
    if (!previewMedia) return null;

    // Handle ESC key
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setPreviewMedia(null);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    return (
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200"
        onClick={() => setPreviewMedia(null)}
      >
        {/* Close Button */}
        <button
          onClick={() => setPreviewMedia(null)}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10 backdrop-blur-sm"
        >
          <X size={24} />
        </button>

        {/* ESC hint */}
        <div className="absolute top-6 left-6 text-white/60 text-sm flex items-center gap-2">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
          <span>เพื่อปิด</span>
        </div>

        {/* Media Content */}
        <div
          className="max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {previewMedia.type === 'image' ? (
            <img
              src={previewMedia.url}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          ) : previewMedia.type === 'video' ? (
            <video
              key={previewMedia.url} // Use URL as key to prevent reload
              src={previewMedia.url}
              controls
              autoPlay
              preload="metadata"
              playsInline
              controlsList="nodownload"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            />
          ) : null}
        </div>

        {/* Download Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadMedia(previewMedia.url, previewMedia.type);
          }}
          className="absolute bottom-6 right-6 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center gap-2 transition-all"
        >
          <Download size={20} />
          <span>ดาวน์โหลด</span>
        </button>
      </div>
    );
  };

  // If shop page, render standalone without sidebar
  if (activeTab === 'shop') {
    return <CustomerShop />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] font-sans antialiased overflow-hidden text-[#1D1D1F] selection:bg-[#007AFF]/20 selection:text-[#007AFF]">

      {/* Sidebar (Main Navigation) */}
      <div className="w-20 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col items-center py-8 z-30 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="mb-10 w-10 h-10 bg-gradient-to-br from-[#007AFF] to-[#00C7BE] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Bot size={24} strokeWidth={2.5} />
        </div>
        <div className="space-y-4 flex-1 w-full px-3">
          <SidebarItem icon={LineChart} id="summary" isActive={activeTab === 'summary'} />
          <SidebarItem icon={MessageSquare} id="chat" isActive={activeTab === 'chat'} />
          <SidebarItem icon={Receipt} id="invoices" isActive={activeTab === 'invoices'} />
          <SidebarItem icon={ShoppingBag} id="orders" isActive={activeTab === 'orders'} />
          <SidebarItem icon={Store} id="shop" isActive={activeTab === 'shop'} />
          <SidebarItem icon={BarChart2} id="analytics" isActive={activeTab === 'analytics'} />
        </div>
        <div className="mb-4">
          <SidebarItem icon={Settings} id="settings" isActive={activeTab === 'settings'} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F7]">

        {/* Dynamic Content Switching */}
        <div className="flex-1 overflow-hidden relative">

          {/* 1. Chat Tab - Double Sidebar Style */}
          <div className={`absolute inset-0 flex ${activeTab === 'chat' ? 'visible z-10' : 'invisible z-0'}`}>

            {/* 1.1 Shop Selector (Leftmost Column of Chat Tab) */}
            <div className="w-[260px] border-r border-gray-200 bg-white/80 backdrop-blur-lg flex flex-col z-20">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <ListFilter size={20} className="text-gray-400" />
                <Search size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {shops.map(shop => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedShopId === shop.id ? 'bg-[#F2F8FF] ring-1 ring-[#007AFF]/20' : 'hover:bg-gray-50'
                      }`}
                  >
                    <ShopIcon type={shop.type} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${selectedShopId === shop.id ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>
                        {shop.name}
                      </h4>
                    </div>
                    <div className="bg-[#FF3B30] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {shop.count}
                    </div>
                  </div>
                ))}

                {/* Add Shop Button in Sidebar */}
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 mt-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#007AFF] hover:text-[#007AFF] transition"
                >
                  <Plus size={16} /> Add Shop
                </button>
              </div>
            </div>

            {/* 1.2 Chat List (Middle Column) */}
            <div className="w-[340px] border-r border-gray-200 bg-white flex flex-col z-20">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button className="flex-1 py-3 text-sm font-medium text-[#1D1D1F] border-b-2 border-[#1D1D1F]">All</button>
                <button className="flex-1 py-3 text-gray-400 hover:text-gray-600 flex justify-center"><MessageCircle size={18} /></button>
                <button className="flex-1 py-3 text-gray-400 hover:text-gray-600 flex justify-center"><AlertCircle size={18} /></button>
                <button className="flex-1 py-3 text-gray-400 hover:text-gray-600 flex justify-center"><Bookmark size={18} /></button>
                <button className="flex-1 py-3 text-gray-400 hover:text-gray-600 flex justify-center"><Menu size={18} /></button>
              </div>

              {/* Sort & Filter */}
              <div className="p-3 border-b border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500 flex items-center gap-1">เรียงตาม <ListFilter size={12} /></span>
              </div>

              {/* Chat List Items */}
              <div className="overflow-y-auto flex-1 px-2 pb-3 space-y-1 scrollbar-hide pt-2">
                {filteredChats.map(chat => (
                  <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`p-3 rounded-2xl flex gap-3 cursor-pointer transition-all duration-200 ${activeChatId === chat.id ? 'bg-gray-50 shadow-sm ring-1 ring-gray-100' : 'hover:bg-gray-50/50'}`}>
                    <div className="relative">
                      <img src={chat.avatar} className="w-12 h-12 rounded-full bg-gray-200 object-cover border border-gray-100" />
                      <div className="absolute -bottom-1 -right-1 scale-90"><PlatformIcon platform={chat.platform} /></div>
                      {/* Unread Badge */}
                      {chat.unread > 0 && (
                        <div className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                          {chat.unread}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-semibold text-[15px] text-[#1D1D1F] truncate flex items-center gap-1">
                          {chat.isPinned && <Pin size={12} className="text-[#007AFF] fill-current" />}
                          {chat.name}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-medium">{chat.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">{chat.lastMessage}</p>

                      {/* Tags Display */}
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {chat.tags.map((tag, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${tag.color}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {activeChatId === chat.id && <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] self-center flex-shrink-0"></div>}
                  </div>
                ))}
                {filteredChats.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">No chats found in this shop</div>
                )}
              </div>
            </div>

            {/* 1.3 Chat Area (Rightmost Column) */}
            <div className="flex-1 flex flex-col bg-white relative">
              {/* Chat Header */}
              <div className="h-16 px-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-[#1D1D1F]">{activeChat?.name || 'Select a chat'}</div>
                  <div className={`w-2 h-2 rounded-full ${activeChat?.online ? 'bg-[#34C759]' : 'bg-gray-300'}`}></div>

                  {/* Active Chat Tags */}
                  <div className="flex gap-1">
                    {activeChat?.tags?.map((tag, i) => (
                      <div key={i} className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-transparent ${tag.color}`}>
                        <span className="w-1 h-1 rounded-full bg-current"></span> {tag.label}
                        <button onClick={(e) => { e.stopPropagation(); removeTag(activeChatId, i); }} className="hover:text-black/50 ml-1"><X size={10} /></button>
                      </div>
                    ))}

                    {/* Add Tag Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAddTagPopover(!showAddTagPopover)}
                        className="text-xs text-gray-400 border border-dashed border-gray-300 px-2 py-0.5 rounded-full hover:border-[#007AFF] hover:text-[#007AFF] transition flex items-center gap-1"
                      >
                        <Plus size={10} /> Tag
                      </button>

                      {showAddTagPopover && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                          <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Add New Tag</h4>
                          <input
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-3 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                            placeholder="Tag name (e.g. VIP)"
                            value={newTagLabel}
                            onChange={(e) => setNewTagLabel(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-1 mb-3 flex-wrap">
                            {TAG_COLORS.map((color, i) => (
                              <button
                                key={i}
                                onClick={() => setNewTagColor(color)}
                                className={`w-5 h-5 rounded-full ${color.class.split(' ')[0]} border-2 ${newTagColor.name === color.name ? 'border-[#1D1D1F]' : 'border-transparent'}`}
                              ></button>
                            ))}
                          </div>
                          <button
                            onClick={() => { handleAddTag(); }}
                            className="w-full bg-[#1D1D1F] text-white text-xs py-1.5 rounded-lg font-medium hover:bg-black"
                          >
                            Add Tag
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat Options Menu */}
                <div className="relative">
                  <MoreHorizontal
                    className="text-gray-400 hover:text-[#007AFF] cursor-pointer"
                    onClick={() => setShowChatOptionsMenu(!showChatOptionsMenu)}
                  />
                  {showChatOptionsMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => exportChatHistory('txt')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Download size={14} /> Export to Text (Notepad)
                      </button>
                      <button
                        onClick={() => exportChatHistory('csv')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <FileSpreadsheet size={14} /> Export to CSV (Excel)
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} /> Clear History
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <div className="text-center my-6"><span className="text-gray-300 text-xs font-medium uppercase tracking-widest">Today</span></div>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-300 mt-32 flex flex-col items-center">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>No messages yet</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={`msg-${msg.id}-${msg.timestamp || Date.now()}`}>{renderMessageBubble(msg)}</div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {/* File upload disabled - text only mode to save Railway credit */}
                  {/* <button
                    onClick={() => fileInputRef.current.click()}
                    className="text-gray-400 hover:text-[#007AFF] transition"
                    title="แนบไฟล์, รูปภาพ, วิดีโอ"
                  >
                    <Paperclip size={22} strokeWidth={2} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                  /> */}

                  <button onClick={() => setShowBillModal(true)} className="text-gray-400 hover:text-[#007AFF] transition" title="สร้างบิลใหม่">
                    <Receipt size={22} strokeWidth={2} />
                  </button>

                  <button onClick={() => setShowSendBillModal(true)} className="text-gray-400 hover:text-[#007AFF] transition" title="ส่งบิลออนไลน์">
                    <FileText size={22} strokeWidth={2} />
                  </button>

                  <button 
                    onClick={() => {
                      if (activeChatId) {
                        const shopUrl = `${window.location.origin}/shop?lineUserId=${activeChatId}`;
                        handleSendMessage('text', `🛒 สั่งซื้อสินค้าออนไลน์ได้ที่นี่:\n${shopUrl}\n\nคลิกเพื่อดูสินค้าและสั่งซื้อได้เลย!`);
                      } else {
                        showToast('กรุณาเลือกแชทกับลูกค้าก่อน', 'error');
                      }
                    }}
                    className="text-gray-400 hover:text-[#007AFF] transition" 
                    title="ส่งลิงก์ร้านค้า"
                  >
                    <Store size={22} strokeWidth={2} />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      className="w-full bg-gray-100 border-none rounded-full px-5 py-2.5 text-[15px] focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition placeholder:text-gray-400"
                      placeholder="iMessage"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage('text')}
                    />
                    <Smile size={20} className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>

                  <button
                    onClick={() => handleSendMessage('text')}
                    className={`p-2.5 rounded-full transition-all duration-200 ${inputText.trim() ? 'bg-[#007AFF] text-white shadow-md shadow-blue-200 scale-100' : 'bg-gray-200 text-gray-400 scale-95'}`}
                  >
                    <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Summary Page (Apple Style) */}
          {activeTab === 'summary' && (
            <div className="absolute inset-0 overflow-y-auto">
              <SummaryPage
                onAddShopClick={() => navigate('/settings')}
                onGoToSettings={() => navigate('/settings')}
                shops={shops}
              />
            </div>
          )}

          {/* 3. Invoices Page - สร้างบิล Online */}
          {activeTab === 'invoices' && (
            <div className="absolute inset-0 overflow-hidden">
              <InvoiceList
                bills={(() => {
                  // Offline-First: ใช้ bills state ถ้ามี, ถ้าไม่มีให้ดึงจาก localStorage
                  if (bills.length > 0) {
                    return [...bills].reverse();
                  }
                  // Fallback to localStorage
                  try {
                    const localBills = JSON.parse(localStorage.getItem('online_bills') || '[]');
                    return localBills.reverse();
                  } catch {
                    return [];
                  }
                })()}
                onViewBill={(bill) => {
                  setViewBillData(bill);
                }}
                onCreateBill={() => {
                  setShowBillModal(true);
                  setEditingBill(null);
                  setSelectedProducts([]);
                }}
                onEditBill={(bill) => {
                  setEditingBill(bill);
                  setShowBillModal(true);
                }}
                onDeleteBill={(bill) => {
                  setBillToDelete(bill);
                  setShowDeleteBillDialog(true);
                }}
                onSendBill={async (bill) => {
                  // แสดง modal เลือกแชททุกครั้ง
                  try {
                    const allChats = await fetch(`${API_URL}/api/chats`).then(r => r.json()).catch(() => []);
                    
                    if (allChats.length === 0) {
                      showToast('ยังไม่มีแชท', 'error');
                      return;
                    }
                    
                    // แสดง modal เลือกแชท
                    setBillToSend(bill);
                    setAvailableChats(allChats);
                    setShowChatSelectionModal(true);
                  } catch (error) {
                    console.error('Error fetching chats:', error);
                    showToast('ไม่สามารถโหลดรายการแชทได้', 'error');
                  }
                }}
                activeChatId={activeChatId}
              />
            </div>
          )}

          {/* 4. Orders Page Mockup */}
          {activeTab === 'orders' && (
            <div className="absolute inset-0 overflow-y-auto p-8">
              <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-6 tracking-tight">Orders</h2>
              <AppleCard className="p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[400px]">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <span className="font-medium">No active orders</span>
              </AppleCard>
            </div>
          )}

          {/* 5. Analytics Page Mockup */}
          {activeTab === 'analytics' && (
            <div className="absolute inset-0 overflow-y-auto p-8">
              <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-6 tracking-tight">Analytics</h2>
              <div className="grid grid-cols-2 gap-6">
                <AppleCard className="h-64 flex items-center justify-center text-gray-400">Chart 1</AppleCard>
                <AppleCard className="h-64 flex items-center justify-center text-gray-400">Chart 2</AppleCard>
              </div>
            </div>
          )}

          {/* 5. Settings Page */}
          {activeTab === 'settings' && (
            <div className="absolute inset-0 overflow-y-auto">
              <SettingsPage shops={shops} onBack={() => navigate('/summary')} onSimulateWebhook={handleSimulateWebhook} />
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {
        showBillModal && <BillCreationModal
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setShowBillModal={setShowBillModal}
          handleCreateBill={handleCreateBill}
          toggleProductSelection={toggleProductSelection}
          PRODUCTS_CATALOG={PRODUCTS_CATALOG}
          editingBill={editingBill}
          setEditingBill={setEditingBill}
          onViewBill={setViewBillData}
          activeChatId={activeChatId}
        />
      }
      {viewBillData && (
        <OnlineBillView 
          bill={viewBillData} 
          onClose={() => setViewBillData(null)}
          onEditBill={(bill) => {
            setViewBillData(null);
            setEditingBill(bill);
            setShowBillModal(true);
          }}
          activeChatId={activeChatId}
          onSendBillToCustomer={(bill) => {
            console.log('Bill sent to customer:', bill);
          }}
        />
      )}

      {/* Delete Bill Dialog */}
      {showDeleteBillDialog && billToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteBillDialog(false);
              setBillToDelete(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-5 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1D1D1F]">ยืนยันการลบบิล</h3>
                  <p className="text-sm text-gray-600 mt-0.5">การกระทำนี้ไม่สามารถยกเลิกได้</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-700 leading-relaxed mb-3">
                คุณต้องการลบบิล <span className="font-semibold text-[#007AFF]">#{billToDelete.billNumber}</span> หรือไม่?
              </p>
              {billToDelete.customerName && (
                <p className="text-sm text-gray-500 mb-4">
                  ลูกค้า: <span className="font-medium">{billToDelete.customerName}</span>
                </p>
              )}
              {billToDelete.total && (
                <p className="text-sm text-gray-500 mb-4">
                  ยอดรวม: <span className="font-medium">{billToDelete.total.toLocaleString()} บาท</span>
                </p>
              )}
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <span>ข้อมูลบิลจะถูกลบถาวรและไม่สามารถกู้คืนได้</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteBillDialog(false);
                  setBillToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <X size={18} />
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  // ใช้ billsAPI.delete() เพื่อ sync อัตโนมัติ
                  try {
                    await billsAPI.delete(billToDelete.id);
                    loadBills(); // อัปเดต bills state
                  } catch (error) {
                    console.error('Error deleting bill:', error);
                    loadBills(); // อัปเดต bills state จาก localStorage
                  }
                  
                  // Show success toast
                  const toast = document.createElement('div');
                  toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 16px 24px;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-weight: 600;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideIn 0.3s ease-out;
                  `;
                  toast.innerHTML = `
                    <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>✅ ลบบิลเรียบร้อยแล้ว</span>
                  `;
                  document.body.appendChild(toast);

                  // Add animation styles if not exists
                  if (!document.getElementById('toast-animations')) {
                    const style = document.createElement('style');
                    style.id = 'toast-animations';
                    style.textContent = `
                      @keyframes slideIn {
                        from { transform: translateX(400px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                      }
                      @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(400px); opacity: 0; }
                      }
                    `;
                    document.head.appendChild(style);
                  }

                  setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => document.body.removeChild(toast), 300);
                  }, 2000);

                  setShowDeleteBillDialog(false);
                  setBillToDelete(null);
                  loadBills(); // อัปเดต bills state แทนการ reload
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                ลบบิล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Bill Modal */}
      {showSendBillModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowSendBillModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSendBillModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#1D1D1F]">📤 ส่งบิลออนไลน์ให้ลูกค้า</h3>
              <button
                onClick={() => setShowSendBillModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Bill List */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                // Offline-First: ใช้ bills state ก่อน, ถ้าไม่มีให้ดึงจาก localStorage
                const displayBills = bills.length > 0 ? bills : (() => {
                  try {
                    return JSON.parse(localStorage.getItem('online_bills') || '[]');
                  } catch {
                    return [];
                  }
                })();
                const reversedBills = displayBills.reverse();
                if (reversedBills.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">ยังไม่มีบิลออนไลน์</p>
                      <p className="text-sm text-gray-500 mt-2">สร้างบิลใหม่ก่อนเพื่อส่งให้ลูกค้า</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {reversedBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#007AFF] hover:shadow-lg transition cursor-pointer group"
                        onClick={async () => {
                          if (!activeChatId) {
                            alert('กรุณาเลือกแชทก่อน');
                            return;
                          }

                          try {
                            // สร้าง URL สำหรับดูบิลออนไลน์ (ใช้ query parameter แทน route)
                            const billUrl = `${window.location.origin}?viewBill=${bill.id}`;
                            
                            // ส่งลิงก์บิลออนไลน์ผ่าน LINE API
                            const response = await fetch(`${API_URL}/api/chats/${activeChatId}/messages`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                text: `📄 บิลออนไลน์ของคุณ\n\nเลขที่บิล: ${bill.billNumber}\nยอดรวม: ${bill.total?.toLocaleString()} บาท\n\nดูบิลออนไลน์: ${billUrl}`
                              })
                            });

                            const data = await response.json();
                            if (data.success) {
                              alert('✅ ส่งบิลออนไลน์ให้ลูกค้าเรียบร้อยแล้ว');
                              setShowSendBillModal(false);
                            } else {
                              alert('❌ ไม่สามารถส่งบิลได้: ' + (data.error || 'Unknown error'));
                            }
                          } catch (error) {
                            console.error('Error sending bill:', error);
                            alert('❌ เกิดข้อผิดพลาดในการส่งบิล\n\nกรุณาตรวจสอบ:\n1. Backend กำลังทำงาน\n2. ngrok กำลังทำงาน\n3. ngrok URL ถูกตั้งค่าใน Settings');
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FileText size={24} className="text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition">
                                {bill.billNumber}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {bill.customerName || 'ไม่มีชื่อลูกค้า'} • {bill.total?.toLocaleString()} บาท
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('th-TH') : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-600' :
                            bill.status === 'sent' ? 'bg-purple-100 text-purple-600' :
                            bill.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                            bill.status === 'unpaid' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {bill.status === 'paid' ? '✅ จ่ายแล้ว' :
                             bill.status === 'sent' ? '🚚 ส่งแล้ว' :
                             bill.status === 'preparing' ? '📦 เตรียมส่ง' :
                             bill.status === 'unpaid' ? '⏳ ยังไม่จ่าย' :
                             '📝 ร่าง'}
                          </span>
                          <Send size={18} className="text-gray-400 group-hover:text-[#007AFF] transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSendBillModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      {showConnectModal && <ConnectShopModal />}
      {previewMedia && <MediaPreviewModal />}

      {/* Chat Selection Modal */}
      {showChatSelectionModal && billToSend && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChatSelectionModal(false);
              setBillToSend(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Send className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1D1D1F]">เลือกแชทที่จะส่งบิล</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {billToSend.customerName ? `บิลของ "${billToSend.customerName}"` : `บิลเลขที่ #${billToSend.billNumber}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {availableChats.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p>ยังไม่มีแชท</p>
                </div>
              ) : (() => {
                // จัดกลุ่มแชทตามแพลตฟอร์ม
                const groupedChats = availableChats.reduce((acc, chat) => {
                  const platform = chat.platform || shops.find(s => s.id === chat.shopId)?.type || 'other';
                  if (!acc[platform]) {
                    acc[platform] = [];
                  }
                  acc[platform].push(chat);
                  return acc;
                }, {});
                
                const platformOrder = ['line', 'facebook', 'shopee', 'lazada', 'tiktok', 'instagram', 'other'];
                
                return (
                  <div className="space-y-4">
                    {platformOrder.filter(p => groupedChats[p]).map((platform) => {
                      const platformChats = groupedChats[platform];
                      const shop = shops.find(s => s.type === platform);
                      const platformName = shop?.name || platform.toUpperCase();
                      
                      return (
                        <div key={platform} className="space-y-2">
                          {/* Platform Header */}
                          <div className="flex items-center gap-2 px-2 py-1">
                            <PlatformIcon platform={platform} />
                            <h5 className="text-sm font-semibold text-gray-700">{platformName}</h5>
                            <span className="text-xs text-gray-400">({platformChats.length})</span>
                          </div>
                          
                          {/* Chats in this platform */}
                          <div className="space-y-2 pl-6">
                            {platformChats.map((chat) => {
                    // ตรวจสอบว่าแชทนี้ตรงกับลูกค้าในบิลหรือไม่
                    const chatName = chat.name || chat.displayName || '';
                    const chatPhone = chat.phone || '';
                    const isMatched = billToSend.customerName && chatName.includes(billToSend.customerName) ||
                                     (billToSend.customerPhone && chatPhone.includes(billToSend.customerPhone));
                    
                    // หา Shop name จาก shopId
                    const shop = shops.find(s => s.id === chat.shopId);
                    const shopName = shop?.name || chat.shopId || 'ไม่ระบุร้าน';
                    const platform = chat.platform || shop?.type || 'unknown';
                    
                    return (
                      <button
                        key={chat.userId || chat.id}
                        onClick={async () => {
                          const chatId = chat.userId || chat.id;
                          const bill = billToSend;
                          
                          // ปิด modal ก่อน
                          setShowChatSelectionModal(false);
                          setBillToSend(null);
                          
                          // ส่งบิล (จะแสดง toast notification เอง)
                          await sendBillToChat(bill, chatId);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition text-left ${
                          isMatched 
                            ? 'bg-blue-50 border-2 border-blue-300 hover:bg-blue-100' 
                            : 'bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Chat Avatar/Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isMatched ? 'bg-blue-200' : 'bg-blue-100'
                        }`}>
                          <MessageSquare size={20} className={isMatched ? 'text-blue-700' : 'text-blue-600'} />
                        </div>
                        
                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold truncate ${isMatched ? 'text-blue-900' : 'text-[#1D1D1F]'}`}>
                              {chat.name || chat.displayName || chat.userId}
                            </h4>
                            {isMatched && (
                              <span className="px-2 py-0.5 bg-blue-200 text-blue-700 text-xs font-semibold rounded-full flex-shrink-0">
                                ตรงกัน
                              </span>
                            )}
                          </div>
                          
                          {/* Shop Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs truncate ${isMatched ? 'text-blue-600' : 'text-gray-500'}`}>
                              🏪 {shopName}
                            </span>
                          </div>
                          
                          {/* Phone if available */}
                          {chat.phone && (
                            <p className={`text-xs truncate mt-0.5 ${isMatched ? 'text-blue-600' : 'text-gray-500'}`}>
                              📞 {chat.phone}
                            </p>
                          )}
                        </div>
                        
                        {/* Send Icon */}
                        <Send size={18} className={`flex-shrink-0 ${isMatched ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                            );
                          })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowChatSelectionModal(false);
                  setBillToSend(null);
                }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
