/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Contribution, 
  Expense, 
  FinancialAuditLog, 
  ExpenseCategory, 
  ContributionStatus,
  SiteSettings 
} from '../types';
import { 
  Plus, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  Download, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  ExternalLink,
  Printer,
  Layers,
  History,
  Coins
} from 'lucide-react';

interface ResiboViewProps {
  currentUser: Server;
  servers: Server[];
  contributions: Contribution[];
  expenses: Expense[];
  auditLogs: FinancialAuditLog[];
  siteSettings?: SiteSettings;
  onAddContribution: (contrib: Omit<Contribution, 'id' | 'createdAt' | 'status'> & { proofImageUrl?: string }) => void;
  onApproveContribution: (contribId: string, note?: string) => void;
  onRejectContribution: (contribId: string, reason?: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onClearAllExpenses?: () => void;
  onDeleteContribution?: (contribId: string) => void;
}

export default function ResiboView({
  currentUser,
  servers,
  contributions = [],
  expenses = [],
  auditLogs = [],
  siteSettings,
  onAddContribution,
  onApproveContribution,
  onRejectContribution,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onClearAllExpenses,
  onDeleteContribution
}: ResiboViewProps) {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pending' | 'expenses' | 'ledger' | 'my_contributions' | 'receipts' | 'audit'>('overview');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Modals state
  const [showAddContribModal, setShowAddContribModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<Expense | null>(null);
  const [rejectingContribId, setRejectingContribId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'in' | 'out' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Add Contribution
  const [contribAmount, setContribAmount] = useState<string>('500');
  const [contribSubmitter, setContribSubmitter] = useState<string>(currentUser.name);
  const [contribDate, setContribDate] = useState<string>('2026-08-18');
  const [contribPurpose, setContribPurpose] = useState<string>('Soccom funds');
  const [contribNote, setContribNote] = useState<string>('');
  const [contribProofUrl, setContribProofUrl] = useState<string>('');

  // Form states for Add Expense
  const [expenseItem, setExpenseItem] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Office Supplies');
  const [expenseDate, setExpenseDate] = useState<string>('2026-08-18');
  const [expensePurchaser, setExpensePurchaser] = useState<string>(currentUser.name);
  const [expensePurpose, setExpensePurpose] = useState<string>('Supplies for Soccom');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState<string>('');

  // Permissions check
  const isAdmin = !!currentUser.isAdmin;
  const isSubAdmin = !!currentUser.isSubAdmin;
  const isFinanceAdmin = !!currentUser.isFinanceAdmin;
  const canManageFinances = isAdmin || isSubAdmin || isFinanceAdmin;

  // Format currency helper
  const formatPHP = (val: number) => {
    return `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculations
  const approvedContributions = useMemo(() => {
    return contributions.filter(c => c.status === 'approved');
  }, [contributions]);

  const pendingContributions = useMemo(() => {
    return contributions.filter(c => c.status === 'pending');
  }, [contributions]);

  const rejectedContributions = useMemo(() => {
    return contributions.filter(c => c.status === 'rejected');
  }, [contributions]);

  const totalApprovedContribAmount = useMemo(() => {
    return approvedContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [approvedContributions]);

  const totalMoneyIn = useMemo(() => {
    return totalApprovedContribAmount;
  }, [totalApprovedContribAmount]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Current Balance = Approved Contributions - Expenses
  const currentBalance = useMemo(() => {
    return totalMoneyIn - totalExpensesAmount;
  }, [totalMoneyIn, totalExpensesAmount]);

  // Current Month Expenses (August 2026 default)
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const eMonth = e.month || (e.date ? e.date.substring(0, 7) : '');
      return eMonth === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const currentMonthExpensesTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [currentMonthExpenses]);

  const pendingContributionsTotal = useMemo(() => {
    return pendingContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [pendingContributions]);

  // User's own contributions
  const myContributions = useMemo(() => {
    return contributions.filter(c => c.submittedById === currentUser.id || c.submittedBy.toLowerCase() === currentUser.name.toLowerCase());
  }, [contributions, currentUser]);

  // Available unique months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add('2026-08');
    set.add('2026-07');
    set.add('2026-09');
    expenses.forEach(e => {
      if (e.month) set.add(e.month);
      else if (e.date) set.add(e.date.substring(0, 7));
    });
    contributions.forEach(c => {
      if (c.date) set.add(c.date.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [expenses, contributions]);

  const monthNames: Record<string, string> = {
    '2026-08': 'August 2026',
    '2026-07': 'July 2026',
    '2026-06': 'June 2026',
    '2026-09': 'September 2026',
    '2026-10': 'October 2026'
  };

  // Build combined financial ledger
  const unifiedLedger = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'contribution' | 'expense';
      title: string;
      subtitle: string;
      person: string;
      amount: number;
      date: string;
      status?: ContributionStatus;
      category?: string;
      receiptUrl?: string;
      proofUrl?: string;
      timestamp: string;
      raw: any;
    }> = [];

    // Add contributions
    contributions.forEach(c => {
      items.push({
        id: `contrib-${c.id}`,
        type: 'contribution',
        title: `Contribution: ${c.purpose}`,
        subtitle: c.note || 'Member fund contribution',
        person: c.submittedBy,
        amount: Number(c.amount) || 0,
        date: c.date,
        status: c.status,
        proofUrl: c.proofImageUrl,
        timestamp: c.createdAt,
        raw: c
      });
    });

    // Add expenses
    expenses.forEach(e => {
      items.push({
        id: `exp-${e.id}`,
        type: 'expense',
        title: `Expense: ${e.item}`,
        subtitle: `${e.category} • ${e.purpose || 'Disbursement'}`,
        person: e.purchasedBy,
        amount: Number(e.amount) || 0,
        date: e.date,
        category: e.category,
        receiptUrl: e.receiptImageUrl,
        timestamp: e.timestamp,
        raw: e
      });
    });

    // Sort by date descending
    return items.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp).getTime();
      const dateB = new Date(b.date || b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [contributions, expenses]);

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    return unifiedLedger.filter(item => {
      // Type filter
      if (ledgerTypeFilter === 'in' && item.type === 'expense') return false;
      if (ledgerTypeFilter === 'out' && item.type !== 'expense') return false;
      if (ledgerTypeFilter === 'pending' && (item.type !== 'contribution' || item.status !== 'pending')) return false;

      // Category filter for expenses
      if (categoryFilter !== 'all' && item.type === 'expense' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesPerson = item.person.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchesCategory = item.category ? item.category.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesPerson && !matchesSubtitle && !matchesCategory) return false;
      }

      return true;
    });
  }, [unifiedLedger, ledgerTypeFilter, categoryFilter, searchQuery]);

  // Handlers for Add Contribution
  const handleFormSubmitContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(contribAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid contribution amount.');
      return;
    }
    if (!contribSubmitter.trim()) {
      alert('Please specify the contributor name.');
      return;
    }

    const payload: any = {
      amount: amountNum,
      submittedBy: contribSubmitter.trim(),
      submittedById: currentUser.id,
      date: contribDate || '2026-08-18',
      purpose: contribPurpose.trim() || 'Soccom funds',
    };
    if (contribNote.trim()) {
      payload.note = contribNote.trim();
    }
    if (contribProofUrl.trim()) {
      payload.proofImageUrl = contribProofUrl.trim();
    }

    onAddContribution(payload);

    setShowAddContribModal(false);
    setContribAmount('500');
    setContribPurpose('Soccom funds');
    setContribNote('');
    setContribProofUrl('');
  };

  // Handlers for Add Expense
  const handleFormSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!expenseItem.trim()) {
      alert('Please enter the item or description of the expense.');
      return;
    }

    const monthStr = expenseDate ? expenseDate.substring(0, 7) : selectedMonth;

    const payload: any = {
      item: expenseItem.trim(),
      amount: amountNum,
      category: expenseCategory,
      date: expenseDate || '2026-08-18',
      purchasedBy: expensePurchaser.trim() || currentUser.name,
      purchasedById: currentUser.id,
      purpose: expensePurpose.trim() || 'Ministry operations',
      addedBy: currentUser.name,
      addedById: currentUser.id,
      month: monthStr
    };
    if (expenseReceiptUrl.trim()) {
      payload.receiptImageUrl = expenseReceiptUrl.trim();
    }

    onAddExpense(payload);

    setShowAddExpenseModal(false);
    setExpenseItem('');
    setExpenseAmount('');
    setExpensePurpose('');
    setExpenseReceiptUrl('');
  };

  const handleConfirmReject = () => {
    if (rejectingContribId) {
      onRejectContribution(rejectingContribId, rejectReason.trim() || 'Not verified');
      setRejectingContribId(null);
      setRejectReason('');
    }
  };

  // Helper to handle image file upload as Base64
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB. Please select a smaller photo or screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Category badge colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Office Supplies':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Printing':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Transportation':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Equipment & Cables':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Snacks & Food':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Liturgy & Worship':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c233c] border-2 border-emerald-400 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Header Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#122131] border border-[#46464c]/40 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#0b57d0]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-gold-500/20 text-amber-300 text-xs font-mono font-bold border border-gold-500/30 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>RESIBO • Financial Tracker</span>
            </span>
            <span className="text-xs font-mono text-[#909096]">
              {siteSettings?.parishName || 'Mary Help of Christians Parish'}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#d4e4fa] tracking-tight">
            Financial Management & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-[#c3c6d7] max-w-2xl leading-relaxed">
            Transparent tracking of contributions, official fund deposits, and monthly expenses with verified receipt auditing.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddContribModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer border border-blue-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Contribution</span>
          </button>

          {canManageFinances && (
            <button
              type="button"
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg hover:shadow-rose-500/25 transition-all cursor-pointer border border-rose-400/40"
            >
              <TrendingDown className="w-4 h-4" />
              <span>+ Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Balance Cards (5 Metric Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1. CURRENT BALANCE (Hero Metric) */}
        <div className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#0c2747] via-[#0d1e33] to-[#081525] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Wallet className="w-24 h-24 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Available Balance
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold">
                Live Audited
              </span>
            </div>
            <div className="mt-2.5">
              <span className="font-serif text-3xl sm:text-4xl font-extrabold text-emerald-200 tracking-tight block">
                {formatPHP(currentBalance)}
              </span>
              <p className="text-[11px] font-mono text-emerald-400/80 mt-1 flex items-center gap-1">
                <span>Approved In ({formatPHP(totalMoneyIn)})</span>
                <span>−</span>
                <span>Expenses ({formatPHP(totalExpensesAmount)})</span>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-[#c3c6d7]">
            <span>Security Rule: Pending funds excluded</span>
            <span className="text-emerald-300 font-bold">100% Verified</span>
          </div>
        </div>

        {/* 2. MONEY IN */}
        <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-4 shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#909096] uppercase font-bold">Total In</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-400">
              +{formatPHP(totalMoneyIn)}
            </span>
            <p className="text-[10px] font-mono text-[#909096] mt-0.5">
              {approvedContributions.length} Approved Contributions
            </p>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Officially Added</span>
          </div>
        </div>

        {/* 3. MONEY OUT / TOTAL EXPENSES */}
        <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-4 shadow-md flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#909096] uppercase font-bold">Money Out</span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-serif text-xl sm:text-2xl font-bold text-rose-400">
              -{formatPHP(totalExpensesAmount)}
            </span>
            <p className="text-[10px] font-mono text-[#909096] mt-0.5">
              {expenses.length} Recorded Disbursements
            </p>
          </div>
          <div className="mt-2 text-[10px] text-rose-400/80 flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            <span>Backed by Receipts</span>
          </div>
        </div>

        {/* 4. PENDING CONTRIBUTIONS (Approval Queue Indicator) */}
        <div 
          onClick={() => {
            if (canManageFinances) setActiveSubTab('pending');
          }}
          className={`bg-[#122131] border rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all ${
            pendingContributions.length > 0
              ? 'border-amber-500/50 bg-[#1f1e1b] cursor-pointer hover:border-amber-400'
              : 'border-[#46464c]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-300 uppercase font-bold">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-serif text-xl sm:text-2xl font-bold text-amber-300">
              {pendingContributions.length}
            </span>
            <p className="text-[10px] font-mono text-amber-400/90 mt-0.5">
              {formatPHP(pendingContributionsTotal)} Awaiting Approval
            </p>
          </div>
          <div className="mt-2 text-[10px] font-mono text-amber-300 flex items-center justify-between">
            <span>{canManageFinances ? 'Click to Review →' : 'Under admin review'}</span>
            {pendingContributions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#46464c]/40 pb-2 overflow-x-auto custom-scrollbar gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-[#3e495d] text-white shadow-md'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {canManageFinances && (
            <button
              type="button"
              onClick={() => setActiveSubTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'pending'
                  ? 'bg-amber-500 text-church-950 shadow-md font-black'
                  : 'text-amber-400/90 hover:bg-amber-500/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Approvals</span>
              {pendingContributions.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'pending' ? 'bg-church-950 text-amber-300' : 'bg-amber-500 text-church-950'
                }`}>
                  {pendingContributions.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'expenses'
                ? 'bg-[#3e495d] text-white shadow-md'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Monthly Expenses</span>
            <span className="text-[10px] opacity-75 font-mono">({monthNames[selectedMonth] || selectedMonth})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-[#3e495d] text-white shadow-md'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Financial History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('receipts')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'receipts'
                ? 'bg-[#3e495d] text-white shadow-md'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Receipts Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my_contributions')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'my_contributions'
                ? 'bg-[#3e495d] text-white shadow-md'
                : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Submissions</span>
            {myContributions.length > 0 && (
              <span className="bg-[#122131] px-1.5 py-0.2 rounded-full text-[10px] font-mono text-[#b2c5ff]">
                {myContributions.length}
              </span>
            )}
          </button>

          {canManageFinances && (
            <button
              type="button"
              onClick={() => setActiveSubTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-[#3e495d] text-white shadow-md'
                  : 'text-[#909096] hover:text-[#d4e4fa] hover:bg-[#1c2b3c]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & RECENT SUMMARY TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* August 2026 Monthly Highlight Banner */}
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#909096] font-bold">Current Billing Cycle</span>
                <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">
                  {monthNames[selectedMonth] || selectedMonth} Financial Breakdown
                </h3>
                <p className="text-xs text-[#c3c6d7]">
                  Total Monthly Expenses: <span className="font-bold text-rose-400">{formatPHP(currentMonthExpensesTotal)}</span> across {currentMonthExpenses.length} expense items.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#0d1c2d] border border-[#46464c]/50 rounded-xl px-3 py-2 text-xs font-mono text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{monthNames[m] || m}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setActiveSubTab('expenses')}
                className="px-3 py-2 rounded-xl bg-[#1c2b3c] hover:bg-[#273647] text-[#b2c5ff] text-xs font-mono font-bold flex items-center gap-1.5 border border-[#46464c]/40 cursor-pointer"
              >
                <span>View Full Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick 2-Column Grid: (Recent Ledger) & (Pending Review Preview / Categories) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (2 spans): Recent Transactions */}
            <div className="lg:col-span-2 bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-lg">receipt_long</span>
                  <h3 className="font-serif font-bold text-base text-[#d4e4fa]">Recent Financial Activity</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('ledger')}
                  className="text-xs font-mono text-[#b2c5ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({unifiedLedger.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {unifiedLedger.slice(0, 6).map((item) => {
                  const isExpense = item.type === 'expense';
                  const isPending = item.type === 'contribution' && item.status === 'pending';
                  const isRejected = item.type === 'contribution' && item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#0d1c2d] border border-[#46464c]/30 flex items-center justify-between gap-3 hover:border-[#0b57d0]/50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isExpense 
                            ? 'bg-rose-500/20 text-rose-400'
                            : isPending 
                            ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                            : isRejected
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isExpense ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs sm:text-sm text-[#d4e4fa] truncate">
                              {item.title}
                            </p>
                            {isPending && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Pending Approval
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                Rejected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#909096] truncate">
                            By {item.person} • {item.date} • {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right shrink-0">
                          <span className={`font-mono text-sm font-bold block ${
                            isExpense 
                              ? 'text-rose-400' 
                              : isPending 
                              ? 'text-amber-300' 
                              : isRejected 
                              ? 'text-red-400 line-through' 
                              : 'text-emerald-400'
                          }`}>
                            {isExpense ? `-${formatPHP(item.amount)}` : `+${formatPHP(item.amount)}`}
                          </span>
                          {item.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setActiveReceiptModal(item.raw)}
                              className="text-[10px] font-mono text-blue-400 hover:underline flex items-center justify-end gap-1 mt-0.5 cursor-pointer ml-auto"
                            >
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>Receipt</span>
                            </button>
                          )}
                        </div>

                        {((canManageFinances) || (item.type === 'contribution' && item.person === currentUser.name && item.status === 'pending')) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.type === 'expense') {
                                onDeleteExpense?.(item.raw.id);
                                triggerToast(`Deleted expense "${item.raw.item}"`);
                              } else {
                                onDeleteContribution?.(item.raw.id);
                                triggerToast(`Deleted contribution "${item.raw.purpose}"`);
                              }
                            }}
                            className="p-1.5 text-[#909096] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title={item.type === 'expense' ? 'Delete Expense' : 'Delete Contribution'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (1 span): Pending Approvals Preview & Security Card */}
            <div className="space-y-4">
              {/* Pending Approvals Card */}
              <div className="bg-[#122131] border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-serif font-bold text-sm text-amber-200">Pending Review ({pendingContributions.length})</h3>
                  </div>
                  {canManageFinances && pendingContributions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('pending')}
                      className="text-[10px] font-mono text-amber-300 hover:underline cursor-pointer"
                    >
                      Review Queue →
                    </button>
                  )}
                </div>

                {pendingContributions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#909096] font-mono">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                    <p>All submitted contributions have been reviewed & verified!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingContributions.slice(0, 3).map(contrib => (
                      <div key={contrib.id} className="p-3 rounded-xl bg-[#0d1c2d] border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#d4e4fa]">{contrib.submittedBy}</span>
                          <span className="font-mono text-xs font-bold text-amber-300">{formatPHP(contrib.amount)}</span>
                        </div>
                        <p className="text-[11px] text-[#c3c6d7] leading-tight line-clamp-1">{contrib.purpose}</p>
                        
                        {canManageFinances && (
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteContribution?.(contrib.id);
                                triggerToast(`Deleted pending contribution from ${contrib.submittedBy}`);
                              }}
                              className="p-1 text-[#909096] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                              title="Delete contribution"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingContribId(contrib.id);
                                setRejectReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-mono font-bold border border-red-500/30 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => onApproveContribution(contrib.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold shadow-sm cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security & Financial Rule Card */}
              <div className="bg-[#0b1b2b] border border-[#46464c]/40 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Resibo Governance Rule</span>
                </div>
                <p className="text-[11px] text-[#909096] leading-relaxed">
                  Only an Admin or authorized Sub-Admin can approve member contributions to add them to the official balance. Every approval, disbursement, and receipt upload is timestamped in the audit log.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PENDING CONTRIBUTIONS APPROVAL QUEUE (Admin & Sub-Admin) */}
      {/* ========================================================================= */}
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#122131] border border-amber-500/30 rounded-2xl p-5">
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Pending Member Contributions</span>
              </h2>
              <p className="text-xs text-[#c3c6d7] mt-0.5">
                Review and verify incoming funds before adding them to the organization's official balance.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30 shrink-0">
              {pendingContributions.length} Pending Approval • {formatPHP(pendingContributionsTotal)}
            </span>
          </div>

          {pendingContributions.length === 0 ? (
            <div className="p-12 text-center bg-[#122131] border border-[#46464c]/30 rounded-2xl space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-75" />
              <h3 className="font-serif text-lg font-bold text-[#d4e4fa]">No Pending Contributions</h3>
              <p className="text-xs text-[#909096] max-w-md mx-auto">
                All submitted member contributions have been reviewed. When members submit new funds, they will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingContributions.map((contrib) => (
                <div 
                  key={contrib.id}
                  className="bg-[#122131] border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#46464c]/30 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase text-[#909096]">Submitted By</span>
                      <h4 className="font-serif font-bold text-base text-[#d4e4fa]">{contrib.submittedBy}</h4>
                      <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Date: {contrib.date}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-[#909096]">Amount</span>
                      <span className="font-serif text-2xl font-black text-amber-300 block">
                        {formatPHP(contrib.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#909096]">Purpose / Note:</span>
                      <p className="font-bold text-[#d4e4fa] bg-[#0d1c2d] p-2.5 rounded-xl border border-[#46464c]/30 mt-1">
                        {contrib.purpose}
                      </p>
                    </div>

                    {contrib.note && (
                      <p className="text-[11px] text-[#c3c6d7] italic">
                        "{contrib.note}"
                      </p>
                    )}

                    {contrib.proofImageUrl && (
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-[#909096] block mb-1">Attached Payment Slip / Proof:</span>
                        <a 
                          href={contrib.proofImageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block relative group rounded-xl overflow-hidden border border-[#46464c]/40 max-h-32"
                        >
                          <img 
                            src={contrib.proofImageUrl} 
                            alt="Payment Proof" 
                            className="max-h-32 object-cover rounded-xl group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-mono font-bold">
                            View Full Photo
                          </span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#46464c]/30 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono text-[#909096]">
                      Status: <strong className="text-amber-300">Pending Approval</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {canManageFinances && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteContribution?.(contrib.id);
                            triggerToast(`Deleted contribution from ${contrib.submittedBy}`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Delete contribution record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setRejectingContribId(contrib.id);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono font-bold border border-red-500/30 cursor-pointer transition-colors"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => onApproveContribution(contrib.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve → Add {formatPHP(contrib.amount)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY EXPENSES & RECEIPTS TABLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Month Picker, Search, and Add Expense Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#122131] border border-[#46464c]/40 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono text-[#909096] font-bold">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#0d1c2d] border border-[#46464c]/50 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                >
                  <option value="all">All Recorded Months</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m] || m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-[#909096] font-bold">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#0d1c2d] border border-[#46464c]/50 rounded-xl px-3 py-1.5 text-xs font-mono text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                >
                  <option value="all">All Categories</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Printing">Printing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Equipment & Cables">Equipment & Cables</option>
                  <option value="Snacks & Food">Snacks & Food</option>
                  <option value="Liturgy & Worship">Liturgy & Worship</option>
                </select>
              </div>
            </div>

            {canManageFinances && (
              <div className="flex items-center gap-2 shrink-0">
                {expenses.length > 0 && onClearAllExpenses && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllExpenses();
                      triggerToast('Cleared all recorded expenses');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Expenses</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record New Expense</span>
                </button>
              </div>
            )}
          </div>

          {/* Monthly Expense Table */}
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 bg-[#0d1c2d] border-b border-[#46464c]/30 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#d4e4fa]">
                  {selectedMonth === 'all' ? 'All Organization Expenses' : `${monthNames[selectedMonth] || selectedMonth} Expense Ledger`}
                </h3>
                <p className="text-xs text-[#909096]">
                  Verified records of where ministry funds were spent with digital receipts.
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                Monthly Total: {formatPHP(selectedMonth === 'all' ? totalExpensesAmount : currentMonthExpensesTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#051424] text-[#909096] font-mono uppercase text-[10px] border-b border-[#46464c]/30">
                    <th className="py-3 px-4 font-bold">Expense Item</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Purchased By</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Purpose / Note</th>
                    <th className="py-3 px-4 font-bold text-center">Receipt Photo</th>
                    <th className="py-3 px-4 font-bold text-right">Amount (₱)</th>
                    {canManageFinances && <th className="py-3 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#46464c]/20 font-sans text-[#d4e4fa]">
                  {(selectedMonth === 'all' ? expenses : currentMonthExpenses)
                    .filter(e => categoryFilter === 'all' || e.category === categoryFilter)
                    .length === 0 ? (
                    <tr>
                      <td colSpan={canManageFinances ? 8 : 7} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-[#909096]">
                          <Receipt className="w-8 h-8 opacity-30 text-[#909096]" />
                          <p className="font-medium text-sm text-[#c3c6d7]">No expense records found</p>
                          <p className="text-xs max-w-sm">
                            {expenses.length === 0 
                              ? "No expenses have been recorded yet. All organization funds remain unspent."
                              : "No expenses match the selected filter."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (selectedMonth === 'all' ? expenses : currentMonthExpenses)
                      .filter(e => categoryFilter === 'all' || e.category === categoryFilter)
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#1c2b3c]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-sm text-[#d4e4fa]">
                            {exp.item}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getCategoryColor(exp.category)}`}>
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#c3c6d7]">
                            {exp.purchasedBy}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#909096]">
                            {exp.date}
                          </td>
                          <td className="py-3 px-4 text-[#c3c6d7] max-w-xs truncate">
                            {exp.purpose}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {exp.receiptImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setActiveReceiptModal(exp)}
                                className="px-2.5 py-1 rounded-lg bg-[#0b57d0]/20 hover:bg-[#0b57d0]/40 text-[#b2c5ff] text-[10px] font-mono font-bold border border-[#0b57d0]/30 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Receipt</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-[#909096] italic">No receipt</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm text-rose-400">
                            {formatPHP(exp.amount)}
                          </td>
                          {canManageFinances && (
                            <td className="py-3 px-3 text-right">
                              {onDeleteExpense && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteExpense(exp.id);
                                    triggerToast(`Deleted expense "${exp.item}"`);
                                  }}
                                  className="p-1 text-[#909096] hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete Expense Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                  )}

                  {/* Summary Total Row */}
                  {(selectedMonth === 'all' ? expenses : currentMonthExpenses).filter(e => categoryFilter === 'all' || e.category === categoryFilter).length > 0 && (
                    <tr className="bg-[#051424] font-bold border-t-2 border-[#46464c]/50 text-sm">
                      <td colSpan={6} className="py-4 px-4 font-serif text-right text-[#d4e4fa]">
                        Total Expenses:
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base font-black text-rose-400">
                        {formatPHP(selectedMonth === 'all' ? totalExpensesAmount : currentMonthExpensesTotal)}
                      </td>
                      {canManageFinances && <td></td>}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FINANCIAL HISTORY & COMPLETE LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#122131] border border-[#46464c]/40 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#909096] font-bold">Type:</span>
              <button
                type="button"
                onClick={() => setLedgerTypeFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                  ledgerTypeFilter === 'all' ? 'bg-[#3e495d] text-white' : 'bg-[#0d1c2d] text-[#909096]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLedgerTypeFilter('in')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                  ledgerTypeFilter === 'in' ? 'bg-emerald-600 text-white' : 'bg-[#0d1c2d] text-emerald-400'
                }`}
              >
                🟢 Money In
              </button>
              <button
                type="button"
                onClick={() => setLedgerTypeFilter('out')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                  ledgerTypeFilter === 'out' ? 'bg-rose-600 text-white' : 'bg-[#0d1c2d] text-rose-400'
                }`}
              >
                🔴 Expenses
              </button>
              <button
                type="button"
                onClick={() => setLedgerTypeFilter('pending')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                  ledgerTypeFilter === 'pending' ? 'bg-amber-500 text-church-950' : 'bg-[#0d1c2d] text-amber-300'
                }`}
              >
                🟡 Pending
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#909096]" />
              <input
                type="text"
                placeholder="Search contributor, item, purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
              />
            </div>
          </div>

          {/* Ledger List */}
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-3">
              <h3 className="font-serif font-bold text-base text-[#d4e4fa]">
                Financial Transaction Ledger ({filteredLedger.length})
              </h3>
              <span className="text-xs font-mono text-[#909096]">
                Sorted chronologically
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredLedger.map((item) => {
                const isExpense = item.type === 'expense';
                const isPending = item.type === 'contribution' && item.status === 'pending';
                const isRejected = item.type === 'contribution' && item.status === 'rejected';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0d1c2d] border border-[#46464c]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#0b57d0]/40 transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isExpense
                          ? 'bg-rose-500/20 text-rose-400'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-300'
                          : isRejected
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isExpense ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-[#d4e4fa]">{item.title}</h4>
                          {isPending && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Pending Approval
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              Rejected
                            </span>
                          )}
                          {item.type === 'deposit' && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Official Grant
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#c3c6d7]">
                          Recorded by: <strong className="text-white">{item.person}</strong> • Date: {item.date}
                        </p>
                        <p className="text-[11px] text-[#909096]">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right shrink-0 sm:pl-4">
                        <span className={`font-mono text-base font-black block ${
                          isExpense 
                            ? 'text-rose-400' 
                            : isPending 
                            ? 'text-amber-300' 
                            : isRejected 
                            ? 'text-red-400 line-through' 
                            : 'text-emerald-400'
                        }`}>
                          {isExpense ? `-${formatPHP(item.amount)}` : `+${formatPHP(item.amount)}`}
                        </span>

                        {item.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setActiveReceiptModal(item.raw)}
                            className="text-[11px] font-mono text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Receipt</span>
                          </button>
                        )}
                      </div>

                      {((canManageFinances) || (item.type === 'contribution' && item.person === currentUser.name && item.status === 'pending')) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.type === 'expense') {
                              onDeleteExpense?.(item.raw.id);
                              triggerToast(`Deleted expense "${item.raw.item}"`);
                            } else {
                              onDeleteContribution?.(item.raw.id);
                              triggerToast(`Deleted contribution "${item.raw.purpose}"`);
                            }
                          }}
                          className="p-2 text-[#909096] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={item.type === 'expense' ? 'Delete Expense' : 'Delete Contribution'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RECEIPTS GALLERY */}
      {/* ========================================================================= */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#d4e4fa] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>Audited Receipts Archive</span>
              </h2>
              <p className="text-xs text-[#c3c6d7] mt-0.5">
                Digital copy of every receipt submitted for organizational transparency.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {expenses.filter(e => e.receiptImageUrl).map((exp) => (
              <div
                key={exp.id}
                onClick={() => setActiveReceiptModal(exp)}
                className="bg-[#122131] border border-[#46464c]/40 rounded-2xl overflow-hidden shadow-lg group hover:border-amber-400/50 transition-all cursor-pointer flex flex-col justify-between relative"
              >
                <div className="relative h-44 bg-[#051424] overflow-hidden">
                  <img
                    src={exp.receiptImageUrl}
                    alt={exp.item}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white">
                    {exp.date}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                    {formatPHP(exp.amount)}
                  </span>
                  {canManageFinances && onDeleteExpense && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteExpense(exp.id);
                        triggerToast(`Deleted expense "${exp.item}"`);
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-black/75 hover:bg-red-900 text-slate-300 hover:text-red-300 border border-[#46464c]/50 transition-colors z-10 cursor-pointer"
                      title="Delete Expense Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="font-bold text-sm text-[#d4e4fa] truncate">{exp.item}</h4>
                  <p className="text-[11px] text-[#909096] truncate">
                    {exp.category} • By {exp.purchasedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MY CONTRIBUTIONS (Member View) */}
      {/* ========================================================================= */}
      {activeSubTab === 'my_contributions' && (
        <div className="space-y-4">
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#d4e4fa]">
                My Submitted Contributions ({myContributions.length})
              </h2>
              <p className="text-xs text-[#c3c6d7] mt-0.5">
                Check the approval status of funds you have submitted to the organization.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddContribModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Submit New Contribution</span>
            </button>
          </div>

          {myContributions.length === 0 ? (
            <div className="p-12 text-center bg-[#122131] border border-[#46464c]/30 rounded-2xl space-y-3">
              <DollarSign className="w-12 h-12 text-[#909096] mx-auto opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#d4e4fa]">No Submitted Contributions Yet</h3>
              <p className="text-xs text-[#909096] max-w-sm mx-auto">
                When you contribute funds to SocCom, submit them here so admins can verify and officially add them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myContributions.map((contrib) => (
                <div
                  key={contrib.id}
                  className="p-4 rounded-xl bg-[#122131] border border-[#46464c]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#d4e4fa]">{contrib.purpose}</h4>
                      {contrib.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved & Added</span>
                        </span>
                      )}
                      {contrib.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Admin Review</span>
                        </span>
                      )}
                      {contrib.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#c3c6d7]">
                      Submitted on: {contrib.date} {contrib.note && `• "${contrib.note}"`}
                    </p>
                    {contrib.reviewedByName && (
                      <p className="text-[10px] font-mono text-[#909096]">
                        Reviewed by: {contrib.reviewedByName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right shrink-0">
                      <span className="font-serif text-xl font-bold text-emerald-300 block">
                        {formatPHP(contrib.amount)}
                      </span>
                    </div>

                    {(contrib.status === 'pending' || canManageFinances) && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteContribution?.(contrib.id);
                          triggerToast(`Deleted contribution "${contrib.purpose}"`);
                        }}
                        className="p-1.5 text-[#909096] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete / Cancel Contribution"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. AUDIT TRAIL LOG (Admin / Sub-Admin) */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && canManageFinances && (
        <div className="space-y-4">
          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#d4e4fa] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Financial Audit Log & Security Trail</span>
              </h2>
              <p className="text-xs text-[#c3c6d7] mt-0.5">
                Immutable chronological log of all approvals, rejections, expense disbursements, and fund modifications.
              </p>
            </div>
          </div>

          <div className="bg-[#122131] border border-[#46464c]/40 rounded-2xl p-5 space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#909096] font-mono text-center py-6">No audit records logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#0d1c2d] border border-[#46464c]/30 text-xs flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#d4e4fa]">{log.description}</span>
                        <span className="text-[10px] font-mono text-[#909096] shrink-0">{log.timestamp.substring(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-[11px] text-[#909096] mt-0.5">
                        Performed by: <strong className="text-white">{log.performedBy}</strong> ({log.performedByRole})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CONTRIBUTION */}
      {/* ========================================================================= */}
      {showAddContribModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#122131] border border-[#46464c]/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#d4e4fa]">Submit Fund Contribution</h3>
                  <p className="text-xs text-[#909096]">Money submitted by a member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContribModal(false)}
                className="p-1 rounded-lg text-[#909096] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmitContribution} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                <p className="font-bold flex items-center gap-1 mb-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Approval Notice</span>
                </p>
                <span>The contribution will initially have the status <strong>Pending Approval</strong> and will NOT immediately be included in the official balance until verified by an Admin.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Amount (PHP ₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="500"
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Date *</label>
                  <input
                    type="date"
                    required
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs font-mono text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Submitted By (Member Name) *</label>
                <input
                  type="text"
                  required
                  value={contribSubmitter}
                  onChange={(e) => setContribSubmitter(e.target.value)}
                  placeholder="e.g. Adrich"
                  className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Purpose / Reason *</label>
                <input
                  type="text"
                  required
                  value={contribPurpose}
                  onChange={(e) => setContribPurpose(e.target.value)}
                  placeholder="e.g. Soccom funds / Broadcast gear contribution"
                  className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Optional Note / Details</label>
                <textarea
                  rows={2}
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  placeholder="Any additional notes about how the money was handed over..."
                  className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Optional GCash / Bank Transfer Proof Slip</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, setContribProofUrl)}
                    className="text-[11px] font-mono text-[#909096] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-[#1c2b3c] file:text-white"
                  />
                </div>
                {contribProofUrl && (
                  <div className="mt-2 relative inline-block">
                    <img src={contribProofUrl} alt="Proof" className="h-20 rounded-lg border border-[#46464c]/40 object-cover" />
                    <button
                      type="button"
                      onClick={() => setContribProofUrl('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#46464c]/30 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddContribModal(false)}
                  className="px-4 py-2 rounded-xl text-[#909096] hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Contribution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD EXPENSE & UPLOAD RECEIPT (Admin / Sub-Admin) */}
      {/* ========================================================================= */}
      {showAddExpenseModal && canManageFinances && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#122131] border border-[#46464c]/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#d4e4fa]">Record Organization Expense</h3>
                  <p className="text-xs text-[#909096]">Money spent by the organization with receipt proof</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded-lg text-[#909096] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmitExpense} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Item / Description *</label>
                <input
                  type="text"
                  required
                  value={expenseItem}
                  onChange={(e) => setExpenseItem(e.target.value)}
                  placeholder="e.g. Ballpen, Printing, Transportation, HDMI Cable"
                  className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Amount (PHP ₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="10"
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-400 focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Category *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs font-mono text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  >
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Printing">Printing</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Equipment & Cables">Equipment & Cables</option>
                    <option value="Snacks & Food">Snacks & Food</option>
                    <option value="Liturgy & Worship">Liturgy & Worship</option>
                    <option value="Software & Licenses">Software & Licenses</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs font-mono text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#909096]">Purchased By *</label>
                  <input
                    type="text"
                    required
                    value={expensePurchaser}
                    onChange={(e) => setExpensePurchaser(e.target.value)}
                    placeholder="e.g. Adrich"
                    className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Purpose / Note *</label>
                <input
                  type="text"
                  required
                  value={expensePurpose}
                  onChange={(e) => setExpensePurpose(e.target.value)}
                  placeholder="e.g. Supplies for Soccom"
                  className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl px-3 py-2 text-xs text-[#d4e4fa] focus:outline-none focus:border-[#0b57d0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#909096]">Upload Receipt Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileUpload(e, setExpenseReceiptUrl)}
                  className="text-[11px] font-mono text-[#909096] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:bg-[#1c2b3c] file:text-white"
                />
                
                {expenseReceiptUrl && (
                  <div className="mt-2 relative inline-block">
                    <img src={expenseReceiptUrl} alt="Receipt" className="h-24 rounded-xl border border-[#46464c]/40 object-cover" />
                    <button
                      type="button"
                      onClick={() => setExpenseReceiptUrl('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#46464c]/30 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-[#909096] hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Expense & Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW RECEIPT FULL SCREEN */}
      {/* ========================================================================= */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#122131] border border-[#46464c]/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#46464c]/30 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#d4e4fa] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>{activeReceiptModal.item}</span>
                </h3>
                <p className="text-xs text-[#909096] font-mono">
                  Receipt ID: {activeReceiptModal.id} • {activeReceiptModal.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="p-1 rounded-lg text-[#909096] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeReceiptModal.receiptImageUrl ? (
              <div className="rounded-xl overflow-hidden border border-[#46464c]/40 bg-black/50 flex items-center justify-center max-h-96">
                <img
                  src={activeReceiptModal.receiptImageUrl}
                  alt={activeReceiptModal.item}
                  className="max-h-96 object-contain w-full"
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0d1c2d] rounded-xl text-xs text-[#909096]">
                No digital image attached for this expense record.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#0d1c2d] p-3.5 rounded-xl border border-[#46464c]/30">
              <div>
                <span className="text-[10px] font-mono text-[#909096] uppercase">Amount</span>
                <p className="font-serif text-lg font-black text-rose-400">{formatPHP(activeReceiptModal.amount)}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#909096] uppercase">Category</span>
                <p className="font-bold text-[#d4e4fa]">{activeReceiptModal.category}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#909096] uppercase">Purchased By</span>
                <p className="text-[#c3c6d7] font-medium">{activeReceiptModal.purchasedBy}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#909096] uppercase">Recorded By</span>
                <p className="text-[#c3c6d7] font-mono">{activeReceiptModal.addedBy}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-mono text-[#909096] uppercase">Purpose / Notes</span>
                <p className="text-[#d4e4fa]">{activeReceiptModal.purpose}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#46464c]/30 flex items-center justify-between">
              {canManageFinances && onDeleteExpense ? (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteExpense(activeReceiptModal.id);
                    triggerToast(`Deleted expense "${activeReceiptModal.item}"`);
                    setActiveReceiptModal(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Expense</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1c2b3c] hover:bg-[#273647] text-white text-xs font-mono font-bold cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT CONTRIBUTION REASON */}
      {/* ========================================================================= */}
      {rejectingContribId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#122131] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base text-[#d4e4fa]">Reject Contribution Submission</h3>
            </div>

            <p className="text-xs text-[#c3c6d7]">
              Confirm rejection of this contribution. The money will <strong>NOT</strong> be added to the official balance, and the contributor will see the rejection status.
            </p>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-[#909096]">Reason for rejection (Optional):</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Payment not received in bank account / Duplicate entry"
                className="w-full bg-[#0d1c2d] border border-[#46464c]/40 rounded-xl p-2.5 text-xs text-[#d4e4fa] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingContribId(null)}
                className="px-4 py-2 rounded-xl text-[#909096] hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-md cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
