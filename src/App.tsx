import React, { useState, useEffect } from 'react';
import { User, CreditCard, Shirt, LogOut, UserPlus, LogIn } from 'lucide-react';
import { supabase } from './supabase';
import './App.css';

interface User {
  email: string;
  name: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

type ViewType = 'welcome' | 'signup' | 'login' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    name: ''
  });
  
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Kayıt işlemi başlatılıyor...');
      
      // Supabase Auth ile kayıt
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });
      
      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Users tablosuna kullanıcı bilgilerini ekle
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            name: signupData.name,
            credits: 100 // Başlangıç kredisi
          }]);

        if (insertError) {
          console.log('⚠️ Kullanıcı tablosuna ekleme hatası:', insertError);
        }

        console.log('✅ Kayıt başarılı:', authData.user);
        setCurrentView('login');
        setError('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      }
    } catch (error) {
      console.error('🚨 Kayıt hatası:', error);
      setError(error instanceof Error ? error.message : 'Kayıt işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Giriş işlemi başlatılıyor...');
      
      // Supabase Auth ile giriş
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      
      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.session && authData.user) {
        // Access token'ı kaydet
        localStorage.setItem('access_token', authData.session.access_token);
        
        // Kullanıcı bilgilerini al
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, credits')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.log('⚠️ Kullanıcı bilgileri alınamadı:', userError);
        }

        setUser({ 
          email: authData.user.email || loginData.email, 
          name: userData?.name || loginData.email.split('@')[0] 
        });
        setCredits(userData?.credits || 100);
        setCurrentView('dashboard');
        console.log('✅ Giriş başarılı:', authData.user);
      }
    } catch (error) {
      console.error('🚨 Giriş hatası:', error);
      setError(error instanceof Error ? error.message : 'Giriş işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleTryOn = async () => {
    if (!user) return;
    
    setTryOnLoading(true);
    setError('');

    try {
      console.log('🔄 Try-on işlemi başlatılıyor...');
      
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Access token bulunamadı. Lütfen tekrar giriş yapın.');
      }

      // Kullanıcının mevcut kredisini kontrol et
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(accessToken);
      
      if (userError || !currentUser) {
        throw new Error('Kullanıcı doğrulanamadı. Lütfen tekrar giriş yapın.');
      }

      // Kullanıcının kredi bilgisini al
      const { data: userData, error: creditError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', currentUser.id)
        .single();

      if (creditError || !userData) {
        throw new Error('Kredi bilgisi alınamadı.');
      }

      if (userData.credits <= 0) {
        setError('Krediniz yetersiz! Lütfen kredi satın alın.');
        return;
      }

      // Krediyi düş
      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: userData.credits - 1 })
        .eq('id', currentUser.id);

      if (updateError) {
        throw new Error('Kredi düşürülürken hata oluştu.');
      }

      // UI'ı güncelle
      setCredits(userData.credits - 1);
      setError('Try-on işlemi başarılı! Krediniz düşürüldü.');
      console.log('✅ Try-on başarılı, kredi düşürüldü');

    } catch (error) {
      console.error('🚨 Try-on hatası:', error);
      setError(error instanceof Error ? error.message : 'Try-on işlemi başarısız');
    } finally {
      setTryOnLoading(false);
    }
  };

  // Sayfa yüklendiğinde oturum kontrolü
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Kullanıcı bilgilerini al
        const { data: userData, error } = await supabase
          .from('users')
          .select('name, credits')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          setUser({ 
            email: session.user.email || '', 
            name: userData.name || session.user.email?.split('@')[0] || 'Kullanıcı'
          });
          setCredits(userData.credits);
          setCurrentView('dashboard');
          localStorage.setItem('access_token', session.access_token);
        }
      }
    };

    checkSession();
  }, []);

  // Logout fonksiyonu
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('access_token');
      setUser(null);
      setCredits(0);
      setCurrentView('welcome');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  // Ana render fonksiyonu
  const renderContent = () => {
    switch (currentView) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mb-8">
              <Shirt className="mx-auto mb-4 text-blue-500" size={64} />
              <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Try-On</h1>
              <p className="text-gray-600 text-lg">Kıyafetleri sanal olarak deneyin!</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('signup')}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <UserPlus size={20} />
                <span>Kayıt Ol</span>
              </button>
              
              <button
                onClick={() => setCurrentView('login')}
                className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn size={20} />
                <span>Giriş Yap</span>
              </button>
            </div>
          </div>
        );

      case 'signup':
        return (
          <div>
            <div className="text-center mb-8">
              <UserPlus className="mx-auto mb-4 text-blue-500" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Kayıt Ol</h2>
            </div>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">E-posta</label>
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Şifre</label>
                <input
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button
                onClick={() => setCurrentView('login')}
                className="text-blue-500 hover:underline"
              >
                Zaten hesabınız var mı? Giriş yapın
              </button>
            </div>
          </div>
        );

      case 'login':
        return (
          <div>
            <div className="text-center mb-8">
              <LogIn className="mx-auto mb-4 text-blue-500" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Giriş Yap</h2>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">E-posta</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Şifre</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button
                onClick={() => setCurrentView('signup')}
                className="text-blue-500 hover:underline"
              >
                Hesabınız yok mu? Kayıt olun
              </button>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div>
            <div className="text-center mb-8">
              <Shirt className="mx-auto mb-4 text-blue-500" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
              <p className="text-gray-600">Kıyafetlerinizi deneyin!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="text-blue-500" size={24} />
                  <h3 className="text-lg font-semibold">Profil</h3>
                </div>
                <p className="text-gray-600">E-posta: {user?.email}</p>
                <p className="text-gray-600">Ad: {user?.name}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="text-yellow-500" size={24} />
                  <h3 className="text-lg font-semibold">Krediler</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-500">{credits}</p>
                <p className="text-gray-600">Mevcut kredi</p>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleTryOn}
                disabled={tryOnLoading || credits <= 0}
                className="bg-green-500 text-white py-3 px-8 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
              >
                <Shirt size={20} />
                <span>
                  {tryOnLoading ? 'Try-On Yapılıyor...' : 
                   credits <= 0 ? 'Kredi Yetersiz' : 'Try-On Yap'}
                </span>
              </button>
              
              {credits <= 0 && (
                <p className="text-red-500 mt-2">Kredi satın almak için destek ile iletişime geçin.</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shirt className="text-blue-500" size={32} />
              <span className="text-xl font-bold text-gray-800">AI Try-On</span>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Merhaba, {user.name}!</span>
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold">{credits} Kredi</span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${
              error.includes('başarılı') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {error}
            </div>
          )}
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;