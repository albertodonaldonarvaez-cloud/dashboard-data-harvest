import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Import from "@/pages/Import";
import Sync from "./pages/Sync";
import KoboConfig from "./pages/KoboConfig";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import DataList from "./pages/DataList";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import CortadorasConfig from "./pages/CortadorasConfig";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/*"}>
        {() => (
          <ProtectedRoute>
            <Switch>
              <Route path={"/"} component={Dashboard} />
              <Route path={"/analytics"} component={Analytics} />
              <Route path={"/data"} component={DataList} />
              <Route path={"/users"} component={Users} />
              <Route path={"/cortadoras"} component={CortadorasConfig} />
              <Route path={"/change-password"} component={ChangePassword} />
              <Route path={"/settings"} component={Settings} />
              <Route path={"/import"} component={Import} />
              <Route path={"/sync"} component={Sync} />
              <Route path={"/kobo-config"} component={KoboConfig} />
              <Route path={"/404"} component={NotFound} />            </Switch>
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
