import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "inandt.sqlite");

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  initializeSchema(db);
  seedIfEmpty(db);
  seedMultiItemsIfEmpty(db);
  dbInstance = db;
  return db;
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      channel TEXT DEFAULT 'Trực tiếp',
      total_revenue REAL DEFAULT 0,
      receivable_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      finished_size TEXT NOT NULL,
      sheet_size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      color_count INTEGER DEFAULT 4,
      sides INTEGER DEFAULT 2,
      paper_type TEXT NOT NULL,
      finishing_services TEXT NOT NULL,
      material_cost REAL NOT NULL,
      printing_cost REAL NOT NULL,
      internal_finishing_cost REAL NOT NULL,
      external_outsourcing_cost REAL NOT NULL,
      design_cost REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      waste_cost REAL DEFAULT 0,
      profit_amount REAL NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'Chờ duyệt',
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      quotation_id TEXT,
      customer_name TEXT NOT NULL,
      channel TEXT DEFAULT 'Trực tiếp',
      product_name TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      revenue REAL NOT NULL,
      deposit_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      outsourcing_cost REAL DEFAULT 0,
      internal_cost REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'Đang sản xuất',
      design_file TEXT,
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

    CREATE TABLE IF NOT EXISTS production_orders (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      order_code TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      specification TEXT NOT NULL,
      assignee TEXT NOT NULL,
      machine_name TEXT,
      start_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      kanban_stage TEXT NOT NULL,
      paper_waste_percent REAL DEFAULT 2.5,
      defect_count INTEGER DEFAULT 0,
      defect_note TEXT,
      design_file TEXT,
      customer_approval TEXT DEFAULT 'Đã duyệt mẫu',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS external_printers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tax_code TEXT,
      address TEXT,
      contact_name TEXT,
      phone TEXT,
      zalo TEXT,
      email TEXT,
      service_types TEXT NOT NULL,
      machine_capacity TEXT,
      unit_pricing TEXT,
      payment_term TEXT,
      quality_standard TEXT,
      status TEXT DEFAULT 'Đã duyệt',
      rating REAL DEFAULT 4.5,
      on_time_rate REAL DEFAULT 95,
      defect_rate REAL DEFAULT 1.5,
      rework_rate REAL DEFAULT 2.0,
      total_Mirror_cost REAL DEFAULT 0,
      payable_balance REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outsourcing_orders (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      order_id TEXT,
      order_code TEXT NOT NULL,
      production_order_id TEXT,
      production_code TEXT NOT NULL,
      external_printer_id TEXT NOT NULL,
      external_printer_name TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity_sent INTEGER NOT NULL,
      quantity_received INTEGER DEFAULT 0,
      quantity_rejected INTEGER DEFAULT 0,
      allowed_waste_percent REAL DEFAULT 2.0,
      unit_price REAL NOT NULL,
      setup_fee REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      rework_cost REAL DEFAULT 0,
      deduction_amount REAL DEFAULT 0,
      total_cost REAL NOT NULL,
      deposit_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'Chưa thanh toán',
      due_date TEXT NOT NULL,
      sent_at TEXT,
      received_at TEXT,
      status TEXT DEFAULT 'Đang gia công',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outsourcing_quality_checks (
      id TEXT PRIMARY KEY,
      outsourcing_order_id TEXT NOT NULL,
      outsourcing_code TEXT NOT NULL,
      external_printer_name TEXT NOT NULL,
      inspector_name TEXT NOT NULL,
      checked_quantity INTEGER NOT NULL,
      passed_quantity INTEGER NOT NULL,
      failed_quantity INTEGER NOT NULL,
      defect_type TEXT,
      responsibility TEXT,
      decision TEXT NOT NULL,
      rework_required INTEGER DEFAULT 0,
      deduction_amount REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      stock_qty REAL NOT NULL,
      min_stock_qty REAL NOT NULL,
      unit_cost REAL NOT NULL,
      supplier_name TEXT NOT NULL,
      valuation_method TEXT DEFAULT 'Bình quân gia quyền'
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      material_id TEXT NOT NULL,
      material_name TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      total_amount REAL NOT NULL,
      reference_code TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounting_vouchers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      voucher_type TEXT NOT NULL,
      book_category TEXT NOT NULL,
      payment_channel TEXT DEFAULT 'Ngân hàng',
      partner_name TEXT NOT NULL,
      reference_code TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL,
      voucher_date TEXT NOT NULL,
      reconciled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_no TEXT UNIQUE NOT NULL,
      invoice_type TEXT NOT NULL,
      order_code TEXT,
      partner_name TEXT NOT NULL,
      tax_code TEXT,
      amount_before_tax REAL NOT NULL,
      tax_rate REAL DEFAULT 8,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      issue_date TEXT NOT NULL,
      reconciled_status TEXT DEFAULT 'Đã đối chiếu'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role_name TEXT NOT NULL,
      salary_type TEXT NOT NULL,
      base_salary REAL NOT NULL,
      work_days INTEGER DEFAULT 26,
      completed_orders INTEGER DEFAULT 0,
      defect_rate REAL DEFAULT 0.8,
      total_pay REAL NOT NULL
    );
  `);
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM orders").get() as { cnt: number };
  if (row && row.cnt > 0) return;

  // 1. Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, code, name, company, phone, email, channel, total_revenue, receivable_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCustomer.run("CUS-01", "KH001", "Nguyễn Minh Hoàng", "Công ty Mỹ Phẩm LaVie", "0903112233", "hoang@lavie.vn", "Trực tiếp", 48500000, 12500000);
  insertCustomer.run("CUS-02", "KH002", "Trần Thu Thủy", "Chuỗi Trà Sữa Mộc Trà", "0918223344", "thuy@moctra.vn", "Zalo", 32800000, 5800000);
  insertCustomer.run("CUS-03", "KH003", "Lê Quốc Bảo", "Nhà Xuất Bản Tri Thức Mới", "0988776655", "bao@trithucmoi.vn", "Trực tiếp", 86400000, 21000000);
  insertCustomer.run("CUS-04", "KH004", "Phạm Hải Yến", "Shop Thời Trang Yến Nhi", "0977665544", "yennhi@shopee.vn", "Shopee", 19200000, 0);

  // 2. Quotations
  const insertQuote = db.prepare(`
    INSERT INTO quotations (
      id, code, customer_id, customer_name, product_name, product_type,
      finished_size, sheet_size, quantity, color_count, sides, paper_type,
      finishing_services, material_cost, printing_cost, internal_finishing_cost,
      external_outsourcing_cost, design_cost, shipping_cost, waste_cost,
      profit_amount, total_price, status, version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQuote.run(
    "QUO-01", "BG-2026-001", "CUS-01", "Công ty Mỹ Phẩm LaVie", "Bộ ấn phẩm ra mắt sản phẩm mới (3 sản phẩm)", "Catalogue",
    "A4 (210x297mm)", "65x86cm", 3500, 4, 2, "Couche 250g",
    "Cán màng bóng, Ép kim logo, Đóng gáy keo nhiệt",
    6200000, 3400000, 850000, 4650000, 500000, 350000, 480000, 4070000, 20500000,
    "Đã chuyển đơn hàng", 2, "2026-11-01"
  );
  insertQuote.run(
    "QUO-02", "BG-2026-002", "CUS-02", "Chuỗi Trà Sữa Mộc Trà", "Combo Hộp quà Tết & Túi giấy + Thiệp (3 sản phẩm)", "Hộp giấy",
    "Hộp giấy (20x15x8cm)", "79x109cm", 3000, 4, 1, "Ivory 350g",
    "Cán màng mờ, Ép kim logo, UV định hình, Bế khuôn, Dán hộp",
    9200000, 2800000, 1200000, 6800000, 800000, 500000, 600000, 5400000, 27300000,
    "Đã chuyển đơn hàng", 1, "2026-11-03"
  );
  insertQuote.run(
    "QUO-03", "BG-2026-003", "CUS-04", "Shop Thời Trang Yến Nhi", "Bộ nhận diện đóng gói: Túi Kraft + Tag treo + Decal (3 sản phẩm)", "Túi giấy",
    "Túi giấy (25x35x10cm)", "65x86cm", 7000, 4, 1, "Kraft 250g",
    "Cán màng mờ, Bế khuôn, Dán túi",
    5400000, 2100000, 650000, 3200000, 300000, 250000, 375000, 3068000, 15343000,
    "Chờ duyệt", 1, "2026-11-06"
  );

  // 3. Orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, code, quotation_id, customer_name, channel, product_name, specification,
      quantity, revenue, deposit_amount, paid_amount, material_cost, outsourcing_cost,
      internal_cost, shipping_cost, discount, due_date, status, design_file, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run(
    "ORD-01", "DH-2026-001", "QUO-01", "Công ty Mỹ Phẩm LaVie", "Trực tiếp",
    "Bộ ấn phẩm LaVie (Catalogue 500c + Tờ rơi 2.000c + Hộp mẫu 1.000c)", "Đơn hàng đa sản phẩm: kết hợp sản xuất nội bộ & gửi gia công ngoài",
    3500, 20500000, 10000000, 10000000, 6200000, 4650000, 2150000, 350000, 0,
    "2026-11-10", "Đang sản xuất", "catalogue_lavie_v2_final.pdf", "2026-11-01"
  );
  insertOrder.run(
    "ORD-02", "DH-2026-002", "QUO-02", "Chuỗi Trà Sữa Mộc Trà", "Zalo",
    "Combo Quà Tết Mộc Trà (1.000 Hộp cứng + 1.000 Túi giấy + 1.000 Thiệp)", "Hộp & Túi gia công ép kim/bế dán ngoài, Thiệp chúc Tết in nhanh nội bộ",
    3000, 27300000, 15000000, 21500000, 9200000, 6800000, 2900000, 500000, 300000,
    "2026-11-12", "Đang sản xuất", "hop_qua_moctra_diecut.ai", "2026-11-03"
  );
  insertOrder.run(
    "ORD-03", "DH-2026-003", null, "Nhà Xuất Bản Tri Thức Mới", "Trực tiếp",
    "Sổ tay lò xo bìa cứng 1.500 cuốn & Bookmark 3.000 cái", "Khổ A5, bìa bồi carton ép kim ngoài, ruột & bookmark in nội bộ",
    4500, 34500000, 15000000, 34500000, 11400000, 7200000, 3800000, 600000, 500000,
    "2026-11-08", "Hoàn thành", "sotay_trithuc_2026.pdf", "2026-10-28"
  );
  insertOrder.run(
    "ORD-04", "DH-2026-004", null, "Shop Thời Trang Yến Nhi", "Shopee",
    "Name card ép kim 1.000c & Sticker thank you 4.000c", "Sticker in bế nội bộ, Name card ép kim gửi Xưởng C",
    5000, 8900000, 4500000, 8900000, 2600000, 1450000, 1100000, 200000, 0,
    "2026-11-09", "Giao hàng", "namecard_sticker_yennhi.cdr", "2026-11-04"
  );

  // 4. Production Orders
  const insertProd = db.prepare(`
    INSERT INTO production_orders (
      id, code, order_id, order_code, customer_name, product_name, quantity,
      specification, assignee, machine_name, start_date, due_date, kanban_stage,
      paper_waste_percent, defect_count, defect_note, design_file, customer_approval
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProd.run(
    "PRO-01", "LSX-2026-001", "ORD-01", "DH-2026-001", "Công ty Mỹ Phẩm LaVie",
    "Catalogue 500 cuốn (32 trang) + Tờ rơi A5 2.000 tờ", 2500,
    "Tờ rơi in nội bộ; Catalogue gửi In offset Xưởng A -> Cán màng Xưởng B -> Ép kim Xưởng C -> Đóng gáy Xưởng D",
    "Phạm Văn Hùng (Quản đốc)", "Komori Lithrone G40 / Gia công ngoài", "2026-11-02", "2026-11-10",
    "QC", 3.2, 20, "Phát hiện 20 cuốn lệch màu trang bìa từ Xưởng A, đã tạo yêu cầu làm lại",
    "catalogue_lavie_v2_final.pdf", "Đã ký duyệt mẫu in thử"
  );
  insertProd.run(
    "PRO-02", "LSX-2026-002", "ORD-02", "DH-2026-002", "Chuỗi Trà Sữa Mộc Trà",
    "Hộp giấy quà Tết 1.000 hộp + Thiệp 1.000 cái", 2000,
    "Ivory 350g, in nội bộ, gửi gia công Ép kim + UV + Bế dán hộp ngoài tại Xưởng C",
    "Đặng Quốc Bảo (Tổ trưởng In)", "Heidelberg Speedmaster 74", "2026-11-04", "2026-11-12",
    "Hậu kỳ", 2.1, 5, "Hao hụt 5 tờ canh bài ép kim",
    "hop_qua_moctra_diecut.ai", "Đã duyệt bình bản CTP"
  );
  insertProd.run(
    "PRO-03", "LSX-2026-003", "ORD-03", "DH-2026-003", "Nhà Xuất Bản Tri Thức Mới",
    "Sổ tay lò xo bìa cứng 1.500 cuốn", 1500,
    "Bìa cứng bồi giấy mỹ thuật, đóng lò xo kẽm trắng",
    "Nguyễn Thị Mai (Hậu kỳ)", "Máy đóng lò xo tự động", "2026-10-29", "2026-11-08",
    "Hoàn thành", 1.8, 0, "Đạt 100% tiêu chuẩn QC",
    "sotay_trithuc_2026.pdf", "Đã duyệt mẫu"
  );
  insertProd.run(
    "PRO-04", "LSX-2026-004", "ORD-04", "DH-2026-004", "Shop Thời Trang Yến Nhi",
    "Name card ép kim & Sticker 5.000 cái", 5000,
    "In nhanh Konica Minolta C4080, bế demi Graphtec",
    "Vũ Hoàng Nam (In Kỹ Thuật Số)", "Konica Minolta AccurioPress C4080", "2026-11-05", "2026-11-09",
    "Chờ giao", 1.2, 12, "Lem mực nhẹ 12 tem ở rìa tờ in, đã bù đủ số lượng",
    "namecard_sticker_yennhi.cdr", "Đã duyệt qua Zalo"
  );

  // 5. External Printers
  const insertPrinter = db.prepare(`
    INSERT INTO external_printers (
      id, code, name, tax_code, address, contact_name, phone, zalo, email,
      service_types, machine_capacity, unit_pricing, payment_term, quality_standard,
      status, rating, on_time_rate, defect_rate, rework_rate, total_Mirror_cost, payable_balance, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPrinter.run(
    "EXT-A", "XN-001", "Xưởng In Offset Đại Phát (Xưởng A)", "0314455667",
    "KCN Tân Bình, Q. Tân Phú, TP.HCM", "Anh Tuấn (Giám đốc SX)", "0909123456", "0909123456", "kinhdoanh@daiphatprint.vn",
    "In offset 4 màu, In khổ lớn 79x109cm, Xuất kẽm CTP",
    "3 máy Mitsubishi & Komori 4 màu, 40.000 tờ/ngày",
    "In 4 màu: 350đ/lượt tờ 65x86; Kẽm CTP: 130.000đ/bản; Phụ phí gấp +15%",
    "Công nợ 15 ngày", "Tỷ lệ hao hụt cho phép <= 2%, sai lệch màu DeltaE < 2.5, lỗi in làm lại 100%",
    "Đã duyệt", 4.3, 91.5, 3.2, 4.0, 42500000, 14200000,
    "Chuyên nhận in ruột và bìa Catalogue số lượng lớn"
  );
  insertPrinter.run(
    "EXT-B", "XN-002", "Xưởng Gia Công Cán Màng & UV Minh Tâm (Xưởng B)", "0315566778",
    "Đường Bình Long, Q. Bình Tân, TP.HCM", "Chị Lan (Quản lý)", "0912345678", "0912345678", "minhtam.uv@gmail.com",
    "Cán màng bóng, Cán màng mờ, Cán màng nhung, Phủ UV định hình, UV toàn phần",
    "2 dây chuyền cán màng nhiệt tự động & 1 máy UV cục bộ, 50.000 tờ/ngày",
    "Cán bóng: 380đ/m2; Cán mờ: 420đ/m2; UV định hình: 800đ/tờ + khuôn 350.000đ",
    "Thanh toán cuối tháng", "Không bong màng, không nổi bọt khí, hao hụt <= 1%",
    "Đã duyệt", 4.8, 98.0, 0.6, 0.5, 19800000, 4800000,
    "Đúng tiến độ, chất lượng cán màng rất ổn định"
  );
  insertPrinter.run(
    "EXT-C", "XN-003", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)", "0316677889",
    "Lạc Long Quân, Q.11, TP.HCM", "Anh Phát (Kỹ thuật trưởng)", "0983456789", "0983456789", "epkimhoanggia@gmail.com",
    "Ép kim logo, Dập nổi, Dập chìm, Làm khuôn bế, Bế hộp giấy",
    "4 máy ép kim tự động & 3 máy bế ngáp/bế tự động",
    "Ép kim: 850đ/lượt + khuôn đồng 450.000đ; Bế hộp: 280đ/tờ + khuôn bế 350.000đ",
    "Đặt cọc 30%, tất toán sau 7 ngày", "Ép sắc nét, không tróc nhũ, chuẩn tay kê +-0.3mm",
    "Đã duyệt", 4.6, 94.0, 1.4, 1.8, 31200000, 9600000,
    "Mạnh về ép kim hộp quà cao cấp và bìa catalogue"
  );
  insertPrinter.run(
    "EXT-D", "XN-004", "Xưởng Đóng Sách & Hoàn Thiện Thành Công (Xưởng D)", "0317788990",
    "Lê Trọng Tấn, Q. Tân Phú, TP.HCM", "Anh Khải", "0934567890", "0934567890", "donggaythanhcong@yahoo.com",
    "Đóng sách keo nhiệt, Đóng kim giữa, Khâu chỉ bìa cứng, Dán hộp tự động",
    "Máy vô bìa keo nhiệt 6 cửa, máy gấp xếp tự động 20.000 cuốn/ngày",
    "Keo nhiệt A4: 1.600đ/cuốn; Đóng kim: 550đ/cuốn; Dán hộp: 950đ/hộp",
    "Công nợ 10 ngày", "Keo bám chắc không bung trang, gáy vuông đẹp",
    "Đã duyệt", 4.5, 93.0, 1.5, 1.2, 24600000, 6200000,
    "Đối tác đóng gáy chính cho đơn Catalogue và Sổ tay"
  );

  // 6. Outsourcing Orders
  const insertOutsource = db.prepare(`
    INSERT INTO outsourcing_orders (
      id, code, order_id, order_code, production_order_id, production_code,
      external_printer_id, external_printer_name, customer_name, product_name,
      service_type, specification, quantity_sent, quantity_received, quantity_rejected,
      allowed_waste_percent, unit_price, setup_fee, shipping_fee, rework_cost,
      deduction_amount, total_cost, deposit_amount, paid_amount, payment_status,
      due_date, sent_at, received_at, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOutsource.run(
    "OUT-01", "PGC-2026-001", "ORD-01", "DH-2026-001", "PRO-01", "LSX-2026-001",
    "EXT-A", "Xưởng In Offset Đại Phát (Xưởng A)", "Công ty Mỹ Phẩm LaVie", "Catalogue 500 cuốn (32 trang)",
    "In offset 4 màu", "In bìa C250 + ruột C150 32 trang khổ A4 theo file chuẩn màu Fogra39",
    520, 500, 20, 2.0, 4200, 520000, 180000, 240000, 240000, 2560000, 1000000, 1000000,
    "Chờ đối chiếu", "2026-11-06", "2026-11-02", "2026-11-06", "QC lỗi, cần làm lại",
    "Kho/QC kiểm tra 500 cuốn, phát hiện 20 cuốn lỗi lệch màu bìa. Yêu cầu Xưởng A in bù 20 cuốn và ghi giảm công nợ 240.000đ"
  );
  insertOutsource.run(
    "OUT-02", "PGC-2026-002", "ORD-01", "DH-2026-001", "PRO-01", "LSX-2026-001",
    "EXT-B", "Xưởng Gia Công Cán Màng & UV Minh Tâm (Xưởng B)", "Công ty Mỹ Phẩm LaVie", "Catalogue 500 cuốn (32 trang)",
    "Cán màng bóng", "Cán màng bóng mặt ngoài bìa Catalogue A4 trải (42x29.7cm)",
    510, 505, 0, 1.5, 900, 100000, 80000, 0, 0, 639000, 0, 639000,
    "Đã thanh toán đủ", "2026-11-07", "2026-11-06", "2026-11-07", "QC đạt",
    "Màng bóng đẹp, không bong mép"
  );
  insertOutsource.run(
    "OUT-03", "PGC-2026-003", "ORD-01", "DH-2026-001", "PRO-01", "LSX-2026-001",
    "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)", "Công ty Mỹ Phẩm LaVie", "Catalogue 500 cuốn (32 trang)",
    "Ép kim", "Ép kim nhũ vàng 18K logo LaVie kích thước 6x4cm giữa bìa trước",
    505, 502, 2, 1.5, 1100, 450000, 100000, 0, 0, 1105500, 300000, 300000,
    "Đã đặt cọc", "2026-11-08", "2026-11-07", "2026-11-08", "Đã nhập kho",
    "Khuôn đồng sắc nét, giao đúng hẹn"
  );
  insertOutsource.run(
    "OUT-04", "PGC-2026-004", "ORD-01", "DH-2026-001", "PRO-01", "LSX-2026-001",
    "EXT-D", "Xưởng Đóng Sách & Hoàn Thiện Thành Công (Xưởng D)", "Công ty Mỹ Phẩm LaVie", "Catalogue 500 cuốn (32 trang)",
    "Đóng sách", "Bắt cuốn 32 trang + vô bìa keo nhiệt PUR + xén 3 mặt thành phẩm A4",
    500, 480, 0, 1.0, 1600, 150000, 100000, 0, 0, 1050000, 0, 0,
    "Chưa thanh toán", "2026-11-09", "2026-11-08", null, "Đang gia công",
    "Đã đóng xong 480 cuốn đạt chuẩn, chờ 20 bìa làm lại từ Xưởng A chuyển sang"
  );
  insertOutsource.run(
    "OUT-05", "PGC-2026-005", "ORD-02", "DH-2026-002", "PRO-02", "LSX-2026-002",
    "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)", "Chuỗi Trà Sữa Mộc Trà", "Hộp giấy quà Tết 1.000 hộp",
    "Ép kim & Bế hộp", "Ép kim hoa mai vàng + Bế nổi họa tiết + Dán thành phẩm hộp 20x15x8cm",
    1030, 0, 0, 2.5, 5800, 650000, 250000, 0, 0, 6874000, 2000000, 2000000,
    "Đã đặt cọc", "2026-11-11", "2026-11-06", null, "Đã giao xưởng ngoài",
    "Đã bàn giao đủ 1.030 tờ in Ivory 350g đã cán màng mờ và khuôn mẫu chuẩn"
  );

  // 7. Outsourcing QC Checks
  const insertQc = db.prepare(`
    INSERT INTO outsourcing_quality_checks (
      id, outsourcing_order_id, outsourcing_code, external_printer_name,
      inspector_name, checked_quantity, passed_quantity, failed_quantity,
      defect_type, responsibility, decision, rework_required, deduction_amount, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQc.run(
    "QC-01", "OUT-01", "PGC-2026-001", "Xưởng In Offset Đại Phát (Xưởng A)",
    "Lê Hoàng Minh (Trưởng QC)", 500, 480, 20,
    "Sai màu / Lệch màu", "Xưởng ngoài", "Yêu cầu làm lại & Trừ công nợ", 1, 240000,
    "20 bộ bìa bị dư mực Magenta làm ám đỏ tone da người mẫu. Xưởng A xác nhận lỗi canh mực và đồng ý làm lại + khấu trừ 240.000đ",
    "2026-11-06 15:30"
  );
  insertQc.run(
    "QC-02", "OUT-02", "PGC-2026-002", "Xưởng Gia Công Cán Màng & UV Minh Tâm (Xưởng B)",
    "Lê Hoàng Minh (Trưởng QC)", 505, 505, 0,
    "Không có lỗi", "Không phát sinh", "Chấp nhận nhập kho", 0, 0,
    "Cán màng bóng đều, độ bám tốt, đủ số lượng dự phòng",
    "2026-11-07 10:15"
  );
  insertQc.run(
    "QC-03", "OUT-03", "PGC-2026-003", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    "Lê Hoàng Minh (Trưởng QC)", 502, 500, 2,
    "Lệch tay kê nhẹ (trong ngưỡng hao hụt)", "Hao hụt cho phép", "Chấp nhận nhập kho", 0, 0,
    "Đạt đủ 500 bìa ép kim hoàn hảo chuyển sang Xưởng D đóng cuốn",
    "2026-11-08 11:00"
  );

  // 8. Warehouse Materials
  const insertMat = db.prepare(`
    INSERT INTO materials (id, code, name, category, unit, stock_qty, min_stock_qty, unit_cost, supplier_name, valuation_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMat.run("MAT-01", "VT-G001", "Giấy Couche 250gsm khổ 65x86cm", "Giấy", "Tờ", 4200, 2000, 2800, "Công ty Giấy Tân Mai", "Bình quân gia quyền");
  insertMat.run("MAT-02", "VT-G002", "Giấy Couche 150gsm khổ 65x86cm", "Giấy", "Tờ", 8500, 3000, 1800, "Công ty Giấy Tân Mai", "Bình quân gia quyền");
  insertMat.run("MAT-03", "VT-G003", "Giấy Ivory 350gsm khổ 79x109cm", "Giấy", "Tờ", 850, 1500, 4500, "Nhà phân phối Giấy Âu Cơ", "FIFO");
  insertMat.run("MAT-04", "VT-G004", "Giấy Kraft Nhật 250gsm", "Giấy", "Tờ", 1100, 1500, 2600, "Nhà phân phối Giấy Âu Cơ", "Bình quân gia quyền");
  insertMat.run("MAT-05", "VT-M001", "Bộ Mực In Offset CMYK Toyo Ink", "Mực", "Kg", 14, 20, 285000, "Vật tư ngành in Minh Đức", "FIFO");
  insertMat.run("MAT-06", "VT-V001", "Màng BOPP Bóng & Mờ cuộn 32cm", "Vật tư", "Cuộn", 9, 6, 620000, "Vật tư ngành in Minh Đức", "Bình quân gia quyền");
  insertMat.run("MAT-07", "VT-BTP01", "Bìa Catalogue LaVie đã cán bóng & ép kim", "Bán thành phẩm", "Tờ", 480, 0, 12500, "Xưởng C bàn giao", "Thực tế đích danh");
  insertMat.run("MAT-08", "VT-TP01", "Sổ tay lò xo bìa cứng Tri Thức Mới (Đóng thùng)", "Thành phẩm", "Cuốn", 1500, 0, 15400, "Xưởng sản xuất nội bộ", "Thực tế đích danh");

  // 9. Stock Movements
  const insertMove = db.prepare(`
    INSERT INTO stock_movements (id, code, material_id, material_name, movement_type, quantity, unit, unit_cost, total_amount, reference_code, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMove.run("MOV-01", "PNK-2026-001", "MAT-01", "Giấy Couche 250gsm khổ 65x86cm", "Nhập kho mua hàng", 5000, "Tờ", 2800, 14000000, "PO-2026-01", "Nhập lô giấy Couche Tân Mai", "2026-11-01");
  insertMove.run("MOV-02", "PXK-2026-001", "MAT-01", "Giấy Couche 250gsm khổ 65x86cm", "Xuất gửi gia công ngoài", 520, "Tờ", 2800, 1456000, "PGC-2026-001", "Xuất giấy bìa giao Xưởng A in Catalogue", "2026-11-02");
  insertMove.run("MOV-03", "PXK-2026-002", "MAT-03", "Giấy Ivory 350gsm khổ 79x109cm", "Xuất cho lệnh sản xuất", 1030, "Tờ", 4500, 4635000, "LSX-2026-002", "Xuất giấy in Hộp quà Tết Mộc Trà", "2026-11-04");
  insertMove.run("MOV-04", "PNK-2026-002", "MAT-07", "Bìa Catalogue LaVie đã cán bóng & ép kim", "Nhập nhận hàng gia công", 480, "Tờ", 12500, 6000000, "PGC-2026-003", "Nhận bán thành phẩm đạt QC từ Xưởng C", "2026-11-08");

  // 10. Accounting Vouchers
  const insertVoucher = db.prepare(`
    INSERT INTO accounting_vouchers (
      id, code, voucher_type, book_category, payment_channel, partner_name,
      reference_code, description, amount, direction, voucher_date, reconciled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVoucher.run("VOU-01", "PT-2026-001", "Phiếu thu tiền khách hàng", "Sổ chi tiết doanh thu", "Ngân hàng", "Công ty Mỹ Phẩm LaVie", "DH-2026-001", "Thu đặt cọc 50% đơn in Bộ ấn phẩm LaVie", 10000000, "THU", "2026-11-01", 1);
  insertVoucher.run("VOU-02", "PT-2026-002", "Phiếu thu tiền khách hàng", "Sổ chi tiết doanh thu", "Ngân hàng", "Chuỗi Trà Sữa Mộc Trà", "DH-2026-002", "Thu đặt cọc & thanh toán đợt 1 đơn Combo Hộp quà Tết", 21500000, "THU", "2026-11-03", 1);
  insertVoucher.run("VOU-03", "PT-2026-003", "Phiếu thu tiền khách hàng", "Sổ chi tiết doanh thu", "Ngân hàng", "Nhà Xuất Bản Tri Thức Mới", "DH-2026-003", "Tất toán đơn Sổ tay lò xo & Bookmark", 34500000, "THU", "2026-11-06", 1);
  insertVoucher.run("VOU-04", "PT-2026-004", "Phiếu thu tiền khách hàng", "Sổ quỹ tiền mặt", "Tiền mặt", "Shop Thời Trang Yến Nhi", "DH-2026-004", "Thu tiền mặt đơn Name card & Sticker", 8900000, "THU", "2026-11-06", 0);
  insertVoucher.run("VOU-05", "PC-2026-001", "Phiếu chi nhà cung cấp", "Sổ vật liệu", "Ngân hàng", "Công ty Giấy Tân Mai", "PO-2026-01", "Thanh toán tiền mua giấy Couche 250g & 150g", 14000000, "CHI", "2026-11-02", 1);
  insertVoucher.run("VOU-06", "PC-2026-002", "Phiếu chi gia công ngoài", "Sổ công nợ phải trả", "Ngân hàng", "Xưởng In Offset Đại Phát (Xưởng A)", "PGC-2026-001", "Tạm ứng gia công in Catalogue LaVie", 1000000, "CHI", "2026-11-02", 1);
  insertVoucher.run("VOU-07", "PC-2026-003", "Phiếu chi gia công ngoài", "Sổ tiền gửi ngân hàng", "Ngân hàng", "Xưởng Cán Màng Minh Tâm (Xưởng B)", "PGC-2026-002", "Thanh toán 100% phiếu cán màng bóng Catalogue", 639000, "CHI", "2026-11-07", 1);
  insertVoucher.run("VOU-08", "PC-2026-004", "Phiếu chi chi phí xưởng", "Sổ chi phí", "Tiền mặt", "Điện lực Tân Phú & Vận tải Nội bộ", "CP-11-2026", "Chi tiền điện chạy máy in & xăng xe giao hàng tuần 1", 4850000, "CHI", "2026-11-05", 1);
  insertVoucher.run("VOU-09", "BT-2026-001", "Phiếu điều chỉnh giảm công nợ gia công", "Sổ công nợ phải trả", "Bút toán đối trừ", "Xưởng In Offset Đại Phát (Xưởng A)", "PGC-2026-001", "Trừ công nợ Xưởng A do lỗi lệch màu 20 cuốn Catalogue", 240000, "THU", "2026-11-06", 1);

  // 11. Invoices
  const insertInv = db.prepare(`
    INSERT INTO invoices (
      id, invoice_no, invoice_type, order_code, partner_name, tax_code,
      amount_before_tax, tax_rate, tax_amount, total_amount, issue_date, reconciled_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInv.run("INV-01", "1C26TAA-000128", "Hóa đơn bán ra", "DH-2026-003", "Nhà Xuất Bản Tri Thức Mới", "0309988776", 31944444, 8, 2555556, 34500000, "2026-11-06", "Đã đối chiếu");
  insertInv.run("INV-02", "1C26TAA-000129", "Hóa đơn bán ra", "DH-2026-002", "Chuỗi Trà Sữa Mộc Trà", "0318877665", 25277778, 8, 2022222, 27300000, "2026-11-05", "Đã đối chiếu");
  insertInv.run("INV-03", "1C26TAA-000130", "Hóa đơn bán ra", "DH-2026-004", "Shop Thời Trang Yến Nhi", "8493021122", 8240741, 8, 659259, 8900000, "2026-11-07", "Chưa đối chiếu phiếu thu");
  insertInv.run("INV-04", "HDV-2026-8821", "Hóa đơn đầu vào", "PO-2026-01", "Công ty Giấy Tân Mai", "3600254112", 12962963, 8, 1037037, 14000000, "2026-11-02", "Đã đối chiếu");

  // 12. Employees
  const insertEmp = db.prepare(`
    INSERT INTO employees (
      id, code, name, department, role_name, salary_type, base_salary, work_days, completed_orders, defect_rate, total_pay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEmp.run("EMP-01", "NV001", "Đặng Ngọc Trí", "Ban Giám Đốc", "Chủ hộ kinh doanh", "Lương quản lý", 20000000, 26, 42, 0.0, 20000000);
  insertEmp.run("EMP-02", "NV002", "Phạm Văn Hùng", "Sản xuất", "Quản đốc", "Lương cứng + Thưởng tiến độ", 15000000, 26, 38, 0.9, 17200000);
  insertEmp.run("EMP-03", "NV003", "Trần Thanh Tâm", "Kế toán", "Kế toán", "Lương cứng", 12000000, 26, 42, 0.0, 12000000);
  insertEmp.run("EMP-04", "NV004", "Lê Hoàng Bích", "Kinh doanh", "Sale", "Lương cứng + % Doanh thu", 9000000, 25, 29, 0.5, 13800000);
  insertEmp.run("EMP-05", "NV005", "Nguyễn Tuấn Kiệt", "Thiết kế & Bình bản", "Thiết kế", "Lương cứng + Sản lượng file", 11000000, 26, 35, 0.6, 12900000);
  insertEmp.run("EMP-06", "NV006", "Đặng Quốc Bảo", "Tổ máy in", "Nhân viên sản xuất", "Lương theo ca + Sản lượng", 13000000, 26, 31, 1.4, 14600000);
  insertEmp.run("EMP-07", "NV007", "Lê Hoàng Minh", "Kho & QC", "Kho", "Lương cứng + Phụ cấp QC", 10500000, 26, 40, 0.2, 11500000);
}

function seedMultiItemsIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM order_items WHERE id = 'OI-10'").get() as { cnt: number };
  if (row && row.cnt > 0) return;

  const insertQItem = db.prepare(`
    INSERT OR IGNORE INTO quotation_items (
      id, quotation_id, product_name, product_type, specification, quantity,
      execution_mode, external_printer_id, external_printer_name,
      material_cost, internal_cost, outsourcing_cost, unit_price, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // QUO-01: 3 sản phẩm (1 kết hợp, 1 nội bộ, 1 gia công ngoài)
  insertQItem.run(
    "QI-01", "QUO-01", "Catalogue 500 cuốn (32 trang)", "Catalogue",
    "Khổ A4, bìa C250 cán bóng + ép kim, ruột C150 đóng keo nhiệt", 500,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-A", "Xưởng In Offset Đại Phát (Xưởng A)",
    3800000, 1200000, 3150000, 24500, 12250000
  );
  insertQItem.run(
    "QI-02", "QUO-01", "Tờ rơi A5 giới thiệu mỹ phẩm", "Poster",
    "Khổ A5, giấy Couche 150g, in 4 màu 2 mặt tại xưởng", 2000,
    "Sản xuất nội bộ", null, null,
    1100000, 950000, 0, 1625, 3250000
  );
  insertQItem.run(
    "QI-03", "QUO-01", "Hộp giấy đựng serum mẫu thử", "Hộp giấy",
    "Ivory 300g, ép kim + bế dán trọn gói tại Xưởng C", 1000,
    "Gia công ngoài", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    1300000, 0, 1500000, 5000, 5000000
  );

  // QUO-02: 3 sản phẩm
  insertQItem.run(
    "QI-04", "QUO-02", "Hộp cứng quà Tết âm dương", "Hộp giấy",
    "Ivory 350g bồi carton, ép kim hoa mai + UV định hình", 1000,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    6200000, 1800000, 4800000, 18500, 18500000
  );
  insertQItem.run(
    "QI-05", "QUO-02", "Túi giấy đựng hộp quà Tết", "Túi giấy",
    "Giấy Couche 250g cán mờ, xỏ dây ruy băng gia công tại Xưởng D", 1000,
    "Gia công ngoài", "EXT-D", "Xưởng Đóng Sách & Hoàn Thiện Thành Công (Xưởng D)",
    2200000, 300000, 2000000, 6800, 6800000
  );
  insertQItem.run(
    "QI-06", "QUO-02", "Thiệp chúc Tết kèm phong bì", "Name card",
    "Giấy Mỹ thuật 250g, in nhanh kỹ thuật số nội bộ", 1000,
    "Sản xuất nội bộ", null, null,
    800000, 800000, 0, 2000, 2000000
  );

  // QUO-03: 3 sản phẩm
  insertQItem.run(
    "QI-07", "QUO-03", "Túi giấy Kraft thời trang", "Túi giấy",
    "Kraft Nhật 250g, in 2 màu, bế dán túi tại Xưởng D", 2000,
    "Gia công ngoài", "EXT-D", "Xưởng Đóng Sách & Hoàn Thiện Thành Công (Xưởng D)",
    3800000, 400000, 2600000, 5200, 10400000
  );
  insertQItem.run(
    "QI-08", "QUO-03", "Tag treo quần áo bế hình", "Name card",
    "Bristol 300g cán mờ, bế khuôn + đục lỗ tại Xưởng C", 2000,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    900000, 500000, 600000, 1450, 2900000
  );
  insertQItem.run(
    "QI-09", "QUO-03", "Tem nhãn Decal dán hộp", "Decal",
    "Decal giấy in nhanh + bế demi nội bộ", 3000,
    "Sản xuất nội bộ", null, null,
    700000, 650000, 0, 681, 2043000
  );

  // Order Items cho các đơn hàng hiện có
  const insertOItem = db.prepare(`
    INSERT OR IGNORE INTO order_items (
      id, order_id, order_code, product_name, product_type, specification, quantity,
      execution_mode, external_printer_id, external_printer_name,
      material_cost, internal_cost, outsourcing_cost, unit_price, total_price,
      production_code, outsourcing_code, item_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ORD-01 (DH-2026-001): 3 sản phẩm
  insertOItem.run(
    "OI-01", "ORD-01", "DH-2026-001", "Catalogue 500 cuốn (32 trang)", "Catalogue",
    "Khổ A4, bìa C250 cán bóng + ép kim, ruột C150 đóng keo nhiệt", 500,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-A", "Xưởng A / B / C / D",
    3800000, 1200000, 3150000, 24500, 12250000, "LSX-2026-001", "PGC-2026-001..004", "Đang kiểm QC"
  );
  insertOItem.run(
    "OI-02", "ORD-01", "DH-2026-001", "Tờ rơi A5 giới thiệu mỹ phẩm", "Poster",
    "Khổ A5, giấy Couche 150g, in 4 màu 2 mặt tại xưởng nội bộ", 2000,
    "Sản xuất nội bộ", null, null,
    1100000, 950000, 0, 1625, 3250000, "LSX-2026-001", null, "Hoàn thành"
  );
  insertOItem.run(
    "OI-03", "ORD-01", "DH-2026-001", "Hộp giấy đựng serum mẫu thử", "Hộp giấy",
    "Ivory 300g, ép kim + bế dán trọn gói tại Xưởng C", 1000,
    "Gia công ngoài", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    1300000, 0, 1500000, 5000, 5000000, null, "PGC-2026-003", "Đã nhập kho"
  );

  // ORD-02 (DH-2026-002): 3 sản phẩm
  insertOItem.run(
    "OI-04", "ORD-02", "DH-2026-002", "Hộp cứng quà Tết âm dương", "Hộp giấy",
    "Ivory 350g, in nội bộ, gửi gia công Ép kim + Bế dán tại Xưởng C", 1000,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    6200000, 1800000, 4800000, 18500, 18500000, "LSX-2026-002", "PGC-2026-005", "Đã giao xưởng ngoài"
  );
  insertOItem.run(
    "OI-05", "ORD-02", "DH-2026-002", "Túi giấy đựng hộp quà Tết", "Túi giấy",
    "Couche 250g cán mờ, gia công dán túi & xỏ dây tại Xưởng D", 1000,
    "Gia công ngoài", "EXT-D", "Xưởng Đóng Sách & Hoàn Thiện Thành Công (Xưởng D)",
    2200000, 300000, 2000000, 6800, 6800000, null, "PGC-2026-005", "Đang gia công"
  );
  insertOItem.run(
    "OI-06", "ORD-02", "DH-2026-002", "Thiệp chúc Tết kèm phong bì", "Name card",
    "Giấy Mỹ thuật 250g, in nhanh kỹ thuật số tại xưởng nội bộ", 1000,
    "Sản xuất nội bộ", null, null,
    800000, 800000, 0, 2000, 2000000, "LSX-2026-002", null, "Hoàn thành"
  );

  // ORD-03 (DH-2026-003): 2 sản phẩm
  insertOItem.run(
    "OI-07", "ORD-03", "DH-2026-003", "Sổ tay lò xo bìa cứng A5", "Sổ tay",
    "Bìa bồi carton ép kim Xưởng C, đóng lò xo nội bộ", 1500,
    "Kết hợp (Nội bộ + Gia công ngoài)", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    10200000, 3200000, 7200000, 21000, 31500000, "LSX-2026-003", null, "Hoàn thành"
  );
  insertOItem.run(
    "OI-08", "ORD-03", "DH-2026-003", "Bookmark kẹp sách C300 cán mờ", "Name card",
    "Couche 300g cán màng mờ 2 mặt, sản xuất 100% nội bộ", 3000,
    "Sản xuất nội bộ", null, null,
    1200000, 600000, 0, 1000, 3000000, "LSX-2026-003", null, "Hoàn thành"
  );

  // ORD-04 (DH-2026-004): 2 sản phẩm
  insertOItem.run(
    "OI-09", "ORD-04", "DH-2026-004", "Name card C300 ép kim 2 mặt", "Name card",
    "Gửi gia công ép kim nhũ vàng tại Xưởng C", 1000,
    "Gia công ngoài", "EXT-C", "Xưởng Ép Kim & Bế Khuôn Hoàng Gia (Xưởng C)",
    900000, 200000, 1450000, 3900, 3900000, null, null, "Chờ giao"
  );
  insertOItem.run(
    "OI-10", "ORD-04", "DH-2026-004", "Sticker Thank You bế demi", "Sticker",
    "In nhanh Konica C4080 & bế demi nội bộ", 4000,
    "Sản xuất nội bộ", null, null,
    1700000, 900000, 0, 1250, 5000000, "LSX-2026-004", null, "Chờ giao"
  );
}

export function getPlatformSnapshot() {
  const db = getDb();

  const customers = db.prepare("SELECT * FROM customers ORDER BY code ASC").all();
  const quotations = db.prepare("SELECT * FROM quotations ORDER BY created_at DESC, code DESC").all();
  const quotationItems = db.prepare("SELECT * FROM quotation_items ORDER BY id ASC").all();
  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC, code DESC").all();
  const orderItems = db.prepare("SELECT * FROM order_items ORDER BY id ASC").all();
  const productionOrders = db.prepare("SELECT * FROM production_orders ORDER BY code DESC").all();
  const externalPrinters = db.prepare("SELECT * FROM external_printers ORDER BY rating DESC").all();
  const outsourcingOrders = db.prepare("SELECT * FROM outsourcing_orders ORDER BY code DESC").all();
  const outsourcingQc = db.prepare("SELECT * FROM outsourcing_quality_checks ORDER BY created_at DESC").all();
  const materials = db.prepare("SELECT * FROM materials ORDER BY code ASC").all();
  const stockMovements = db.prepare("SELECT * FROM stock_movements ORDER BY created_at DESC").all();
  const accountingVouchers = db.prepare("SELECT * FROM accounting_vouchers ORDER BY voucher_date DESC, code DESC").all();
  const invoices = db.prepare("SELECT * FROM invoices ORDER BY issue_date DESC").all();
  const employees = db.prepare("SELECT * FROM employees ORDER BY code ASC").all();

  return JSON.parse(
    JSON.stringify({
      customers,
      quotations,
      quotationItems,
      orders,
      orderItems,
      productionOrders,
      externalPrinters,
      outsourcingOrders,
      outsourcingQc,
      materials,
      stockMovements,
      accountingVouchers,
      invoices,
      employees,
    })
  );
}
