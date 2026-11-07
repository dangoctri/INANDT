import PrintShopPlatform from "@/components/PrintShopPlatform";
import { getPlatformSnapshot } from "@/lib/db";

export default function HomePage() {
  const initialData = getPlatformSnapshot();
  return <PrintShopPlatform initialData={initialData} />;
}


