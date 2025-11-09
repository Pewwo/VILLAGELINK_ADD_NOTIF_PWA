import React from 'react'
import { Header } from '../../components/partials/header'
import { useNavigate } from 'react-router-dom'
import communityImage from '../../assets/Logo.png'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      {/* Hero Section */}
      <section
        id="Home"
        className="relative bg-white text-amber-950 pt-28 pb-12 px-6 sm:justify-between sm:px-8 md:px-16 flex flex-col md:flex-col-reverse md:flex-row items-center md:justify-between shadow-lg w-full max-w-full min-h-[90vh] overflow-hidden"
      >
        <div className="w-full md:w-1/2 flex justify-center px-4 opacity-30 md:px-0 mb-6 md:mb-0">
          <img src={communityImage} alt="VillageLink Community" className="w-3/4 sm:w-4/5 h-auto object-contain rounded-xl opacity-100 mix-blend-multiply mx-auto" />
        </div>
        <div className="relative w-full md:w-1/2 px-4 md:pl-8 flex flex-col items-center md:items-start z-10">
          <h1 className="pl-0 sm:pl-7 text-2xl sm:text-4xl md:text-7xl font-extrabold mb-3 leading-snug sm:leading-tight drop-shadow-lg text-center md:text-left">
            Welcome to <span className="text-yellow-700 font-extrabold">VillageLink</span>
          </h1>
          <p className="pl-0 sm:pl-7 text-base sm:text-lg md:text-2xl max-w-md sm:max-w-lg mb-5 drop-shadow-md text-center md:text-left">
            Your trusted community connection for a safe, vibrant, and thriving subdivision.
          </p>
          <div className='pl-0 sm:pl-7 flex flex-col sm:flex-row gap-4'>
            <button
              onClick={() => navigate('/signup')}
              className="bg-yellow-400 hover:bg-yellow-500 text-amber-950 font-bold text-base sm:text-lg py-3 px-6 rounded-full shadow-xl transition duration-300 transform hover:scale-105"
            >
              Sign up here
            </button>
            
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="About" className="py-1 px-4 sm:px-8 md:px-16 bg-white text-amber-950 rounded-lg shadow-lg max-w-5xl mx-auto my-12 min-h-[60vh]">
        <h2 className="text-3xl pt-8 sm:text-4xl md:text-5xl font-extrabold mb-8 text-center tracking-wide border-b-4 border-yellow-600 pb-4">About VillageLink</h2>
        <p className="text-lg pt-8 sm:text- leading-relaxed text-gray-700 text-center max-w-4xl mx-auto">
          VillageLink is a community-driven platform designed to foster communication, safety, and collaboration among the residents of our subdivision. We provide intuitive tools and reliable resources to keep everyone connected, informed, and engaged in the well-being of the community.

          Through features such as real-time updates, incident reporting, visitor logging, and emergency notifications, VillageLink ensures that vital information is accessible when it matters most. Residents can easily submit complaints, track announcements, and participate in community initiatives, all in one centralized web platform.

          By bridging the gap between residents, village officials, and emergency responders, VillageLink promotes transparency, encourages participation, and helps build a safer, more organized, and responsive neighborhood. Whether it’s staying up to date with the latest community news or quickly reporting an issue, VillageLink empowers every resident to play an active role in shaping a better living environment.
        </p>
      </section>

      {/* Contact Section */}
      <section id="ContactUs" className="py-12 px-4 sm:px-8 md:px-16 bg-white text-amber-950">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center tracking-wide">Get in Touch</h2>
        <p className="max-w-3xl mx-auto text-center mb-8 text-gray-700">
          Have questions or want to get involved? Reach out to us!
        </p>
        <form className="max-w-xl mx-auto flex flex-col gap-6">
          <input type="text" placeholder="Your Name" className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <input type="email" placeholder="Your Email" className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <textarea placeholder="Your Message" rows="4" className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
          <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-amber-950 font-bold py-3 rounded-full shadow-md transition mx-50 duration-300">
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-amber-950 text-white py-6 text-center text-sm tracking-wide">
        &copy; {new Date().getFullYear()} VillageLink. All rights reserved.
      </footer>
    </div>
  )
}

export default LandingPage
