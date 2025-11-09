import React, { useState, useEffect } from 'react';
import { faqsPollingService } from '../../../services/faqsPolling';
import Pagination from '../../common/Pagination';

const FaqsPageRes = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('https://villagelink.site/backend/api/faqs/get_faqs.php');
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          setFaqs(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchFaqs();

    // Setup polling for real-time updates
    const handleNewFaq = (newFaq) => {
      console.log('New/Updated FAQ received:', newFaq);
      fetchFaqs(); // Refresh the entire list
    };

    faqsPollingService.addListener('new_faq', handleNewFaq);
    faqsPollingService.startPolling();

    return () => {
      faqsPollingService.removeListener('new_faq', handleNewFaq);
    };
  }, []);

  const toggleFAQ = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate paginated data
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl text-blue-600">📋</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <span className="text-2xl text-red-600">❌</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl text-blue-600">📋</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our village community. Everything you need to know in one place.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-lg"
            />
          </div>

          <div className="space-y-4">
            {paginatedFaqs.length > 0 ? (
              paginatedFaqs.map((faq, index) => (
                <div key={faq.faq_id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-200 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-3 text-xl">Q:</span>
                      <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                    </div>
                    <span className="text-2xl text-blue-600 font-bold select-none">
                      {activeIndex === index ? '−' : '+'}
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                      <div className="flex items-start">
                        <span className="text-indigo-600 mr-3 text-xl mt-1">A:</span>
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-gray-500 text-lg">No FAQs found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        <div className="text-center">
          <p className="text-gray-600">
            Can't find what you're looking for? <br />
            You can also visit the HOA office directly for assistance with your questions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaqsPageRes;
