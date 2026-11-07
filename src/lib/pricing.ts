export interface QuoteCalculationInput {
  productType: string;
  finishedSize: string;
  sheetSize: string;
  quantity: number;
  pages?: number;
  colorCount: number;
  sides: 1 | 2;
  paperType: string;
  paperGsm: number;
  finishingServices: string[];
  designFee: number;
  shippingFee: number;
  wastePercent: number;
  targetMarginPercent: number;
  outsourceCostOverride?: number;
}

export interface QuoteCalculationResult {
  materialCost: number;
  printingCost: number;
  internalFinishingCost: number;
  externalOutsourcingCost: number;
  designCost: number;
  shippingCost: number;
  wasteCost: number;
  totalBaseCost: number;
  profitAmount: number;
  sellingPrice: number;
  unitSellingPrice: number;
  estimatedSheets: number;
}

const PAPER_BASE_PRICE_PER_SHEET: Record<string, number> = {
  "Couche 150g": 1800,
  "Couche 250g": 2800,
  "Couche 300g": 3400,
  "Bristol 300g": 3600,
  "Ivory 350g": 4500,
  "Kraft 250g": 2600,
  "Decal Giấy": 3200,
  "Giấy Mỹ Thuật": 8500,
};

const PRODUCTS_PER_SHEET: Record<string, number> = {
  "Name card (90x55mm)": 24,
  "A5 (148x210mm)": 8,
  "A4 (210x297mm)": 4,
  "A3 (297x420mm)": 2,
  "Sticker (50x50mm)": 40,
  "Hộp giấy (20x15x8cm)": 2,
  "Túi giấy (25x35x10cm)": 1,
  "Poster (50x70cm)": 1,
};

const FINISHING_RATES: Record<
  string,
  { label: string; isExternal: boolean; setupFee: number; unitRate: number }
> = {
  can_mang_mo: { label: "Cán màng mờ", isExternal: false, setupFee: 100000, unitRate: 450 },
  can_mang_bong: { label: "Cán màng bóng", isExternal: false, setupFee: 100000, unitRate: 400 },
  ep_kim: { label: "Ép kim logo", isExternal: true, setupFee: 450000, unitRate: 900 },
  uv_dinh_hinh: { label: "UV định hình", isExternal: true, setupFee: 400000, unitRate: 850 },
  be_khuon: { label: "Bế khuôn thành phẩm", isExternal: true, setupFee: 350000, unitRate: 300 },
  xe_ranh: { label: "Cấn / Xẻ rãnh", isExternal: false, setupFee: 80000, unitRate: 200 },
  dong_gay_ghim: { label: "Đóng gáy bấm kim", isExternal: false, setupFee: 120000, unitRate: 600 },
  dong_gay_keo: { label: "Đóng gáy keo nhiệt", isExternal: true, setupFee: 300000, unitRate: 1800 },
  dan_hop: { label: "Dán hộp / Đóng túi", isExternal: true, setupFee: 250000, unitRate: 1100 },
};

export function calculatePrintQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  const safeQty = Math.max(1, Number(input.quantity) || 1);
  const pagesMultiplier = Math.max(1, Math.ceil((input.pages || 2) / 2));
  const ups = PRODUCTS_PER_SHEET[input.finishedSize] || 4;
  const estimatedSheets = Math.ceil((safeQty * pagesMultiplier) / ups);

  const sheetUnitPrice = PAPER_BASE_PRICE_PER_SHEET[input.paperType] || 3000;
  const materialCost = Math.round(estimatedSheets * sheetUnitPrice);

  // Chi phí bản kẽm CTP + công chạy máy in
  const plateCost = input.colorCount * input.sides * 140000;
  const impressionCost = estimatedSheets * input.sides * (input.colorCount >= 4 ? 380 : 220);
  const printingCost = Math.round(plateCost + impressionCost);

  let internalFinishingCost = 0;
  let computedExternalCost = 0;

  for (const code of input.finishingServices) {
    const rate = FINISHING_RATES[code];
    if (!rate) continue;
    const cost = Math.round(rate.setupFee + safeQty * rate.unitRate);
    if (rate.isExternal) {
      computedExternalCost += cost;
    } else {
      internalFinishingCost += cost;
    }
  }

  const externalOutsourcingCost =
    typeof input.outsourceCostOverride === "number" && input.outsourceCostOverride >= 0
      ? Math.round(input.outsourceCostOverride)
      : computedExternalCost;

  const designCost = Math.max(0, Math.round(input.designFee || 0));
  const shippingCost = Math.max(0, Math.round(input.shippingFee || 0));

  const wasteCost = Math.round(
    ((materialCost + printingCost) * Math.max(0, input.wastePercent || 0)) / 100
  );

  const totalBaseCost =
    materialCost +
    printingCost +
    internalFinishingCost +
    externalOutsourcingCost +
    designCost +
    shippingCost +
    wasteCost;

  const profitAmount = Math.round(
    (totalBaseCost * Math.max(0, input.targetMarginPercent || 0)) / 100
  );

  const sellingPrice = totalBaseCost + profitAmount;
  const unitSellingPrice = Math.round(sellingPrice / safeQty);

  return {
    materialCost,
    printingCost,
    internalFinishingCost,
    externalOutsourcingCost,
    designCost,
    shippingCost,
    wasteCost,
    totalBaseCost,
    profitAmount,
    sellingPrice,
    unitSellingPrice,
    estimatedSheets,
  };
}

export interface OrderProfitInput {
  revenue: number;
  materialCost: number;
  outsourcingCost: number;
  internalCost: number;
  shippingCost: number;
  discount: number;
}

export interface OrderProfitResult {
  grossProfit: number;
  netProfit: number;
  marginPercent: number;
}

export function calculateOrderProfit(input: OrderProfitInput): OrderProfitResult {
  const grossProfit =
    input.revenue - input.materialCost - input.outsourcingCost - input.internalCost;
  const netProfit = grossProfit - input.shippingCost - input.discount;
  const marginPercent =
    input.revenue > 0 ? Number(((netProfit / input.revenue) * 100).toFixed(1)) : 0;

  return {
    grossProfit,
    netProfit,
    marginPercent,
  };
}

export function evaluateTaxThreshold(annualRevenue: number) {
  const cap = 1_000_000_000; // 1 tỷ đồng/năm cho hộ kinh doanh theo TT 152/2025/TT-BTC
  const percentUsed = Number(((annualRevenue / cap) * 100).toFixed(2));
  const remaining = Math.max(0, cap - annualRevenue);
  const status: "safe" | "warning" | "exceeded" =
    annualRevenue >= cap ? "exceeded" : annualRevenue >= cap * 0.8 ? "warning" : "safe";

  return {
    cap,
    annualRevenue,
    remaining,
    percentUsed,
    status,
    filingDeadline: "31/01 hàng năm",
    circularRef: "Thông tư 152/2025/TT-BTC",
  };
}

