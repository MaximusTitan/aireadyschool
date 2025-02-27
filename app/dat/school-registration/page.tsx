'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const cities = [
  'DELHI', 'MUMBAI', 'PUNE', 'BANGALORE', 'HYDERABAD',
  'CHENNAI', 'LUCKNOW', 'VIZAG', 'VIJAYAWADA', 'BHOPAL',
  'MANGALORE', 'TRIVANDRUM'
]

const educationBoards = [
  'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'
]

export default function SchoolRegistration() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    schoolName: '',
    website: '',
    educationBoard: '',
    area: '',
    city: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // First, save data to Supabase
      const { error } = await supabase
        .from('school_registrations')
        .insert([{
          contact_person: formData.contactPerson,
          designation: formData.designation,
          email: formData.email,
          phone: formData.phone,
          school_name: formData.schoolName,
          website: formData.website,
          education_board: formData.educationBoard,
          area: formData.area,
          city: formData.city
        }])

      if (error) throw error

      // Then, send thank you email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.contactPerson,
            schoolName: formData.schoolName
          })
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      router.push(`/dat/thankyou?school=${encodeURIComponent(formData.schoolName)}`)
    } catch (error) {
      setMessage('Error submitting form. Please try again.')
      console.error('Error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm">
        {/* Keep logo centered */}
        <div className="flex justify-center mb-6">
          <div className="relative h-24 w-56">
            <Image 
              src="https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//DATlogo.avif"
              alt="DAT Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-left text-[#e42467]">School Registration</h1>
        <p className="text-gray-600 text-left mb-6">Register your school to join our AI Ready School program</p>
        
        {message && (
          <div className={`p-4 mb-6 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Single column layout with left alignment */}
          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Contact Person*</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Designation*</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Email*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Phone*</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              placeholder="10-digit number"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">School Name*</label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Website Address*</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://www.example.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Education Board*</label>
            <select
              name="educationBoard"
              value={formData.educationBoard}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            >
              <option value="">Select an education board</option>
              {educationBoards.map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">Area/Locality*</label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-medium mb-1">City*</label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e42467] focus:border-[#e42467]"
              required
            >
              <option value="">Select a city</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-2 px-4 rounded-md hover:bg-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 font-medium disabled:bg-rose-300"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
          
          <p className="text-gray-500 text-center text-xs">
            Fields marked with * are required
          </p>
        </form>
      </div>
    </div>
  )
}
