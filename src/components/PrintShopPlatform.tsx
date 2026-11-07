"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Printer,
  FileText,
  Factory,
  Truck,
  Package,
  Calculator,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Receipt,
  RefreshCw,
  Award,
  Search,
  Layers,
  Trash2,
} from "lucide-react";
import {
  calculatePrintQuote,
  calculateOrderProfit,
  evaluateTaxThreshold,
} from "@/lib/pricing";

const KANBAN_STAGES = [
  "Chờ duyệt file",
  "Đang thiết kế",
  "Chờ duyệt khách",
  "Chuẩn bị in",
  "Đang in",
  "Hậu kỳ",
  "QC",
  "Chờ giao",
  "Hoàn thành",
  "Hủy",
];

const OUTSOURCING_STATUSES = [
  "Chờ duyệt",
  "Đã duyệt",
  "Đang chuẩn bị nguyên vật liệu",
  "Đã giao xưởng ngoài",
  "Xưởng đã nhận",
  "Đang gia công",
  "Chờ QC",
  "QC đạt",
  "QC lỗi, cần làm lại",
  "Đã nhận hàng về",
  "Đã nhập kho",
  "Hoàn tất",
  "Hủy",
];

const ACCOUNTING_BOOKS = [
  "Tất cả chứng từ",
  "Sổ chi tiết doanh thu",
  "Sổ vật liệu",
  "Sổ chi phí",
  "Sổ quỹ tiền mặt",
  "Sổ tiền gửi ngân hàng",
  "Sổ công nợ phải thu",
  "Sổ công nợ phải trả",
];

const FINISHING_OPTIONS = [
  { code: "can_mang_bong", label: "Cán màng bóng (Nội bộ)" },
  { code: "can_mang_mo", label: "Cán màng mờ (Nội bộ)" },
  { code: "ep_kim", label: "Ép kim logo (Gia công ngoài)" },
  { code: "uv_dinh_hinh", label: "UV định hình (Gia công ngoài)" },
  { code: "be_khuon", label: "Bế khuôn thành phẩm (Gia công ngoài)" },
  { code: "xe_ranh", label: "Cấn / Xẻ rãnh (Nội bộ)" },
  { code: "dong_gay_ghim", label: "Đóng gáy bấm kim (Nội bộ)" },
  { code: "dong_gay_keo", label: "Đóng sách keo nhiệt (Gia công ngoài)" },
  { code: "dan_hop", label: "Dán hộp / Đóng túi (Gia công ngoài)" },
];

const ROLE_MATRIX = [
  { role: "Chủ hộ kinh doanh", permissions: "Toàn quyền điều hành, phê duyệt giá, tài chính, thuế và phân quyền" },
  { role: "Kế toán", permissions: "Thu chi, công nợ khách & xưởng ngoài, hóa đơn điện tử, 7 sổ kế toán TT152, báo cáo thuế" },
  { role: "Sale", permissions: "Khách hàng, tính báo giá tự động, tạo đơn hàng, theo dõi đặt cọc và giao hàng" },
  { role: "Thiết kế", permissions: "Nhận file, kiểm tra bình bản CTP, cập nhật phiên bản file thiết kế và bản duyệt khách" },
  { role: "Quản đốc", permissions: "Lệnh sản xuất, điều phối Kanban 10 công đoạn, tạo phiếu gửi gia công ngoài, tiến độ" },
  { role: "Kho", permissions: "Nhập xuất tồn giấy/mực/vật tư, nhận hàng gia công về, đối chiếu QC số lượng" },
  { role: "Nhân viên sản xuất", permissions: "Xem lệnh sản xuất được phân công, cập nhật trạng thái in/hậu kỳ và ghi nhận hao hụt" },
  { role: "Xưởng ngoài", permissions: "Xem phiếu gửi gia công được giao, xác nhận nhận hàng, cập nhật tiến độ & upload ảnh" },
];

interface DraftQuoteItem {
  id: string;
  productName: string;
  productType: string;
  specification: string;
  quantity: number;
  executionMode: "Sản xuất nội bộ" | "Gia công ngoài" | "Kết hợp (Nội bộ + Gia công ngoài)";
  externalPrinterId: string | null;
  externalPrinterName: string | null;
  materialCost: number;
  printingCost: number;
  internalFinishingCost: number;
  externalOutsourcingCost: number;
  designCost: number;
  shippingCost: number;
  wasteCost: number;
  profitAmount: number;
  unitPrice: number;
  totalPrice: number;
}

function formatVND(val: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(val || 0)) + " đ";
}

