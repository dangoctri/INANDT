import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INANDT — Nền tảng Quản lý Xưởng in & Kế toán Hộ kinh doanh (TT152/2025/TT-BTC)",
  description:
    "Hệ thống quản lý toàn diện Báo giá, Đơn hàng, Lệnh sản xuất Kanban, Gia công Xưởng in ngoài, Kho vật tư và 7 Sổ kế toán hộ kinh doanh dưới 1 tỷ đồng/năm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

