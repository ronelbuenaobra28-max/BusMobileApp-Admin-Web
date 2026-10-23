import AdminLayout from "./AdminLayout";
import { PARTNER_CONSOLE } from "./console";
import { usePartnerMe } from "@/lib/partner-hooks";

/** The Partner Portal shell: the shared layout with the partner menu and the
 *  signed-in staff member's bus company under their name. */
export default function PartnerLayout() {
  const { data: me } = usePartnerMe();
  return <AdminLayout config={{ ...PARTNER_CONSOLE, subtitle: me?.operator_name }} />;
}
