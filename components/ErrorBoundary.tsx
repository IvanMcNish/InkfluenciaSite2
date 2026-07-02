import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

// ─── Props & State ─────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Mensaje contextual mostrado al usuario (p.ej. "Error al cargar la galería") */
  message?: string;
  /** Callback opcional al pulsar "Reintentar" (útil para refetch o navegación) */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

// ─── Fallback UI ───────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null;
  message?: string;
  onRetry: () => void;
  onShowDetails: () => void;
  showDetails: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  message,
  onRetry,
  onShowDetails,
  showDetails,
}) => {
  const isDev = import.meta.env.DEV;

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-red-200/40 dark:border-red-900/40 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl p-8">
          
          {/* Ambient glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-400/20 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50">
              <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Algo salió mal
          </h2>

          {/* Message */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            {message ??
              'Ocurrió un error inesperado. Puedes reintentar o volver al inicio.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>

            <button
              onClick={goHome}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </button>
          </div>

          {/* Dev-only details toggle */}
          {isDev && error && (
            <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                onClick={onShowDetails}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
                {showDetails ? 'Ocultar detalles' : 'Ver detalles del error'}
              </button>

              {showDetails && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 p-3 overflow-auto max-h-40">
                  <p className="font-mono text-[11px] text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
                    {error.name}: {error.message}
                    {'\n\n'}
                    {error.stack}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-3">
          Si el problema persiste, recarga la página o contacta soporte.
        </p>
      </div>
    </div>
  );
};

// ─── ErrorBoundary class ───────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Logging estructurado — reemplaza con tu servicio de errores (Sentry, etc.)
    console.error('[ErrorBoundary] Error capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    this.props.onReset?.();
  };

  handleShowDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          message={this.props.message}
          onRetry={this.handleRetry}
          onShowDetails={this.handleShowDetails}
          showDetails={this.state.showDetails}
        />
      );
    }

    return this.props.children;
  }
}
