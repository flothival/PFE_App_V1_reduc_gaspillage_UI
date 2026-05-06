import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "@/stores/StoreContext";
import { ThemeProvider } from "@/components/theme-provider";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </StoreProvider>
  );
}
