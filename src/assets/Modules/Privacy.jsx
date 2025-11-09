import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from "lucide-react"
import villageLinkLogo from '../../assets/villageLinkLogo.png'

const Privacy = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="bg-white p-4 rounded-full shadow-lg inline-block">
          <img src={villageLinkLogo} alt="VillageLink Logo" className="h-12 sm:h-16 md:h-20 w-auto" />
        </div>
        <h2 className="mt-8 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Privacy Policy
        </h2>
        <p className="mt-3 text-base sm:text-lg text-gray-600 font-medium">
          Your privacy is important to us
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h3>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>Name, email address, phone number</li>
              <li>Address information (block, lot, phase, street)</li>
              <li>Location coordinates from map selection</li>
              <li>Profile information and content you post</li>
              <li>Communications with us</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h3>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Communicate with you about products, services, offers, and events</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. Information Sharing</h3>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>With service providers who assist us in operating our platform</li>
              <li>When required by law or to protect rights and safety</li>
              <li>In connection with a business transfer or merger</li>
              <li>With your consent</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security</h3>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">5. Data Retention</h3>
            <p className="mb-4">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">6. Your Rights</h3>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>Access, update, or delete your personal information</li>
              <li>Object to or restrict certain processing of your information</li>
              <li>Data portability</li>
              <li>Withdraw consent where applicable</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">7. Cookies and Tracking</h3>
            <p className="mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie settings through your browser preferences.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">8. Third-Party Services</h3>
            <p className="mb-4">
              Our service may contain links to third-party websites or services that are not owned or controlled by us. We are not responsible for the privacy practices of these third parties.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">9. Children's Privacy</h3>
            <p className="mb-4">
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">10. Changes to This Policy</h3>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">11. Contact Us</h3>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@villagelink.site.
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

export default Privacy
