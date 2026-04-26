import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Building2,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Heart,
  UploadCloud,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'

const DOMAINS = [
  'Education',
  'Healthcare',
  'Environment',
  'Food Distribution',
  'Women Empowerment',
  'Child Welfare'
]

const REQUIRED_FIELDS = [
  'ngoName', 'ngoType', 'registrationNumber', 'yearOfEstablishment',
  'contactPersonName', 'phone', 'email', 'address', 'city', 'state', 'pincode',
  'missionStatement', 'aboutNgo'
]

const NGOProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  
  // Determine initial values as a plain object
  const initialValues = (() => {
    try {
      const saved = localStorage.getItem('ngoProfileDraft');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved draft', e);
    }
    return {
      ngoName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      areasOfWork: []
    };
  })();

  // Use React Hook Form with plain object for defaultValues
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: initialValues
  });

  const formValues = watch() || {};

  // Safe Data Handling: Map API/User data safely once ready
  useEffect(() => {
    if (user && !localStorage.getItem('ngoProfileDraft')) {
      reset({
        ngoName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        areasOfWork: []
      });
    }
  }, [user, reset]);

  // Add debug logs
  console.log("NGO PROFILE RENDERED");

  // Fallback condition
  if (!user) return <div>Loading...</div>;

  // Auto-save draft
  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('ngoProfileDraft', JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  // Calculate dynamic completion percentage
  const filledFields = REQUIRED_FIELDS.filter(key => {
    const val = formValues[key]
    return typeof val === 'string' ? val.trim().length > 0 : !!val
  }).length
  const completionPercent = Math.round((filledFields / REQUIRED_FIELDS.length) * 100)

  const handleNext = async () => {
    // Note: To be totally robust we could trigger react-hook-form validation for specific fields here
    // but for simplicity we rely on HTML5 validation patterns via the wrapper + step progression
    setCurrentStep(prev => Math.min(prev + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log("Submitted NGO Profile:", data)
    localStorage.removeItem('ngoProfileDraft')
    setIsSaving(false)
    navigate('/ngo-dashboard')
  }

  const handleCheckboxChange = (domain) => {
    const current = watch('areasOfWork') || []
    if (current.includes(domain)) {
      setValue('areasOfWork', current.filter(d => d !== domain), { shouldDirty: true })
    } else {
      setValue('areasOfWork', [...current, domain], { shouldDirty: true })
    }
  }

  // Animation variants
  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
  }

  try {
    return (
      <div className="min-h-screen bg-black flex flex-col">
      {/* Custom Minimal Header */}
      <div className="bg-black border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/ngo-dashboard')}
            className="flex items-center gap-2 text-zinc-400 hover:text-brand-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-zinc-50 leading-tight">Sahayogam</span>
            </div>
          </div>
          <div className="w-10 flex items-center justify-center">
            {/* Show badge if highly completed */}
            {completionPercent === 100 && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        
        {/* Progress & Stepper Header */}
        <div className="bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-800 mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-50">Complete NGO Profile</h1>
              <p className="text-sm text-zinc-400 mt-1">Provide details to verify your organization</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-brand-500">{completionPercent}%</span>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Profile Completed</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-8">
            <motion.div 
              className="h-full bg-brand-600"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Stepper Dots/Icons */}
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 -z-10" />
            
            {[
              { id: 1, icon: Building2, label: 'Organization' },
              { id: 2, icon: MapPin, label: 'Location' },
              { id: 3, icon: Users, label: 'Work' },
              { id: 4, icon: FileText, label: 'Documents' }
            ].map((step) => (
              <button 
                key={step.id}
                type="button"
                onClick={() => step.id < currentStep ? setCurrentStep(step.id) : null}
                className="flex flex-col items-center gap-2 group cursor-pointer disabled:cursor-default"
                disabled={step.id > currentStep && completionPercent < 25}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-zinc-900 ${
                  currentStep === step.id 
                    ? 'border-brand-500 text-brand-500' 
                    : step.id < currentStep 
                    ? 'border-brand-600 bg-brand-600 text-white' 
                    : 'border-zinc-700 text-zinc-500'
                }`}>
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-semibold ${currentStep >= step.id ? 'text-zinc-50' : 'text-zinc-500'}`}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Step Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ORGANIZATION */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-800"
              >
                <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-500" />
                  Organization Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">NGO Name *</label>
                    <input 
                      type="text" 
                      {...register('ngoName', { required: 'NGO Name is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors" 
                      placeholder="E.g. Helping Hands Foundation" 
                    />
                    {errors.ngoName && <p className="text-red-500 text-sm mt-1">{errors.ngoName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">NGO Type *</label>
                    <select 
                      {...register('ngoType', { required: 'Type is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors"
                    >
                      <option value="">Select organizational type</option>
                      <option value="Trust">Trust</option>
                      <option value="Society">Society</option>
                      <option value="Section 8 Company">Section 8 Company</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.ngoType && <p className="text-red-500 text-sm mt-1">{errors.ngoType.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Year of Establishment *</label>
                    <input 
                      type="number" 
                      min="1800" max={new Date().getFullYear()}
                      {...register('yearOfEstablishment', { required: 'Year is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors" 
                      placeholder="YYYY" 
                    />
                    {errors.yearOfEstablishment && <p className="text-red-500 text-sm mt-1">{errors.yearOfEstablishment.message}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Registration Number *</label>
                    <input 
                      type="text" 
                      {...register('registrationNumber', { required: 'Registration Number is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors uppercase" 
                      placeholder="Official Reg No." 
                    />
                    {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber.message}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CONTACT & LOCATION */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-800"
              >
                <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" />
                  Contact & Location
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Contact Person Name *</label>
                    <input 
                      type="text" 
                      {...register('contactPersonName', { required: 'Contact Name is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      placeholder="Full Name" 
                    />
                    {errors.contactPersonName && <p className="text-red-500 text-sm mt-1">{errors.contactPersonName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Designation</label>
                    <input 
                      type="text" 
                      {...register('designation')}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      placeholder="E.g. Director, Trustee" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Phone Number *</label>
                    <input 
                      type="tel" 
                      {...register('phone', { required: 'Phone is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      placeholder="+91" 
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      {...register('email', { required: 'Email is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      placeholder="ngo@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Address *</label>
                    <textarea 
                      rows="3"
                      {...register('address', { required: 'Address is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 resize-none" 
                      placeholder="Complete physical address..." 
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">City *</label>
                    <input 
                      type="text" 
                      {...register('city', { required: 'City is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">State *</label>
                      <input 
                        type="text" 
                        {...register('state', { required: 'State is required' })}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Pincode *</label>
                      <input 
                        type="text" 
                        {...register('pincode', { required: 'Pincode is required' })}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: WORK & MISSION */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-800"
              >
                <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-500" />
                  Work & Mission
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Mission Statement *</label>
                    <textarea 
                      rows="2"
                      {...register('missionStatement', { required: 'Mission statement is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 resize-none hover:border-zinc-700 transition-colors" 
                      placeholder="Brief one-line mission..." 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">About NGO *</label>
                    <textarea 
                      rows="4"
                      {...register('aboutNgo', { required: 'Description is required' })}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500 resize-none hover:border-zinc-700 transition-colors" 
                      placeholder="Detail the history, goals, and achievements of the organization..." 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">Areas of Work *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {DOMAINS.map(domain => {
                        const isSelected = watch('areasOfWork')?.includes(domain)
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => handleCheckboxChange(domain)}
                            className={`px-4 py-3 text-left border rounded-xl text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-brand-600 border-brand-600' : 'border-zinc-600'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              {domain}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: DOCUMENTS & VERIFICATION */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-800"
              >
                <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Documents & Verification
                </h2>
                
                <div className="space-y-6">
                  
                  {/* Mock Uploaders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-800 hover:border-brand-500 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-zinc-50 text-sm">Upload Registration Certificate</p>
                      <p className="text-xs text-zinc-400 mt-1">PDF, JPG up to 5MB</p>
                    </div>

                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-800 hover:border-brand-500 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-zinc-50 text-sm">Upload PAN Card</p>
                      <p className="text-xs text-zinc-400 mt-1">PDF, JPG up to 5MB</p>
                    </div>
                  </div>

                  <hr className="border-zinc-800 my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Website Link (Optional)</label>
                      <input 
                        type="url" 
                        {...register('website')}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                        placeholder="https://" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Social Media Link (Optional)</label>
                      <input 
                        type="url" 
                        {...register('socialMedia')}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:ring-2 focus:ring-brand-500" 
                        placeholder="Twitter, LinkedIn..." 
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Action Controls */}
          <div className="mt-8 flex items-center justify-between relative">
            <button
              type="button"
              onClick={handleBack}
              className={`px-6 py-3 font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                currentStep === 1
                  ? 'bg-transparent text-transparent select-none cursor-default'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
              disabled={currentStep === 1}
              aria-hidden={currentStep === 1}
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>

            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  /* just relying on auto-save useEffect */
                  alert("Draft saved to browser storage!")
                }}
                className="px-6 py-3 font-semibold rounded-xl text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
              >
                Complete Later
              </button>

              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="px-5 py-3 font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-500 transition-colors flex items-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  Save & Continue <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 font-bold rounded-xl text-white bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                >
                  {isSaving ? 'Submitting...' : 'Submit Profile'}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
      </div>
    )
  } catch (error) {
    console.error(error)
    return <div className="p-8 text-center text-red-500 font-medium">Error loading profile</div>
  }
}

export default NGOProfilePage
