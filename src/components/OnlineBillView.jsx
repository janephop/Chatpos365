import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Clock, Truck, ChevronRight, MapPin, Phone, User, Copy, Edit2, Save, Upload, Send, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const OnlineBillView = ({ bill, onClose, onEditBill, shopInfo, activeChatId, onSendBillToCustomer }) => {
    if (!bill) return null;

    // Handle ESC key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Editing State
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [editedShipping, setEditedShipping] = useState({
        customerName: bill.customerName || '',
        shippingAddress: bill.shippingAddress || '',
        subDistrict: bill.subDistrict || '',
        district: bill.district || '',
        customerPhone: bill.customerPhone || ''
    });

    const handleSaveShipping = () => {
        // Update bill in localStorage
        const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
        const index = bills.findIndex(b => b.id === bill.id);
        
        if (index !== -1) {
            bills[index] = {
                ...bills[index],
                ...editedShipping,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('online_bills', JSON.stringify(bills));
            
            // Update current bill object
            Object.assign(bill, editedShipping);
            
            setIsEditingShipping(false);
            
            // Show success message
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
            `;
            toast.textContent = '✅ บันทึกที่อยู่แล้ว';
            
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
            
            toast.style.animation = 'slideIn 0.3s ease-out';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 2000);
        }
    };

    // Load shop settings
    const shopName = localStorage.getItem('shop_name') || 'โรจน์พาณิชย์ โครงเหล็ก...';
    const shopLogo = localStorage.getItem('shop_logo') || 'RP';
    
    // Load bank accounts from settings
    const bankAccounts = JSON.parse(localStorage.getItem('bank_accounts') || '[]');
    const bankAccount = bankAccounts.length > 0 ? bankAccounts[0] : null;
    
    const banks = {
        'ttb': { name: 'ธนาคารทหารไทยธนชาต', color: 'bg-[#0056b3]' },
        'bbl': { name: 'ธนาคารกรุงเทพ', color: 'bg-[#1E3A8A]' },
        'kbank': { name: 'ธนาคารกสิกรไทย', color: 'bg-[#006B3C]' },
        'scb': { name: 'ธนาคารไทยพาณิชย์', color: 'bg-[#4A148C]' },
        'ktb': { name: 'ธนาคารกรุงไทย', color: 'bg-[#C8102E]' },
        'tmb': { name: 'ธนาคารทหารไทยธนชาต', color: 'bg-[#0056b3]' },
    };

    // Status & Progress Logic
    const steps = [
        { id: 'payment', label: 'ชำระเงิน', status: ['draft', 'unpaid'] },
        { id: 'shipping', label: 'การจัดส่ง', status: ['paid'] },
        { id: 'preparing', label: 'เตรียมส่ง', status: ['preparing'] },
        { id: 'transit', label: 'ระหว่างขนส่ง', status: ['sent'] }
    ];

    const getCurrentStepIndex = (status) => {
        if (status === 'cancelled') return -1;
        if (status === 'sent') return 4;
        if (status === 'preparing') return 3;
        if (status === 'paid') return 2;
        return 1; // Default to payment
    };

    const currentStep = getCurrentStepIndex(bill.status);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-100/90 backdrop-blur-sm z-[100] overflow-y-auto"
            onClick={(e) => {
                // Close when clicking on the background (not on the bill content)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="min-h-screen flex flex-col items-center py-8 px-4 md:px-6">

                {/* Main Container */}
                <div 
                    className="w-full max-w-6xl bg-transparent flex flex-col gap-6"
                    onClick={(e) => {
                        // Prevent closing when clicking inside the bill content
                        e.stopPropagation();
                    }}
                >

                    {/* Top Bar: Logo & Progress */}
                    <div className="bg-white rounded-t-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black text-white font-bold flex items-center justify-center rounded text-xs">
                                {shopLogo}
                            </div>
                            <h1 className="text-xl font-bold text-[#00BFA5]">{shopName}</h1>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center w-full md:w-1/2 relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-[#00BFA5] -z-10 rounded-full transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                            ></div>

                            {steps.map((step, index) => {
                                const isActive = index + 1 <= currentStep;
                                return (
                                    <div key={step.id} className="flex-1 flex flex-col items-center gap-2">
                                        <div className={`text-xs font-medium ${isActive ? 'text-[#00BFA5]' : 'text-gray-300'}`}>
                                            {step.label}
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${isActive
                                                ? 'bg-[#00BFA5] border-[#00BFA5] text-white'
                                                : 'bg-white border-gray-200 text-gray-300'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="absolute top-4 right-4 md:static flex items-center gap-2">
                            {onEditBill && (
                                <button 
                                    onClick={() => {
                                        onClose();
                                        onEditBill(bill);
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#00BFA5] hover:bg-[#00BFA5]/10 rounded-lg transition"
                                    title="แก้ไขบิล"
                                >
                                    <Edit2 size={20} />
                                </button>
                            )}
                            <button 
                                onClick={onClose} 
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                                title="ปิด"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left Column: Bill Details */}
                        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-medium text-gray-800">บิลเลขที่ {bill.billNumber.replace('INV-', '')}</h2>
                                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                                        <div className="flex justify-between w-full min-w-[300px]">
                                            <span>ชื่อลูกค้า</span>
                                            <span className="font-medium text-gray-900">{bill.customerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>ออกบิลเมื่อ</span>
                                            <span>{formatDate(bill.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>กรุณาชำระก่อน</span>
                                            <span>{formatDate(new Date(new Date(bill.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[#00BFA5] text-sm font-medium bg-[#00BFA5]/10 px-3 py-1 rounded-full">
                                    ใบเสร็จ
                                </span>
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            {/* Items */}
                            <div className="space-y-6">
                                {bill.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                                            <p className="text-xs text-gray-400">รหัส: {item.sku || '-'}</p>
                                            <div className="flex justify-between items-end mt-2">
                                                <p className="text-sm text-gray-600">จำนวน {item.quantity}</p>
                                                <p className="font-medium text-gray-900">{(item.price * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            {/* Summary */}
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>มูลค่าสินค้า</span>
                                    <span>{bill.subtotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>ค่าจัดส่ง</span>
                                    <span>{bill.shippingCost?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                                {bill.shippingCompany && (
                                    <div className="text-xs text-gray-400 text-right -mt-1">
                                        {bill.shippingCompany.name}
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>ส่วนลด</span>
                                    <span>{bill.discount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4">
                                    <span>ยอดสุทธิ</span>
                                    <span className="text-[#00BFA5]">{bill.total?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Payment & Shipping */}
                        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 flex flex-col h-full">
                            <h2 className="text-2xl font-medium text-gray-800 mb-6">วิธีชำระเงิน</h2>

                            {/* Shipping Info */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-medium text-gray-500">รายละเอียดจัดส่ง</h3>
                                    {!isEditingShipping ? (
                                        <button 
                                            onClick={() => setIsEditingShipping(true)}
                                            className="text-[#00BFA5] text-sm hover:underline flex items-center gap-1"
                                        >
                                            <Edit2 size={14} /> แก้ไข
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditedShipping({
                                                        customerName: bill.customerName || '',
                                                        shippingAddress: bill.shippingAddress || '',
                                                        subDistrict: bill.subDistrict || '',
                                                        district: bill.district || '',
                                                        customerPhone: bill.customerPhone || ''
                                                    });
                                                    setIsEditingShipping(false);
                                                }}
                                                className="text-gray-500 text-sm hover:underline"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button 
                                                onClick={handleSaveShipping}
                                                className="text-[#00BFA5] text-sm hover:underline flex items-center gap-1 font-medium"
                                            >
                                                <Save size={14} /> บันทึก
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {!isEditingShipping ? (
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        <p className="font-medium text-gray-900 mb-1">{bill.customerName}</p>
                                        <p>{bill.shippingAddress}</p>
                                        <p>{bill.subDistrict} {bill.district}</p>
                                        <p className="mt-2">{bill.customerPhone}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">ชื่อผู้รับ</label>
                                            <input
                                                type="text"
                                                value={editedShipping.customerName}
                                                onChange={(e) => setEditedShipping({...editedShipping, customerName: e.target.value})}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-[#00BFA5] transition"
                                                placeholder="ชื่อผู้รับ"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">ที่อยู่</label>
                                            <textarea
                                                value={editedShipping.shippingAddress}
                                                onChange={(e) => setEditedShipping({...editedShipping, shippingAddress: e.target.value})}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-[#00BFA5] transition resize-none"
                                                placeholder="ที่อยู่จัดส่ง"
                                                rows="2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">ตำบล/แขวง</label>
                                                <input
                                                    type="text"
                                                    value={editedShipping.subDistrict}
                                                    onChange={(e) => setEditedShipping({...editedShipping, subDistrict: e.target.value})}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-[#00BFA5] transition"
                                                    placeholder="ตำบล"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">อำเภอ/เขต</label>
                                                <input
                                                    type="text"
                                                    value={editedShipping.district}
                                                    onChange={(e) => setEditedShipping({...editedShipping, district: e.target.value})}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-[#00BFA5] transition"
                                                    placeholder="อำเภอ"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">เบอร์โทร</label>
                                            <input
                                                type="tel"
                                                value={editedShipping.customerPhone}
                                                onChange={(e) => setEditedShipping({...editedShipping, customerPhone: e.target.value})}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-[#00BFA5] transition"
                                                placeholder="เบอร์โทรศัพท์"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 mb-8"></div>

                            {/* Bank Transfer Section */}
                            {bankAccounts.length > 0 ? (
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-gray-500 mb-4">โอนผ่านบัญชีธนาคาร</h3>
                                    {bankAccounts.map((account) => {
                                        const bankInfo = banks[account.bank] || banks['ttb'];
                                        return (
                                            <div key={account.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-[#00BFA5] cursor-pointer transition group mb-3">
                                                <div className={`w-12 h-12 ${bankInfo.color} rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                                                    {account.bank.toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500">{bankInfo.name}</p>
                                                    <p className="font-medium text-gray-900">{account.number}</p>
                                                    <p className="text-sm text-gray-600">{account.accountHolder}</p>
                                                </div>
                                                <ChevronRight className="text-gray-300 group-hover:text-[#00BFA5]" />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ ยังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาไปที่ Settings → ตั้งค่าธนาคาร เพื่อเพิ่มบัญชีธนาคาร
                                    </p>
                                </div>
                            )}

                            {/* Payment Slip Upload (If needed) */}
                            {(() => {
                                const slipInputRef = useRef(null);
                                // Convert paymentSlip to array if it's not already
                                const paymentSlips = Array.isArray(bill.paymentSlip) 
                                    ? bill.paymentSlip 
                                    : bill.paymentSlip 
                                        ? [bill.paymentSlip] 
                                        : [];
                                
                                const handleSlipUpload = (e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;
                                    
                                    // Validate all files
                                    for (const file of files) {
                                        if (!file.type.startsWith('image/')) {
                                            alert('❌ กรุณาเลือกไฟล์รูปภาพเท่านั้น');
                                            return;
                                        }
                                        
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert('❌ ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
                                            return;
                                        }
                                    }
                                    
                                    // Read all files
                                    const readers = files.map(file => {
                                        return new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = (event) => resolve(event.target.result);
                                            reader.readAsDataURL(file);
                                        });
                                    });
                                    
                                    Promise.all(readers).then((imageDataArray) => {
                                        // Update bill in localStorage
                                        const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
                                        const index = bills.findIndex(b => b.id === bill.id);
                                        if (index !== -1) {
                                            const existingSlips = Array.isArray(bills[index].paymentSlip) 
                                                ? bills[index].paymentSlip 
                                                : bills[index].paymentSlip 
                                                    ? [bills[index].paymentSlip] 
                                                    : [];
                                            
                                            bills[index] = {
                                                ...bills[index],
                                                paymentSlip: [...existingSlips, ...imageDataArray],
                                                status: 'paid',
                                                updatedAt: new Date().toISOString()
                                            };
                                            localStorage.setItem('online_bills', JSON.stringify(bills));
                                            Object.assign(bill, bills[index]);
                                            
                                            // Show success message
                                            alert(`✅ อัพโหลดสลิปชำระเงิน ${imageDataArray.length} ใบเรียบร้อยแล้ว`);
                                            window.location.reload();
                                        }
                                    });
                                    
                                    // Reset input
                                    if (slipInputRef.current) {
                                        slipInputRef.current.value = '';
                                    }
                                };
                                
                                const handleDeleteSlip = (indexToDelete) => {
                                    if (confirm('ต้องการลบสลิปนี้หรือไม่?')) {
                                        const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
                                        const index = bills.findIndex(b => b.id === bill.id);
                                        if (index !== -1) {
                                            const updatedSlips = paymentSlips.filter((_, idx) => idx !== indexToDelete);
                                            bills[index] = {
                                                ...bills[index],
                                                paymentSlip: updatedSlips.length > 0 ? updatedSlips : null,
                                                updatedAt: new Date().toISOString()
                                            };
                                            localStorage.setItem('online_bills', JSON.stringify(bills));
                                            Object.assign(bill, bills[index]);
                                            window.location.reload();
                                        }
                                    }
                                };
                                
                                return (
                                    <>
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm font-medium text-gray-700">
                                                    สลิปชำระเงิน {paymentSlips.length > 0 ? `(${paymentSlips.length} ใบ)` : ''}
                                                </p>
                                                <button 
                                                    onClick={() => slipInputRef.current?.click()}
                                                    className="bg-[#007AFF] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#0056b3] transition flex items-center gap-2"
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
                                                <div className="bg-blue-50 p-4 rounded-xl text-center border-2 border-dashed border-blue-200">
                                                    <p className="text-sm text-blue-600">ยังไม่ได้แนบสลิปชำระเงิน</p>
                                                    <p className="text-xs text-blue-500 mt-1">สามารถอัพโหลดได้หลายใบ</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {paymentSlips.map((slip, index) => (
                                                        <div key={index} className="bg-green-50 p-4 rounded-xl border border-green-200 relative">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-xs text-green-700 font-medium">
                                                                    สลิปที่ {index + 1}
                                                                </p>
                                                                <button 
                                                                    onClick={() => handleDeleteSlip(index)}
                                                                    className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                                                                    title="ลบสลิป"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                            <img 
                                                                src={slip} 
                                                                alt={`Payment Slip ${index + 1}`} 
                                                                className="w-full rounded-lg border border-green-200" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="mt-auto space-y-6">
                                {/* Action Button */}
                                {(!bill.paymentSlip || (Array.isArray(bill.paymentSlip) && bill.paymentSlip.length === 0)) && (
                                    <button className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                                        กรุณาเลือกช่องทางชำระเงินเพื่อไปขั้นตอนถัดไป
                                    </button>
                                )}
                                
                                {/* Send Bill Button - Show when all info is complete and paid */}
                                {bill.paymentSlip && (Array.isArray(bill.paymentSlip) ? bill.paymentSlip.length > 0 : true) && bill.customerName && bill.shippingAddress && (
                                    <button 
                                        onClick={async () => {
                                            // บันทึกบิลอัตโนมัติก่อนส่ง
                                            const bills = JSON.parse(localStorage.getItem('online_bills') || '[]');
                                            const index = bills.findIndex(b => b.id === bill.id);
                                            
                                            // ถ้ายังไม่มีบิลใน localStorage ให้บันทึกใหม่
                                            if (index === -1) {
                                                bills.push({
                                                    ...bill,
                                                    createdAt: bill.createdAt || new Date().toISOString(),
                                                    updatedAt: new Date().toISOString()
                                                });
                                                localStorage.setItem('online_bills', JSON.stringify(bills));
                                            } else {
                                                // อัพเดทบิลที่มีอยู่
                                                bills[index] = {
                                                    ...bills[index],
                                                    ...bill,
                                                    updatedAt: new Date().toISOString()
                                                };
                                                localStorage.setItem('online_bills', JSON.stringify(bills));
                                            }

                                            // หาแชทที่จะส่งให้ (ถ้าไม่มี activeChatId)
                                            let targetChatId = activeChatId;
                                            
                                            if (!targetChatId) {
                                                // หาแชทจากชื่อลูกค้าหรือเบอร์โทร
                                                const allChats = await fetch(`${API_URL}/api/chats`).then(r => r.json()).catch(() => []);
                                                
                                                // หาแชทที่ตรงกับชื่อลูกค้าหรือเบอร์โทร
                                                const matchedChat = allChats.find(chat => {
                                                    const chatName = chat.name || chat.displayName || '';
                                                    const chatPhone = chat.phone || '';
                                                    return chatName.includes(bill.customerName) || 
                                                           bill.customerPhone && chatPhone.includes(bill.customerPhone);
                                                });
                                                
                                                if (matchedChat) {
                                                    targetChatId = matchedChat.userId || matchedChat.id;
                                                } else {
                                                    // ถ้าไม่เจอ ให้แสดง modal เลือกแชท
                                                    const selectedChatId = prompt(
                                                        `ไม่พบแชทของลูกค้า "${bill.customerName}"\n\nกรุณาเลือกแชทที่จะส่งบิล:\n\n${allChats.map((chat, idx) => `${idx + 1}. ${chat.name || chat.displayName || chat.userId}`).join('\n')}\n\nกรอกหมายเลขแชท (1-${allChats.length}):`
                                                    );
                                                    
                                                    if (selectedChatId) {
                                                        const chatIndex = parseInt(selectedChatId) - 1;
                                                        if (chatIndex >= 0 && chatIndex < allChats.length) {
                                                            targetChatId = allChats[chatIndex].userId || allChats[chatIndex].id;
                                                        }
                                                    }
                                                }
                                            }

                                            if (!targetChatId) {
                                                alert('กรุณาเลือกแชทกับลูกค้าก่อน');
                                                return;
                                            }

                                            try {
                                                // สร้าง URL สำหรับดูบิลออนไลน์
                                                const billUrl = `${window.location.origin}?viewBill=${bill.id}`;
                                                
                                                // ส่งลิงก์บิลออนไลน์ผ่าน LINE API
                                                const response = await fetch(`${API_URL}/api/chats/${targetChatId}/messages`, {
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
                                                    // Update bill status to 'sent'
                                                    const updatedBills = JSON.parse(localStorage.getItem('online_bills') || '[]');
                                                    const billIndex = updatedBills.findIndex(b => b.id === bill.id);
                                                    if (billIndex !== -1) {
                                                        updatedBills[billIndex] = {
                                                            ...updatedBills[billIndex],
                                                            status: 'sent',
                                                            updatedAt: new Date().toISOString()
                                                        };
                                                        localStorage.setItem('online_bills', JSON.stringify(updatedBills));
                                                        Object.assign(bill, updatedBills[billIndex]);
                                                    }
                                                    
                                                    alert('✅ ส่งบิลให้ลูกค้าเรียบร้อยแล้ว');
                                                    if (onSendBillToCustomer) {
                                                        onSendBillToCustomer(bill);
                                                    }
                                                    window.location.reload();
                                                } else {
                                                    alert('❌ ไม่สามารถส่งบิลได้: ' + (data.error || 'Unknown error'));
                                                }
                                            } catch (error) {
                                                console.error('Error sending bill:', error);
                                                alert('❌ เกิดข้อผิดพลาดในการส่งบิล\n\nกรุณาตรวจสอบ:\n1. Backend กำลังทำงาน\n2. ngrok กำลังทำงาน\n3. ngrok URL ถูกตั้งค่าใน Settings');
                                            }
                                        }}
                                        className="w-full bg-[#00BFA5] hover:bg-[#00a690] text-white py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <Send size={18} />
                                        ส่งบิลให้ลูกค้า
                                    </button>
                                )}
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnlineBillView;
