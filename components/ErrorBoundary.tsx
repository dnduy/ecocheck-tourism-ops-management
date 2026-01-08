import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100 max-w-md">
            <p className="text-sm font-bold text-red-600 mb-2">Đã xảy ra lỗi</p>
            <p className="text-gray-700 mb-4">{this.state.message || 'Đã xảy ra sự cố không mong muốn.'}</p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl font-semibold w-full"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