function getExecutionBadgeClass(mode: string): string {
  if (mode === "Sản xuất nội bộ") {
    return "bg-sky-50 text-sky-700 border border-sky-200";
  }
  if (mode === "Gia công ngoài") {
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }
  return "bg-purple-50 text-purple-700 border border-purple-200";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PrintShopPlatform({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "sales" | "production" | "outsourcing" | "warehouse" | "accounting" | "hr"
  >("dashboard");
  const [activeRole, setActiveRole] = useState("Chủ hộ kinh doanh");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/platform")
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh) => {
        if (fresh && fresh.orders) setData(fresh);
      })
      .catch(() => {});
  }, []);

  // Quotation header & current item calculator state
  const [qCustomer, setQCustomer] = useState("Công ty Mỹ Phẩm LaVie");
  const [qTitle, setQTitle] = useState("Đơn hàng Bộ ấn phẩm Marketing Quý 4");
  const [qProductName, setQProductName] = useState("Catalogue giới thiệu sản phẩm (24 trang)");
  const [qProductType, setQProductType] = useState("Catalogue");
  const [qFinishedSize, setQFinishedSize] = useState("A4 (210x297mm)");
  const [qSheetSize, setQSheetSize] = useState("65x86cm");
  const [qQuantity, setQQuantity] = useState(500);
  const [qPages, setQPages] = useState(24);
  const [qColors, setQColors] = useState(4);
  const [qSides, setQSides] = useState<1 | 2>(2);
  const [qPaper, setQPaper] = useState("Couche 250g");
  const [qExecutionMode, setQExecutionMode] = useState<
    "Sản xuất nội bộ" | "Gia công ngoài" | "Kết hợp (Nội bộ + Gia công ngoài)"
  >("Kết hợp (Nội bộ + Gia công ngoài)");
  const [qExternalPrinterId, setQExternalPrinterId] = useState("EXT-A");
  const [qFinishing, setQFinishing] = useState<string[]>(["can_mang_bong", "ep_kim", "dong_gay_keo"]);
  const [qDesignFee, setQDesignFee] = useState(300000);
  const [qShippingFee, setQShippingFee] = useState(200000);
  const [qWastePercent, setQWastePercent] = useState(3);
  const [qMarginPercent, setQMarginPercent] = useState(25);

  // Multi-product basket inside the quotation builder
  const [draftItems, setDraftItems] = useState<DraftQuoteItem[]>([
    {
      id: "DRAFT-1",
      productName: "Catalogue 500 cuốn (24 trang)",
      productType: "Catalogue",
      specification: "A4 (210x297mm), giấy Couche 250g, in 4 màu 2 mặt | Cán màng bóng, Ép kim, Đóng keo nhiệt",
      quantity: 500,
      executionMode: "Kết hợp (Nội bộ + Gia công ngoài)",
      externalPrinterId: "EXT-A",
      externalPrinterName: "Xưởng In Offset Đại Phát (Xưởng A)",
      materialCost: 4200000,
      printingCost: 2200000,
      internalFinishingCost: 300000,
      externalOutsourcingCost: 2100000,
      designCost: 300000,
      shippingCost: 200000,
      wasteCost: 192000,
      profitAmount: 2373000,
      unitPrice: 23730,
      totalPrice: 11865000,
    },
    {
      id: "DRAFT-2",
      productName: "Tờ rơi A5 khuyến mãi 2.000 tờ",
      productType: "Poster",
      specification: "A5 (148x210mm), giấy Couche 150g, in 4 màu 2 mặt tại xưởng nội bộ",
      quantity: 2000,
      executionMode: "Sản xuất nội bộ",
      externalPrinterId: null,
      externalPrinterName: null,
      materialCost: 900000,
      printingCost: 1100000,
      internalFinishingCost: 200000,
      externalOutsourcingCost: 0,
      designCost: 0,
      shippingCost: 100000,
      wasteCost: 60000,
      profitAmount: 590000,
      unitPrice: 1475,
      totalPrice: 2950000,
    },
  ]);

  // Outsourcing creation state
  const [outProdId, setOutProdId] = useState("PRO-01");
  const [outPrinterId, setOutPrinterId] = useState("EXT-A");
  const [outServiceType, setOutServiceType] = useState("In offset 4 màu");
  const [outQtySent, setOutQtySent] = useState(500);
  const [outUnitPrice, setOutUnitPrice] = useState(3800);
  const [outSetupFee, setOutSetupFee] = useState(450000);
  const [outShippingFee, setOutShippingFee] = useState(150000);
  const [outDueDate, setOutDueDate] = useState("2026-11-12");
  const [outSpec, setOutSpec] = useState("In 4 màu chuẩn hệ CMYK theo mẫu ký duyệt");
  const [printerFilter, setPrinterFilter] = useState("");

  // Outsourcing QC form state
  const [qcOrderId, setQcOrderId] = useState("OUT-04");
  const [qcCheckedQty, setQcCheckedQty] = useState(500);
  const [qcFailedQty, setQcFailedQty] = useState(15);
  const [qcDefectType, setQcDefectType] = useState("Sai màu / Lệch màu");
  const [qcResponsibility, setQcResponsibility] = useState("Xưởng ngoài");
  const [qcRework, setQcRework] = useState(true);
  const [qcDeduction, setQcDeduction] = useState(200000);
  const [qcNotes, setQcNotes] = useState("Phát hiện lỗi khi kiểm tra xác suất lô hàng nhận về");

  // Warehouse movement state
  const [movMaterialId, setMovMaterialId] = useState("MAT-03");
  const [movType, setMovType] = useState("Nhập kho mua hàng");
  const [movQty, setMovQty] = useState(1000);
  const [movRef, setMovRef] = useState("PO-2026-05");
  const [movNote, setMovNote] = useState("Nhập bổ sung giấy tồn kho dưới định mức");

  // Accounting book & voucher form state
  const [selectedBook, setSelectedBook] = useState("Tất cả chứng từ");
  const [vType, setVType] = useState("Phiếu thu tiền khách hàng");
  const [vBook, setVBook] = useState("Sổ chi tiết doanh thu");
  const [vDirection, setVDirection] = useState<"THU" | "CHI">("THU");
  const [vChannel, setVChannel] = useState("Ngân hàng");
  const [vPartner, setVPartner] = useState("Công ty Mỹ Phẩm LaVie");
  const [vRef, setVRef] = useState("DH-2026-001");
  const [vAmount, setVAmount] = useState(10500000);
  const [vDesc, setVDesc] = useState("Thu tất toán 50% còn lại đơn hàng Catalogue 500 cuốn");

  const quoteCalc = useMemo(() => {
    const raw = calculatePrintQuote({
      productType: qProductType,
      finishedSize: qFinishedSize,
      sheetSize: qSheetSize,
      quantity: qQuantity,
      pages: qPages,
      colorCount: qColors,
      sides: qSides,
      paperType: qPaper,
      paperGsm: 250,
      finishingServices: qFinishing,
      designFee: qDesignFee,
      shippingFee: qShippingFee,
      wastePercent: qWastePercent,
      targetMarginPercent: qMarginPercent,
    });

    // Điều chỉnh phân bổ chi phí Nội bộ vs Gia công ngoài theo Phương thức sản xuất của sản phẩm
    if (qExecutionMode === "Sản xuất nội bộ") {
      const movedInternal = raw.internalFinishingCost + raw.externalOutsourcingCost;
      return {
        ...raw,
        internalFinishingCost: movedInternal,
        externalOutsourcingCost: 0,
      };
    }
    if (qExecutionMode === "Gia công ngoài") {
      const movedExternal = raw.printingCost + raw.internalFinishingCost + raw.externalOutsourcingCost;
      return {
        ...raw,
        printingCost: 0,
        internalFinishingCost: 0,
        externalOutsourcingCost: movedExternal,
      };
    }
    return raw;
  }, [
    qProductType,
    qFinishedSize,
    qSheetSize,
    qQuantity,
    qPages,
    qColors,
    qSides,
    qPaper,
    qExecutionMode,
    qFinishing,
    qDesignFee,
    qShippingFee,
    qWastePercent,
    qMarginPercent,
  ]);

  const draftBasketSummary = useMemo(() => {
    return draftItems.reduce(
      (acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.materialCost += item.materialCost;
        acc.printingCost += item.printingCost;
        acc.internalFinishingCost += item.internalFinishingCost;
        acc.externalOutsourcingCost += item.externalOutsourcingCost;
        acc.designCost += item.designCost;
        acc.shippingCost += item.shippingCost;
        acc.wasteCost += item.wasteCost;
        acc.profitAmount += item.profitAmount;
        acc.totalPrice += item.totalPrice;
        return acc;
      },
      {
        totalQuantity: 0,
        materialCost: 0,
        printingCost: 0,
        internalFinishingCost: 0,
        externalOutsourcingCost: 0,
        designCost: 0,
        shippingCost: 0,
        wasteCost: 0,
        profitAmount: 0,
        totalPrice: 0,
      }
    );
  }, [draftItems]);

  // Summary metrics
  const metrics = useMemo(() => {
    const orders = data.orders || [];
    const totalRevenue = orders.reduce((s: number, o: { revenue: number }) => s + Number(o.revenue || 0), 0);
    const totalPaid = orders.reduce((s: number, o: { paid_amount: number }) => s + Number(o.paid_amount || 0), 0);
    const totalReceivable = Math.max(0, totalRevenue - totalPaid);

    let totalGrossProfit = 0;
    let totalNetProfit = 0;
    for (const o of orders) {
      const pf = calculateOrderProfit({
        revenue: Number(o.revenue),
        materialCost: Number(o.material_cost),
        outsourcingCost: Number(o.outsourcing_cost),
        internalCost: Number(o.internal_cost),
        shippingCost: Number(o.shipping_cost),
        discount: Number(o.discount),
      });
      totalGrossProfit += pf.grossProfit;
      totalNetProfit += pf.netProfit;
    }

    const printers = data.externalPrinters || [];
    const totalOutsourcePayable = printers.reduce(
      (s: number, p: { payable_balance: number }) => s + Number(p.payable_balance || 0),
      0
    );

    const lowStockItems = (data.materials || []).filter(
      (m: { stock_qty: number; min_stock_qty: number }) => Number(m.stock_qty) < Number(m.min_stock_qty)
    );

    const unreconciledInvoices = (data.invoices || []).filter(
      (i: { reconciled_status: string }) => i.reconciled_status !== "Đã đối chiếu"
    );

    const cumulativeAnnualRevenue = 685_000_000 + totalRevenue;
    const taxStatus = evaluateTaxThreshold(cumulativeAnnualRevenue);

    return {
      totalRevenue,
      totalPaid,
      totalReceivable,
      totalGrossProfit,
      totalNetProfit,
      totalOutsourcePayable,
      lowStockItems,
      unreconciledInvoices,
      taxStatus,
    };
  }, [data]);

  async function dispatchAction(action: string, payload: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.error || "Có lỗi xảy ra");
      }
      setData(updated);
      setToast(successMsg);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast(`Lỗi: ${err instanceof Error ? err.message : "Không thể thực hiện"}`);
    } finally {
      setBusy(false);
    }
  }

  function toggleFinishing(code: string) {
    setQFinishing((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  }

  function handleAddProductToQuoteBasket() {
    const selectedPrinter = (data.externalPrinters || []).find(
      (p: Record<string, unknown>) => String(p.id) === qExternalPrinterId
    );
    const usesExternal = qExecutionMode !== "Sản xuất nội bộ";
    const finishingText = qFinishing
      .map((c) => FINISHING_OPTIONS.find((o) => o.code === c)?.label.split(" (")[0])
      .filter(Boolean)
      .join(", ");

    const newItem: DraftQuoteItem = {
      id: `DRAFT-${Date.now()}`,
      productName: qProductName,
      productType: qProductType,
      specification: `${qFinishedSize}, giấy ${qPaper}, in ${qColors} màu ${qSides} mặt${
        finishingText ? ` | ${finishingText}` : ""
      }`,
      quantity: qQuantity,
      executionMode: qExecutionMode,
      externalPrinterId: usesExternal ? qExternalPrinterId : null,
      externalPrinterName: usesExternal && selectedPrinter ? String(selectedPrinter.name) : null,
      materialCost: quoteCalc.materialCost,
      printingCost: quoteCalc.printingCost,
      internalFinishingCost: quoteCalc.internalFinishingCost,
      externalOutsourcingCost: quoteCalc.externalOutsourcingCost,
      designCost: quoteCalc.designCost,
      shippingCost: quoteCalc.shippingCost,
      wasteCost: quoteCalc.wasteCost,
      profitAmount: quoteCalc.profitAmount,
      unitPrice: quoteCalc.unitSellingPrice,
      totalPrice: quoteCalc.sellingPrice,
    };

    setDraftItems((prev) => [...prev, newItem]);
    setToast(`Đã thêm "${qProductName}" (${qExecutionMode}) vào giỏ báo giá!`);
    setTimeout(() => setToast(null), 3000);
  }

  function handleRemoveDraftItem(id: string) {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">INANDT ERP & KẾ TOÁN XƯỞNG IN</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  TT 152/2025/TT-BTC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quản lý Báo giá Đa sản phẩm • Lệnh sản xuất Kanban • Gia công Xưởng ngoài • Kho • Kế toán Hộ kinh doanh (&lt; 1 tỷ/năm)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Vai trò:</span>
              <select
                aria-label="Chọn vai trò"
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
              >
                {ROLE_MATRIX.map((r) => (
                  <option key={r.role} value={r.role} className="bg-slate-900 text-white">
                    {r.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-1">
          {[
            { id: "dashboard", label: "1. Tổng quan & Lợi nhuận", icon: BarChart3 },
            { id: "sales", label: "2. Báo giá & Đơn hàng (Đa SP)", icon: FileText },
            { id: "production", label: "3. Sản xuất & Kanban (10 bước)", icon: Factory },
            { id: "outsourcing", label: "4. Xưởng in ngoài & QC", icon: Truck },
            { id: "warehouse", label: "5. Kho Giấy/Mực & Vật tư", icon: Package },
            { id: "accounting", label: "6. Sổ Kế toán (7 sổ) & Thuế", icon: Calculator },
            { id: "hr", label: "7. Nhân sự & Phân quyền", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-indigo-400 text-white bg-slate-800/70"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-indigo-500/40 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase">Doanh thu đơn hàng kỳ này</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{formatVND(metrics.totalRevenue)}</div>
                <div className="text-xs text-emerald-600 mt-2 font-medium">
                  Đã thu: {formatVND(metrics.totalPaid)} • Phải thu: {formatVND(metrics.totalReceivable)}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase">Lợi nhuận ròng thực tế</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{formatVND(metrics.totalNetProfit)}</div>
                <div className="text-xs text-slate-500 mt-2">
                  Lợi nhuận gộp: {formatVND(metrics.totalGrossProfit)} (Tỷ suất:{" "}
                  {metrics.totalRevenue > 0
                    ? ((metrics.totalNetProfit / metrics.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %)
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase">Công nợ phải trả Xưởng ngoài</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">{formatVND(metrics.totalOutsourcePayable)}</div>
                <div className="text-xs text-slate-500 mt-2">
                  Đang gửi ngoài: {(data.outsourcingOrders || []).length} phiếu gia công
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase">Cảnh báo Kho & Chứng từ</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {metrics.lowStockItems.length + metrics.unreconciledInvoices.length} cảnh báo
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {metrics.lowStockItems.length} vật tư dưới định mức • {metrics.unreconciledInvoices.length} HĐ chưa đối chiếu
                </div>
              </div>
            </div>

            {/* Tax Threshold Banner (TT 152/2025/TT-BTC) */}
            <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                    Giám sát Thuế Hộ Kinh Doanh • {metrics.taxStatus.circularRef}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1.5">
                    Theo dõi ngưỡng doanh thu 1 tỷ đồng/năm & Kê khai thuế (Hạn nộp: {metrics.taxStatus.filingDeadline})
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Doanh thu lũy kế năm 2026: <strong className="text-slate-900">{formatVND(metrics.taxStatus.annualRevenue)}</strong> / 1.000.000.000 đ (Còn dư địa:{" "}
                    <strong className="text-emerald-700">{formatVND(metrics.taxStatus.remaining)}</strong>)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-indigo-600">{metrics.taxStatus.percentUsed}%</div>
                  <div className="text-xs text-slate-500">Ngưỡng 1 tỷ đồng/năm</div>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, metrics.taxStatus.percentUsed)}%` }}
                />
              </div>
            </div>

            {/* Order Profitability Analysis Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Báo cáo Lợi nhuận theo Đơn hàng (Công thức Mục 7.8)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lợi nhuận ròng = Doanh thu − Giá vốn NVL − Chi phí gia công ngoài − Chi phí nội bộ − Vận chuyển − Chiết khấu
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã ĐH</th>
                      <th className="py-3 px-4">Khách hàng & Tổ hợp sản phẩm</th>
                      <th className="py-3 px-4 text-right">Doanh thu</th>
                      <th className="py-3 px-4 text-right">Giá vốn NVL</th>
                      <th className="py-3 px-4 text-right">Gia công ngoài</th>
                      <th className="py-3 px-4 text-right">CP Nội bộ & VC</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận gộp</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận ròng</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(data.orders || []).map((ord: Record<string, unknown>) => {
                      const pf = calculateOrderProfit({
                        revenue: Number(ord.revenue),
                        materialCost: Number(ord.material_cost),
                        outsourcingCost: Number(ord.outsourcing_cost),
                        internalCost: Number(ord.internal_cost),
                        shippingCost: Number(ord.shipping_cost),
                        discount: Number(ord.discount),
                      });
                      const itemsForOrd = (data.orderItems || []).filter(
                        (i: Record<string, unknown>) => String(i.order_id) === String(ord.id)
                      );
                      return (
                        <tr key={String(ord.id)} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-semibold text-indigo-600">{String(ord.code)}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{String(ord.product_name)}</div>
                            <div className="text-xs text-slate-500">
                              {String(ord.customer_name)} • {itemsForOrd.length} sản phẩm thành phần
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">{formatVND(Number(ord.revenue))}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatVND(Number(ord.material_cost))}</td>
                          <td className="py-3 px-4 text-right text-amber-700 font-medium">
                            {formatVND(Number(ord.outsourcing_cost))}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {formatVND(Number(ord.internal_cost) + Number(ord.shipping_cost))}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">
                            {formatVND(pf.grossProfit)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">
                            {formatVND(pf.netProfit)} ({pf.marginPercent}%)
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                              {String(ord.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outsourcing Dashboard & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Bảng điều khiển Gia công Xưởng ngoài (Mục 14.3)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  Xếp hạng xưởng chiếm tỷ trọng chi phí cao nhất, tỷ lệ lỗi và công nợ phải trả
                </p>
                <div className="space-y-3">
                  {(data.externalPrinters || []).map((p: Record<string, unknown>) => (
                    <div
                      key={String(p.id)}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          {String(p.name)} <span className="text-xs text-indigo-600">({String(p.code)})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{String(p.service_types)}</div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="text-emerald-700 font-medium">Đúng hạn: {String(p.on_time_rate)}%</span>
                          <span className="text-rose-600 font-medium">Tỷ lệ lỗi: {String(p.defect_rate)}%</span>
                          <span className="text-amber-700 font-medium">Làm lại: {String(p.rework_rate)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Công nợ phải trả</div>
                        <div className="text-sm font-bold text-amber-700">
                          {formatVND(Number(p.payable_balance))}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tổng chi phí: {formatVND(Number(p.total_Mirror_cost))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Cảnh báo Tồn kho tối thiểu & Đối chiếu Hóa đơn</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  Cảnh báo tự động giấy/mực sắp hết và chứng từ cần kế toán kiểm tra
                </p>
                <div className="space-y-3">
                  {metrics.lowStockItems.map((m: Record<string, unknown>) => (
                    <div
                      key={String(m.id)}
                      className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-rose-900">{String(m.name)}</div>
                        <div className="text-xs text-rose-700">
                          Tồn thực tế: <strong>{String(m.stock_qty)} {String(m.unit)}</strong> (Tối thiểu:{" "}
                          {String(m.min_stock_qty)} {String(m.unit)}) • NCC: {String(m.supplier_name)}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("warehouse")}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Nhập kho ngay
                      </button>
                    </div>
                  ))}

                  {metrics.unreconciledInvoices.map((inv: Record<string, unknown>) => (
                    <div
                      key={String(inv.id)}
                      className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-amber-900">
                          Hóa đơn {String(inv.invoice_no)} — {String(inv.partner_name)}
                        </div>
                        <div className="text-xs text-amber-800">
                          Số tiền: {formatVND(Number(inv.total_amount))} • Trạng thái:{" "}
                          <strong>{String(inv.reconciled_status)}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("accounting")}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                      >
                        Đối chiếu
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-PRODUCT QUOTATIONS & ORDERS (SECTION 3 & 7.2) */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Multi-Product Quotation Builder */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Báo giá & Đơn hàng Đa sản phẩm
                  </span>
                  <h2 className="font-bold text-slate-900 mt-1">
                    Soạn Báo Giá Nhiều Sản Phẩm (Nội bộ / Gia công ngoài)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cấu hình từng sản phẩm (chọn sản xuất nội bộ, gửi gia công ngoài hoặc kết hợp) rồi thêm vào giỏ báo giá
                  </p>
                </div>

                {/* Quotation Customer & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Khách hàng</label>
                    <input
                      type="text"
                      value={qCustomer}
                      onChange={(e) => setQCustomer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bộ báo giá / Đơn hàng</label>
                    <input
                      type="text"
                      value={qTitle}
                      onChange={(e) => setQTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Product Configurator */}
                <div className="space-y-3 border border-indigo-100 bg-indigo-50/20 p-3.5 rounded-xl">
                  <div className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Cấu hình sản phẩm để thêm vào Báo giá
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-600 mb-1">Tên sản phẩm / Hạng mục in</label>
                      <input
                        type="text"
                        value={qProductName}
                        onChange={(e) => setQProductName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    {/* Execution Mode: Internal vs External Outsourcing vs Hybrid */}
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-indigo-900 mb-1">
                        Hình thức thực hiện sản phẩm này
                      </label>
                      <select
                        value={qExecutionMode}
                        onChange={(e) =>
                          setQExecutionMode(
                            e.target.value as
                              | "Sản xuất nội bộ"
                              | "Gia công ngoài"
                              | "Kết hợp (Nội bộ + Gia công ngoài)"
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border-2 border-indigo-300 text-xs font-semibold bg-white text-indigo-950"
                      >
                        <option value="Sản xuất nội bộ">
                          1. Sản xuất nội bộ 100% (Tự in & hoàn thiện tại xưởng)
                        </option>
                        <option value="Gia công ngoài">
                          2. Gia công ngoài trọn gói (Gửi xưởng đối tác thực hiện)
                        </option>
                        <option value="Kết hợp (Nội bộ + Gia công ngoài)">
                          3. Kết hợp (In nội bộ + Gửi gia công công đoạn ngoài)
                        </option>
                      </select>
                    </div>

                    {qExecutionMode !== "Sản xuất nội bộ" && (
                      <div className="sm:col-span-2">
                        <label className="block font-medium text-amber-800 mb-1">
                          Chọn Xưởng in ngoài dự kiến nhận gia công sản phẩm này
                        </label>
                        <select
                          value={qExternalPrinterId}
                          onChange={(e) => setQExternalPrinterId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-xs font-medium"
                        >
                          {(data.externalPrinters || []).map((p: Record<string, unknown>) => (
                            <option key={String(p.id)} value={String(p.id)}>
                              {String(p.name)} — ({String(p.service_types)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Nhóm sản phẩm</label>
                      <select
                        value={qProductType}
                        onChange={(e) => setQProductType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {[
                          "Catalogue",
                          "Name card",
                          "Sticker",
                          "Hộp giấy",
                          "Túi giấy",
                          "Poster",
                          "Banner",
                          "Decal",
                          "Lịch",
                          "Sổ tay",
                        ].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Khổ thành phẩm</label>
                      <select
                        value={qFinishedSize}
                        onChange={(e) => setQFinishedSize(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {[
                          "A4 (210x297mm)",
                          "A5 (148x210mm)",
                          "Name card (90x55mm)",
                          "Sticker (50x50mm)",
                          "Hộp giấy (20x15x8cm)",
                          "Túi giấy (25x35x10cm)",
                          "Poster (50x70cm)",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Số lượng</label>
                      <input
                        type="number"
                        value={qQuantity}
                        onChange={(e) => setQQuantity(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Số trang</label>
                      <input
                        type="number"
                        value={qPages}
                        onChange={(e) => setQPages(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Loại giấy</label>
                      <select
                        value={qPaper}
                        onChange={(e) => setQPaper(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {[
                          "Couche 250g",
                          "Couche 150g",
                          "Couche 300g",
                          "Bristol 300g",
                          "Ivory 350g",
                          "Kraft 250g",
                          "Decal Giấy",
                          "Giấy Mỹ Thuật",
                        ].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Số màu & Mặt in</label>
                      <div className="flex gap-1.5">
                        <select
                          value={qColors}
                          onChange={(e) => setQColors(Number(e.target.value))}
                          className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value={4}>4 màu</option>
                          <option value={5}>5 màu</option>
                          <option value={1}>1 màu</option>
                        </select>
                        <select
                          value={qSides}
                          onChange={(e) => setQSides(Number(e.target.value) as 1 | 2)}
                          className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value={2}>2 mặt</option>
                          <option value={1}>1 mặt</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Finishing checkboxes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Công đoạn gia công áp dụng cho sản phẩm này
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      {FINISHING_OPTIONS.map((opt) => (
                        <label
                          key={opt.code}
                          className="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 bg-white cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={qFinishing.includes(opt.code)}
                            onChange={() => toggleFinishing(opt.code)}
                            className="rounded text-indigo-600"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quick preview of current product price */}
                  <div className="p-2.5 rounded-lg bg-slate-900 text-white flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-300">
                        Giá thành SP này:{" "}
                        <strong className="text-white">{formatVND(quoteCalc.sellingPrice)}</strong> (
                        {formatVND(quoteCalc.unitSellingPrice)}/SP)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        NVL: {formatVND(quoteCalc.materialCost)} • Nội bộ:{" "}
                        {formatVND(quoteCalc.printingCost + quoteCalc.internalFinishingCost)} • Gia công ngoài:{" "}
                        <span className="text-amber-300">{formatVND(quoteCalc.externalOutsourcingCost)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProductToQuoteBasket}
                      className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm SP vào Báo giá</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Product Basket Summary */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-700">
                      Giỏ sản phẩm trong Báo giá ({draftItems.length} sản phẩm)
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {draftItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              #{idx + 1}. {item.productName}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getExecutionBadgeClass(
                                item.executionMode
                              )}`}
                            >
                              {item.executionMode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            SL: <strong>{item.quantity}</strong> • {item.specification}
                          </div>
                          {item.externalPrinterName && (
                            <div className="text-[11px] text-amber-800 font-medium">
                              → Xưởng gia công: {item.externalPrinterName} (CP ngoài:{" "}
                              {formatVND(item.externalOutsourcingCost)})
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <div className="font-bold text-indigo-600">{formatVND(item.totalPrice)}</div>
                          {draftItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 inline-flex items-center gap-0.5 text-[11px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Aggregated Quotation Total */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Tổng chi phí nguyên vật liệu ({draftItems.length} SP):</span>
                      <span className="font-semibold text-white">{formatVND(draftBasketSummary.materialCost)}</span>
                    </div>
                    <div className="flex justify-between text-sky-300">
                      <span>Tổng chi phí sản xuất nội bộ:</span>
                      <span className="font-semibold">
                        {formatVND(draftBasketSummary.printingCost + draftBasketSummary.internalFinishingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Tổng chi phí thuê gia công ngoài:</span>
                      <span className="font-semibold">{formatVND(draftBasketSummary.externalOutsourcingCost)}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-sm font-bold border-t border-slate-700 pt-2">
                      <span>TỔNG CỘNG BÁO GIÁ ({draftItems.length} SẢN PHẨM):</span>
                      <span className="text-lg text-emerald-400">{formatVND(draftBasketSummary.totalPrice)}</span>
                    </div>
                  </div>

                  <button
                    disabled={busy || draftItems.length === 0}
                    onClick={() =>
                      dispatchAction(
                        "create_quotation",
                        {
                          customerName: qCustomer,
                          productName: `${qTitle} (${draftItems.length} sản phẩm)`,
                          productType: draftItems[0]?.productType || "Catalogue",
                          finishedSize: qFinishedSize,
                          sheetSize: qSheetSize,
                          quantity: draftBasketSummary.totalQuantity,
                          colorCount: qColors,
                          sides: qSides,
                          paperType: qPaper,
                          finishingServices: "Đa sản phẩm (Nội bộ & Gia công ngoài)",
                          materialCost: draftBasketSummary.materialCost,
                          printingCost: draftBasketSummary.printingCost,
                          internalFinishingCost: draftBasketSummary.internalFinishingCost,
                          externalOutsourcingCost: draftBasketSummary.externalOutsourcingCost,
                          designCost: draftBasketSummary.designCost,
                          shippingCost: draftBasketSummary.shippingCost,
                          wasteCost: draftBasketSummary.wasteCost,
                          profitAmount: draftBasketSummary.profitAmount,
                          totalPrice: draftBasketSummary.totalPrice,
                          items: draftItems,
                        },
                        `Đã lưu Báo giá đa sản phẩm (${draftItems.length} sản phẩm) thành công!`
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu Báo Giá Đa Sản Phẩm ({draftItems.length} SP)</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Quotations & Orders with Multi-Product Breakdown */}
              <div className="lg:col-span-7 space-y-6">
                {/* Multi-Product Quotations List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900">
                      Danh sách Báo giá Đa sản phẩm & Chuyển đổi tự động
                    </h3>
                    <p className="text-xs text-slate-500">
                      Khi duyệt báo giá, hệ thống tự động tách các sản phẩm <strong>Nội bộ</strong> sang <strong>Lệnh sản xuất Kanban (`LSX`)</strong> và các sản phẩm <strong>Gia công ngoài</strong> sang <strong>Phiếu gửi gia công (`PGC`)</strong>
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {(data.quotations || []).map((q: Record<string, unknown>) => {
                      const qItems = (data.quotationItems || []).filter(
                        (item: Record<string, unknown>) => String(item.quotation_id) === String(q.id)
                      );
                      return (
                        <div key={String(q.id)} className="p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-indigo-600">{String(q.code)}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {qItems.length || 1} sản phẩm
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    q.status === "Đã chuyển đơn hàng"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {String(q.status)}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 mt-1">{String(q.product_name)}</div>
                              <div className="text-xs text-slate-500">
                                Khách hàng: <strong>{String(q.customer_name)}</strong> • Ngày tạo:{" "}
                                {String(q.created_at)}
                              </div>
                            </div>

                            <div className="text-right space-y-1.5">
                              <div className="text-lg font-bold text-slate-900">
                                {formatVND(Number(q.total_price))}
                              </div>
                              {q.status !== "Đã chuyển đơn hàng" && (
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    dispatchAction(
                                      "convert_quotation_to_order",
                                      { quotationId: q.id, dueDate: "2026-11-18" },
                                      `Đã chuyển báo giá ${q.code} thành Đơn hàng, tự động tách Lệnh SX nội bộ & Phiếu gia công ngoài!`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                >
                                  <span>Duyệt & Tự động tách LSX + Phiếu Gia Công</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Product items inside quotation */}
                          {qItems.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                              <div className="text-[11px] font-bold uppercase text-slate-500">
                                Chi tiết các sản phẩm trong báo giá {String(q.code)}:
                              </div>
                              <div className="divide-y divide-slate-200/70 text-xs">
                                {qItems.map((item: Record<string, unknown>, iIdx: number) => (
                                  <div
                                    key={String(item.id)}
                                    className="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-slate-900">
                                          {iIdx + 1}. {String(item.product_name)}
                                        </span>
                                        <span className="text-slate-500">
                                          (SL: <strong>{String(item.quantity)}</strong>)
                                        </span>
                                        <span
                                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getExecutionBadgeClass(
                                            String(item.execution_mode)
                                          )}`}
                                        >
                                          {String(item.execution_mode)}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {String(item.specification)}
                                        {item.external_printer_name ? (
                                          <span className="text-amber-800 font-medium">
                                            {" "}
                                            • Xưởng nhận: {String(item.external_printer_name)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="text-right font-semibold text-slate-900">
                                      {formatVND(Number(item.total_price))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Product Orders & Itemized Execution Mode List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900">
                      Đơn hàng Đa sản phẩm & Phân luồng Sản xuất Nội bộ / Gia công ngoài (Mục 3.2 & 7.2)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mỗi đơn hàng hiển thị danh sách sản phẩm thành phần, phương thức sản xuất và mã Lệnh SX (`LSX`) hoặc Phiếu gia công (`PGC`) liên kết
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {(data.orders || []).map((o: Record<string, unknown>) => {
                      const debt = Math.max(0, Number(o.revenue) - Number(o.paid_amount));
                      const oItems = (data.orderItems || []).filter(
                        (item: Record<string, unknown>) => String(item.order_id) === String(o.id)
                      );
                      return (
                        <div key={String(o.id)} className="p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-indigo-600">{String(o.code)}</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                  {String(o.status)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Hẹn giao: <strong>{String(o.due_date)}</strong>
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 mt-0.5">{String(o.product_name)}</div>
                              <div className="text-xs text-slate-500">
                                Khách hàng: <strong>{String(o.customer_name)}</strong> • Kênh: {String(o.channel)}
                              </div>
                            </div>

                            <div className="text-right text-xs space-y-0.5">
                              <div className="text-base font-bold text-slate-900">
                                Tổng đơn: {formatVND(Number(o.revenue))}
                              </div>
                              <div className="text-emerald-600 font-medium">
                                Đã thu: {formatVND(Number(o.paid_amount))} •{" "}
                                <span className="text-rose-600 font-semibold">Còn nợ: {formatVND(debt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          {oItems.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100/80 text-slate-600 uppercase">
                                  <tr>
                                    <th className="py-2 px-3">Sản phẩm trong đơn</th>
                                    <th className="py-2 px-3 text-center">SL</th>
                                    <th className="py-2 px-3">Hình thức sản xuất & Đối tác</th>
                                    <th className="py-2 px-3">Lệnh SX / Phiếu GC</th>
                                    <th className="py-2 px-3 text-right">Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {oItems.map((item: Record<string, unknown>, idx: number) => (
                                    <tr key={String(item.id)}>
                                      <td className="py-2.5 px-3">
                                        <div className="font-semibold text-slate-900">
                                          {idx + 1}. {String(item.product_name)}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {String(item.specification)}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-semibold">
                                        {String(item.quantity)}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold ${getExecutionBadgeClass(
                                            String(item.execution_mode)
                                          )}`}
                                        >
                                          {String(item.execution_mode)}
                                        </span>
                                        {item.external_printer_name ? (
                                          <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                                            {String(item.external_printer_name)}
                                          </div>
                                        ) : null}
                                      </td>
                                      <td className="py-2.5 px-3 space-y-0.5">
                                        {item.production_code ? (
                                          <div className="text-[11px] font-semibold text-sky-700">
                                            Nội bộ: {String(item.production_code)}
                                          </div>
                                        ) : null}
                                        {item.outsourcing_code ? (
                                          <div className="text-[11px] font-semibold text-amber-700">
                                            Gia công: {String(item.outsourcing_code)}
                                          </div>
                                        ) : null}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                        {formatVND(Number(item.total_price))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTION KANBAN 10 STAGES (SECTION 4) */}
        {activeTab === "production" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  Bảng Kanban Sản Xuất Xưởng In — 10 Công Đoạn Chuẩn (Mục 4.2 & 4.3)
                </h2>
                <p className="text-xs text-slate-500">
                  Chuyển trạng thái trực tiếp trên từng Lệnh sản xuất để tự động đồng bộ tiến độ với Đơn hàng bán & QC nội bộ
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {KANBAN_STAGES.map((stage, idx) => (
                  <span
                    key={stage}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                  >
                    {idx + 1}. {stage}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data.productionOrders || []).map((pro: Record<string, unknown>) => (
                <div
                  key={String(pro.id)}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600 text-sm">{String(pro.code)}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">Đơn: {String(pro.order_code)}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                        {String(pro.kanban_stage)}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">
                      {String(pro.product_name)} ({String(pro.quantity)} SP)
                    </h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Quy trình & Kỹ thuật:</strong> {String(pro.specification)}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        <strong>Khách hàng:</strong> {String(pro.customer_name)}
                      </div>
                      <div>
                        <strong>Phụ trách:</strong> {String(pro.assignee)}
                      </div>
                      <div>
                        <strong>Máy / Tổ SX:</strong> {String(pro.machine_name)}
                      </div>
                      <div>
                        <strong>Deadline giao:</strong>{" "}
                        <span className="text-rose-600 font-semibold">{String(pro.due_date)}</span>
                      </div>
                      <div>
                        <strong>Bản duyệt:</strong> {String(pro.customer_approval)}
                      </div>
                      <div>
                        <strong>Hao hụt giấy:</strong> {String(pro.paper_waste_percent)}%
                      </div>
                    </div>

                    {Number(pro.defect_count) > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Ghi nhận QC ({String(pro.defect_count)} lỗi):</strong> {String(pro.defect_note)}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-500">Chuyển bước Kanban:</span>
                    <select
                      aria-label={`Chuyển bước Kanban cho ${String(pro.code)}`}
                      value={String(pro.kanban_stage)}
                      disabled={busy}
                      onChange={(e) =>
                        dispatchAction(
                          "update_kanban_stage",
                          { productionOrderId: pro.id, kanbanStage: e.target.value },
                          `Đã chuyển ${pro.code} sang công đoạn "${e.target.value}"`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50 hover:bg-white cursor-pointer"
                    >
                      {KANBAN_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EXTERNAL PRINTERS, OUTSOURCING ORDERS & QC */}
        {activeTab === "outsourcing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>Hồ sơ Xưởng In Ngoài & Đánh giá Năng lực Đối tác (Mục 7.1, 7.10 & 14.1)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Quản lý bảng giá quy cách, công suất máy, điều khoản bồi thường chất lượng và chấm điểm tự động
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Lọc theo dịch vụ (offset, ép kim, UV...)"
                    value={printerFilter}
                    onChange={(e) => setPrinterFilter(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.externalPrinters || [])
                  .filter(
                    (p: Record<string, unknown>) =>
                      !printerFilter ||
                      String(p.name).toLowerCase().includes(printerFilter.toLowerCase()) ||
                      String(p.service_types).toLowerCase().includes(printerFilter.toLowerCase())
                  )
                  .map((p: Record<string, unknown>) => (
                    <div
                      key={String(p.id)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900">{String(p.name)}</span>
                          <div className="text-slate-500">
                            Mã: <strong>{String(p.code)}</strong> • MST: {String(p.tax_code)} • Liên hệ:{" "}
                            {String(p.contact_name)} ({String(p.phone)})
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          ★ {String(p.rating)} / 5.0
                        </span>
                      </div>

                      <div className="text-slate-700">
                        <strong>Dịch vụ:</strong> {String(p.service_types)}
                      </div>
                      <div className="text-slate-600">
                        <strong>Năng lực máy:</strong> {String(p.machine_capacity)}
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">
                        <strong>Bảng giá quy cách:</strong> {String(p.unit_pricing)}
                      </div>
                      <div className="text-slate-600">
                        <strong>Cam kết QC & Bồi thường:</strong> {String(p.quality_standard)}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-3">
                          <span className="font-semibold text-emerald-700">Đúng hạn: {String(p.on_time_rate)}%</span>
                          <span className="font-semibold text-rose-600">Tỷ lệ lỗi: {String(p.defect_rate)}%</span>
                          <span className="font-semibold text-amber-700">Làm lại: {String(p.rework_rate)}%</span>
                        </div>
                        <div className="font-bold text-amber-800">
                          Công nợ: {formatVND(Number(p.payable_balance))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Tạo Phiếu Gửi Gia Công Ngoài Từ Lệnh Sản Xuất (Mục 7.4)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Lệnh sản xuất gốc</label>
                    <select
                      value={outProdId}
                      onChange={(e) => setOutProdId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {(data.productionOrders || []).map((pro: Record<string, unknown>) => (
                        <option key={String(pro.id)} value={String(pro.id)}>
                          {String(pro.code)} — {String(pro.product_name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Xưởng nhận gia công</label>
                    <select
                      value={outPrinterId}
                      onChange={(e) => setOutPrinterId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {(data.externalPrinters || []).map((p: Record<string, unknown>) => (
                        <option key={String(p.id)} value={String(p.id)}>
                          {String(p.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Công đoạn gia công</label>
                    <input
                      type="text"
                      value={outServiceType}
                      onChange={(e) => setOutServiceType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Số lượng gửi đi</label>
                    <input
                      type="number"
                      value={outQtySent}
                      onChange={(e) => setOutQtySent(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Đơn giá gia công (VNĐ)</label>
                    <input
                      type="number"
                      value={outUnitPrice}
                      onChange={(e) => setOutUnitPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Phí khuôn / bản in / setup</label>
                    <input
                      type="number"
                      value={outSetupFee}
                      onChange={(e) => setOutSetupFee(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Phí vận chuyển 2 chiều</label>
                    <input
                      type="number"
                      value={outShippingFee}
                      onChange={(e) => setOutShippingFee(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Deadline nhận hàng về</label>
                    <input
                      type="date"
                      value={outDueDate}
                      onChange={(e) => setOutDueDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Quy cách kỹ thuật & mẫu đối chứng</label>
                    <input
                      type="text"
                      value={outSpec}
                      onChange={(e) => setOutSpec(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-600">
                    Tổng chi phí phiếu:{" "}
                    <strong className="text-indigo-600 text-sm">
                      {formatVND(outQtySent * outUnitPrice + outSetupFee + outShippingFee)}
                    </strong>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() =>
                      dispatchAction(
                        "create_outsourcing_order",
                        {
                          productionOrderId: outProdId,
                          externalPrinterId: outPrinterId,
                          serviceType: outServiceType,
                          quantitySent: outQtySent,
                          unitPrice: outUnitPrice,
                          setupFee: outSetupFee,
                          shippingFee: outShippingFee,
                          dueDate: outDueDate,
                          specification: outSpec,
                        },
                        "Đã tạo Phiếu gửi gia công ngoài & ghi nhận công nợ tạm tính!"
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Tạo Phiếu Gửi Gia Công
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-rose-600" />
                  <span>Nghiệm Thu QC Khi Nhận Hàng Về & Xử Lý Làm Lại / Trừ Công Nợ (Mục 7.6 & 7.9)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Chọn phiếu gia công nhận hàng</label>
                    <select
                      value={qcOrderId}
                      onChange={(e) => setQcOrderId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {(data.outsourcingOrders || []).map((o: Record<string, unknown>) => (
                        <option key={String(o.id)} value={String(o.id)}>
                          {String(o.code)} — {String(o.external_printer_name)} ({String(o.service_type)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Số lượng nhận về kiểm tra</label>
                    <input
                      type="number"
                      value={qcCheckedQty}
                      onChange={(e) => setQcCheckedQty(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Số lượng lỗi / hỏng</label>
                    <input
                      type="number"
                      value={qcFailedQty}
                      onChange={(e) => setQcFailedQty(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Loại lỗi phát hiện</label>
                    <select
                      value={qcDefectType}
                      onChange={(e) => setQcDefectType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {[
                        "Sai màu / Lệch màu",
                        "Lem mực / Trầy xước",
                        "Bong màng / Nổi bọt",
                        "Lệch tay kê ép kim / bế",
                        "Đóng gáy bung keo",
                        "Thiếu số lượng",
                        "Không có lỗi (Đạt 100%)",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Bên chịu trách nhiệm chi phí</label>
                    <select
                      value={qcResponsibility}
                      onChange={(e) => setQcResponsibility(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Xưởng ngoài">Xưởng ngoài (Khấu trừ công nợ / Bắt làm lại)</option>
                      <option value="Xưởng in chính">Xưởng in chính (Lỗi file / nguyên vật liệu)</option>
                      <option value="Khách hàng">Khách hàng thay đổi yêu cầu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Số tiền trừ công nợ xưởng ngoài (VNĐ)</label>
                    <input
                      type="number"
                      value={qcDeduction}
                      onChange={(e) => setQcDeduction(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
                      <input
                        type="checkbox"
                        checked={qcRework}
                        onChange={(e) => setQcRework(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>Yêu cầu xưởng làm lại số lượng lỗi</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Ghi chú biên bản QC</label>
                    <input
                      type="text"
                      value={qcNotes}
                      onChange={(e) => setQcNotes(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    disabled={busy}
                    onClick={() =>
                      dispatchAction(
                        "record_outsourcing_qc",
                        {
                          outsourcingOrderId: qcOrderId,
                          checkedQuantity: qcCheckedQty,
                          failedQuantity: qcFailedQty,
                          defectType: qcDefectType,
                          responsibility: qcResponsibility,
                          reworkRequired: qcRework,
                          deductionAmount: qcDeduction,
                          notes: qcNotes,
                        },
                        "Đã lưu biên bản QC & tự động hạch toán giảm công nợ xưởng ngoài!"
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Lưu Biên Bản QC & Khấu Trừ Công Nợ
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">
                  Danh sách Phiếu Gửi Gia Công Ngoài & Đối chiếu Số lượng / Chi phí (Mục 7.2, 7.5 & 14.2)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Mã Phiếu</th>
                      <th className="py-3 px-3">Đơn / LSX</th>
                      <th className="py-3 px-3">Xưởng thực hiện & Sản phẩm</th>
                      <th className="py-3 px-3 text-center">SL Gửi / Nhận / Lỗi</th>
                      <th className="py-3 px-3 text-right">Tổng CP (Sau trừ lỗi)</th>
                      <th className="py-3 px-3 text-right">Đã trả / Còn nợ</th>
                      <th className="py-3 px-3">Trạng thái tiến độ (13 bước)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(data.outsourcingOrders || []).map((o: Record<string, unknown>) => {
                      const remain = Math.max(0, Number(o.total_cost) - Number(o.paid_amount));
                      return (
                        <tr key={String(o.id)} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-bold text-indigo-600">{String(o.code)}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{String(o.order_code)}</div>
                            <div className="text-slate-500">{String(o.production_code)}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{String(o.external_printer_name)}</div>
                            <div className="text-indigo-700 font-medium">
                              {String(o.product_name)} — {String(o.service_type)}
                            </div>
                            <div className="text-slate-500 max-w-md truncate">{String(o.notes)}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-medium">
                            <span>{String(o.quantity_sent)}</span> /{" "}
                            <span className="text-emerald-700">{String(o.quantity_received)}</span> /{" "}
                            <span className="text-rose-600 font-bold">{String(o.quantity_rejected)}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900">{formatVND(Number(o.total_cost))}</div>
                            {Number(o.deduction_amount) > 0 && (
                              <div className="text-[11px] text-rose-600">
                                Đã trừ lỗi: -{formatVND(Number(o.deduction_amount))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="text-emerald-700">{formatVND(Number(o.paid_amount))}</div>
                            <div className="font-semibold text-amber-700">Nợ: {formatVND(remain)}</div>
                            <div className="text-[11px] text-slate-500">{String(o.payment_status)}</div>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              aria-label={`Trạng thái phiếu ${String(o.code)}`}
                              value={String(o.status)}
                              disabled={busy}
                              onChange={(e) =>
                                dispatchAction(
                                  "update_outsourcing_status",
                                  { outsourcingOrderId: o.id, status: e.target.value },
                                  `Đã cập nhật trạng thái phiếu ${o.code} -> ${e.target.value}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                            >
                              {OUTSOURCING_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WAREHOUSE & STOCK MOVEMENTS */}
        {activeTab === "warehouse" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-900">
                  Lập Phiếu Nhập / Xuất Kho (Mục 5.2)
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập nguyên vật liệu từ nhà cung cấp, xuất cho lệnh sản xuất hoặc xuất gửi gia công ngoài
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Loại giao dịch kho</label>
                    <select
                      value={movType}
                      onChange={(e) => setMovType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Nhập kho mua hàng">Nhập kho mua hàng (Tăng tồn)</option>
                      <option value="Nhập nhận hàng gia công">Nhập nhận hàng gia công về (Tăng tồn)</option>
                      <option value="Xuất cho lệnh sản xuất">Xuất cho lệnh sản xuất (Giảm tồn)</option>
                      <option value="Xuất gửi gia công ngoài">Xuất gửi gia công ngoài (Giảm tồn)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Chọn Giấy / Mực / Vật tư / Thành phẩm</label>
                    <select
                      value={movMaterialId}
                      onChange={(e) => setMovMaterialId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {(data.materials || []).map((m: Record<string, unknown>) => (
                        <option key={String(m.id)} value={String(m.id)}>
                          {String(m.code)} — {String(m.name)} (Tồn: {String(m.stock_qty)} {String(m.unit)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Số lượng</label>
                    <input
                      type="number"
                      value={movQty}
                      onChange={(e) => setMovQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Mã chứng từ tham chiếu (PO / LSX / PGC)</label>
                    <input
                      type="text"
                      value={movRef}
                      onChange={(e) => setMovRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={movNote}
                      onChange={(e) => setMovNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    disabled={busy}
                    onClick={() =>
                      dispatchAction(
                        "create_stock_movement",
                        {
                          materialId: movMaterialId,
                          movementType: movType,
                          quantity: movQty,
                          referenceCode: movRef,
                          note: movNote,
                        },
                        "Đã ghi nhận phiếu kho và cập nhật tồn kho thực tế!"
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    Ghi Nhận Phiếu Kho
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900">
                    Danh mục Tồn kho Giấy, Mực, Vật tư, Bán thành phẩm & Thành phẩm (Mục 5.1)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Mã VT</th>
                        <th className="py-3 px-4">Tên hàng hóa & Nhóm</th>
                        <th className="py-3 px-4 text-right">Tồn thực tế</th>
                        <th className="py-3 px-4 text-right">Tồn tối thiểu</th>
                        <th className="py-3 px-4 text-right">Đơn giá vốn</th>
                        <th className="py-3 px-4 text-right">Giá trị tồn</th>
                        <th className="py-3 px-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(data.materials || []).map((m: Record<string, unknown>) => {
                        const isLow = Number(m.stock_qty) < Number(m.min_stock_qty);
                        return (
                          <tr key={String(m.id)}>
                            <td className="py-3 px-4 font-bold text-indigo-600">{String(m.code)}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{String(m.name)}</div>
                              <div className="text-slate-500">
                                Nhóm: <strong>{String(m.category)}</strong> • NCC: {String(m.supplier_name)} (
                                {String(m.valuation_method)})
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {String(m.stock_qty)} {String(m.unit)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500">
                              {String(m.min_stock_qty)} {String(m.unit)}
                            </td>
                            <td className="py-3 px-4 text-right">{formatVND(Number(m.unit_cost))}</td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {formatVND(Number(m.stock_qty) * Number(m.unit_cost))}
                            </td>
                            <td className="py-3 px-4">
                              {isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                                  Cần mua thêm
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                  Đủ định mức
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: HOUSEHOLD ACCOUNTING (7 BOOKS TT152) & E-INVOICES */}
        {activeTab === "accounting" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <span>Hệ thống 7 Sổ Kế Toán Hộ Kinh Doanh (Thông tư 152/2025/TT-BTC — Mục 8.2)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chọn từng sổ kế toán bên dưới để lọc chứng từ thu/chi/nhập/xuất/công nợ tương ứng
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {ACCOUNTING_BOOKS.map((book) => (
                  <button
                    key={book}
                    onClick={() => setSelectedBook(book)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedBook === book
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {book}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 text-sm">Lập Phiếu Thu / Phiếu Chi Mới (Mục 8.1)</h3>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Loại chứng từ</label>
                  <select
                    value={vType}
                    onChange={(e) => {
                      setVType(e.target.value);
                      if (e.target.value.includes("Phiếu thu")) {
                        setVDirection("THU");
                        setVBook("Sổ chi tiết doanh thu");
                      } else {
                        setVDirection("CHI");
                        setVBook("Sổ chi phí");
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Phiếu thu tiền khách hàng">Phiếu thu tiền khách hàng</option>
                    <option value="Phiếu chi gia công ngoài">Phiếu chi trả xưởng gia công ngoài</option>
                    <option value="Phiếu chi nhà cung cấp">Phiếu chi trả nhà cung cấp giấy/mực</option>
                    <option value="Phiếu chi chi phí xưởng">Phiếu chi lương / điện nước / vận hành</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Ghi vào Sổ kế toán</label>
                  <select
                    value={vBook}
                    onChange={(e) => setVBook(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {ACCOUNTING_BOOKS.slice(1).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Kênh thanh toán</label>
                  <select
                    value={vChannel}
                    onChange={(e) => setVChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Ngân hàng">Chuyển khoản Ngân hàng</option>
                    <option value="Tiền mặt">Quỹ Tiền mặt</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Đối tác (Khách hàng / Xưởng ngoài / NCC)</label>
                  <input
                    type="text"
                    value={vPartner}
                    onChange={(e) => setVPartner(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Mã đơn hàng / Phiếu gia công liên kết</label>
                  <input
                    type="text"
                    value={vRef}
                    onChange={(e) => setVRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    value={vAmount}
                    onChange={(e) => setVAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Diễn giải nội dung</label>
                  <input
                    type="text"
                    value={vDesc}
                    onChange={(e) => setVDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <button
                  disabled={busy}
                  onClick={() =>
                    dispatchAction(
                      "create_voucher",
                      {
                        voucherType: vType,
                        bookCategory: vBook,
                        paymentChannel: vChannel,
                        partnerName: vPartner,
                        referenceCode: vRef,
                        amount: vAmount,
                        direction: vDirection,
                        description: vDesc,
                      },
                      "Đã lập chứng từ kế toán và ghi sổ thành công!"
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Ghi Sổ Chứng Từ Kế Toán
                </button>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      Chi tiết Sổ Kế Toán: <span className="text-indigo-600">{selectedBook}</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3">Số CT</th>
                          <th className="py-3 px-3">Ngày</th>
                          <th className="py-3 px-3">Sổ kế toán & Kênh</th>
                          <th className="py-3 px-3">Đối tác & Diễn giải</th>
                          <th className="py-3 px-3 text-right">Thu / Ghi giảm nợ</th>
                          <th className="py-3 px-3 text-right">Chi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(data.accountingVouchers || [])
                          .filter(
                            (v: Record<string, unknown>) =>
                              selectedBook === "Tất cả chứng từ" || v.book_category === selectedBook
                          )
                          .map((v: Record<string, unknown>) => (
                            <tr key={String(v.id)}>
                              <td className="py-3 px-3 font-bold text-indigo-600">{String(v.code)}</td>
                              <td className="py-3 px-3 text-slate-500">{String(v.voucher_date)}</td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{String(v.book_category)}</div>
                                <div className="text-slate-500">{String(v.payment_channel)}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900">{String(v.partner_name)}</div>
                                <div className="text-slate-600">
                                  {String(v.description)}{" "}
                                  {v.reference_code ? (
                                    <span className="text-indigo-600 font-medium">({String(v.reference_code)})</span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-600">
                                {v.direction === "THU" ? formatVND(Number(v.amount)) : "—"}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-rose-600">
                                {v.direction === "CHI" ? formatVND(Number(v.amount)) : "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                        <span>Hóa đơn điện tử & Đối chiếu doanh thu kê khai thuế (Mục 9)</span>
                      </h3>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() =>
                        dispatchAction(
                          "issue_invoice",
                          {
                            orderCode: "DH-2026-001",
                            partnerName: "Công ty Mỹ Phẩm LaVie",
                            taxCode: "0312233445",
                            totalAmount: 20500000,
                          },
                          "Đã phát hành Hóa đơn điện tử mới cho đơn hàng DH-2026-001!"
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      + Phát hành HĐĐT đơn DH-2026-001
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Số HĐĐT</th>
                          <th className="py-3 px-4">Loại HĐ</th>
                          <th className="py-3 px-4">Đối tác & Mã ĐH</th>
                          <th className="py-3 px-4 text-right">Trước thuế</th>
                          <th className="py-3 px-4 text-right">Thuế GTGT</th>
                          <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                          <th className="py-3 px-4">Đối chiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(data.invoices || []).map((inv: Record<string, unknown>) => (
                          <tr key={String(inv.id)}>
                            <td className="py-3 px-4 font-bold text-indigo-600">{String(inv.invoice_no)}</td>
                            <td className="py-3 px-4">{String(inv.invoice_type)}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{String(inv.partner_name)}</div>
                              <div className="text-slate-500">
                                MST: {String(inv.tax_code)} • Tham chiếu: {String(inv.order_code)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">{formatVND(Number(inv.amount_before_tax))}</td>
                            <td className="py-3 px-4 text-right">{formatVND(Number(inv.tax_amount))}</td>
                            <td className="py-3 px-4 text-right font-bold">{formatVND(Number(inv.total_amount))}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold ${
                                  inv.reconciled_status === "Đã đối chiếu"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {String(inv.reconciled_status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: HR, PAYROLL & RBAC */}
        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 text-lg">
                  Nhân sự Xưởng in, Chấm công, Lương & Năng suất (Mục 10)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã NV</th>
                      <th className="py-3 px-4">Họ tên & Bộ phận</th>
                      <th className="py-3 px-4">Vai trò hệ thống</th>
                      <th className="py-3 px-4">Hình thức lương</th>
                      <th className="py-3 px-4 text-center">Ngày công</th>
                      <th className="py-3 px-4 text-center">Số đơn hoàn thành</th>
                      <th className="py-3 px-4 text-center">Tỷ lệ lỗi</th>
                      <th className="py-3 px-4 text-right">Tổng thực lĩnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(data.employees || []).map((emp: Record<string, unknown>) => (
                      <tr key={String(emp.id)}>
                        <td className="py-3 px-4 font-bold text-indigo-600">{String(emp.code)}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{String(emp.name)}</div>
                          <div className="text-xs text-slate-500">{String(emp.department)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {String(emp.role_name)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{String(emp.salary_type)}</td>
                        <td className="py-3 px-4 text-center font-medium">{String(emp.work_days)} công</td>
                        <td className="py-3 px-4 text-center font-semibold text-indigo-600">
                          {String(emp.completed_orders)} đơn
                        </td>
                        <td className="py-3 px-4 text-center text-xs">{String(emp.defect_rate)}%</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatVND(Number(emp.total_pay))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-3">
                Ma trận Phân quyền 8 Vai trò trong Xưởng in (Mục 12.3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {ROLE_MATRIX.map((r) => (
                  <div
                    key={r.role}
                    className={`p-3.5 rounded-xl border text-xs ${
                      activeRole === r.role
                        ? "border-indigo-600 bg-indigo-50/60"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm mb-1">{r.role}</div>
                    <p className="text-slate-600 leading-relaxed">{r.permissions}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
