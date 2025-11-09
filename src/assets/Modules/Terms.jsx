import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from "lucide-react"
import villageLinkLogo from '../../assets/villageLinkLogo.png'

const Terms = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="bg-white p-4 rounded-full shadow-lg inline-block">
          <img src={villageLinkLogo} alt="VillageLink Logo" className="h-12 sm:h-16 md:h-20 w-auto" />
        </div>
        <h2 className="mt-8 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Terms and Conditions
        </h2>
        <p className="mt-3 text-base sm:text-lg text-gray-600 font-medium">
          Please read these terms carefully before using VillageLink
        </p>
      </div>

      <div className="mt-10 flex justify-center mx-auto sm:mx-auto sm:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-4xl xl:max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3 py-2 bg-white/80 hover:bg-blue-500/30 rounded-md transition-colors duration-200 text-blue-600 font-semibold text-sm shadow-md"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="bg-white py-12 px-10 shadow-2xl rounded-3xl border border-gray-200 backdrop-blur-sm bg-opacity-95 relative w-full">
          <div className="prose prose-lg max-w-none text-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing and using VillageLink, a community platform for residents of Residencia De Muzon, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Use License</h3>
            <p className="mb-4">
              Permission is granted to temporarily use VillageLink for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on VillageLink</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. User Accounts</h3>
            <p className="mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">4. Community Guidelines</h3>
            <p className="mb-4">
              Users are expected to maintain a respectful and positive community environment. Prohibited activities include harassment, spam, illegal content, and any behavior that violates local laws or community standards.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">5. Content</h3>
            <p className="mb-4">
              Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for content that you post to the service, including its legality, reliability, and appropriateness.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">6. Termination</h3>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">7. Limitation of Liability</h3>
            <p className="mb-4">
              In no event shall VillageLink or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on VillageLink.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">8. Governing Law</h3>
            <p className="mb-4">
              These terms and conditions are governed by and construed in accordance with the laws of the Philippines, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">9. Changes to Terms</h3>
            <p className="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">10. Contact Information</h3>
            <p className="mb-4">
              If you have any questions about these Terms and Conditions, please contact us at support@villagelink.site.
            </p>

            <p className="text-sm text-gray-500 mt-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
