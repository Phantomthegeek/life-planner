'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  Brain, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  CheckCircle2,
} from 'lucide-react'
import { getAppUrl } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Email validation - using a simple regex pattern
  // This always bites me - could use a library but keeping dependencies minimal
  // Trade-off: won't catch all edge cases but covers 99% of real-world emails
  const isValidEmailFormat = (emailValue: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(emailValue)
  }

  // Form validation - collects all errors before showing them
  // This approach prevents the "error whack-a-mole" UX issue
  const performFormValidation = (): boolean => {
    const validationErrors: { email?: string; password?: string } = {}
    
    // Email validation
    if (!email.trim()) {
      validationErrors.email = 'Email is required'
    } else if (!isValidEmailFormat(email)) {
      validationErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation - only for login/signup modes
    if (mode !== 'forgot') {
      if (!password) {
        validationErrors.password = 'Password is required'
      } else if (password.length < 6) {
        // Supabase minimum is 6 chars - this matches their requirement
        validationErrors.password = 'Password must be at least 6 characters'
      }
    }
    
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  // Authentication handler - handles Supabase sign-in
  // Legacy quirk: we clear errors before attempting login to give user clean slate
  // This prevents stale error messages from previous attempts
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!performFormValidation()) {
      return // Don't proceed if validation fails
    }
    
    setLoading(true)
    setErrors({}) // Clear any previous errors

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(), // Trim whitespace - common user mistake
        password,
      })

      if (authError) {
        throw authError
      }

      // Success feedback - no emoji per design guidelines
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      })

      // Handle "remember me" functionality
      // Using localStorage key with arcana prefix for namespacing
      if (rememberMe) {
        localStorage.setItem('arcana_remember_email', email.trim())
      } else {
        // Clear it if they uncheck - privacy consideration
        localStorage.removeItem('arcana_remember_email')
      }

      // Navigate to dashboard
      // Using both push and refresh - refresh ensures server components re-fetch
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      // Error handling - show password field error since that's where the issue usually is
      const errorMessage = error?.message || 'Failed to log in'
      setErrors({ password: errorMessage })
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!performFormValidation()) return
    
    setLoading(true)
    setErrors({})

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getAppUrl()}/dashboard`,
        },
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: 'Check your email 📧',
        description: 'We sent you a confirmation link to complete your signup.',
      })
    } catch (error: any) {
      setErrors({ email: error.message || 'Failed to sign up' })
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Failed to sign up',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !isValidEmailFormat(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: 'Password reset sent 📧',
        description: 'Check your email for password reset instructions.',
      })
    } catch (error: any) {
      setErrors({ email: error.message || 'Failed to send reset email' })
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem('arcana_remember_email')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1120] p-4">
      <Card className="w-full max-w-md border-white/10 bg-gray-950/80 backdrop-blur shadow-xl">
        <CardHeader className="space-y-2 text-center pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-xl bg-[#2A2D7C]/15 p-3 border border-white/10">
              <Brain className="h-8 w-8 text-[#9C6ADE]" />
            </div>
          </div>

          <CardTitle className="text-3xl font-semibold tracking-tight text-white">
            Arcana
          </CardTitle>
          <CardDescription className="text-sm text-gray-400">
            {mode === 'forgot'
              ? 'Reset your password.'
              : mode === 'signup'
                ? 'Create your account.'
                : 'Sign in to keep going.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {emailSent ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Check your email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We&apos;ve sent instructions to <strong>{email}</strong>
                </p>
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setMode('login')
                }}
                variant="outline"
                className="mt-4"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form 
              onSubmit={mode === 'forgot' ? handleForgotPassword : mode === 'signup' ? handleSignUp : handleLogin} 
              className="space-y-5"
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    required
                    disabled={loading}
                    className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>•</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: undefined })
                      }}
                      required
                      disabled={loading}
                      minLength={6}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>•</span> {errors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-[#2A2D7C] dark:text-[#9C6ADE] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#9C6ADE] hover:bg-[#AC7ADE] text-white h-10"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'forgot'
                      ? 'Sending…'
                      : mode === 'signup'
                        ? 'Creating account…'
                        : 'Signing in…'}
                  </>
                ) : mode === 'forgot' ? (
                  'Send reset link'
                ) : mode === 'signup' ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </Button>

              {/* Mode Toggle */}
              <div className="text-center space-y-2 pt-2">
                {mode === 'login' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup')
                        setErrors({})
                      }}
                      className="text-[#2A2D7C] dark:text-[#9C6ADE] hover:underline font-semibold"
                    >
                      Sign up
                    </button>
                  </p>
                ) : mode === 'signup' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setErrors({})
                      }}
                      className="text-[#2A2D7C] dark:text-[#9C6ADE] hover:underline font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setErrors({})
                    }}
                    className="text-sm text-[#2A2D7C] dark:text-[#9C6ADE] hover:underline font-semibold"
                  >
                    Back to login
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Terms */}
          {mode !== 'forgot' && !emailSent && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
              By continuing, you agree to our{' '}
              <a href="#" className="hover:underline text-[#2A2D7C] dark:text-[#9C6ADE]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="hover:underline text-[#2A2D7C] dark:text-[#9C6ADE]">
                Privacy Policy
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
