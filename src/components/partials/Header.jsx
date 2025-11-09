import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/Logo.png';

export const Header = () => {
  return (
    <nav className="sticky top-0 w-full lg:px-16 px-6 flex flex-wrap items-center lg:py-0 py-2 bg-amber-950 shadow-md z-50">
      <div className='w-full container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 md:h-14 h-12'>
        {/* Logo Section */}
        <div className='flex items-center gap-1 sm:gap-2'>
          <Link to="/"><img src={logo} alt="VillageLink Logo" className='h-9'/></Link>
          <div><p className='text-white px-0 top-1'>VillageLink</p></div>
        </div>

        {/* Login Button */}
        <div className='flex items-center'>
          <Link 
            to="/login" 
            className="bg-yellow-400 hover:bg-yellow-500 text-amber-950 font-bold text-sm sm:text-sm py-2 px-3 rounded-full shadow-xl transition duration-300 transform hover:scale-105"
          >
            Log in
          </Link>
        </div>
      </div>
    </nav>
  )
}
