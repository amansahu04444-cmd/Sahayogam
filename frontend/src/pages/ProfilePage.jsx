import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  User,
  Mail,
  MapPin,
  BadgeCheck,
  Edit2,
  Save,
  X,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { userAPI } from '../services/api'

import { TASK_CATEGORIES } from '../constants/categories'

const ALL_SKILLS = TASK_CATEGORIES

const ProfilePage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editData, setEditData] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await userAPI.getProfile()
        if (res.data.success) {
          const userData = res.data.data
          // Normalize location field - backend may return location.address or just location string
          if (userData.location && typeof userData.location === 'object' && userData.location.address) {
            userData.location = userData.location.address
          }
          setUser(userData)
          console.log("User data loaded:", userData)
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError('Failed to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const startEditing = () => {
    setEditData({
      ...user,
      skills: Array.isArray(user?.skills)
        ? user.skills
        : user?.skills
        ? [user.skills]
        : [],
    })
    setIsEditing(true)
    setLocationError(null)
    console.log("Entering edit mode. Initial EditData:", user)
  }

  const cancelEditing = () => {
    setEditData({})
    setIsEditing(false)
  }

  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSkillToggle = (skill) => {
    setEditData((prev) => {
      // Safely ensure currentSkills is an array
      const currentSkills = Array.isArray(prev?.skills) ? prev.skills : []
      
      if (currentSkills.includes(skill)) {
        return { ...prev, skills: currentSkills.filter((s) => s !== skill) }
      } else {
        return { ...prev, skills: [...currentSkills, skill] }
      }
    })
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsDetectingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          if (data.display_name) {
            setEditData((prev) => ({
              ...prev,
              location: data.display_name,
              _latitude: latitude,
              _longitude: longitude,
            }))
          } else {
            setLocationError('Could not detect address for this location')
          }
        } catch {
          setLocationError('Failed to get address for detected location')
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access or enter manually.')
        } else {
          setLocationError('Failed to detect location. Please try again or enter manually.')
        }
        setIsDetectingLocation(false)
      }
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Ensure skills is an array before saving
      const safeSkills = Array.isArray(editData.skills)
        ? editData.skills
        : editData.skills
        ? [editData.skills]
        : [];

      console.log("Saving profile. Data to send:", { ...editData, skills: safeSkills });

      const res = await userAPI.updateProfile({
        name: editData.name,
        skills: safeSkills,
        location: editData.location,
      })
      if (res.data.success) {
        setUser(res.data.data)
        setIsEditing(false)
        setEditData({})
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (user?.role === 'ngo') {
      navigate('/ngo-dashboard')
    } else {
      navigate('/volunteer-dashboard')
    }
  }

  const displayData = isEditing ? editData : user

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-zinc-400">Loading profile...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="text-red-400 text-lg font-medium">{error || 'Failed to load profile'}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Custom Profile Header */}
      <div className="bg-black border-b border-zinc-800 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-brand-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-zinc-50 leading-tight">
                Sahayogam
              </span>
              <span className="text-xs text-brand-500 font-medium -mt-0.5">
                सहयोगम्
              </span>
            </div>
          </div>

          {/* Spacer for alignment */}
          <div className="w-10" />
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Toast */}
          {showSuccess && (
            <div className="fixed top-20 right-8 z-50 px-6 py-3 bg-green-500/10 text-green-400 border border-green-500/20 backdrop-blur-xl rounded-xl shadow-lg shadow-black/20 flex items-center gap-3">
              <Check className="w-5 h-5" />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-50">Profile</h1>
            <p className="text-zinc-400 mt-1">
              View and manage your profile information
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Profile Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-8 relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-20 h-20 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
                  <User className="w-10 h-10 text-zinc-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-50 tracking-wide">{user?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <BadgeCheck className="w-4 h-4 text-brand-400" />
                    <span className="text-brand-400 capitalize font-medium">{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              {/* Action Buttons */}
              {!isEditing ? (
                <div className="flex justify-end mb-6">
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 shadow-sm transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-3 mb-6">
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 hover:text-zinc-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 shadow-sm disabled:opacity-70 transition-all"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors placeholder-zinc-600"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <User className="w-5 h-5 text-zinc-500" />
                      <span className="text-zinc-50 font-medium">{user?.name}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors placeholder-zinc-600"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <Mail className="w-5 h-5 text-zinc-500" />
                      <span className="text-zinc-50 font-medium">{user?.email}</span>
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Role
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <BadgeCheck className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-50 capitalize font-medium">{user?.role}</span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                          type="text"
                          value={editData.location || ''}
                          onChange={(e) => handleChange('location', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-colors placeholder-zinc-600"
                          placeholder="Enter your location"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 hover:text-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDetectingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Detecting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            Use Current Location
                          </>
                        )}
                      </button>
                      {locationError && (
                        <p className="text-red-400 text-sm">{locationError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <MapPin className="w-5 h-5 text-zinc-500" />
                      <span className="text-zinc-50 font-medium">{user?.location || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Skills - Only for Volunteers */}
                {user?.role === 'volunteer' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">
                      Skills
                    </label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                        {ALL_SKILLS.map((skill) => {
                          const isSelected = Array.isArray(editData?.skills) && editData.skills.includes(skill)
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-brand-600 text-white shadow-sm'
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(user?.skills) && user.skills.length > 0 ? (
                          user.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-lg text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-sm italic">
                            {user?.skills ? (Array.isArray(user.skills) ? "No skills added" : user.skills) : "No skills added"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
