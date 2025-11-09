import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import villageLinkLogo from '../../assets/villageLinkLogo.png'
import SimpleMap from '../../components/partials/SimpleMap'

const SignUpPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [blk, setBlk] = useState('')
  const [lot, setLot] = useState('')
  const [ph, setPh] = useState('')
  const [street, setStreet] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('') // New state for phone number (will include +63 prefix)
  const [coordinates, setCoordinates] = useState(null)
  const [phoneNumberError, setPhoneNumberError] = useState('') // New state for phone number error
  const [locationError, setLocationError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const role = 'Resident'

    const validatePhoneNumber = (value) => {
      // This function is no longer used for setting phoneNumber state with +63 prefix
      return value;
    }

  // Validate password on every change for live feedback
  React.useEffect(() => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (password.length === 0) {
      setPasswordError('');
      setPasswordValid(false);
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Passwords must be at least 8 characters long and include at least one uppercase letter and one special character.');
      setPasswordValid(false);
    } else {
      setPasswordError('');
      setPasswordValid(true);
    }
  }, [password]);

  const [passwordValid, setPasswordValid] = React.useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = React.useState(null); // null = no input yet, true = valid, false = invalid

  React.useEffect(() => {
    if (confirmPassword.length === 0) {
      setConfirmPasswordValid(null);
    } else if (confirmPassword === password) {
      setConfirmPasswordValid(true);
    } else {
      setConfirmPasswordValid(false);
    }
  }, [confirmPassword, password]);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return false
    }
    if (passwordError) {
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!validatePassword()) {
      setIsLoading(false)
      return
    }

    if (!coordinates) {
      setLocationError("Please select a location on the map")
      setIsLoading(false)
      return
    }
    setLocationError("")

    if (!acceptTerms) {
      alert("Please accept the terms and conditions and privacy policy")
      setIsLoading(false)
      return
    }

    const payload = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email,
      password,
      blk,
      lot,
      ph,
      street,
      subdivision: "Residencia De Muzon",
      province: "City of San Jose Del Monte Bulacan",
      phone_number: phoneNumber,
      coordinates: JSON.stringify(coordinates),
      role,
    }

    try {
      const res = await fetch(
        "https://villagelink.site/backend/api/auth/register.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Registration failed")
      }

      alert("Registration successful!")
      navigate("/login")
    } catch (err) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 shadow-sm  text-sm"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="bg-white p-4 rounded-full shadow-lg inline-block">
           <img src={villageLinkLogo} alt="VillageLink Logo" className="h-12 sm:h-16 md:h-20 w-auto" />
        </div>
        <h2 className="mt-8 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-3 text-base sm:text-lg text-gray-600 font-medium">
          Join our community and start connecting with your neighbors
        </p>
      </div>

      <div className="mt-10 flex justify-center mx-auto sm:mx-auto sm:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-7xl xl:max-w-7xl">
        <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3 py-2 bg-white/80 hover:bg-blue-500/30 rounded-md transition-colors duration-200 text-blue-600 font-semibold text-sm shadow-md"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        <div className="bg-white py-12 px-10 shadow-2xl rounded-3xl border border-gray-200 backdrop-blur-sm bg-opacity-95 relative w-full max-w-3xl lg:max-w-7xl md:max-w-xl">
          
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Personal and Address Information */}
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                        Middle Name <span className="text-gray-400 text-xs"> (optional) </span>
                      </label>
                      <input
                        id="middleName"
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address <span className="text-red-400"> * </span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div className="mt-6">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-400"> * </span>
                    </label>
                    <div className="flex items-center">
                      <span className="mr-2">+63</span>
                      <input
                        id="phoneNumber"
                        type="tel"
                        required
                        placeholder="9XX XXX XXXX"
                        maxLength="10"
                        value={phoneNumber ? phoneNumber.replace('+63', '') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          const phoneNumberDigits = value.length <= 10 ? value : value.slice(0, 10);
                          setPhoneNumber(phoneNumberDigits ? '+63' + phoneNumberDigits : '');
                          if (phoneNumberDigits && phoneNumberDigits.length !== 10) {
                            setPhoneNumberError('Phone number must be exactly 10 digits');
                          } else {
                            setPhoneNumberError('');
                          }
                        }}
                        className={inputClasses}
                      />
                      {phoneNumberError && <p className="mt-1 text-sm text-red-600">{phoneNumberError}</p>}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label htmlFor="blk" className="block text-sm font-medium text-gray-700">
                        Block <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="blk"
                        type="number"
                        value={blk}
                        onChange={(e) => setBlk(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label htmlFor="lot" className="block text-sm font-medium text-gray-700">
                        Lot <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="lot"
                        type="number"
                        value={lot}
                        onChange={(e) => setLot(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label htmlFor="ph" className="block text-sm font-medium text-gray-700">
                        Phase <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="ph"
                        type="number"
                        value={ph}
                        onChange={(e) => setPh(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                        Street <span className="text-red-400"> * </span>
                      </label>
                      <input
                        id="street"
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label htmlFor="subdivision" className="block text-sm font-medium text-gray-700 mt-3">
                        Subdivision 
                      </label>
                      <input
                        id="subdivision"
                        type="text"
                        value="Residencia De Muzon"
                        readOnly
                        className={inputClasses + " bg-gray-200 cursor-not-allowed"}
                      />
                    </div>
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-gray-700 mt-3">
                        Province
                      </label>
                      <input
                        id="province"
                        type="text"
                        value="City of San Jose Del Monte Bulacan"
                        readOnly
                        className={inputClasses + " bg-gray-200 cursor-not-allowed"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Password and Map */}
              <div className="space-y-8 mt-11">
                {/* Password */}
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-400"> * </span>
                  </label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClasses} ${passwordError ? 'ring-2 ring-red-500' : ''} ${passwordValid ? 'ring-2 ring-green-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
                </div>

                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-400"> * </span>
                  </label>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClasses} ${confirmPasswordValid === false ? 'ring-2 ring-red-500' : ''} ${confirmPasswordValid === true ? 'ring-2 ring-green-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Map */}
                <div className='w-full'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your location on the map
                  </label>
                  <div className="rounded-lg overflow-hidden border border-gray-300 shadow">
                    <SimpleMap onLocationSelect={setCoordinates} />
                  </div>
                  {locationError && <p className="mt-1 text-sm text-red-600">{locationError}</p>}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => window.open('/terms', '_blank')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Terms and Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => window.open('/privacy', '_blank')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-base font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <div className="text-center pt-6">
              <p className="text-base text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
