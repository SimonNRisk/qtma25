'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function Onboarding() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false)
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
    industry: ''
  })

  // Check if user is returning from LinkedIn authentication
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setLinkedinConnected(true)
      setCurrentStep(3) // Go to LinkedIn step
    }
  }, [searchParams])

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Consulting',
    'Real Estate',
    'Manufacturing',
    'Retail',
    'Other'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLinkedInConnect = async () => {
    setIsConnectingLinkedIn(true)
    try {
      const response = await fetch('http://localhost:8000/api/linkedin/auth')
      const data = await response.json()

      if (response.ok && data.auth_url) {
        window.location.href = data.auth_url
      } else {
        alert(data.detail || 'Failed to get LinkedIn authorization URL.')
      }
    } catch (err) {
      alert('Network error or backend is not running.')
      console.error(err)
    } finally {
      setIsConnectingLinkedIn(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name: formData.name,
            company: formData.company,
            role: formData.role,
            email: formData.email,
            industry: formData.industry
          }
        ])
        .select()

      if (error) {
        console.error('Error saving to Supabase:', error)
        alert('Error saving data. Please try again.')
        return
      }

      console.log('Data saved to Supabase:', data)
      alert('Onboarding complete! Your data has been saved.')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving data. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-brand-light">
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-brand-dark">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Login/Create Account */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">Welcome!</h1>
              <p className="text-gray-600">Let's get you set up with your LinkedIn content platform</p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Your Account</h2>
                <p className="text-gray-600 mb-6">Sign up to start creating amazing LinkedIn content</p>

                <button
                  onClick={handleNext}
                  className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-lg w-full"
                >
                  Continue (Skip for now)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">Tell us about yourself</h1>
              <p className="text-gray-600">This helps us personalize your experience</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full text-black p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full text-black p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role/Title *
                </label>
                <input
                  id="role"
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full text-black p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="e.g. Marketing Manager, CEO, Developer"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full text-black p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full text-black p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="">Select your industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={
                  !formData.name || !formData.company || !formData.role || !formData.email || !formData.industry
                }
                className="bg-brand-blue text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: LinkedIn Connection */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">Connect Your LinkedIn</h1>
              <p className="text-gray-600">Connect your LinkedIn account to start posting content</p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                {linkedinConnected ? (
                  <>
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">LinkedIn Connected Successfully!</h2>
                    <p className="text-gray-600 mb-6">Your LinkedIn account is now connected and ready to use.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect Your LinkedIn Account</h2>
                    <p className="text-gray-600 mb-6">
                      Authorize our app to post content on your behalf. We'll only post what you create.
                    </p>

                    <button
                      onClick={handleLinkedInConnect}
                      disabled={isConnectingLinkedIn}
                      className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg w-full"
                    >
                      {isConnectingLinkedIn ? 'Connecting...' : 'Connect with LinkedIn'}
                    </button>

                    <p className="text-sm text-gray-500 mt-4">You can skip this step and connect later if needed.</p>
                  </>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>

              <button
                onClick={handleSubmit}
                className="bg-brand-blue text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
