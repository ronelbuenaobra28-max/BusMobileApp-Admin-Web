import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { PARTNER_CONSOLE } from "./console";
import { usePartnerMe } from "@/lib/partner-hooks";

/** The Partner Portal shell: the shared layout with the partner menu and the
 *  signed-in staff member's bus company under their name. Staff still on the
 *  temporary password from an admin must choose their own first. */
export default function PartnerLayout() {
  const { data: me } = usePartnerMe();
  const queryClient = useQueryClient();
  return (
    <>
      <AdminLayout config={{ ...PARTNER_CONSOLE, subtitle: me?.operator_name }} />
      <ChangePasswordDialog
        open={!!me?.must_change_password}
        onOpenChange={() => {}}
        forced
        onChanged={() => void queryClient.invalidateQueries({ queryKey: ["partner", "me"] })}
      />
    </>
  );
}
