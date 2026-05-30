import { Trash2, ShoppingBag, Coffee, Car, Home, Film, MoreHorizontal, PlusCircle, Edit2, ArrowUpCircle, ArrowDownCircle, Wallet, Filter, Calendar as CalendarIcon, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import TransactionForm from './TransactionForm';
import DateRangeFilter from './DateRangeFilter';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onAdd: (data: any) => Promise<void>;
  currency?: string;
  timeFormat?: '12h' | '24h';
  profile?: any;
  onToggleFilter?: () => void;
  onToggleCalendar?: () => void;
  isFilterActive?: boolean;
  isCalendarActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  onFilterChange?: (start: Date | null, end: Date | null) => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
  const c = category.toLowerCase();
  if (c.includes('food')) return <Coffee size={20} />;
  if (c.includes('transport')) return <Car size={20} />;
  if (c.includes('shopping')) return <ShoppingBag size={20} />;
  if (c.includes('home') || c.includes('bill')) return <Home size={20} />;
  if (c.includes('entertainment')) return <Film size={20} />;
  if (c.includes('salary')) return <PlusCircle size={20} />;
  return <MoreHorizontal size={20} />;
};

export default function TransactionList({ 
  transactions, 
  onDelete, 
  onUpdate, 
  onAdd, 
  currency = 'Rp',
  timeFormat = '24h',
  profile,
  onToggleFilter,
  onToggleCalendar,
  isFilterActive,
  isCalendarActive,
  startDate,
  endDate,
  onFilterChange
}: Props) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatVal = (val: number) => {
    return `${currency} ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const exportToExcel = () => {
    // 1. Prepare data
    const data = transactions.map((t, idx) => {
      const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Tabungan Goal';
      return {
        'No': idx + 1,
        'Tanggal': t.date,
        'Tipe': typeLabel,
        'Kategori': t.category || '',
        'Keterangan': t.description || '',
        [`Jumlah (${currency})`]: t.amount
      };
    });

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Set custom column widths for a polished layout
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 15 }, // Tanggal
      { wch: 15 }, // Tipe
      { wch: 15 }, // Kategori
      { wch: 30 }, // Keterangan
      { wch: 18 }  // Jumlah
    ];

    // 4. Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

    // 5. Generate date range suffix
    const dateRangeSuffix = startDate && endDate
      ? `_${format(startDate, 'yyyyMMdd')}_to_${format(endDate, 'yyyyMMdd')}`
      : `_semua`;

    // 6. Write to standard .xlsx file
    XLSX.writeFile(workbook, `Laporan_Transaksi_AturDuit${dateRangeSuffix}.xlsx`);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = startDate && endDate 
      ? `Periode: ${format(startDate, 'd MMMM yyyy', { locale: id })} - ${format(endDate, 'd MMMM yyyy', { locale: id })}`
      : 'Semua Periode';

    // Calculate metrics for charts
    const incomeTxns = transactions.filter(t => t.type === 'income');
    const expenseTxns = transactions.filter(t => t.type === 'expense');
    const totalIncome = incomeTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = expenseTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const grandTotal = totalIncome + totalExpense;

    const incomePercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 0;
    const expensePercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 0;

    // Group expenses by category
    const categoryMap: { [key: string]: number } = {};
    expenseTxns.forEach(t => {
      const cat = t.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + (t.amount || 0);
    });

    // Sort categories descending
    const sortedCats = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3

    const topCategoriesUI = sortedCats.length > 0
      ? sortedCats.map(([cat, amount]) => {
          const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
          const barColor = cat.toLowerCase().includes('food') ? '#f59e0b' :
                           cat.toLowerCase().includes('transport') ? '#3b82f6' :
                           cat.toLowerCase().includes('shopping') ? '#ec4899' :
                           cat.toLowerCase().includes('bill') || cat.toLowerCase().includes('home') ? '#8b5cf6' :
                           cat.toLowerCase().includes('entertainment') ? '#10b981' : '#6b7280';
          return `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #374151;">${cat}</span>
                <span style="color: #6b7280; font-weight: 500;">${currency} ${new Intl.NumberFormat('id-ID').format(amount)} (${percentage}%)</span>
              </div>
              <div style="width: 100%; height: 6px; background-color: #f3f4f6; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background-color: ${barColor}; border-radius: 9999px;"></div>
              </div>
            </div>
          `;
        }).join('')
      : `<div style="text-align: center; color: #9ca3af; font-size: 11px; padding: 24px 0;">Belum ada data pengeluaran dicatat</div>`;

    const rows = transactions.map((t, idx) => {
      const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Tabungan Goal';
      const amountFormatted = `${currency} ${new Intl.NumberFormat('id-ID').format(t.amount)}`;
      return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px; font-size: 11px; color: #374151;">${idx + 1}</td>
          <td style="padding: 12px; font-size: 11px; color: #374151;">${t.date}</td>
          <td style="padding: 12px; font-size: 11px; color: #374151; font-weight: 700;">${typeLabel}</td>
          <td style="padding: 12px; font-size: 11px; color: #374151;">${t.category}</td>
          <td style="padding: 12px; font-size: 11px; color: #374151;">${t.description || '-'}</td>
          <td style="padding: 12px; font-size: 11px; text-align: right; font-weight: 700; color: ${t.type === 'income' ? '#16a34a' : t.type === 'expense' ? '#dc2626' : '#2563eb'}">
            ${t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}${amountFormatted}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Transaksi AturDuit</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #111827;
              margin: 40px;
              background-color: #ffffff;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #111827;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title-main {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.025em;
              text-transform: uppercase;
            }
            .subtitle-date {
              font-size: 12px;
              color: #4b5563;
              margin-top: 4px;
              font-weight: 500;
            }
            .meta-info {
              text-align: right;
              font-size: 11px;
              color: #4b5563;
              line-height: 1.5;
            }
            .summary-box {
              display: grid;
              grid-template-cols: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 24px;
            }
            .card-summary {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              padding: 14px 18px;
              border-radius: 16px;
            }
            .card-label {
              font-size: 9px;
              font-weight: 800;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .card-amount {
              font-size: 16px;
              font-weight: 800;
              margin-top: 4px;
            }
            .charts-grid {
              display: grid;
              grid-template-cols: 1.2fr 1.8fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .chart-card {
              border: 1px solid #e5e7eb;
              border-radius: 20px;
              padding: 20px;
              background-color: #ffffff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th {
              background-color: #111827;
              color: white;
              text-align: left;
              padding: 12px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .print-btn-bar {
              text-align: center;
              margin-top: 40px;
              padding: 24px;
              background-color: #f3f4f6;
              border-radius: 20px;
              border: 1px dashed #d1d5db;
            }
            .btn-accent {
              background-color: #111827;
              color: white;
              border: none;
              padding: 10px 24px;
              font-size: 12px;
              font-weight: 800;
              border-radius: 12px;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-right: 10px;
              transition: background-color 0.2s;
            }
            .btn-accent:hover {
              background-color: #374151;
            }
            .btn-secondary {
              background-color: transparent;
              color: #4b5563;
              border: 1px solid #d1d5db;
              padding: 9px 24px;
              font-size: 12px;
              font-weight: 800;
              border-radius: 12px;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            @media print {
              .print-btn-bar { display: none; }
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="title-main">AturDuit Financial Report</div>
              <div class="subtitle-date">${dateStr}</div>
            </div>
            <div class="meta-info">
              <div>Pengguna: <b>${profile?.displayName || 'Teman AturDuit'}</b></div>
              <div>Negara/Mata Uang: <b>IDR (${currency})</b></div>
              <div>Tanggal Pembuatan: ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: id })}</div>
            </div>
          </div>

          <div class="summary-box">
            <div class="card-summary" style="border-left: 4px solid #10b981;">
              <div class="card-label">Total Pemasukan</div>
              <div class="card-amount" style="color: #10b981;">${formatVal(totals.income)}</div>
            </div>
            <div class="card-summary" style="border-left: 4px solid #ef4444;">
              <div class="card-label">Total Pengeluaran</div>
              <div class="card-amount" style="color: #ef4444;">${formatVal(totals.expense)}</div>
            </div>
            <div class="card-summary" style="border-left: 4px solid #3b82f6;">
              <div class="card-label">Sisa Saldo Kas</div>
              <div class="card-amount" style="color: #111827;">${formatVal(totals.balance)}</div>
            </div>
          </div>

          <!-- Bagian Grafik & Analisis Visual -->
          <div class="charts-grid">
            <div class="chart-card" style="display: flex; align-items: center; gap: 16px;">
              <div style="position: relative; width: 90px; height: 90px; flex-shrink: 0;">
                <svg width="90" height="90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#f3f4f6" stroke-width="4" />
                  ${incomePercent > 0 ? `
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="${incomePercent}, 100" />
                  ` : ''}
                  ${expensePercent > 0 ? `
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#ef4444" stroke-width="4" stroke-dasharray="${expensePercent}, 100" stroke-dashoffset="-${incomePercent}" />
                  ` : ''}
                </svg>
                <div style="position: absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
                  <span style="font-size: 13px; font-weight: 800; color: #111827;">${incomePercent || 0}%</span>
                  <span style="font-size: 7px; color: #6b7280; font-weight: 800; text-transform: uppercase;">Masuk</span>
                </div>
              </div>
              <div style="flex-grow: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Bauran Saldo</h4>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>Masuk</span>
                    <span style="font-weight: 700;">${incomePercent}%</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block;"></span>Keluar</span>
                    <span style="font-weight: 700;">${expensePercent}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="chart-card" style="display: flex; flex-direction: column; justify-content: center;">
              <h4 style="margin: 0 0 10px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Kategori Pengeluaran Terbesar</h4>
              <div style="display: flex; flex-direction: column;">
                ${topCategoriesUI}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px; border-top-left-radius: 8px;">No</th>
                <th style="width: 120px;">Tanggal</th>
                <th style="width: 120px;">Jenis</th>
                <th style="width: 130px;">Kategori</th>
                <th>Keterangan</th>
                <th style="text-align: right; width: 150px; border-top-right-radius: 8px;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af; font-size: 13px;">Tidak ada riwayat transaksi</td></tr>'}
            </tbody>
          </table>

          <div class="print-btn-bar">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #1f2937; font-weight: 700;">Laporan PDF Siap Dicetak & Disimpan</p>
            <button class="btn-accent" onclick="window.print()">Cetak / Simpan PDF</button>
            <button class="btn-secondary" onclick="window.close()">Tutup Halaman</button>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/10">
        <div className="flex items-center gap-3">
          <h3 className="font-black text-xl tracking-tight">Riwayat Transaksi</h3>
          <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest">{transactions.length} Item</span>
        </div>
        <div className="flex gap-1.5">
          {transactions.length > 0 && (
            <>
              <button
                onClick={exportToExcel}
                className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-black hover:bg-gray-50 hover:border-gray-200 rounded-2xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title="Ekspor ke Excel"
              >
                <FileSpreadsheet size={18} />
              </button>
              <button
                onClick={exportToPDF}
                className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-black hover:bg-gray-50 hover:border-gray-200 rounded-2xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title="Cetak & Simpan PDF"
              >
                <FileText size={18} />
              </button>
            </>
          )}
          {onFilterChange && (
            <DateRangeFilter
              startDate={startDate || null}
              endDate={endDate || null}
              onFilter={onFilterChange}
              align="right"
              trigger={
                <button 
                  className={`p-3 rounded-2xl transition-all ${isFilterActive ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-400 hover:text-black'}`}
                  title="Filter Periode"
                >
                  <Filter size={18} />
                </button>
              }
            />
          )}
        </div>
      </div>

      <div className="px-8 py-6 bg-white border-b border-gray-50">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Pemasukan
            </span>
            <p className="font-black text-green-600 text-lg truncate">{formatVal(totals.income)}</p>
          </div>
          <div className="flex flex-col gap-1 border-x border-gray-100 px-6">
            <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Pengeluaran
            </span>
            <p className="font-black text-red-600 text-lg truncate">{formatVal(totals.expense)}</p>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest flex items-center gap-1.5 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Saldo
            </span>
            <p className={`font-black text-lg truncate ${totals.balance >= 0 ? 'text-black' : 'text-red-600'}`}>
              {formatVal(totals.balance)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50 overflow-y-auto max-h-[700px] flex-1">
        {transactions.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <MoreHorizontal size={32} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Tidak Ada Transaksi</p>
            <p className="text-gray-300 text-sm mt-2">Belum ada catatan di periode ini</p>
          </div>
        ) : (
          transactions.map((t) => {
            const dateObj = new Date(t.date);
            const dateStr = format(dateObj, 'd MMM yyyy', { locale: id });
            const timeStr = format(dateObj, timeFormat === '12h' ? 'hh:mm a' : 'HH:mm');

            return (
              <div 
                key={t.id || Math.random().toString()} 
                className="p-6 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                onClick={() => setActiveMenuId(activeMenuId === t.id ? null : (t.id || null))}
              >
                <div className={`p-3 rounded-2xl ${t.type === 'goal' ? 'bg-blue-50 text-blue-600' : t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <CategoryIcon category={t.category || 'Others'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate tracking-tight">{t.description || t.category || 'Transaksi'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{dateStr}</p>
                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{timeStr}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className={`font-black text-lg tracking-tight ${t.type === 'goal' ? 'text-blue-600' : t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'goal' ? '🎯' : t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(t.amount)}
                    </p>
                    <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest">{t.category}</p>
                  </div>

                  {activeMenuId === t.id && (
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(t);
                          setActiveMenuId(null);
                        }}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all active:scale-90"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          t.id && onDelete(t.id);
                          setActiveMenuId(null);
                        }}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingTransaction && (
        <TransactionForm 
          onAdd={onAdd}
          onUpdate={onUpdate}
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          profile={profile}
        />
      )}
    </div>
  );
}

