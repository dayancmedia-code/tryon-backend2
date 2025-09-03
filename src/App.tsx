@@ .. @@
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');
 
     try {
       console.log('🔄 Kayıt işlemi başlatılıyor...');
       
       // Backend'e kayıt isteği gönder
       const response = await fetch(`${BACKEND_URL}/api/signup`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
-          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY} SUPABASE_SERVICE_KEY=${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
         },
         body: JSON.stringify({
           email: signupData.email,
           password: signupData.password,
           name: signupData.name
         })
       });
 
       console.log('📡 Backend response status:', response.status);
       
       if (response.ok) {
         const result = await response.json();
         console.log('✅ Backend kayıt başarılı:', result);
         setCurrentView('login');
         setError('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
       } else {
         const errorData = await response.json();
         console.log('❌ Backend kayıt hatası:', errorData);
         throw new Error(errorData.error || 'Kayıt işlemi başarısız');
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
       
       // Backend'e giriş isteği gönder
       const response = await fetch(`${BACKEND_URL}/api/login`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
-          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY} SUPABASE_SERVICE_KEY=${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
         },
         body: JSON.stringify({
           email: loginData.email,
           password: loginData.password
         })
       });
 
       console.log('📡 Backend login response status:', response.status);
       
       if (response.ok) {
         const result = await response.json();
         console.log('✅ Backend giriş başarılı:', result);
         
         // Access token'ı kaydet
         if (result.session?.access_token) {
           localStorage.setItem('access_token', result.session.access_token);
           setUser({ 
             email: loginData.email, 
             name: result.user?.name || loginData.email.split('@')[0] 
           });
           setCurrentView('dashboard');
         } else {
           throw new Error('Access token alınamadı');
         }
       } else {
         const errorData = await response.json();
         console.log('❌ Backend giriş hatası:', errorData);
         throw new Error(errorData.error || 'Giriş işlemi başarısız');
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
 
       // Backend'e try-on isteği gönder
       const response = await fetch(`${BACKEND_URL}/api/tryon`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
-          'Authorization': `Bearer ${accessToken} SUPABASE_SERVICE_KEY=${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
+          'Authorization': `Bearer ${accessToken}`,
         },
         body: JSON.stringify({
           token: accessToken
         })
       });
 
       console.log('📡 Backend try-on response status:', response.status);
       
       if (response.ok) {
         const result = await response.json();
         console.log('✅ Backend try-on başarılı:', result);
         
         // Krediyi düş
         setCredits(prev => Math.max(0, prev - 1));
         setError('Try-on işlemi başarılı! Krediniz düşürüldü.');
       } else if (response.status === 400) {
         const errorData = await response.json();
         console.log('❌ Kredi yetersiz:', errorData);
         setError('Krediniz yetersiz! Lütfen kredi satın alın.');
       } else {
         const errorData = await response.json();
         console.log('❌ Backend try-on hatası:', errorData);
         throw new Error(errorData.error || 'Try-on işlemi başarısız');
       }
     } catch (error) {
       console.error('🚨 Try-on hatası:', error);
       setError(error instanceof Error ? error.message : 'Try-on işlemi başarısız');
     } finally {
       setTryOnLoading(false);
     }
   };