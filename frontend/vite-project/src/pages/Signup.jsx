import React, { useState,useContext } from 'react'
import {Link} from 'react-router-dom'
import {AuthContext} from '../context/AuthContext'
import {useNavigate} from 'react-router-dom'

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(null)
  const {login} = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleClick = async ()=>{
    const res = await fetch('http://localhost:3000/user/signup',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify(form)
    })
    const data = await res.json();
    if(!res.ok){
        console.log(data.message);
    }
    if(res.ok){
        console.log(data);
        login(data.email,data.token,data._id,data.name);
        navigate('/dashboard');
    }
  }

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )

  const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )

  const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )

  const fields = [
    { name: 'name', label: 'name', type: 'text', placeholder: 'e.g. john_doe', icon: <UserIcon /> },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: <MailIcon /> },
    { name: 'password', label: 'Password', type: showPassword ? 'text' : 'password', placeholder: '••••••••', icon: <LockIcon /> },
  ]

  return (
    <div className="min-h-screen bg-[#080612] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-800 rounded-full opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-violet-700 rounded-full opacity-25 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-900 rounded-full opacity-15 blur-[80px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-md">

        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-8" />

        <div className="bg-[#100d1f]/80 backdrop-blur-xl border border-purple-900/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(109,40,217,0.15)]">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-900 shadow-[0_0_24px_rgba(139,92,246,0.5)] mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
            <p className="text-purple-300/60 text-sm mt-2 font-light">Sign up to get started today</p>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            {fields.map(({ name, label, type, placeholder, icon }) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-purple-300/80 uppercase tracking-widest mb-2">
                  {label}
                </label>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focused === name
                    ? 'border-purple-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)] bg-purple-950/30'
                    : 'border-purple-900/50 bg-[#0d0b1e]/60 hover:border-purple-700/60'
                }`}>
                  <span className={`pl-4 transition-colors duration-200 ${focused === name ? 'text-purple-400' : 'text-purple-600/70'}`}>
                    {icon}
                  </span>
                  <input
                    name={name}
                    type={type}
                    value={form[name]}
                    placeholder={placeholder}
                    onChange={handleChange}
                    onFocus={() => setFocused(name)}
                    onBlur={() => setFocused(null)}
                    className="w-full bg-transparent text-white text-sm placeholder-purple-800/70 px-3 py-3.5 outline-none"
                  />
                  {name === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-4 text-purple-600/70 hover:text-purple-400 transition-colors duration-150"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Submit */}
            <button
              onClick={handleClick}
              type="button"
              className="group relative w-full mt-2 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden bg-gradient-to-r from-purple-700 to-violet-600 hover:from-purple-600 hover:to-violet-500 transition-all duration-200 shadow-[0_4px_24px_rgba(109,40,217,0.4)] hover:shadow-[0_4px_32px_rgba(139,92,246,0.55)] active:scale-[0.98]"
            >
              <span className="relative z-10 tracking-wide">Create Account</span>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-purple-900/40" />
            <span className="text-purple-700/60 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-purple-900/40" />
          </div>

          
          

          {/* Footer */}
          <p className="text-center text-purple-400/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to='/login' className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-150 underline underline-offset-2 decoration-purple-600/50 hover:decoration-purple-400">
              Login
            </Link>
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mt-8" />
      </div>
    </div>
  )
}

export default Signup