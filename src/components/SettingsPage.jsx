import React, { useState } from 'react';
import { 
  Settings,
  User,
  Globe,
  CreditCard,
  Bell,
  ArrowLeft,
  Plus,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Building2
} from 'lucide-react';
import LineSettings from './LineSettings';
import { shopDataAPI, bankAccountsAPI } from '../utils/apiStorage';

const getLogoUrl = (platform) => {
  switch (platform) {
    case 'shopee': return 'https://logo.clearbit.com/shopee.co.th';
    case 'lazada': return 'https://logo.clearbit.com/lazada.co.th';
    case 'tiktok': return 'https://logo.clearbit.com/tiktok.com';
    case 'facebook': return 'https://logo.clearbit.com/facebook.com';
    case 'line': return 'https://at.line.me/img/line_at_logo.png'; // LINE@ logo
    case 'instagram': return 'https://logo.clearbit.com/instagram.com';
    default: return null;
  }
};

const SettingsPage = ({ shops, onBack, onSimulateWebhook }) => {
  const [selectedMenu, setSelectedMenu] = useState('channels');
  const [editingShop, setEditingShop] = useState(null);

  const handleEditShop = (shop) => {
    setEditingShop(shop);
  };

  // Show LineSettings if editing a LINE shop
  if (editingShop && editingShop.type === 'line') {
    return (
      <div className="h-full bg-[#F5F5F7]">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => setEditingShop(null)} 
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-gray-600 hover:text-[#1D1D1F] transition"
          >
            <ArrowLeft size={20} />
            <span>ย้อนกลับ</span>
          </button>
          <LineSettings shop={editingShop} onBack={() => setEditingShop(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#F5F5F7]">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">⚙️ Settings</h2>
        <nav className="space-y-1">
          {[
            { id: 'general', icon: Settings, label: 'General' },
            { id: 'shop', icon: User, label: 'ตั้งค่าร้าน' },
            { id: 'bank', icon: CreditCard, label: 'ตั้งค่าธนาคาร' },
            { id: 'channels', icon: Globe, label: 'Channels & Integrations' },
            { id: 'billing', icon: CreditCard, label: 'Billing' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setSelectedMenu(item.id); setEditingShop(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                selectedMenu === item.id
                  ? 'bg-[#F5F5F7] text-[#1D1D1F]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} className={selectedMenu === item.id ? 'text-[#007AFF]' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedMenu === 'channels' ? (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#1D1D1F]">🔌 Connected Channels</h3>
              <p className="text-sm text-gray-500 mt-1">จัดการการเชื่อมต่อช่องทางและ API</p>
            </div>

            <div className="grid gap-4">
              {shops.filter(s => s.type !== 'all').map(shop => (
                <div 
                  key={shop.id} 
                  className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#06C755] hover:shadow-lg transition-all cursor-pointer" 
                  onClick={() => handleEditShop(shop)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#06C755]/10 rounded-xl flex items-center justify-center p-2.5 border border-[#06C755]/20">
                      <img
                        src={getLogoUrl(shop.type)}
                        className="w-full h-full object-contain"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.parentElement.innerHTML = shop.name[0]; 
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1D1D1F] text-lg">{shop.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{shop.type} Integration</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-[#06C755] text-white rounded-lg text-sm font-medium hover:bg-[#05b54d] transition">
                      ตั้งค่า →
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        ) : selectedMenu === 'shop' ? (
          <ShopSettings />
        ) : selectedMenu === 'bank' ? (
          <BankSettings />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <Settings size={48} className="mb-4 opacity-20" />
            <p>Settings for {selectedMenu} coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Shop Settings Component
const ShopSettings = () => {
  const [shopName, setShopName] = useState('โรจน์พาณิชย์ โครงเหล็ก...');
  const [shopLogo, setShopLogo] = useState('RP');
  const [customerPriceLevel, setCustomerPriceLevel] = useState(1);
  const [productCardSize, setProductCardSize] = useState('medium');
  const [navCategoriesCount, setNavCategoriesCount] = useState(5);
  const [billModalSize, setBillModalSize] = useState('medium');
  const [billFontSize, setBillFontSize] = useState('small');
  const [loading, setLoading] = useState(false);

  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const shopData = await shopDataAPI.get();
        setShopName(shopData.shop_name || 'โรจน์พาณิชย์ โครงเหล็ก...');
        setShopLogo(shopData.shop_logo || 'RP');
        setProductCardSize(shopData.product_card_size || 'medium');
        setNavCategoriesCount(shopData.nav_categories_count || 5);
        setBillModalSize(shopData.bill_modal_size || 'medium');
        setBillFontSize(shopData.bill_font_size || 'small');
        
        // Load customer price level from settings API
        const getApiUrl = () => {
           const hostname = window.location.hostname;
           if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3000';
           return 'https://e45c90bd13d0.ngrok-free.app';
        };
        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/settings`);
        const data = await response.json();
        if (data.customerPriceLevel) {
          setCustomerPriceLevel(data.customerPriceLevel);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      alert('⚠️ กรุณากรอกชื่อร้าน');
      return;
    }
    
    setLoading(true);
    try {
      // Save shop data to API
      await shopDataAPI.save({
        shop_name: shopName.trim(),
        shop_logo: shopLogo.trim() || 'RP',
        product_card_size: productCardSize,
        nav_categories_count: navCategoriesCount,
        bill_modal_size: billModalSize,
        bill_font_size: billFontSize,
      });
      
      // Save backend settings
      const getApiUrl = () => {
           const hostname = window.location.hostname;
           if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3000';
           return 'https://e45c90bd13d0.ngrok-free.app';
      };
      const API_URL = getApiUrl();
      
      await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPriceLevel })
      });
      
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
        z-index: 10001;
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
        <span>✅ บันทึกการตั้งค่าแล้ว</span>
      `;
      
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
      
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">🏪 ตั้งค่าร้าน</h3>
        <p className="text-sm text-gray-500">จัดการข้อมูลร้านค้าและโลโก้ที่จะแสดงในบิลออนไลน์</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Preview Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-4">ตัวอย่างการแสดงผล</p>
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#007AFF] to-[#0056b3] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {shopLogo.trim() || 'RP'}
              </div>
              <div>
                <h4 className="text-xl font-bold text-[#1D1D1F]">{shopName.trim() || 'ชื่อร้าน'}</h4>
                <p className="text-sm text-gray-500">ข้อมูลร้านค้า</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อร้าน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
              placeholder="กรอกชื่อร้านของคุณ"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-2">ชื่อร้านจะแสดงในบิลออนไลน์และเอกสารต่างๆ</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              โลโก้ (ตัวย่อ)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={shopLogo}
                onChange={(e) => setShopLogo(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-center text-xl font-bold"
                placeholder="RP"
              />
              <div className="flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-[#007AFF] to-[#0056b3] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {shopLogo.trim() || 'RP'}
                </div>
                <p className="text-xs text-gray-500 mt-2">ตัวอักษรที่แสดงในโลโก้ (สูงสุด 10 ตัวอักษร)</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-[#1D1D1F] mb-4">💰 ตั้งค่าราคาหน้าร้าน (Customer Shop)</h4>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ระดับราคาที่แสดงให้ลูกค้าเห็น
              </label>
              <select
                value={customerPriceLevel}
                onChange={(e) => setCustomerPriceLevel(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
              >
                <option value={1}>ราคาที่ 1 (ราคาปกติ)</option>
                <option value={2}>ราคาที่ 2</option>
                <option value={3}>ราคาที่ 3</option>
                <option value={4}>ราคาที่ 4</option>
                <option value={5}>ราคาที่ 5</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                เลือกราคาที่จะแสดงในหน้าเว็บสำหรับลูกค้า (Shop)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ขนาดการ์ดสินค้า
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setProductCardSize('small')}
                  className={`p-4 border-2 rounded-xl transition ${
                    productCardSize === 'small'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">เล็ก</div>
                    <div className="bg-gray-200 rounded h-16 w-full"></div>
                  </div>
                </button>
                <button
                  onClick={() => setProductCardSize('medium')}
                  className={`p-4 border-2 rounded-xl transition ${
                    productCardSize === 'medium'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">กลาง</div>
                    <div className="bg-gray-200 rounded h-20 w-full"></div>
                  </div>
                </button>
                <button
                  onClick={() => setProductCardSize('large')}
                  className={`p-4 border-2 rounded-xl transition ${
                    productCardSize === 'large'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">ใหญ่</div>
                    <div className="bg-gray-200 rounded h-24 w-full"></div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                เลือกขนาดการ์ดสินค้าที่จะแสดงในหน้า Shop
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                จำนวนหมวดหมู่ใน Navigation
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={navCategoriesCount}
                onChange={(e) => setNavCategoriesCount(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                จำนวนหมวดหมู่ที่จะแสดงในเมนู Navigation ด้านบน (1-20)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ขนาดหน้าต่างดูบิล
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setBillModalSize('small')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billModalSize === 'small'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">เล็ก</div>
                    <div className="bg-gray-200 rounded h-12 w-full"></div>
                  </div>
                </button>
                <button
                  onClick={() => setBillModalSize('medium')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billModalSize === 'medium'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">กลาง</div>
                    <div className="bg-gray-200 rounded h-16 w-full"></div>
                  </div>
                </button>
                <button
                  onClick={() => setBillModalSize('large')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billModalSize === 'large'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">ใหญ่</div>
                    <div className="bg-gray-200 rounded h-20 w-full"></div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                เลือกขนาดหน้าต่างดูบิล
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ขนาดตัวอักษรในบิล
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setBillFontSize('small')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billFontSize === 'small'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">เล็ก</div>
                    <div className="text-xs">Aa</div>
                  </div>
                </button>
                <button
                  onClick={() => setBillFontSize('medium')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billFontSize === 'medium'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">กลาง</div>
                    <div className="text-sm">Aa</div>
                  </div>
                </button>
                <button
                  onClick={() => setBillFontSize('large')}
                  className={`p-4 border-2 rounded-xl transition ${
                    billFontSize === 'large'
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-2">ใหญ่</div>
                    <div className="text-base">Aa</div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                เลือกขนาดตัวอักษรในหน้าต่างดูบิล
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#0056b3] hover:from-[#0056b3] hover:to-[#004494] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bank Settings Component
const BankSettings = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  
  // Load bank accounts on mount
  React.useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const accounts = await bankAccountsAPI.getAll();
        setBankAccounts(accounts);
      } catch (error) {
        console.error('Error loading bank accounts:', error);
      }
    };
    loadBankAccounts();
  }, []);
  const [showAddBank, setShowAddBank] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({
    bank: 'ttb',
    name: '',
    number: '',
    accountHolder: ''
  });

  const banks = [
    { id: 'ttb', name: 'ธนาคารทหารไทยธนชาต', color: 'bg-[#0056b3]', shortName: 'TTB' },
    { id: 'bbl', name: 'ธนาคารกรุงเทพ', color: 'bg-[#1E3A8A]', shortName: 'BBL' },
    { id: 'kbank', name: 'ธนาคารกสิกรไทย', color: 'bg-[#006B3C]', shortName: 'KBANK' },
    { id: 'scb', name: 'ธนาคารไทยพาณิชย์', color: 'bg-[#4A148C]', shortName: 'SCB' },
    { id: 'ktb', name: 'ธนาคารกรุงไทย', color: 'bg-[#C8102E]', shortName: 'KTB' },
    { id: 'tmb', name: 'ธนาคารทหารไทยธนชาต', color: 'bg-[#0056b3]', shortName: 'TMB' },
    { id: 'gsb', name: 'ธนาคารออมสิน', color: 'bg-[#FF6B00]', shortName: 'GSB' },
    { id: 'krungsri', name: 'ธนาคารกรุงศรีอยุธยา', color: 'bg-[#FFD700]', shortName: 'KRUNGSRI' },
  ];

  const handleSaveBank = async () => {
    if (!formData.name || !formData.number || !formData.accountHolder) {
      alert('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Validate account number (should be numeric)
    if (!/^\d+(-\d+)*$/.test(formData.number.replace(/\s/g, ''))) {
      alert('⚠️ เลขที่บัญชีต้องเป็นตัวเลขเท่านั้น');
      return;
    }

    const accountToSave = { ...formData, id: editingBank?.id || Date.now().toString() };
    
    try {
      await bankAccountsAPI.save(accountToSave);
      const updatedAccounts = await bankAccountsAPI.getAll();
      setBankAccounts(updatedAccounts);
      setShowAddBank(false);
      setEditingBank(null);
      setFormData({ bank: 'ttb', name: '', number: '', accountHolder: '' });

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
        z-index: 10001;
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
        <span>✅ ${editingBank ? 'อัพเดต' : 'เพิ่ม'}ข้อมูลธนาคารแล้ว</span>
      `;
      
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
      
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Error saving bank account:', error);
      alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลธนาคาร');
    }
  };

  const handleDeleteBank = async (id) => {
    if (confirm('⚠️ ต้องการลบข้อมูลธนาคารนี้หรือไม่?')) {
      try {
        await bankAccountsAPI.delete(id);
        const updatedAccounts = await bankAccountsAPI.getAll();
        setBankAccounts(updatedAccounts);
        
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
        z-index: 10001;
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
        <span>✅ ลบข้อมูลธนาคารแล้ว</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000);
      } catch (error) {
        console.error('Error deleting bank account:', error);
        alert('❌ เกิดข้อผิดพลาดในการลบข้อมูลธนาคาร');
      }
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">🏦 ตั้งค่าธนาคาร</h3>
          <p className="text-sm text-gray-500">จัดการบัญชีธนาคารสำหรับรับเงินโอนจากลูกค้า</p>
        </div>
        <button
          onClick={() => {
            setShowAddBank(true);
            setEditingBank(null);
            setFormData({ bank: 'ttb', name: '', number: '', accountHolder: '' });
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] hover:from-[#0056b3] hover:to-[#004494] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus size={18} />
          เพิ่มบัญชีธนาคาร
        </button>
      </div>

      {showAddBank && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg mb-6 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-lg font-bold text-[#1D1D1F]">
              {editingBank ? '✏️ แก้ไขบัญชีธนาคาร' : '➕ เพิ่มบัญชีธนาคาร'}
            </h4>
            <button
              onClick={() => {
                setShowAddBank(false);
                setEditingBank(null);
                setFormData({ bank: 'ttb', name: '', number: '', accountHolder: '' });
              }}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เลือกธนาคาร <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {banks.map(bankOption => (
                  <button
                    key={bankOption.id}
                    onClick={() => {
                      const selectedBank = banks.find(b => b.id === bankOption.id);
                      setFormData({ ...formData, bank: bankOption.id, name: selectedBank?.name || '' });
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.bank === bankOption.id
                        ? 'border-[#007AFF] bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 ${bankOption.color} rounded-lg flex items-center justify-center text-white font-bold text-xs mx-auto mb-2`}>
                      {bankOption.shortName}
                    </div>
                    <p className="text-xs text-gray-600 text-center font-medium">{bankOption.shortName}</p>
                  </button>
                ))}
              </div>
              <select
                value={formData.bank}
                onChange={(e) => {
                  const selectedBank = banks.find(b => b.id === e.target.value);
                  setFormData({ ...formData, bank: e.target.value, name: selectedBank?.name || '' });
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
              >
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
                placeholder="ธนาคารทหารไทยธนชาต"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เลขที่บัญชี <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => {
                  // Allow only numbers and dashes
                  const value = e.target.value.replace(/[^\d-]/g, '');
                  setFormData({ ...formData, number: value });
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px] font-mono"
                placeholder="215-7-30684-2"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-2">กรอกเฉพาะตัวเลขและเครื่องหมาย -</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อเจ้าของบัญชี <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] transition text-[15px]"
                placeholder="บจก. โรจน์พาณิชย์ โครงเหล็ก"
                maxLength={100}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveBank}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#0056b3] hover:from-[#0056b3] hover:to-[#004494] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                {editingBank ? 'อัพเดตข้อมูล' : 'เพิ่มบัญชี'}
              </button>
              <button
                onClick={() => {
                  setShowAddBank(false);
                  setEditingBank(null);
                  setFormData({ bank: 'ttb', name: '', number: '', accountHolder: '' });
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {bankAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={40} className="text-blue-500" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีบัญชีธนาคาร</p>
            <p className="text-sm text-gray-500 mb-4">เพิ่มบัญชีธนาคารเพื่อให้ลูกค้าสามารถโอนเงินได้</p>
            <button
              onClick={() => {
                setShowAddBank(true);
                setEditingBank(null);
                setFormData({ bank: 'ttb', name: '', number: '', accountHolder: '' });
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              เพิ่มบัญชีธนาคารแรก
            </button>
          </div>
        ) : (
          bankAccounts.map((bank) => {
            const bankInfo = banks.find(b => b.id === bank.bank) || banks[0];
            return (
              <div key={bank.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-16 h-16 ${bankInfo.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}>
                        {bankInfo.shortName || bank.bank.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-[#1D1D1F] mb-1">{bank.name}</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 font-mono">
                            <span className="text-gray-500">เลขที่บัญชี:</span> {bank.number}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-500">ชื่อเจ้าของ:</span> {bank.accountHolder}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingBank(bank);
                          setFormData(bank);
                          setShowAddBank(true);
                        }}
                        className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                        title="แก้ไข"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="ลบ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

