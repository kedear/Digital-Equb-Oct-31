import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthViewProps {
  onBackToHome: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBackToHome }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setLocation('');
    setError('');
    setShowSuccessMessage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      if (!email || !password || !fullName || !phone || !location) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            location: location
          }
        }
      });
      if (error) {
        setError(error.message)
      } else if (data.user) {
        setShowSuccessMessage(true);
        // Notify admin of new registration
        const { data: admins, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');
        
          if (adminError) {
              console.error('Could not find admin to notify:', adminError);
          } else if (admins && admins.length > 0) {
              const notifications = admins.map(admin => ({
                  user_id: admin.id,
                  message: `${fullName} has just registered as a new member.`,
              }));
              const { error: notificationError } = await supabase.from('notifications').insert(notifications);
              if (notificationError) {
                  console.error('Error sending notification to admin:', notificationError);
              }
          }
      }
    }
    setLoading(false);
  };
  
  const toggleAuthMode = () => {
      setIsLogin(!isLogin);
      resetForm();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-brand-dark p-4">
      <div className="w-full max-w-md bg-light-card dark:bg-brand-card rounded-lg shadow-lg p-8 border border-light-border dark:border-brand-border relative">
        <button onClick={onBackToHome} className="absolute top-4 left-4 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">&larr; Back to Home</button>
        <div className="text-center mb-6 mt-8">
            <h1 className="text-3xl font-bold text-brand-primary">ZamZam Bank</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">Digital Equb Platform</p>
        </div>

        {showSuccessMessage ? (
          <div className="text-center py-4">
            <h2 className="text-2xl font-semibold text-center mb-4 text-brand-primary">Registration Successful!</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Please check your email inbox for a confirmation link to activate your account. You can close this page.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">{isLogin ? 'Login' : 'Create Account'}</h2>
            
            {error && <p className="text-center text-sm text-brand-danger mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                        <label htmlFor="fullName" className="sr-only">Full Name</label>
                        <input id="fullName" type="text" placeholder="Hawa Sani" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="phone" className="sr-only">Phone Number</label>
                        <input id="phone" type="tel" placeholder="0912233445" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="location" className="sr-only">Location</label>
                        <input id="location" type="text" placeholder="Addis Ababa" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                    </div>
                  </>
                )}
                <div>
                    <label htmlFor="email" className="sr-only">Email</label>
                    <input id="email" type="email" placeholder="hawasani8@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                </div>
                <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-dark border border-light-border dark:border-brand-border rounded-lg p-3 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-bold py-3 mt-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait">
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
              </button>
            </form>
            <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary mt-6">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={toggleAuthMode} className="text-brand-primary font-semibold ml-1">
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};