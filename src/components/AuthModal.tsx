import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { X, Mail, Lock, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let errorMessage = '인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 로그인이 비활성화되어 있습니다. 관리자에게 문의하거나 구글 로그인을 이용해주세요.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호는 6자리 이상이어야 합니다.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error("Login failed", err);
      let errorMessage = '구글 로그인에 실패했습니다. 인증 도메인을 확인해주세요.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인 팝업이 닫혔습니다.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = '여러 개의 로그인 팝업이 열렸습니다.';
      } else if (err.message) {
        errorMessage = `로그인 실패: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="p-8 pb-6">
          <h2 className="text-2xl font-bold font-serif mb-2 text-stone-800">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
          <p className="text-stone-500 mb-6 text-sm">
            {isLogin ? '계정에 로그인하여 더 많은 기능을 사용하세요.' : '새로운 계정을 만들어 강해설교 분석 기록을 저장하세요.'}
          </p>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">이메일</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-stone-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-stone-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="비밀번호 (6자 이상)"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-stone-800 hover:bg-stone-900 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70"
            >
              <LogIn size={18} />
              {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-stone-500">또는</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="mt-6 w-full bg-white border border-stone-300 text-stone-700 font-medium py-2.5 rounded-lg hover:bg-stone-50 transition-colors flex justify-center items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 계속하기
            </button>
          </div>
        </div>
        
        <div className="bg-stone-50 p-4 text-center border-t border-stone-200">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-stone-600 hover:text-stone-900 font-medium"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
};
