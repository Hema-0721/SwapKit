import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShieldAlert } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();

  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validatePhone = () => {
    const cleanPhone = phone.trim().replace(/[^\d]/g, '');
    if (cleanPhone.length !== 10) {
      setErrors({ phone: 'Enter a valid 10-digit Indian mobile number' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateOtp = () => {
    if (otp.length !== 6 || isNaN(Number(otp))) {
      setErrors({ otp: 'Enter a valid 6-digit OTP code' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;

    setIsLoading(true);
    try {
      // Format to Indian country code
      const formattedPhone = `+91${phone.trim()}`;
      await api.post('/auth/send-otp', { phone: formattedPhone });
      setIsOtpSent(true);
      addToast('OTP sent successfully (Use 123456 in dev mode)', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to send OTP. Try again.';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setIsLoading(true);
    try {
      const formattedPhone = `+91${phone.trim()}`;
      const res = await api.post('/auth/verify-otp', {
        phone: formattedPhone,
        otp,
      });

      const { accessToken, user, isNewUser } = res.data;
      
      // Store in auth store
      setAuth(accessToken, user);
      
      // Initialize Socket connection
      connectSocket(user.id);

      addToast('Welcome to SchoolSwap!', 'success');

      // Routing hook
      if (isNewUser || !user.schoolId) {
        navigate('/onboarding');
      } else {
        navigate('/feed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Verification failed. Try again.';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl font-black text-slate-800">
            {isOtpSent ? 'Verify Mobile Number' : 'Login / Register'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isOtpSent 
              ? `Enter the 6-digit OTP code sent to +91 ${phone}` 
              : 'Verify your identity in seconds using your Indian phone number'
            }
          </p>
        </div>

        {/* Informative notice badge */}
        <div className="flex items-start gap-2.5 bg-primary-50 text-primary-700 text-xs p-3 rounded-lg border border-primary-100">
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Guarantee:</strong> We hash your phone number (SHA-256) inside our database. Plain numbers are never stored, logged, or shared with other parents.
          </span>
        </div>

        {!isOtpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <Input
              label="10-digit Indian Mobile Number"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').substring(0, 10))}
              error={errors.phone}
              disabled={isLoading}
              type="tel"
              required
            />
            <Button className="w-full py-3" type="submit" isLoading={isLoading}>
              Send Verification OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <Input
              label="6-digit Verification Code (OTP)"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, '').substring(0, 6))}
              error={errors.otp}
              disabled={isLoading}
              type="text"
              required
              helperText="For testing, use the default mock OTP: 123456"
            />
            <div className="flex flex-col gap-2">
              <Button className="w-full py-3" type="submit" isLoading={isLoading}>
                Verify & Login
              </Button>
              <Button
                variant="outline"
                className="w-full py-3"
                disabled={isLoading}
                onClick={() => setIsOtpSent(false)}
              >
                Change Phone Number
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
