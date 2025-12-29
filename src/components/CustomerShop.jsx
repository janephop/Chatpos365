import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, X, ArrowLeft, Send, MapPin, ShoppingBag, Receipt, FileText, Filter, Menu, Home, Info, Phone, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';
import { billsAPI, shopDataAPI } from '../utils/apiStorage';

const CustomerShop = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showMyBills, setShowMyBills] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceLevel, setPriceLevel] = useState(1); // Default price level for customers
  const [myBills, setMyBills] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [lineUserId, setLineUserId] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationProduct, setNotificationProduct] = useState(null);
  const [productCardSize, setProductCardSize] = useState('medium');
  const [shopName, setShopName] = useState('iStore');
  const [navCategoriesCount, setNavCategoriesCount] = useState(5); // จำนวนหมวดหมู่ที่จะแสดงใน Navigation
  const [billModalSize, setBillModalSize] = useState('medium'); // small, medium, large
  const [billFontSize, setBillFontSize] = useState('small'); // small, medium, large
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [inputPhone, setInputPhone] = useState('');

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Load configuration and products
  useEffect(() => {
    // Check for LINE user ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlLineId = urlParams.get('lineUserId');
    const storedLineId = localStorage.getItem('line_user_id');
    const lineId = urlLineId || storedLineId;
    
    if (lineId) {
      setLineUserId(lineId);
      localStorage.setItem('line_user_id', lineId);
      // Try to find customer phone from LINE chats
      loadCustomerFromLine(lineId);
    }

    loadSettings();
    loadProducts();
  }, []);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load product card size, shop name, and nav categories count
  useEffect(() => {
    const loadSize = () => {
      const savedSize = localStorage.getItem('product_card_size');
      if (savedSize) {
        setProductCardSize(savedSize);
      }
    };
    
    const loadShopName = () => {
      const savedShopName = localStorage.getItem('shop_name');
      if (savedShopName) {
        setShopName(savedShopName);
      }
    };
    
    const loadNavCategoriesCount = () => {
      const savedCount = localStorage.getItem('nav_categories_count');
      if (savedCount) {
        setNavCategoriesCount(parseInt(savedCount) || 5);
      }
    };
    
    const loadBillModalSize = () => {
      const savedSize = localStorage.getItem('bill_modal_size');
      if (savedSize) {
        setBillModalSize(savedSize);
      }
    };
    
    const loadBillFontSize = () => {
      const savedSize = localStorage.getItem('bill_font_size');
      if (savedSize) {
        setBillFontSize(savedSize);
      }
    };
    
    loadSize();
    loadShopName();
    loadNavCategoriesCount();
    loadBillModalSize();
    loadBillFontSize();
    
    // Poll for changes (since storage event doesn't work for same-origin)
    const interval = setInterval(() => {
      loadSize();
      loadShopName();
      loadNavCategoriesCount();
      loadBillModalSize();
      loadBillFontSize();
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Load settings from API
  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.customerPriceLevel) {
          setPriceLevel(data.customerPriceLevel);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem('shop_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.priceLevel) setPriceLevel(settings.priceLevel);
      }
    }
  };

  // Load customer info from LINE
  const loadCustomerFromLine = async (lineUserId) => {
    try {
      // Try to get customer info from chats
      const response = await fetch(`${API_URL}/api/chats`);
      const chats = await response.json();
      const customerChat = chats.find(chat => chat.userId === lineUserId);
      
      if (customerChat) {
        // Auto-fill customer name from LINE chat
        setCustomerInfo(prev => ({
          ...prev,
          name: customerChat.name || prev.name
        }));
        
        // Try to load bills for this customer
        loadMyBillsByLine(lineUserId, customerChat.name);
      }
    } catch (error) {
      console.error('Failed to load LINE customer:', error);
    }
  };

  // Load bills by LINE user ID
  const loadMyBillsByLine = async (lineUserId, customerName) => {
    try {
      // Get all bills from API
      const allBills = await billsAPI.getAll();
      
      // Filter bills by lineUserId first, then by customer name
      const filtered = allBills.filter(bill => {
        if (bill.lineUserId === lineUserId) return true;
        if (customerName && bill.customerName && bill.customerName.includes(customerName)) return true;
        return false;
      });
      
      setMyBills(filtered.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)));
      
      // If bills found, auto-show modal
      if (filtered.length > 0) {
        setShowMyBills(true);
      }
    } catch (error) {
      console.error('Failed to load bills:', error);
    }
  };

  // Load my bills
  const loadMyBills = async (phone) => {
    if (!phone) {
      setMyBills([]);
      setCustomerHistory(null);
      return;
    }
    try {
      const phoneKey = phone.replace(/\s/g, '');
      const allBills = await billsAPI.getAll();
      const filtered = allBills.filter(bill => 
        bill.customerPhone && bill.customerPhone.replace(/\s/g, '').includes(phoneKey)
      );
      setMyBills(filtered.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)));
      
      // Load customer history
      const history = JSON.parse(localStorage.getItem('customer_history') || '{}');
      if (history[phoneKey]) {
        setCustomerHistory(history[phoneKey]);
      } else {
        setCustomerHistory(null);
      }
    } catch (error) {
      console.error('Error loading my bills:', error);
      setMyBills([]);
      setCustomerHistory(null);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        
        // Extract unique categories from product category field (preferred) or SKU prefix
        const extractedCategories = data.products
          .map(p => {
            // Use category field if available, otherwise use SKU prefix
            if (p.category && p.category.trim()) {
              return p.category.trim();
            } else if (p.sku && p.sku.length >= 2) {
              return p.sku.substring(0, 2);
            }
            return null;
          })
          .filter(Boolean);
        const uniqueCategories = [...new Set(extractedCategories)];
        setCategories(uniqueCategories.sort());
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get price based on level
  const getPrice = (product) => {
    switch (parseInt(priceLevel)) {
      case 2: return product.price2 || product.price;
      case 3: return product.price3 || product.price;
      case 4: return product.price4 || product.price;
      case 5: return product.price5 || product.price;
      default: return product.price; // Price 1
    }
  };

  // Helper to format category name for display
  const formatCategoryName = (cat) => {
    // If it looks like a SKU prefix (2 characters, alphanumeric), format it
    if (cat && cat.length === 2 && /^[A-Z0-9]{2}$/.test(cat)) {
      return `หมวดหมู่ ${cat}`;
    }
    // Otherwise return as is (it's already a proper category name)
    return cat;
  };

  // Helper to get font size classes based on billFontSize
  const getFontSizeClasses = (type) => {
    if (billFontSize === 'small') {
      return {
        header: 'text-xl',
        subheader: 'text-sm',
        body: 'text-xs',
        price: 'text-lg',
        summary: 'text-xl'
      };
    } else if (billFontSize === 'large') {
      return {
        header: 'text-4xl',
        subheader: 'text-lg',
        body: 'text-base',
        price: 'text-3xl',
        summary: 'text-4xl'
      };
    } else { // medium
      return {
        header: 'text-3xl',
        subheader: 'text-base',
        body: 'text-sm',
        price: 'text-2xl',
        summary: 'text-3xl'
      };
    }
  };

  const fontSize = getFontSizeClasses();

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, finalPrice: getPrice(product) }];
    });
    
    // Show notification
    setNotificationProduct(product);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      // Check if product has category field and it matches
      if (p.category && p.category.trim() === selectedCategory) {
        matchesCategory = true;
      } 
      // Otherwise check SKU prefix
      else if (p.sku && p.sku.length >= 2 && p.sku.substring(0, 2) === selectedCategory) {
        matchesCategory = true;
      } else {
        matchesCategory = false;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }

    // Create bill and save to API
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const billData = {
      id: billNumber,
      billNumber: billNumber,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      shippingAddress: customerInfo.address,
      lineUserId: lineUserId || null, // Store LINE user ID if available
      items: cart.map(item => ({
        ...item,
        price: item.finalPrice,
        quantity: item.quantity || 1
      })),
      subtotal: totalAmount,
      discount: 0,
      shippingCost: 0,
      total: totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    // Save to API
    try {
      await billsAPI.save(billData);
    } catch (error) {
      console.error('Error saving bill:', error);
    }

    // Save to customer history
    const phoneKey = customerInfo.phone.replace(/\s/g, '');
    const customerHistory = JSON.parse(localStorage.getItem('customer_history') || '{}');
    
    if (!customerHistory[phoneKey]) {
      customerHistory[phoneKey] = {
        phone: customerInfo.phone,
        name: customerInfo.name,
        address: customerInfo.address,
        lineUserId: lineUserId || null,
        totalOrders: 0,
        totalSpent: 0,
        firstOrderDate: new Date().toISOString(),
        lastOrderDate: new Date().toISOString(),
        orders: []
      };
    }
    
    // Update customer history
    customerHistory[phoneKey].name = customerInfo.name; // Update name if changed
    customerHistory[phoneKey].address = customerInfo.address || customerHistory[phoneKey].address;
    customerHistory[phoneKey].totalOrders += 1;
    customerHistory[phoneKey].totalSpent += totalAmount;
    customerHistory[phoneKey].lastOrderDate = new Date().toISOString();
    customerHistory[phoneKey].orders.push({
      billNumber: billNumber,
      billId: billNumber,
      date: new Date().toISOString(),
      total: totalAmount,
      items: cart.length,
      status: 'draft'
    });
    
    localStorage.setItem('customer_history', JSON.stringify(customerHistory));

    alert(`✅ สั่งซื้อเรียบร้อย!\n\nเลขที่บิล: ${billNumber}\nยอดเงิน: ${totalAmount.toLocaleString()} บาท\n\nทางร้านจะติดต่อกลับไปที่เบอร์ ${customerInfo.phone}`);
    setCart([]);
    setShowCart(false);
    setCustomerInfo({ name: '', phone: '', address: '' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">กำลังโหลดสินค้า...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - iStore Style */}
      <header className="bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-gray-900">
                {shopName}
              </span>
            </div>
            
            {/* Navigation Links - Dynamic from categories (configurable count) */}
            {categories.length > 0 && (
              <nav className="hidden md:flex items-center gap-4">
                {categories.slice(0, navCategoriesCount).map(cat => (
                  <a 
                    key={cat}
                    href={`#${cat}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(cat);
                      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-sm font-medium transition ${
                      selectedCategory === cat
                        ? 'text-[#0071e3] font-semibold'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {formatCategoryName(cat)}
                  </a>
                ))}
              </nav>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (lineUserId) {
                    loadMyBillsByLine(lineUserId, customerInfo.name);
                    setShowMyBills(true);
                  } else {
                    setShowPhoneInput(true);
                  }
                }}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition relative"
                title={lineUserId ? "ดูบิลของฉัน (LINE)" : "ดูบิลของฉัน"}
              >
                <Receipt size={20} />
                {lineUserId && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </button>
              
              {/* Cart Button */}
              <button
                onClick={() => setShowCart(true)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition relative"
                title="ตะกร้าสินค้า"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0071e3] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Search and Category Filter */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="w-full pl-12 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition border border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter - Dropdown */}
            {categories.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-gray-600" />
                  <label className="text-base font-semibold text-gray-700">หมวดหมู่:</label>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition min-w-[150px]"
                >
                  <option value="all">ทั้งหมด</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{formatCategoryName(cat)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Section - iStore Style */}
      <section id="products" className="container mx-auto px-6 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">ไม่พบสินค้า</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'ลองเปลี่ยนคำค้นหาหรือหมวดหมู่' 
                : 'ยังไม่มีสินค้าในระบบ'}
            </p>
          </div>
        ) : (
          <div className={`grid gap-3 ${
            productCardSize === 'small' 
              ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : productCardSize === 'large'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
          }`}>
            {filteredProducts.map((product) => {
              const currentPrice = getPrice(product);
              const inCart = cart.find(c => c.id === product.id);
              
              const cardHeight = productCardSize === 'small' ? 'h-32' : productCardSize === 'large' ? 'h-56' : 'h-40';
              const padding = productCardSize === 'small' ? 'p-2' : productCardSize === 'large' ? 'p-4' : 'p-3';
              const titleSize = productCardSize === 'small' ? 'text-xs' : productCardSize === 'large' ? 'text-base' : 'text-sm';
              const priceSize = productCardSize === 'small' ? 'text-base' : productCardSize === 'large' ? 'text-xl' : 'text-lg';
              
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className={`relative ${cardHeight} bg-gray-50 overflow-hidden`}>
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {e.target.src = 'https://via.placeholder.com/200?text=No+Image'}}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={productCardSize === 'small' ? 24 : productCardSize === 'large' ? 48 : 32} />
                      </div>
                    )}
                    {/* Quantity Badge */}
                    {inCart && (
                      <div className={`absolute top-2 right-2 bg-[#0071e3] text-white font-bold rounded-full flex items-center justify-center shadow-lg ${
                        productCardSize === 'small' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
                      }`}>
                        {inCart.quantity}
                      </div>
                    )}
                  </div>
                  
                  <div className={padding}>
                    <h3 className={`${titleSize} font-semibold text-gray-900 mb-1 line-clamp-2 ${
                      productCardSize === 'small' ? 'h-8' : productCardSize === 'large' ? 'h-12' : 'h-10'
                    }`}>{product.name}</h3>
                    {productCardSize !== 'small' && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {product.sku}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${priceSize} font-bold text-gray-900`}>฿{currentPrice.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`bg-[#0071e3] text-white rounded-lg font-medium hover:bg-[#0077ed] active:scale-95 transition-all duration-200 ${
                          productCardSize === 'small' 
                            ? 'px-2 py-1 text-xs' 
                            : productCardSize === 'large'
                            ? 'px-6 py-2 text-base'
                            : 'px-4 py-1.5 text-sm'
                        }`}
                      >
                        ซื้อ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notification Toast */}
      {showNotification && notificationProduct && (
        <div className="fixed top-24 right-6 z-50 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 min-w-[300px] border border-gray-200">
            <div className="bg-[#0071e3] w-12 h-12 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">เพิ่มลงตะกร้าแล้ว</p>
              <p className="text-sm text-gray-600 line-clamp-1">{notificationProduct.name}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}


      {/* Cart Sidebar - Slide from Right */}
      {showCart && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={() => setShowCart(false)}
          ></div>
          
          {/* Cart Sidebar */}
          <div 
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col"
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            
            {/* Cart Header - Blue */}
            <div className="bg-gradient-to-r from-[#0071e3] to-[#0077ed] text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">ตะกร้าสินค้า</h2>
                    <p className="text-white/80 text-sm">
                      {cart.length > 0 ? `${totalItems} รายการ` : 'ว่างเปล่า'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCart(false)} 
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              {cart.length > 0 && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">ยอดรวม</span>
                    <span className="text-2xl font-bold">฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={40} className="text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ตะกร้าว่างเปล่า</h3>
                  <p className="text-gray-500 text-sm">เพิ่มสินค้าเข้าไปในตะกร้าเพื่อเริ่มสั่งซื้อ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 line-clamp-2 mb-1">{item.name}</h4>
                          <p className="text-gray-900 font-bold text-lg mb-2">฿{item.finalPrice.toLocaleString()}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 active:scale-95 transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-bold text-gray-800 w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg active:scale-95 transition"
                            >
                              <Plus size={16} />
                            </button>
                            <div className="ml-auto text-right">
                              <p className="text-xs text-gray-500">รวม</p>
                              <p className="font-bold text-gray-800">฿{(item.finalPrice * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info Form */}
              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin size={18} className="text-[#0071e3]" />
                    ข้อมูลจัดส่ง
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="ชื่อผู้รับ"
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    />
                    <input
                      type="tel"
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    />
                    <textarea
                      placeholder="ที่อยู่จัดส่ง (ถ้ามี)"
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none transition"
                      value={customerInfo.address}
                      onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">ยอดรวมทั้งสิ้น</span>
                    <span className="text-2xl font-bold text-[#0071e3]">฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={!customerInfo.name || !customerInfo.phone}
                  className="w-full bg-[#0071e3] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Send size={20} />
                  ยืนยันการสั่งซื้อ
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Phone Input Modal */}
      {showPhoneInput && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#0071e3] to-[#0077ed] text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Receipt size={24} />
                  </div>
                  <h2 className="text-xl font-bold">ดูบิลของคุณ</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowPhoneInput(false);
                    setInputPhone('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                กรุณากรอกเบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                placeholder="เช่น 0812345678"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputPhone.trim()) {
                    setCustomerPhone(inputPhone.trim());
                    loadMyBills(inputPhone.trim());
                    setShowMyBills(true);
                    setShowPhoneInput(false);
                    setInputPhone('');
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] outline-none text-base"
                autoFocus
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPhoneInput(false);
                    setInputPhone('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    if (inputPhone.trim()) {
                      setCustomerPhone(inputPhone.trim());
                      loadMyBills(inputPhone.trim());
                      setShowMyBills(true);
                      setShowPhoneInput(false);
                      setInputPhone('');
                    }
                  }}
                  disabled={!inputPhone.trim()}
                  className="flex-1 px-4 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ดูบิล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Bills Modal - Redesigned */}
      {showMyBills && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
          <div className={`bg-white w-full sm:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl overflow-hidden ${
            billModalSize === 'small' 
              ? 'sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh]'
              : billModalSize === 'large'
              ? 'sm:max-w-6xl h-[95vh] sm:h-auto sm:max-h-[95vh]'
              : 'sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh]'
          }`}>
            
            {/* Header - Modern Design */}
            <div className={`relative bg-gradient-to-br from-[#0071e3] via-[#0077ed] to-[#0051a5] text-white ${billFontSize === 'small' ? 'p-5' : billFontSize === 'large' ? 'p-10' : 'p-8'}`}>
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
              </div>
              
              <div className="relative z-10">
                <div className={`flex items-center justify-between ${billFontSize === 'small' ? 'mb-4' : 'mb-6'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`bg-white/20 backdrop-blur-sm ${billFontSize === 'small' ? 'p-2' : billFontSize === 'large' ? 'p-5' : 'p-4'} rounded-2xl shadow-lg`}>
                      <Receipt size={billFontSize === 'small' ? 20 : billFontSize === 'large' ? 40 : 32} />
                    </div>
                    <div>
                      <h2 className={`${fontSize.header} font-bold mb-1`}>บิลของฉัน</h2>
                      <p className={`text-white/90 ${fontSize.subheader}`}>ประวัติการสั่งซื้อทั้งหมด</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMyBills(false)} 
                    className={`${billFontSize === 'small' ? 'p-2' : 'p-3'} hover:bg-white/20 rounded-full transition backdrop-blur-sm`}
                  >
                    <X size={billFontSize === 'small' ? 20 : 24} />
                  </button>
                </div>
                
                {/* Customer Summary - Enhanced */}
                {customerHistory && (
                  <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className={`bg-white/20 rounded-full ${billFontSize === 'small' ? 'w-12 h-12' : billFontSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} flex items-center justify-center mx-auto mb-3`}>
                          <FileText size={billFontSize === 'small' ? 18 : billFontSize === 'large' ? 28 : 24} />
                        </div>
                        <p className={`text-white/80 ${fontSize.body} mb-1 font-medium`}>จำนวนบิล</p>
                        <p className={`${fontSize.price} font-bold`}>{customerHistory.totalOrders || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className={`bg-white/20 rounded-full ${billFontSize === 'small' ? 'w-12 h-12' : billFontSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} flex items-center justify-center mx-auto mb-3`}>
                          <Receipt size={billFontSize === 'small' ? 18 : billFontSize === 'large' ? 28 : 24} />
                        </div>
                        <p className={`text-white/80 ${fontSize.body} mb-1 font-medium`}>ยอดรวมทั้งหมด</p>
                        <p className={`${fontSize.price} font-bold`}>฿{(customerHistory.totalSpent || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <div className={`bg-white/20 rounded-full ${billFontSize === 'small' ? 'w-12 h-12' : billFontSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} flex items-center justify-center mx-auto mb-3`}>
                          <ShoppingBag size={billFontSize === 'small' ? 18 : billFontSize === 'large' ? 28 : 24} />
                        </div>
                        <p className={`text-white/80 ${fontSize.body} mb-1 font-medium`}>บิลล่าสุด</p>
                        <p className={`${fontSize.subheader} font-semibold`}>
                          {customerHistory.lastOrderDate 
                            ? new Date(customerHistory.lastOrderDate).toLocaleDateString('th-TH', { 
                                day: 'numeric', 
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bills List - Modern Design */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              {lineUserId ? (
                myBills.length === 0 ? (
                  <div className="text-center py-20">
                    <div className={`bg-gradient-to-br from-blue-100 to-blue-50 ${billFontSize === 'small' ? 'w-16 h-16' : billFontSize === 'large' ? 'w-32 h-32' : 'w-24 h-24'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <Receipt size={billFontSize === 'small' ? 32 : billFontSize === 'large' ? 64 : 48} className="text-[#0071e3]" />
                    </div>
                    <h3 className={`${fontSize.header} font-bold text-gray-800 mb-2`}>ยังไม่มีบิล</h3>
                    <p className={fontSize.subheader + ' text-gray-500'}>เมื่อสั่งซื้อสินค้า บิลจะแสดงที่นี่</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {myBills.map((bill, index) => (
                      <div key={bill.id} className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                        {/* Bill Header - Enhanced */}
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <div className={`bg-gradient-to-br from-[#0071e3] to-[#0051a5] text-white px-4 py-2 rounded-xl font-bold ${fontSize.body} shadow-md`}>
                                #{bill.billNumber}
                              </div>
                              <span className={`px-4 py-2 ${fontSize.body} font-semibold rounded-full shadow-sm ${
                                bill.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                                bill.status === 'sent' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                bill.status === 'preparing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                bill.status === 'unpaid' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {bill.status === 'paid' ? '✅ จ่ายแล้ว' :
                                 bill.status === 'sent' ? '🚚 ส่งแล้ว' :
                                 bill.status === 'preparing' ? '📦 เตรียมส่ง' :
                                 bill.status === 'unpaid' ? '⏳ ยังไม่จ่าย' :
                                 '📝 ร่าง'}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={`${fontSize.body} text-gray-500 mb-1`}>วันที่สั่งซื้อ</p>
                              <p className={`${fontSize.body} font-semibold text-gray-700`}>
                                {new Date(bill.createdAt || bill.updatedAt).toLocaleDateString('th-TH', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className={`${fontSize.body} text-gray-500 mt-1`}>
                                {new Date(bill.createdAt || bill.updatedAt).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Bill Items - Enhanced */}
                        <div className={billFontSize === 'small' ? 'p-4' : billFontSize === 'large' ? 'p-8' : 'p-6'}>
                          <h4 className={`${fontSize.body} font-semibold text-gray-500 mb-4 uppercase tracking-wide`}>รายการสินค้า</h4>
                          <div className={`space-y-3 mb-6`}>
                            {bill.items && bill.items.length > 0 ? (
                              bill.items.map((item, idx) => (
                                <div key={idx} className={`flex items-center gap-3 ${billFontSize === 'small' ? 'p-2' : 'p-3'} bg-gray-50 rounded-xl hover:bg-gray-100 transition`}>
                                  {/* Product Image */}
                                  <div className={`${billFontSize === 'small' ? 'w-12 h-12' : billFontSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-200 rounded-lg overflow-hidden flex-shrink-0`}>
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-full h-full ${item.image ? 'hidden' : 'flex'} items-center justify-center text-gray-400`}>
                                      <ShoppingBag size={billFontSize === 'small' ? 16 : billFontSize === 'large' ? 28 : 20} />
                                    </div>
                                  </div>
                                  
                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-gray-900 mb-1 ${fontSize.body} truncate`}>{item.name}</p>
                                    <div className={`flex items-center gap-3 ${fontSize.body} text-gray-600 flex-wrap`}>
                                      <span>จำนวน: {item.quantity || 1}</span>
                                      <span>•</span>
                                      <span>ราคา: ฿{item.price?.toLocaleString() || '0'}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Total Price */}
                                  <div className="text-right flex-shrink-0">
                                    <p className={`${fontSize.subheader} font-bold text-gray-900`}>
                                      ฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className={`text-gray-400 ${fontSize.body} text-center py-6`}>ไม่มีรายการสินค้า</p>
                            )}
                          </div>
                          
                          {/* Bill Summary - Enhanced */}
                          <div className={`bg-gradient-to-r from-[#0071e3] to-[#0077ed] rounded-2xl ${billFontSize === 'small' ? 'p-4' : 'p-5'} text-white shadow-lg`}>
                            <div className="flex justify-between items-center mb-4">
                              <span className={`${fontSize.subheader} font-semibold`}>ยอดรวมทั้งสิ้น</span>
                              <span className={`${fontSize.summary} font-bold`}>
                                ฿{bill.total?.toLocaleString() || '0'}
                              </span>
                            </div>
                            {bill.shippingAddress && (
                              <div className="mt-4 pt-4 border-t border-white/20">
                                <p className={`${fontSize.body} text-white/80 mb-1 flex items-center gap-2`}>
                                  <MapPin size={billFontSize === 'small' ? 12 : 14} />
                                  ที่อยู่จัดส่ง:
                                </p>
                                <p className={`${fontSize.body} font-medium`}>{bill.shippingAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : !customerPhone ? (
                <div className="text-center py-20">
                  <div className={`bg-gradient-to-br from-blue-100 to-blue-50 ${billFontSize === 'small' ? 'w-16 h-16' : billFontSize === 'large' ? 'w-32 h-32' : 'w-24 h-24'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Receipt size={billFontSize === 'small' ? 32 : billFontSize === 'large' ? 64 : 48} className="text-[#0071e3]" />
                  </div>
                  <h3 className={`${fontSize.header} font-bold text-gray-800 mb-2`}>กรุณากรอกเบอร์โทรศัพท์</h3>
                  <p className={fontSize.subheader + ' text-gray-500'}>เพื่อดูบิลของคุณ</p>
                </div>
              ) : myBills.length === 0 ? (
                <div className="text-center py-20">
                  <div className={`bg-gradient-to-br from-blue-100 to-blue-50 ${billFontSize === 'small' ? 'w-16 h-16' : billFontSize === 'large' ? 'w-32 h-32' : 'w-24 h-24'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Receipt size={billFontSize === 'small' ? 32 : billFontSize === 'large' ? 64 : 48} className="text-[#0071e3]" />
                  </div>
                  <h3 className={`${fontSize.header} font-bold text-gray-800 mb-2`}>ไม่พบบิล</h3>
                  <p className={fontSize.subheader + ' text-gray-500'}>สำหรับเบอร์ {customerPhone}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {myBills.map((bill, index) => (
                    <div key={bill.id} className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                      {/* Bill Header - Enhanced */}
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`bg-gradient-to-br from-[#0071e3] to-[#0051a5] text-white px-4 py-2 rounded-xl font-bold ${fontSize.body} shadow-md`}>
                              #{bill.billNumber}
                            </div>
                            <span className={`px-4 py-2 ${fontSize.body} font-semibold rounded-full shadow-sm ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                              bill.status === 'sent' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              bill.status === 'preparing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              bill.status === 'unpaid' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {bill.status === 'paid' ? '✅ จ่ายแล้ว' :
                               bill.status === 'sent' ? '🚚 ส่งแล้ว' :
                               bill.status === 'preparing' ? '📦 เตรียมส่ง' :
                               bill.status === 'unpaid' ? '⏳ ยังไม่จ่าย' :
                               '📝 ร่าง'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`${fontSize.body} text-gray-500 mb-1`}>วันที่สั่งซื้อ</p>
                            <p className={`${fontSize.body} font-semibold text-gray-700`}>
                              {new Date(bill.createdAt || bill.updatedAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className={`${fontSize.body} text-gray-500 mt-1`}>
                              {new Date(bill.createdAt || bill.updatedAt).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bill Items - Enhanced */}
                      <div className={billFontSize === 'small' ? 'p-4' : billFontSize === 'large' ? 'p-8' : 'p-6'}>
                        <h4 className={`${fontSize.body} font-semibold text-gray-500 mb-4 uppercase tracking-wide`}>รายการสินค้า</h4>
                        <div className={`space-y-3 mb-6`}>
                          {bill.items && bill.items.length > 0 ? (
                            bill.items.map((item, idx) => (
                              <div key={idx} className={`flex items-center gap-3 ${billFontSize === 'small' ? 'p-2' : 'p-3'} bg-gray-50 rounded-xl hover:bg-gray-100 transition`}>
                                {/* Product Image */}
                                <div className={`${billFontSize === 'small' ? 'w-12 h-12' : billFontSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-200 rounded-lg overflow-hidden flex-shrink-0`}>
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full ${item.image ? 'hidden' : 'flex'} items-center justify-center text-gray-400`}>
                                    <ShoppingBag size={billFontSize === 'small' ? 16 : billFontSize === 'large' ? 28 : 20} />
                                  </div>
                                </div>
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-gray-900 mb-1 ${fontSize.body} truncate`}>{item.name}</p>
                                  <div className={`flex items-center gap-3 ${fontSize.body} text-gray-600 flex-wrap`}>
                                    <span>จำนวน: {item.quantity || 1}</span>
                                    <span>•</span>
                                    <span>ราคา: ฿{item.price?.toLocaleString() || '0'}</span>
                                  </div>
                                </div>
                                
                                {/* Total Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className={`${fontSize.subheader} font-bold text-gray-900`}>
                                    ฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className={`text-gray-400 ${fontSize.body} text-center py-6`}>ไม่มีรายการสินค้า</p>
                          )}
                        </div>
                        
                        {/* Bill Summary - Enhanced */}
                        <div className={`bg-gradient-to-r from-[#0071e3] to-[#0077ed] rounded-2xl ${billFontSize === 'small' ? 'p-4' : 'p-5'} text-white shadow-lg`}>
                          <div className="flex justify-between items-center mb-4">
                            <span className={`${fontSize.subheader} font-semibold`}>ยอดรวมทั้งสิ้น</span>
                            <span className={`${fontSize.summary} font-bold`}>
                              ฿{bill.total?.toLocaleString() || '0'}
                            </span>
                          </div>
                          {bill.shippingAddress && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className={`${fontSize.body} text-white/80 mb-1 flex items-center gap-2`}>
                                <MapPin size={billFontSize === 'small' ? 12 : 14} />
                                ที่อยู่จัดส่ง:
                              </p>
                              <p className={`${fontSize.body} font-medium`}>{bill.shippingAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer - Enhanced */}
            {(myBills.length > 0 || customerHistory) && (
              <div className={`bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 ${billFontSize === 'small' ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                  {customerHistory && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={`${fontSize.body} text-gray-500 mb-1`}>จำนวนบิลทั้งหมด</p>
                        <p className={`${fontSize.subheader} font-bold text-gray-900`}>{customerHistory.totalOrders || 0}</p>
                      </div>
                      <div className={`${billFontSize === 'small' ? 'h-8' : 'h-12'} w-px bg-gray-300`}></div>
                      <div className="text-center">
                        <p className={`${fontSize.body} text-gray-500 mb-1`}>ยอดรวมทั้งหมด</p>
                        <p className={`${fontSize.subheader} font-bold text-[#0071e3]`}>฿{(customerHistory.totalSpent || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowMyBills(false)}
                    className={`${billFontSize === 'small' ? 'px-6 py-2 text-sm' : 'px-8 py-3'} bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold transition shadow-md hover:shadow-lg`}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CustomerShop;
