import { Toaster } from "@/components/ui/toast";
import AdminRoutes from "@/routes/AdminRoutes";

function App() {
  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <AdminRoutes />
      <Toaster />
    </div>
  );
}

export default App;
