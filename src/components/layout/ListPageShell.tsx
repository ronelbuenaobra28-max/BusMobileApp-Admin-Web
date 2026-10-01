import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

function ListPageShell({
  header,
  filters,
  children,
}: {
  header: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {header}
      {filters}
      <Card className="flex-1 overflow-auto">
        {children}
      </Card>
    </div>
  );
}

export default ListPageShell;
