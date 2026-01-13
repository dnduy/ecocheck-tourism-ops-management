
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        setIsLoading(true);
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const profile = JSON.parse(jsonPayload);
        
        // Try to login with Google (using email)
        try {
          const response = await authService.login({
            email: profile.email,
            password: 'google_auth' // Placeholder
          });
          
          authService.setToken(response.token);
          authService.setCurrentUser(response.user);
          onLogin(response.user);
        } catch (err) {
          setError("Google login chưa được hỗ trợ. Vui lòng dùng Email/Password.");
        }
      } catch (e) {
        console.error("Error with Google auth:", e);
        setError("Lỗi xác thực Google");
      } finally {
        setIsLoading(false);
      }
    };

    const googleObj = (window as any).google;
    if (googleObj) {
      googleObj.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", 
        callback: handleCredentialResponse,
        auto_select: false,
      });

      googleObj.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: 280, text: "signin_with" }
      );
    }
  }, [onLogin]);

  const handleDirectEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!emailInput || !emailInput.includes('@')) {
      setError("Vui lòng nhập email hợp lệ");
      setIsLoading(false);
      return;
    }

    if (!passwordInput) {
      setError("Vui lòng nhập mật khẩu");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.login({
        email: emailInput,
        password: passwordInput
      });

      console.log('Login successful, calling onLogin with user:', response.user);
      onLogin(response.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Đăng nhập thất bại. Kiểm tra email/mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-gray-900 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck size={48} className="text-brand-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-900 tracking-tight">EcoCheck</h1>
          <p className="text-gray-500 font-medium mt-1">Hệ thống Quản trị Du lịch</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center" id="googleBtn"></div>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Hoặc</span></div>
          </div>

          {!showEmailLogin ? (
            <button 
              onClick={() => setShowEmailLogin(true)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <Mail size={18} className="mr-2 text-gray-400" />
              Đăng nhập bằng Email
            </button>
          ) : (
            <form onSubmit={handleDirectEmailLogin} className="space-y-3 animate-in slide-in-from-top-2 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setShowEmailLogin(false);
                  setError('');
                }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
              >
                Quay lại
              </button>
            </form>
          )}

          <div className="pt-2">
            <p className="text-[10px] text-gray-400 leading-relaxed italic">
              Quản lý có thể tạo tài khoản cho nhân viên trong tab Quản trị.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-8 text-brand-100/60 text-xs font-medium">© 2024 EcoCheck Operations System</p>
    </div>
  );
};
