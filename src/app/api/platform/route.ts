import { NextResponse } from "next/server";
import { getDb, getPlatformSnapshot } from "@/lib/db";

export async function GET() {
  try {
    const data = getPlatformSnapshot();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 }
    );
  }
}

interface IncomingQuoteItem {
  productName: string;
  productType: string;
  specification: string;
  quantity: number;
  executionMode: string;
  externalPrinterId?: string | null;
  externalPrinterName?: string | null;
  materialCost: number;
  internalCost: number;
  outsourcingCost: number;
  unitPrice: number;
  totalPrice: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    if (action === "create_quotation") {
      const countRow = db.prepare("SELECT COUNT(*) as cnt FROM quotations").get() as { cnt: number };
      const nextNum = (countRow?.cnt || 0) + 1;
      const code = `BG-2026-${String(nextNum).padStart(3, "0")}`;
      const id = `QUO-${Date.now()}`;

      const items: IncomingQuoteItem[] = Array.isArray(payload.items) ? payload.items : [];

      db.prepare(`
        INSERT INTO quotations (
          id, code, customer_name, product_name, product_type,
          finished_size, sheet_size, quantity, color_count, sides, paper_type,
          finishing_services, material_cost, printing_cost, internal_finishing_cost,
          external_outsourcing_cost, design_cost, shipping_cost, waste_cost,
          profit_amount, total_price, status, version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chờ duyệt', 1, ?)
      `).run(
        id,
        code,
        payload.customerName,
        payload.productName,
        payload.productType,
        payload.finishedSize,
        payload.sheetSize,
        Number(payload.quantity),
        Number(payload.colorCount),
        Number(payload.sides),
        payload.paperType,
        payload.finishingServices,
        Number(payload.materialCost),
        Number(payload.printingCost),
        Number(payload.internalFinishingCost),
        Number(payload.externalOutsourcingCost),
        Number(payload.designCost),
        Number(payload.shippingCost),
        Number(payload.wasteCost),
        Number(payload.profitAmount),
        Number(payload.totalPrice),
        today
      );

      const insertQItem = db.prepare(`
        INSERT INTO quotation_items (
          id, quotation_id, product_name, product_type, specification, quantity,
          execution_mode, external_printer_id, external_printer_name,
          material_cost, internal_cost, outsourcing_cost, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((item, index) => {
        insertQItem.run(
          `QI-${Date.now()}-${index}`,
          id,
          item.productName,
          item.productType,
          item.specification,
          Number(item.quantity),
          item.executionMode,
          item.externalPrinterId || null,
          item.externalPrinterName || null,
          Number(item.materialCost || 0),
          Number(item.internalCost || 0),
          Number(item.outsourcingCost || 0),
          Number(item.unitPrice || 0),
          Number(item.totalPrice || 0)
        );
      });
    } else if (action === "convert_quotation_to_order") {
      const quote = db
        .prepare("SELECT * FROM quotations WHERE id = ?")
        .get(payload.quotationId) as Record<string, unknown> | undefined;

      if (!quote) {
        return NextResponse.json({ error: "Không tìm thấy báo giá" }, { status: 404 });
      }

      const qItems = db
        .prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC")
        .all(String(quote.id)) as Record<string, unknown>[];

      const ordCount = (db.prepare("SELECT COUNT(*) as cnt FROM orders").get() as { cnt: number }).cnt + 1;
      const orderCode = `DH-2026-${String(ordCount).padStart(3, "0")}`;
      const orderId = `ORD-${Date.now()}`;
      const dueDate = payload.dueDate || "2026-11-18";

      const spec = `${quote.finished_size}, giấy ${quote.paper_type} | Gia công: ${quote.finishing_services}`;

      db.prepare(`
        INSERT INTO orders (
          id, code, quotation_id, customer_name, channel, product_name, specification,
          quantity, revenue, deposit_amount, paid_amount, material_cost, outsourcing_cost,
          internal_cost, shipping_cost, discount, due_date, status, design_file, created_at
        ) VALUES (?, ?, ?, ?, 'Trực tiếp', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, 'Đang sản xuất', 'file_thiet_ke_moi.pdf', ?)
      `).run(
        orderId,
        orderCode,
        String(quote.id),
        String(quote.customer_name),
        String(quote.product_name),
        spec,
        Number(quote.quantity),
        Number(quote.total_price),
        Math.round(Number(quote.total_price) * 0.5),
        Number(quote.material_cost),
        Number(quote.external_outsourcing_cost),
        Number(quote.printing_cost) + Number(quote.internal_finishing_cost) + Number(quote.design_cost) + Number(quote.waste_cost),
        Number(quote.shipping_cost),
        dueDate,
        today
      );

      const insertOItem = db.prepare(`
        INSERT INTO order_items (
          id, order_id, order_code, product_name, product_type, specification, quantity,
          execution_mode, external_printer_id, external_printer_name,
          material_cost, internal_cost, outsourcing_cost, unit_price, total_price,
          production_code, outsourcing_code, item_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const effectiveItems =
        qItems.length > 0
          ? qItems
          : [
              {
                product_name: quote.product_name,
                product_type: quote.product_type,
                specification: spec,
                quantity: quote.quantity,
                execution_mode:
                  Number(quote.external_outsourcing_cost) > 0
                    ? "Kết hợp (Nội bộ + Gia công ngoài)"
                    : "Sản xuất nội bộ",
                external_printer_id: Number(quote.external_outsourcing_cost) > 0 ? "EXT-A" : null,
                external_printer_name:
                  Number(quote.external_outsourcing_cost) > 0
                    ? "Xưởng In Offset Đại Phát (Xưởng A)"
                    : null,
                material_cost: quote.material_cost,
                internal_cost: Number(quote.printing_cost) + Number(quote.internal_finishing_cost),
                outsourcing_cost: quote.external_outsourcing_cost,
                unit_price: Math.round(Number(quote.total_price) / Math.max(1, Number(quote.quantity))),
                total_price: quote.total_price,
              },
            ];

      effectiveItems.forEach((item, idx) => {
        const mode = String(item.execution_mode || "Sản xuất nội bộ");
        const needsInternal =
          mode === "Sản xuất nội bộ" || mode.startsWith("Kết hợp");
        const needsOutsource =
          mode === "Gia công ngoài" || mode.startsWith("Kết hợp");

        let generatedProdId: string | null = null;
        let generatedProdCode: string | null = null;
        let generatedOutCode: string | null = null;

        if (needsInternal) {
          const prodCount =
            (db.prepare("SELECT COUNT(*) as cnt FROM production_orders").get() as { cnt: number }).cnt + 1;
          generatedProdCode = `LSX-2026-${String(prodCount).padStart(3, "0")}`;
          generatedProdId = `PRO-${Date.now()}-${idx}`;

          db.prepare(`
            INSERT INTO production_orders (
              id, code, order_id, order_code, customer_name, product_name, quantity,
              specification, assignee, machine_name, start_date, due_date, kanban_stage,
              paper_waste_percent, defect_count, defect_note, design_file, customer_approval
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Phạm Văn Hùng (Quản đốc)', 'Heidelberg / Konica Nội bộ', ?, ?, 'Chờ duyệt file', 2.0, 0, 'Khởi tạo tự động từ dòng sản phẩm đơn hàng', 'file_thiet_ke_moi.pdf', 'Chờ duyệt mẫu')
          `).run(
            generatedProdId,
            generatedProdCode,
            orderId,
            orderCode,
            String(quote.customer_name),
            String(item.product_name),
            Number(item.quantity),
            String(item.specification),
            today,
            dueDate
          );
        }

        if (needsOutsource) {
          const outCount =
            (db.prepare("SELECT COUNT(*) as cnt FROM outsourcing_orders").get() as { cnt: number }).cnt + 1;
          generatedOutCode = `PGC-2026-${String(outCount).padStart(3, "0")}`;
          const outId = `OUT-${Date.now()}-${idx}`;
          const printerId = String(item.external_printer_id || "EXT-A");
          const printerRow = db
            .prepare("SELECT * FROM external_printers WHERE id = ?")
            .get(printerId) as Record<string, unknown> | undefined;
          const printerName = printerRow
            ? String(printerRow.name)
            : String(item.external_printer_name || "Xưởng In Offset Đại Phát (Xưởng A)");

          const outCost =
            Number(item.outsourcing_cost) > 0
              ? Number(item.outsourcing_cost)
              : Math.round(Number(item.total_price) * 0.45);
          const qty = Math.max(1, Number(item.quantity));
          const unitCost = Math.round(outCost / qty);

          db.prepare(`
            INSERT INTO outsourcing_orders (
              id, code, order_id, order_code, production_order_id, production_code,
              external_printer_id, external_printer_name, customer_name, product_name,
              service_type, specification, quantity_sent, quantity_received, quantity_rejected,
              allowed_waste_percent, unit_price, setup_fee, shipping_fee, rework_cost,
              deduction_amount, total_cost, deposit_amount, paid_amount, payment_status,
              due_date, sent_at, received_at, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 2.0, ?, 0, 0, 0, 0, ?, 0, 0, 'Chưa thanh toán', ?, ?, NULL, 'Chờ duyệt', ?)
          `).run(
            outId,
            generatedOutCode,
            orderId,
            orderCode,
            generatedProdId,
            generatedProdCode || "Trực tiếp từ ĐH",
            printerId,
            printerName,
            String(quote.customer_name),
            String(item.product_name),
            mode === "Gia công ngoài" ? "Gia công trọn gói ngoài" : "Gia công công đoạn ngoài",
            String(item.specification),
            qty,
            unitCost,
            outCost,
            dueDate,
            today,
            `Tự động tạo từ sản phẩm [${item.product_name}] thuộc đơn ${orderCode}`
          );

          db.prepare(`
            UPDATE external_printers
            SET payable_balance = payable_balance + ?, total_Mirror_cost = total_Mirror_cost + ?
            WHERE id = ?
          `).run(outCost, outCost, printerId);
        }

        insertOItem.run(
          `OI-${Date.now()}-${idx}`,
          orderId,
          orderCode,
          String(item.product_name),
          String(item.product_type),
          String(item.specification),
          Number(item.quantity),
          mode,
          item.external_printer_id ? String(item.external_printer_id) : null,
          item.external_printer_name ? String(item.external_printer_name) : null,
          Number(item.material_cost || 0),
          Number(item.internal_cost || 0),
          Number(item.outsourcing_cost || 0),
          Number(item.unit_price || 0),
          Number(item.total_price || 0),
          generatedProdCode,
          generatedOutCode,
          "Mới khởi tạo"
        );
      });

      db.prepare("UPDATE quotations SET status = 'Đã chuyển đơn hàng' WHERE id = ?").run(String(quote.id));
    } else if (action === "update_kanban_stage") {
      db.prepare("UPDATE production_orders SET kanban_stage = ? WHERE id = ?").run(
        payload.kanbanStage,
        payload.productionOrderId
      );

      const prod = db
        .prepare("SELECT order_id FROM production_orders WHERE id = ?")
        .get(payload.productionOrderId) as { order_id: string } | undefined;

      if (prod) {
        if (payload.kanbanStage === "Hoàn thành") {
          db.prepare("UPDATE orders SET status = 'Hoàn thành' WHERE id = ?").run(prod.order_id);
        } else if (payload.kanbanStage === "Chờ giao") {
          db.prepare("UPDATE orders SET status = 'Giao hàng' WHERE id = ?").run(prod.order_id);
        } else if (payload.kanbanStage === "Hủy") {
          db.prepare("UPDATE orders SET status = 'Hủy' WHERE id = ?").run(prod.order_id);
        } else {
          db.prepare("UPDATE orders SET status = 'Đang sản xuất' WHERE id = ?").run(prod.order_id);
        }
      }
    } else if (action === "create_outsourcing_order") {
      const countRow = db.prepare("SELECT COUNT(*) as cnt FROM outsourcing_orders").get() as { cnt: number };
      const code = `PGC-2026-${String((countRow?.cnt || 0) + 1).padStart(3, "0")}`;
      const id = `OUT-${Date.now()}`;

      const prod = db
        .prepare("SELECT * FROM production_orders WHERE id = ?")
        .get(payload.productionOrderId) as Record<string, unknown> | undefined;
      const printer = db
        .prepare("SELECT * FROM external_printers WHERE id = ?")
        .get(payload.externalPrinterId) as Record<string, unknown> | undefined;

      if (!prod || !printer) {
        return NextResponse.json({ error: "Thiếu thông tin lệnh sản xuất hoặc xưởng ngoài" }, { status: 400 });
      }

      const qtySent = Number(payload.quantitySent) || Number(prod.quantity);
      const unitPrice = Number(payload.unitPrice) || 1500;
      const setupFee = Number(payload.setupFee) || 0;
      const shippingFee = Number(payload.shippingFee) || 0;
      const totalCost = Math.round(qtySent * unitPrice + setupFee + shippingFee);

      db.prepare(`
        INSERT INTO outsourcing_orders (
          id, code, order_id, order_code, production_order_id, production_code,
          external_printer_id, external_printer_name, customer_name, product_name,
          service_type, specification, quantity_sent, quantity_received, quantity_rejected,
          allowed_waste_percent, unit_price, setup_fee, shipping_fee, rework_cost,
          deduction_amount, total_cost, deposit_amount, paid_amount, payment_status,
          due_date, sent_at, received_at, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 2.0, ?, ?, ?, 0, 0, ?, 0, 0, 'Chưa thanh toán', ?, ?, NULL, 'Đã giao xưởng ngoài', ?)
      `).run(
        id,
        code,
        String(prod.order_id),
        String(prod.order_code),
        String(prod.id),
        String(prod.code),
        String(printer.id),
        String(printer.name),
        String(prod.customer_name),
        String(prod.product_name),
        payload.serviceType,
        payload.specification || String(prod.specification),
        qtySent,
        unitPrice,
        setupFee,
        shippingFee,
        totalCost,
        payload.dueDate || String(prod.due_date),
        today,
        payload.notes || "Phiếu gửi gia công tạo từ lệnh sản xuất"
      );

      db.prepare(`
        UPDATE external_printers
        SET payable_balance = payable_balance + ?, total_Mirror_cost = total_Mirror_cost + ?
        WHERE id = ?
      `).run(totalCost, totalCost, String(printer.id));
    } else if (action === "update_outsourcing_status") {
      db.prepare("UPDATE outsourcing_orders SET status = ? WHERE id = ?").run(
        payload.status,
        payload.outsourcingOrderId
      );
    } else if (action === "record_outsourcing_qc") {
      const outOrder = db
        .prepare("SELECT * FROM outsourcing_orders WHERE id = ?")
        .get(payload.outsourcingOrderId) as Record<string, unknown> | undefined;

      if (!outOrder) {
        return NextResponse.json({ error: "Không tìm thấy phiếu gia công" }, { status: 404 });
      }

      const checkedQty = Number(payload.checkedQuantity) || Number(outOrder.quantity_sent);
      const failedQty = Number(payload.failedQuantity) || 0;
      const passedQty = Math.max(0, checkedQty - failedQty);
      const deduction = Number(payload.deductionAmount) || 0;
      const reworkReq = payload.reworkRequired ? 1 : 0;

      const qcId = `QC-${Date.now()}`;
      db.prepare(`
        INSERT INTO outsourcing_quality_checks (
          id, outsourcing_order_id, outsourcing_code, external_printer_name,
          inspector_name, checked_quantity, passed_quantity, failed_quantity,
          defect_type, responsibility, decision, rework_required, deduction_amount, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        qcId,
        String(outOrder.id),
        String(outOrder.code),
        String(outOrder.external_printer_name),
        payload.inspectorName || "Lê Hoàng Minh (Trưởng QC)",
        checkedQty,
        passedQty,
        failedQty,
        payload.defectType || "Không có lỗi",
        payload.responsibility || "Xưởng ngoài",
        payload.decision || (failedQty > 0 ? "Yêu cầu làm lại & Trừ công nợ" : "Chấp nhận nhập kho"),
        reworkReq,
        deduction,
        payload.notes || "",
        `${today} 16:00`
      );

      const newStatus = reworkReq ? "QC lỗi, cần làm lại" : "QC đạt";
      const newPayStatus = deduction > 0 ? "Đã ghi giảm công nợ" : String(outOrder.payment_status);

      db.prepare(`
        UPDATE outsourcing_orders
        SET quantity_received = ?, quantity_rejected = ?, deduction_amount = deduction_amount + ?,
            total_cost = MAX(0, total_cost - ?), status = ?, payment_status = ?, received_at = ?
        WHERE id = ?
      `).run(
        checkedQty,
        failedQty,
        deduction,
        deduction,
        newStatus,
        newPayStatus,
        today,
        String(outOrder.id)
      );

      if (deduction > 0) {
        db.prepare(`
          UPDATE external_printers
          SET payable_balance = MAX(0, payable_balance - ?)
          WHERE id = ?
        `).run(deduction, String(outOrder.external_printer_id));

        const vCount = (db.prepare("SELECT COUNT(*) as cnt FROM accounting_vouchers").get() as { cnt: number }).cnt + 1;
        db.prepare(`
          INSERT INTO accounting_vouchers (
            id, code, voucher_type, book_category, payment_channel, partner_name,
            reference_code, description, amount, direction, voucher_date, reconciled
          ) VALUES (?, ?, 'Phiếu điều chỉnh giảm công nợ gia công', 'Sổ công nợ phải trả', 'Bút toán đối trừ', ?, ?, ?, ?, 'THU', ?, 1)
        `).run(
          `VOU-${Date.now()}`,
          `BT-2026-${String(vCount).padStart(3, "0")}`,
          String(outOrder.external_printer_name),
          String(outOrder.code),
          `Khấu trừ công nợ do lỗi QC (${failedQty} SP lỗi: ${payload.defectType})`,
          deduction,
          today
        );
      }
    } else if (action === "create_stock_movement") {
      const mat = db
        .prepare("SELECT * FROM materials WHERE id = ?")
        .get(payload.materialId) as Record<string, unknown> | undefined;
      if (!mat) {
        return NextResponse.json({ error: "Không tìm thấy vật tư" }, { status: 404 });
      }

      const qty = Number(payload.quantity) || 0;
      const isInbound = String(payload.movementType).startsWith("Nhập");
      const delta = isInbound ? qty : -qty;
      const unitCost = Number(payload.unitCost) || Number(mat.unit_cost);
      const totalAmount = Math.round(qty * unitCost);

      const mCount = (db.prepare("SELECT COUNT(*) as cnt FROM stock_movements").get() as { cnt: number }).cnt + 1;
      const prefix = isInbound ? "PNK" : "PXK";

      db.prepare(`
        INSERT INTO stock_movements (
          id, code, material_id, material_name, movement_type, quantity, unit, unit_cost, total_amount, reference_code, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `MOV-${Date.now()}`,
        `${prefix}-2026-${String(mCount).padStart(3, "0")}`,
        String(mat.id),
        String(mat.name),
        payload.movementType,
        qty,
        String(mat.unit),
        unitCost,
        totalAmount,
        payload.referenceCode || "",
        payload.note || "",
        today
      );

      db.prepare("UPDATE materials SET stock_qty = MAX(0, stock_qty + ?) WHERE id = ?").run(
        delta,
        String(mat.id)
      );
    } else if (action === "create_voucher") {
      const vCount = (db.prepare("SELECT COUNT(*) as cnt FROM accounting_vouchers").get() as { cnt: number }).cnt + 1;
      const prefix = payload.direction === "THU" ? "PT" : "PC";
      const code = `${prefix}-2026-${String(vCount).padStart(3, "0")}`;

      db.prepare(`
        INSERT INTO accounting_vouchers (
          id, code, voucher_type, book_category, payment_channel, partner_name,
          reference_code, description, amount, direction, voucher_date, reconciled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        `VOU-${Date.now()}`,
        code,
        payload.voucherType,
        payload.bookCategory,
        payload.paymentChannel || "Ngân hàng",
        payload.partnerName,
        payload.referenceCode || "",
        payload.description,
        Number(payload.amount),
        payload.direction,
        today
      );
    } else if (action === "issue_invoice") {
      const iCount = (db.prepare("SELECT COUNT(*) as cnt FROM invoices").get() as { cnt: number }).cnt + 128;
      const invoiceNo = `1C26TAA-${String(iCount).padStart(6, "0")}`;
      const amountBeforeTax = Math.round(Number(payload.totalAmount) / 1.08);
      const taxAmount = Number(payload.totalAmount) - amountBeforeTax;

      db.prepare(`
        INSERT INTO invoices (
          id, invoice_no, invoice_type, order_code, partner_name, tax_code,
          amount_before_tax, tax_rate, tax_amount, total_amount, issue_date, reconciled_status
        ) VALUES (?, ?, 'Hóa đơn bán ra', ?, ?, ?, ?, 8, ?, ?, ?, 'Đã đối chiếu')
      `).run(
        `INV-${Date.now()}`,
        invoiceNo,
        payload.orderCode,
        payload.partnerName,
        payload.taxCode || "0310009999",
        amountBeforeTax,
        taxAmount,
        Number(payload.totalAmount),
        today
      );
    }

    const updated = getPlatformSnapshot();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 500 }
    );
  }
}
