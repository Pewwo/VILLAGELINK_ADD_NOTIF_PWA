import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import villageLinkLogo from '../../assets/villageLinkLogo.png'
import bgImage from '../../assets/bg_2_logo.png'

function LogInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')   // 🔹 state for error message
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = { email, password };
    console.log("Logging in with:", payload);

    try {
      const res = await fetch(
        "https://villagelink.site/backend/api/auth/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("Login response:", data);

      // 🔹 If backend sends error in message
      if (data.error) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user) {
        // 🔹 Check if account is approved by HOA
        if (data.user.approve_status !== 'Approved') {
          setError("Waiting for the account approval by the HOA");
          return;
        }

        setError(""); // clear error if success
        localStorage.setItem('userId', data.user.acc_id);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === "Resident") {
          navigate("/reslayout");
        } else if (data.user.role === "Admin") {
          navigate("/splayout");
        } else if (data.user.role === "Developer") {
          navigate("/devlayout");
        } else if (data.user.role === "President") {
          navigate("/Pre_VPLayout");
        } else if (data.user.role === "Vice President") {
          navigate("/Pre_VPLayout");
        } else if (data.user.role === "Security") {
          navigate("/Secu_RespoLayout");
        } else if (data.user.role === "Secretary") {
          navigate("/SecLayout");
        } else {
          setError("Invalid role, please contact support.");
        }
      } else {
        setError("Invalid credentials, please try again.");
      }

    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3 py-2 bg-white/80 hover:bg-blue-500/30 rounded-md transition-colors duration-200 text-blue-600 font-semibold text-sm shadow-md"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-slate-200/30 p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl relative z-10">
        
        <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
          <img src={villageLinkLogo} alt="VillageLink Logo" className="h-12 sm:h-16 md:h-20 w-auto" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-center text-amber-950">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 text-sm sm:text-base"
              placeholder="you@example.com"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 mb-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 text-sm sm:text-base pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 top-1/3 transform -translate-y-1/2 mt-7"
            >
              {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
            </button>
          </div>

          {/* 🔹 Error Message under password */}
          {error && (
            <p className="text-red-600 text-sm pl-1">{error}</p>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 sm:py-3 sm:px-6 border border-transparent rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 font-semibold text-sm sm:text-base"
          >
            Log In
          </button>
          <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-700">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2"
            >
              Sign up here
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default LogInPage
