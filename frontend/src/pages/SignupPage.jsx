import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useAuth } from '../context/AuthContext'

import { TASK_CATEGORIES } from '../constants/categories'

const SKILLS = TASK_CATEGORIES

const SignupPage = () => {
  const navigate = useNavigate()
  const { syncWithBackend, login } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    ngoName: '',
    email: '',
    phone: '',
    password: '',
    role: 'volunteer',
    skills: [],
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setErrorMessage('')
  }

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      skills: role === 'ngo' ? [] : prev.skills,
    }))
  }

  const handleSkillToggle = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (formData.role === 'ngo') {
      if (!formData.ngoName.trim()) {
        newErrors.ngoName = 'NGO Name is required'
      }
    } else {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full Name is required'
      }
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (
      formData.role === 'volunteer' &&
      formData.skills.length === 0
    ) {
      newErrors.skills = 'Please select at least one skill'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const displayName = formData.role === 'ngo' ? formData.ngoName : formData.fullName

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // 2. Set display name in Firebase
      await updateProfile(userCredential.user, { displayName })

      // 3. Force-refresh the Firebase ID token and persist it locally
      const token = await userCredential.user.getIdToken(true)
      localStorage.setItem('authToken', token)

      // 4. Sync with backend and save user state
      const dbUser = await syncWithBackend({
        name: displayName || 'User',
        role: formData.role,
        skills: formData.skills || [],
      })

      login(dbUser)
      const dbUserRole = dbUser?.role?.toLowerCase() || formData.role

      setSuccessMessage('Account created successfully!')

      // 5. Navigate to dashboard
      setTimeout(() => {
        const dashboardPath =
          dbUserRole === 'ngo' ? '/ngo-dashboard' : '/volunteer-dashboard'
        navigate(dashboardPath, { replace: true })
      }, 800)
    } catch (err) {
      console.error("Firebase Signup Error:", err.code, err.message);
      
      // Handle Firebase Auth errors
      const code = err.code
      let message = err.message || 'Signup failed. Please try again.';

      if (code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.'
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.'
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.'
      } else if (code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.'
      } else if (err.response?.data?.message) {
        // Backend sync error
        message = err.response.data.message
      }

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://plus.unsplash.com/premium_photo-1726837345485-7a0a7d543290?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
        }}
      >
        <div className="absolute inset-0 bg-gray-900/75" />
      </div>

      {/* Signup Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Branding */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white leading-tight">
                  Sahayogam
                </span>
                <span className="text-xs text-brand-400 font-medium -mt-1">
                  सहयोगम्
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-400 text-sm">
                Join Sahayogam and start making an impact
              </p>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-300 text-sm">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Conditional Name Input */}
              {formData.role === 'ngo' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NGO Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ngoName"
                      value={formData.ngoName}
                      onChange={handleChange}
                      placeholder="Enter NGO Name"
                      className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                        errors.ngoName
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/10'
                      }`}
                    />
                  </div>
                  {errors.ngoName && (
                    <p className="mt-1 text-sm text-red-400">{errors.ngoName}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                        errors.fullName
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/10'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                      errors.email
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                      errors.password
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10'
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Join as
                </label>
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                  {['volunteer', 'ngo'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all capitalize ${
                        formData.role === role
                          ? 'bg-brand-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills Selector - Only show for Volunteers */}
              {formData.role === 'volunteer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Skills
                    <span className="text-gray-500 font-normal ml-1">
                      (select all that apply)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                    {SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                          formData.skills.includes(skill)
                            ? 'bg-brand-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {formData.skills.includes(skill) ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : null}
                        {skill}
                      </button>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="mt-2 text-sm text-red-400">{errors.skills}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
