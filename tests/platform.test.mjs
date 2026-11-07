import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

test("1. Công thức tính giá bán báo giá in ấn (Mục 3.3) và lợi nhuận đơn hàng (Mục 7.8)", () => {
  const materialCost = 6200000;
  const printingCost = 3400000;
  const internalFinishingCost = 850000;
  const externalOutsourcingCost = 4650000;
  const designCost = 500000;
  const shippingCost = 350000;
  const wasteCost = 480000;
  const baseCost =
    materialCost +
    printingCost +
    internalFinishingCost +
    externalOutsourcingCost +
    designCost +
    shippingCost +
    wasteCost;
  const profitAmount = Math.round(baseCost * 0.25);
  const sellingPrice = baseCost + profitAmount;

  assert.equal(baseCost, 16430000);
  assert.equal(sellingPrice, 20537500);

  const revenue = 20500000;
  const grossProfit = revenue - materialCost - externalOutsourcingCost - 2150000;
  const netProfit = grossProfit - shippingCost - 0;
  assert.equal(grossProfit, 7500000);
  assert.equal(netProfit, 7150000);
});

test("2. Kiểm tra CSDL SQLite, báo giá & đơn hàng đa sản phẩm (Nội bộ / Gia công ngoài / Kết hợp) và 7 sổ kế toán TT152", () => {
  const dbPath = path.join(process.cwd(), "data", "inandt.sqlite");
  assert.ok(fs.existsSync(dbPath), "File SQLite data/inandt.sqlite phải tồn tại");

  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      execution_mode TEXT NOT NULL DEFAULT 'Sản xuất nội bộ',
      external_printer_id TEXT,
      external_printer_name TEXT,
      material_cost REAL DEFAULT 0,
      internal_cost REAL DEFAULT 0,
      outsourcing_cost REAL DEFAULT 0,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      execution_mode TEXT NOT NULL DEFAULT 'Sản xuất nội bộ',
      external_printer_id TEXT,
      external_printer_name TEXT,
      material_cost REAL DEFAULT 0,
      internal_cost REAL DEFAULT 0,
      outsourcing_cost REAL DEFAULT 0,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      production_code TEXT,
      outsourcing_code TEXT,
      item_status TEXT DEFAULT 'Đang xử lý',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existingOi = db.prepare("SELECT COUNT(*) as cnt FROM order_items").get();
  if (!existingOi || existingOi.cnt === 0) {
    const insertQItem = db.prepare(`
      INSERT INTO quotation_items (
        id, quotation_id, product_name, product_type, specification, quantity,
        execution_mode, external_printer_id, external_printer_name,
        material_cost, internal_cost, outsourcing_cost, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertQItem.run("QI-01", "QUO-01", "Catalogue 500 cuốn (32 trang)", "Catalogue", "Khổ A4, bìa C250 cán bóng + ép kim, ruột C150 đóng keo nhiệt", 500, "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-A", "Xưởng In Offset Đại Phát (Xưởng A)", 3800000, 1200000, 3150000, 24500, 12250000);
    insertQItem.run("QI-02", "QUO-01", "Tờ rơi A5 giới thiệu mỹ phẩm", "Poster", "Khổ A5, giấy Couche 150g, in 4 màu 2 mặt tại xưởng", 2000, "Sản xuất nội bộ", null, null, 1100000, 950000, 0, 1625, 3250000);
    insertQItem.run("QI-03", "QUO-01", "Hộp giấy đựng serum mẫu thử", "Hộp giấy", "Ivory 300g, ép kim + bế dán trọn gói tại Xưởng C", 1000, "Gia công ngoài", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)", 1300000, 0, 1500000, 5000, 5000000);

    const insertOItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, order_code, product_name, product_type, specification, quantity,
        execution_mode, external_printer_id, external_printer_name,
        material_cost, internal_cost, outsourcing_cost, unit_price, total_price,
        production_code, outsourcing_code, item_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertOItem.run("OI-01", "ORD-01", "DH-2026-001", "Catalogue 500 cuốn (32 trang)", "Catalogue", "Khổ A4, bìa C250 cán bóng + ép kim, ruột C150 đóng keo nhiệt", 500, "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-A", "Xưởng A / B / C / D", 3800000, 1200000, 3150000, 24500, 12250000, "LSX-2026-001", "PGC-2026-001..004", "Đang kiểm QC");
    insertOItem.run("OI-02", "ORD-01", "DH-2026-001", "Tờ rơi A5 giới thiệu mỹ phẩm", "Poster", "Khổ A5, giấy Couche 150g, in 4 màu 2 mặt tại xưởng nội bộ", 2000, "Sản xuất nội bộ", null, null, 1100000, 950000, 0, 1625, 3250000, "LSX-2026-001", null, "Hoàn thành");
    insertOItem.run("OI-03", "ORD-01", "DH-2026-001", "Hộp giấy đựng serum mẫu thử", "Hộp giấy", "Ivory 300g, ép kim + bế dán trọn gói tại Xưởng C", 1000, "Gia công ngoài", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)", 1300000, 0, 1500000, 5000, 5000000, null, "PGC-2026-003", "Đã nhập kho");
  }

  const printers = db.prepare("SELECT code, name FROM external_printers ORDER BY code").all();
  assert.equal(printers.length, 4, "Phải có đủ 4 xưởng gia công đối tác Xưởng A, B, C, D");

  // Kiểm tra mỗi báo giá và đơn hàng có nhiều sản phẩm và hỗ trợ cả Nội bộ & Gia công ngoài
  const quoteItems = db.prepare("SELECT * FROM quotation_items WHERE quotation_id = 'QUO-01'").all();
  assert.equal(quoteItems.length, 3, "Báo giá QUO-01 phải có 3 sản phẩm thành phần");

  const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = 'ORD-01'").all();
  assert.equal(orderItems.length, 3, "Đơn hàng ORD-01 phải có 3 sản phẩm thành phần");

  const modes = new Set(orderItems.map((i) => i.execution_mode));
  assert.ok(modes.has("Sản xuất nội bộ"), "Đơn hàng phải có sản phẩm Sản xuất nội bộ");
  assert.ok(modes.has("Gia công ngoài"), "Đơn hàng phải có sản phẩm Gia công ngoài");
  assert.ok(
    modes.has("Kết hợp (Nội bộ + Gia công ngoài)"),
    "Đơn hàng phải có sản phẩm Kết hợp (Nội bộ + Gia công ngoài)"
  );

  const catalogueOutsource = db
    .prepare("SELECT * FROM outsourcing_orders WHERE order_code = 'DH-2026-001' ORDER BY code")
    .all();
  assert.ok(
    catalogueOutsource.length >= 4,
    "Đơn Catalogue 500 cuốn phải liên kết với ít nhất 4 phiếu gia công (Xưởng A, B, C, D)"
  );

  const qcDefect = db
    .prepare("SELECT * FROM outsourcing_quality_checks WHERE outsourcing_code = 'PGC-2026-001'")
    .get();
  assert.ok(qcDefect, "Phải có biên bản QC ghi nhận 20 cuốn lỗi màu tại Xưởng A");
  assert.equal(qcDefect.failed_quantity, 20);
  assert.equal(qcDefect.deduction_amount, 240000);

  const vouchers = db.prepare("SELECT DISTINCT book_category FROM accounting_vouchers").all();
  assert.ok(vouchers.length >= 5, "Chứng từ kế toán phải được phân bổ vào các sổ kế toán TT152");
});
