import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArchive, FaEllipsisH } from 'react-icons/fa';
import { faqsPollingService } from '../../../services/faqsPolling';
import Pagination from '../../common/Pagination';

const FaqsPage = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqsData, setFaqsData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ellipsis dropdown states
  const [showEllipsisDropdown, setShowEllipsisDropdown] = useState(null);
  const ellipsisDropdownRef = useRef(null);

  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const toggleFAQ = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
    }
  };

  const toggleEllipsisDropdown = (index) => {
    setShowEllipsisDropdown(showEllipsisDropdown === index ? null : index);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ellipsisDropdownRef.current && !ellipsisDropdownRef.current.contains(event.target)) {
        setShowEllipsisDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEllipsisDropdown]);

  // Handle archiving an FAQ
  const handleArchive = async (faq_id) => {
    try {
      const response = await fetch('https://villagelink.site/backend/api/archive.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: 'faqs', id: faq_id }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove the archived FAQ from the list
        setFaqsData(prev => prev.filter(faq => faq.faq_id !== faq_id));
        setSuccessMessage('FAQ archived successfully');
        setShowSuccessModal(true);
      } else {
        alert('Failed to archive: ' + result.message);
      }
    } catch (error) {
      alert('Error archiving FAQ: ' + error.message);
    }
  };

  const startEditing = (index) => {
    setEditIndex(index);
    setEditQuestion(faqsData[index].question);
    setEditAnswer(faqsData[index].answer);
  };

  const cancelEditing = () => {
    setEditIndex(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEditing = async () => {
    if (editQuestion.trim() === '' || editAnswer.trim() === '') {
      alert('Question and Answer cannot be empty or whitespace only.');
      return;
    }
    const faqToUpdate = faqsData[editIndex];
    try {
      const response = await fetch(`https://villagelink.site/backend/api/faqs/update_faqs.php?faq_id=${faqToUpdate.faq_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          question: editQuestion,
          answer: editAnswer,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update FAQ');
      }
      const result = await response.json();
      if (result.status === 'success') {
        setFaqsData(prevFaqs => {
          const updatedFaqs = [...prevFaqs];
          updatedFaqs[editIndex] = result.data;
          return updatedFaqs;
        });
        setEditIndex(null);
        setEditQuestion('');
        setEditAnswer('');
      } else {
        throw new Error(result.message || 'Failed to update FAQ');
      }
    } catch (err) {
      alert('Error updating FAQ: ' + err.message);
    }
  };

  const startAdding = () => {
    setShowAddForm(true);
    setNewQuestion('');
    setNewAnswer('');
  };

  const cancelAdding = () => {
    setShowAddForm(false);
    setNewQuestion('');
    setNewAnswer('');
  };

  const saveAdding = async () => {
    if (newQuestion.trim() === '' || newAnswer.trim() === '') {
      alert('Question and Answer cannot be empty or whitespace only.');
      return;
    }
    try {
      const response = await fetch('https://villagelink.site/backend/api/faqs/create_faqs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          question: newQuestion,
          answer: newAnswer,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create FAQ');
      }
      const result = await response.json();
      if (result.status === 'success') {
        // Add the new FAQ to the beginning of the list
        setFaqsData(prevFaqs => [result.data, ...prevFaqs]);
        setShowAddForm(false);
        setNewQuestion('');
        setNewAnswer('');
      } else {
        throw new Error(result.message || 'Failed to create FAQ');
      }
    } catch (err) {
      alert('Error creating FAQ: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://villagelink.site/backend/api/faqs/get_faqs.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          setFaqsData(result.data);
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

      // Update the FAQ in place if it exists, otherwise add it to the beginning
      setFaqsData(prevFaqs => {
        const existingIndex = prevFaqs.findIndex(faq => faq.faq_id === newFaq.faq_id);
        if (existingIndex !== -1) {
          // Update existing FAQ
          const updatedFaqs = [...prevFaqs];
          updatedFaqs[existingIndex] = newFaq;
          return updatedFaqs;
        } else {
          // Add new FAQ to the beginning
          return [newFaq, ...prevFaqs];
        }
      });
    };

    faqsPollingService.addListener('new_faq', handleNewFaq);
    faqsPollingService.startPolling();

    return () => {
      faqsPollingService.removeListener('new_faq', handleNewFaq);
    };
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(faqsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = faqsData.slice(startIndex, endIndex);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [faqsData.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Manage FAQs</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create, update, and organize frequently asked questions for the community.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                  if (user.role === 'Admin') {
                    navigate('/spLayout/archived-faqs');
                  } else if (user.role === 'President' || user.role === 'Vice President') {
                    navigate('/Pre_VPLayout/archived-faqs');
                  } else if (user.role === 'Secretary') {
                    navigate('/SecLayout/archived-faqs');
                  } else if (user.role === 'Security') {
                    navigate('/Secu_RespoLayout/archived-faqs');
                  }
                }
              }}
              className="text-gray-600 px-4 py-3 rounded-xl hover:bg-black/50 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-lg"
              title="View Archived FAQs"
            >
              <FaArchive />
              Archived FAQs
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!showAddForm && (
            <div className="flex justify-end mb-6">
              <button
                onClick={startAdding}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-200 flex items-center "
              >
                <span className="mr-2 text-lg">+</span>
                Add New FAQ
              </button>
            </div>
          )}

          {showAddForm && (
            <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New FAQ</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-lg"
                  placeholder="Enter question"
                />
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                  rows={5}
                  placeholder="Enter answer"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={saveAdding}
                    disabled={newQuestion.trim() === '' || newAnswer.trim() === ''}
                    className={`px-6 py-3 rounded-lg shadow transition duration-200 flex items-center ${
                      newQuestion.trim() === '' || newAnswer.trim() === ''
                        ? 'bg-blue-300 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Add
                  </button>
                  <button
                    onClick={cancelAdding}
                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-400 transition duration-200 flex items-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {paginatedData.map((faq, index) => {
              const globalIndex = startIndex + index;
              return (
                <div key={faq.faq_id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {editIndex === globalIndex ? (
                    <div className="bg-yellow-50 p-6 border-l-4 border-yellow-400">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Edit FAQ</h4>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-lg"
                          placeholder="Edit question"
                        />
                        <textarea
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                          rows={5}
                          placeholder="Edit answer"
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={saveEditing}
                            disabled={editQuestion.trim() === '' || editAnswer.trim() === ''}
                            className={`px-6 py-3 rounded-lg shadow transition duration-200 flex items-center ${
                              editQuestion.trim() === '' || editAnswer.trim() === ''
                                ? 'bg-blue-300 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-400 transition duration-200 flex items-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleFAQ(globalIndex)}
                        className="w-full text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-200 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <span className="text-blue-600 mr-3 text-xl">Q:</span>
                          <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl text-blue-600 font-bold select-none">
                            {activeIndex === globalIndex ? '−' : '+'}
                          </span>
                          {activeIndex === globalIndex && (
                            <div className="relative" ref={ellipsisDropdownRef}>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleEllipsisDropdown(globalIndex); }}
                                className="px-3 py-2 bg-white text-black text-sm rounded-lg hover:bg-black/20 transition duration-200"
                              >
                                <FaEllipsisH />
                              </button>

                              {showEllipsisDropdown === globalIndex && (
                                <div className="absolute right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                  <button
                                    onClick={() => {
                                      startEditing(globalIndex);
                                      setShowEllipsisDropdown(null);
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-gray-50 border-b"
                                  >
                                    Edit FAQ
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleArchive(faq.faq_id);
                                      setShowEllipsisDropdown(null);
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-gray-50"
                                  >
                                    Archive
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${activeIndex === globalIndex ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-6 py-4 bg-white border-t border-gray-200">
                          <div className="flex items-start flex-1">
                            <span className="text-indigo-600 mr-3 text-xl mt-1">A:</span>
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="text-green-500 text-4xl mb-4">✓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Success</h3>
                <p className="text-gray-600 mb-4">{successMessage}</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FaqsPage;
