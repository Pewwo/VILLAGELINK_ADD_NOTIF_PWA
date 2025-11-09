import React, { useState } from 'react';
import { Send, CheckCircle, MessageSquare } from 'lucide-react';
import { feedbackPollingService } from '../../../services/feedbackPolling';

const FeedbackPageRes = (props) => {
  // Get acc_id from localStorage as in reqAndComp-Res.jsx
  const acc_id = localStorage.getItem('userId') || 1; // fallback to 1 if not found

  const [formData, setFormData] = useState({
    message: '',
  });

  const [rating, setRating] = useState(0);

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('acc_id', acc_id);
      formDataToSend.append('feedback_context', formData.message);
      formDataToSend.append('rating', rating);

      const response = await fetch('https://villagelink.site/backend/api/submit_feedback.php', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setFormData({ message: '' });
        setRating(0);
        
        // Force an immediate check for updates
        setTimeout(() => {
          console.log('User side: Triggering immediate update check after new feedback');
          feedbackPollingService.checkForUpdates();
        }, 500); // Small delay to ensure backend has processed the new feedback
      } else {
        alert('Failed to submit feedback: ' + result.message);
      }
    } catch (error) {
      alert('Error submitting feedback: ' + error.message);
    } finally {
      setIsLoading(false);
    }

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  const Star = ({ filled, onClick }) => (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      fill={filled ? "gold" : "none"}
      viewBox="0 0 24 24"
      stroke="gold"
      strokeWidth={2}
      className="w-6 h-10 cursor-pointer"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.034a1 1 0 00.95.69h7.39c.969 0 1.371 1.24.588 1.81l-5.98 4.34a1 1 0 00-.364 1.118l2.287 7.034c.3.921-.755 1.688-1.54 1.118l-5.98-4.34a1 1 0 00-1.176 0l-5.98 4.34c-.784.57-1.838-.197-1.539-1.118l2.287-7.034a1 1 0 00-.364-1.118l-5.98-4.34c-.783-.57-.38-1.81.588-1.81h7.39a1 1 0 00.95-.69l2.286-7.034z" />
    </svg>
  );

  return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mt-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Share Your Feedback</h1>
          <p className="text-gray-600 text-lg">We value your opinion and would love to hear from you</p>
        </div>

        {/* Feedback Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r  from-blue-800 to-blue-950 p-6">
            <h2 className="text-white text-xl font-semibold">Feedback Form</h2>
            <p className="text-amber-100 text-sm mt-1">Help us improve our services</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Star Rating Field */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex space-x-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    filled={star <= rating}
                    onClick={() => handleRatingChange(star)}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 select-none">Click to rate from 1 to 5 stars</p>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                  Your Feedback
                </div>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Please share your thoughts, suggestions, or concerns..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Your feedback is anonymous and will be used to improve our services.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Response time: Usually within 24-48 hours
          </p>
        </div>
      </div>
  );
};

export default FeedbackPageRes;
