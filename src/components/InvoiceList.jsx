import React, { useState, useRef, useEffect } from 'react';
import {
    Search,
    Filter,
    ChevronDown,
    Printer,
    Download,
    MoreHorizontal,
    FileText,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
    AlertCircle,
    RefreshCw,
    Plus,
    Calendar,
    X,
    Edit2,
    Send
} from 'lucide-react';

const InvoiceList = ({ bills, onViewBill, onCreateBill, onEditBill, onDeleteBill, onSendBill, activeChatId }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBills, setSelectedBills] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterShipping, setFilterShipping] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showShippingDropdown, setShowShippingDropdown] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const dateDropdownRef = useRef(null);
    const shippingDropdownRef = useRef(null);

    // Calculate Stats
    const stats = {
        all: bills.length,
        draft: bills.filter(b => b.status === 'draft').length,
        unpaid: bills.filter(b => b.status === 'unpaid').length,
        paid: bills.filter(b => b.status === 'paid').length,
        preparing: bills.filter(b => b.status === 'preparing').length,
        sent: bills.filter(b => b.status === 'sent').length,
        expired: 0, // Mock
        cancelled: bills.filter(b => b.status === 'cancelled').length,
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            try {
                if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
                    setShowDateDropdown(false);
                }
                if (shippingDropdownRef.current && !shippingDropdownRef.current.contains(event.target)) {
                    setShowShippingDropdown(false);
                }
            } catch (error) {
                // Silently handle any errors from browser extensions
                console.debug('Click outside handler:', error);
            }
        };
        
        if (typeof document !== 'undefined') {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                if (typeof document !== 'undefined') {
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            };
        }
    }, []);

    // Get unique shipping companies from bills
    const shippingCompanies = [...new Set(bills.map(bill => bill.shippingCompany).filter(Boolean))];

    // Filter Logic
    const filteredBills = bills.filter(bill => {
        const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
        const matchesSearch =
            bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Date filter
        let matchesDate = true;
        if (filterDate) {
            const billDate = bill.createdAt ? new Date(bill.createdAt) : null;
            if (billDate) {
                const filterDateObj = new Date(filterDate);
                const startOfDay = new Date(filterDateObj);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDateObj);
                endOfDay.setHours(23, 59, 59, 999);
                matchesDate = billDate >= startOfDay && billDate <= endOfDay;
            } else {
                matchesDate = false;
            }
        }

        // Shipping filter
        const matchesShipping = !filterShipping || bill.shippingCompany === filterShipping;

        return matchesStatus && matchesSearch && matchesDate && matchesShipping;
    });

    const toggleSelectAll = () => {
        if (selectedBills.length === filteredBills.length) {
            setSelectedBills([]);
        } else {
            setSelectedBills(filteredBills.map(b => b.id));
        }
    };

    const toggleSelectBill = (id) => {
        if (selectedBills.includes(id)) {
            setSelectedBills(selectedBills.filter(b => b !== id));
        } else {
            setSelectedBills([...selectedBills, id]);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="px-3 py-1 rounded-full bg-[#F5A623] text-white text-xs font-bold">โอนแล้ว</span>;
            case 'preparing':
                return <span className="px-3 py-1 rounded-full bg-[#4A90E2] text-white text-xs font-bold">เตรียมส่ง</span>;
            case 'sent':
                return <span className="px-3 py-1 rounded-full bg-[#7ED321] text-white text-xs font-bold">ส่งแล้ว</span>;
            case 'unpaid':
                return <span className="px-3 py-1 rounded-full bg-[#D0021B] text-white text-xs font-bold">ยังไม่จ่าย</span>;
            case 'cancelled':
                return <span className="px-3 py-1 rounded-full bg-gray-500 text-white text-xs font-bold">ยกเลิก</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-gray-300 text-gray-600 text-xs font-bold">ร่าง</span>;
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Bulk change status
    const handleBulkChangeStatus = (newStatus) => {
        if (selectedBills.length === 0) return;
        
        const updatedBills = bills.map(bill => {
            if (selectedBills.includes(bill.id)) {
                return { ...bill, status: newStatus };
            }
            return bill;
        });
        
        // Update localStorage
        localStorage.setItem('online_bills', JSON.stringify(updatedBills));
        
        // Clear selection
        setSelectedBills([]);
        setShowStatusModal(false);
        
        // Reload page to reflect changes
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-full bg-[#F4F5F7] p-6 overflow-hidden">

            {/* Header Stats */}
            <div className="grid grid-cols-8 gap-2 mb-6">
                <StatCard label="ทั้งหมด" count={stats.all} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} color="bg-[#1A4F68] text-white" />
                <StatCard label="ร่าง" count={stats.draft} active={filterStatus === 'draft'} onClick={() => setFilterStatus('draft')} />
                <StatCard label="ยังไม่จ่าย" count={stats.unpaid} active={filterStatus === 'unpaid'} onClick={() => setFilterStatus('unpaid')} />
                <StatCard label="โอนแล้ว" count={stats.paid} active={filterStatus === 'paid'} onClick={() => setFilterStatus('paid')} />
                <StatCard label="เตรียมส่ง" count={stats.preparing} active={filterStatus === 'preparing'} onClick={() => setFilterStatus('preparing')} />
                <StatCard label="ส่งแล้ว" count={stats.sent} active={filterStatus === 'sent'} onClick={() => setFilterStatus('sent')} />
                <StatCard label="หมดอายุ" count={stats.expired} active={false} onClick={() => { }} />
                <StatCard label="ยกเลิก" count={stats.cancelled} active={filterStatus === 'cancelled'} onClick={() => setFilterStatus('cancelled')} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="ค้นหาด้วยเลขที่บิล หรือ ชื่อลูกค้า"
                                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <DateFilterDropdown 
                            filterDate={filterDate}
                            setFilterDate={setFilterDate}
                            showDateDropdown={showDateDropdown}
                            setShowDateDropdown={setShowDateDropdown}
                            dateDropdownRef={dateDropdownRef}
                        />
                        <ShippingFilterDropdown 
                            filterShipping={filterShipping}
                            setFilterShipping={setFilterShipping}
                            shippingCompanies={shippingCompanies}
                            showShippingDropdown={showShippingDropdown}
                            setShowShippingDropdown={setShowShippingDropdown}
                            shippingDropdownRef={shippingDropdownRef}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onCreateBill}
                            className="bg-[#00BFA5] hover:bg-[#00a690] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition"
                        >
                            <Plus size={18} /> เปิดบิล
                        </button>
                    </div>
                </div>

                {selectedBills.length > 0 && (
                    <div className="bg-white p-2 rounded-lg border border-gray-200 flex gap-2 items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm text-gray-600 px-2">เลือก {selectedBills.length} รายการ</span>
                        <div className="h-4 w-px bg-gray-300 mx-1"></div>
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
                        >
                            <RefreshCw size={14} /> เปลี่ยนสถานะ
                        </button>
                        <ActionButton icon={Printer} label="พิมพ์" />
                        <ActionButton icon={Download} label="ดาวน์โหลด" />
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8F9FA] text-gray-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[#00BFA5] focus:ring-[#00BFA5]"
                                        checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-4">เลขที่...</th>
                                <th className="p-4">วันที่เปิดบิล</th>
                                <th className="p-4">ผู้สั่งสินค้า</th>
                                <th className="p-4">ที่มา</th>
                                <th className="p-4 text-right">ยอดสุทธิ</th>
                                <th className="p-4 text-right">ยอดค้างชำระ</th>
                                <th className="p-4 text-center">สถานะ</th>
                                <th className="p-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredBills.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="p-12 text-center text-gray-400">
                                            ไม่พบรายการบิล
                                        </td>
                                    </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr 
                                        key={bill.id} 
                                        className="hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={(e) => {
                                            // Don't trigger if clicking on checkbox, buttons, or links
                                            if (e.target.closest('input[type="checkbox"]') || 
                                                e.target.closest('button') || 
                                                e.target.closest('a')) {
                                                return;
                                            }
                                            // Edit bill when clicking on row
                                            if (onEditBill) {
                                                onEditBill(bill);
                                            }
                                        }}
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[#00BFA5] focus:ring-[#00BFA5]"
                                                checked={selectedBills.includes(bill.id)}
                                                onChange={() => toggleSelectBill(bill.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-[#00BFA5] hover:underline" onClick={(e) => {
                                            e.stopPropagation();
                                            onViewBill(bill);
                                        }}>
                                            #{bill.billNumber}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {formatDate(bill.createdAt)}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {bill.customerName || '-'}
                                        </td>
                                        <td className="p-4 text-gray-500 flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">L</div>
                                            LINE
                                        </td>
                                        <td className="p-4 text-right font-medium text-gray-900">
                                            {bill.total?.toLocaleString()} บาท
                                        </td>
                                        <td className="p-4 text-right text-gray-500">
                                            {bill.status === 'paid' || bill.status === 'sent' || bill.status === 'preparing' ? '0.00' : bill.total?.toLocaleString()} บาท
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {bill.shippingCompany ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{bill.shippingCompany.icon || '🚚'}</span>
                                                    <span className="text-sm">{bill.shippingCompany.name}</span>
                                                </div>
                                            ) : bill.shippingCost > 0 ? (
                                                <span className="text-sm">ค่าจัดส่ง: {bill.shippingCost.toLocaleString()} บาท</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onViewBill(bill)} className="p-1.5 text-gray-400 hover:text-[#00BFA5] hover:bg-gray-100 rounded-md" title="ดูรายละเอียด">
                                                    <FileText size={16} />
                                                </button>
                                                {onSendBill && activeChatId && (
                                                    <button onClick={() => onSendBill(bill)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md" title="ส่งบิลออนไลน์ให้ลูกค้า">
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {onEditBill && (
                                                    <button onClick={() => onEditBill(bill)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md" title="แก้ไขบิล">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                <button onClick={() => onDeleteBill(bill)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" title="ลบ">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowStatusModal(false);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setShowStatusModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">เปลี่ยนสถานะ</h3>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            เปลี่ยนสถานะของ {selectedBills.length} รายการเป็น:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <StatusOption label="ยังไม่จ่าย" status="unpaid" onClick={() => handleBulkChangeStatus('unpaid')} />
                            <StatusOption label="โอนแล้ว" status="paid" onClick={() => handleBulkChangeStatus('paid')} />
                            <StatusOption label="เตรียมส่ง" status="preparing" onClick={() => handleBulkChangeStatus('preparing')} />
                            <StatusOption label="ส่งแล้ว" status="sent" onClick={() => handleBulkChangeStatus('sent')} />
                            <StatusOption label="ยกเลิก" status="cancelled" onClick={() => handleBulkChangeStatus('cancelled')} />
                            <StatusOption label="ร่าง" status="draft" onClick={() => handleBulkChangeStatus('draft')} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatCard = ({ label, count, active, onClick, color }) => (
    <div
        onClick={onClick}
        className={`
      flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border transition-all
      ${active
                ? (color || 'bg-white border-[#00BFA5] shadow-sm')
                : 'bg-white border-gray-200 hover:border-gray-300'
            }
      ${color && active ? color : 'text-gray-700'}
    `}
    >
        <span className="text-lg font-bold">{count}</span>
        <span className="text-xs opacity-80">{label}</span>
    </div>
);

const DateFilterDropdown = ({ filterDate, setFilterDate, showDateDropdown, setShowDateDropdown, dateDropdownRef }) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const last7Days = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const last30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const formatDateDisplay = (dateString) => {
        if (!dateString) return 'เฉพาะวันที่';
        // Parse YYYY-MM-DD format
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleDateSelect = (date) => {
        setFilterDate(date);
        setShowDateDropdown(false);
    };

    return (
        <div className="relative" ref={dateDropdownRef}>
            <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 ${
                    filterDate 
                        ? 'border-[#00BFA5] bg-[#00BFA5]/5 text-[#00BFA5]' 
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
            >
                <Calendar size={14} />
                {formatDateDisplay(filterDate)}
                {filterDate && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setFilterDate('');
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                        <X size={12} />
                    </button>
                )}
                <ChevronDown size={14} />
            </button>
            {showDateDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                    <div className="p-2">
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                            value={filterDate}
                            onChange={(e) => handleDateSelect(e.target.value)}
                            max={today}
                        />
                    </div>
                    <div className="border-t border-gray-200 p-2 space-y-1">
                        <button
                            onClick={() => handleDateSelect(today)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                            วันนี้
                        </button>
                        <button
                            onClick={() => handleDateSelect(yesterday)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                            เมื่อวาน
                        </button>
                        <button
                            onClick={() => handleDateSelect('')}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ShippingFilterDropdown = ({ filterShipping, setFilterShipping, shippingCompanies, showShippingDropdown, setShowShippingDropdown, shippingDropdownRef }) => {
    return (
        <div className="relative" ref={shippingDropdownRef}>
            <button
                onClick={() => setShowShippingDropdown(!showShippingDropdown)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 ${
                    filterShipping 
                        ? 'border-[#00BFA5] bg-[#00BFA5]/5 text-[#00BFA5]' 
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
            >
                <Truck size={14} />
                {filterShipping || 'เฉพาะขนส่ง'}
                {filterShipping && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setFilterShipping('');
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                        <X size={12} />
                    </button>
                )}
                <ChevronDown size={14} />
            </button>
            {showShippingDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto">
                    <div className="p-2">
                        {shippingCompanies.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-400">ไม่มีข้อมูลขนส่ง</div>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setFilterShipping('');
                                        setShowShippingDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded ${
                                        !filterShipping 
                                            ? 'bg-[#00BFA5]/10 text-[#00BFA5]' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    ทั้งหมด
                                </button>
                                {shippingCompanies.map((company) => (
                                    <button
                                        key={company}
                                        onClick={() => {
                                            setFilterShipping(company);
                                            setShowShippingDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded ${
                                            filterShipping === company 
                                                ? 'bg-[#00BFA5]/10 text-[#00BFA5]' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {company}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusOption = ({ label, status, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-[#F5A623] text-white';
            case 'preparing': return 'bg-[#4A90E2] text-white';
            case 'sent': return 'bg-[#7ED321] text-white';
            case 'unpaid': return 'bg-[#D0021B] text-white';
            case 'cancelled': return 'bg-gray-500 text-white';
            default: return 'bg-gray-300 text-gray-600';
        }
    };

    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition hover:opacity-90 ${getStatusColor(status)}`}
        >
            {label}
        </button>
    );
};

const ActionButton = ({ icon: Icon, label }) => (
    <button className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2">
        <Icon size={14} /> {label}
    </button>
);

export default InvoiceList;
