import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export const Login: React.FC = () => {
  const { hasPassword, login, setPassword } = useAuth();
  const [password, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (hasPassword) {
        // Login with existing password
        const success = await login(password);
        if (!success) {
          setError('Incorrect password. Please try again.');
        }
      } else {
        // Set up new password
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        await setPassword(password);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {hasPassword ? 'Welcome Back' : 'Set Up Password'}
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? 'Enter your password to access your finance tracker'
              : 'Create a password to protect your financial data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {hasPassword ? 'Password' : 'Create Password'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={hasPassword ? 'Enter your password' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            {!hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : hasPassword ? 'Login' : 'Set Password'}
            </Button>

            {!hasPassword && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Your password is stored securely in your browser. Make sure to remember it as
                it cannot be recovered.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
