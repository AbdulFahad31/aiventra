import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { AuthProvider } from "@/lib/auth-context";

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4 text-white">
          <div className="max-w-lg rounded-2xl border border-rose-300/25 bg-rose-300/10 p-6">
            <h1 className="text-xl font-bold">ForensiAI could not open the dashboard</h1>
            <p className="mt-3 text-sm text-rose-100">{this.state.error.message}</p>
            <button className="mt-5 rounded-md bg-[#dc2626] px-4 py-2 text-sm font-medium text-white" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

