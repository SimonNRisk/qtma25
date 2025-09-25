'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
    industry: ''
  })

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
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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
            <span className="text-sm font-medium text-brand-dark">Step {currentStep} of 2</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 2) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
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
                onClick={handleSubmit}
                disabled={
                  !formData.name || !formData.company || !formData.role || !formData.email || !formData.industry
                }
                className="bg-brand-blue text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
