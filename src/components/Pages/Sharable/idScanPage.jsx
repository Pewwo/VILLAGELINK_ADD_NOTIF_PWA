import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, AlertCircle, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

const IDScanPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [ocrDetails, setOcrDetails] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    lastName: '',
    givenName: '',
    middleName: '',
    idNumber: '',
    address: '',
    purposeOfVisit: '',
    dateOfBirth: '',
    sex: '',
    nationality: '',
    bloodType: '',
    weight: '',
    height: '',
    eyeColor: '',
    restrictions: '',
    conditions: ''
  });

  const purposeOptions = [
    "Visiting Resident",
    "Delivery",
    "Maintenance",
    "Event",
    "Others"
  ];

  // ===== Handle Upload =====
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    runOCR(url);
    setShowOptions(false);
  };

  // ===== Camera Functions =====
  const startCamera = async () => {
    try {
      setError(null);

      console.log('Requesting camera access...');

      // Try to get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.error('Error playing video:', e));
        };
        setShowCamera(true);
      } else {
        setError('Video element not found. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera. Please check permissions and try again.');
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(imageUrl);
      runOCR(imageUrl);

      // Stop camera stream
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };



  // ===== Run OCR ===== tweek
  // Helper function to resize and compress image to max width/height while maintaining aspect ratio
  const resizeImage = (imageUrl, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxWidth && height <= maxHeight) {
          // No resizing needed, but compress anyway
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
          return;
        }
        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const runOCR = async (imageUrl) => {
    setScanning(true);
    setProgress(0);
    setError(null);

    try {
      // Resize image before OCR to improve speed and accuracy
      const resizedImageUrl = await resizeImage(imageUrl);

      // Convert resizedImageUrl to base64
      let base64Image;
      if (resizedImageUrl.startsWith('blob:')) {
        const response = await fetch(resizedImageUrl);
        const blob = await response.blob();
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else if (resizedImageUrl.startsWith('data:image')) {
        base64Image = resizedImageUrl.split(',')[1];
      } else {
        // If it's a normal URL, fetch and convert to base64
        const response = await fetch(resizedImageUrl);
        const blob = await response.blob();
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // Call OCR.space API with improved parameters for accuracy
      const apiKey = 'K88135516388957';
      const apiFormData = new FormData();
      apiFormData.append('base64Image', 'data:image/png;base64,' + base64Image);
      apiFormData.append('language', 'eng');
      apiFormData.append('isOverlayRequired', 'false');
      apiFormData.append('OCREngine', '2'); // Use latest OCR engine
      apiFormData.append('detectOrientation', 'true'); // Detect orientation for better accuracy
      apiFormData.append('scale', 'true'); // Scale image for better OCR accuracy

      console.time('OCR API Call');
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: apiKey,
        },
        body: apiFormData,
      });
      console.timeEnd('OCR API Call');

      const ocrResult = await ocrResponse.json();

      if (ocrResult.IsErroredOnProcessing) {
        console.error('OCR API Error:', ocrResult.ErrorMessage);
        throw new Error(ocrResult.ErrorMessage[0] || 'OCR processing error');
      }

      const rawText = ocrResult.ParsedResults[0].ParsedText;

      // Clean the text: normalize spaces and remove extra line breaks
      const cleanedText = rawText.replace(/\s+/g, ' ').trim();

      // Extract details using enhanced parsing to handle label-value pairs on separate lines and multi-line address
      const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

      let lastName = '';
      let givenNames = '';
      let middleName = '';
      let idNumber = '';
      let addressLines = [];
      let isAddressSection = false;

      // Detect ID type for specialized parsing
      let idType = 'generic';
      if (rawText.toUpperCase().includes('PAMBANSANG PAGKAKAKILANLAN') || rawText.toUpperCase().includes('PHILIPPINE IDENTIFICATION CARD')) {
        idType = 'national_id';
      } else if (rawText.toUpperCase().includes('UNIFIED MULTI-PURPOSE ID') || rawText.toUpperCase().includes('UMID')) {
        idType = 'umid_id';
      } else if (rawText.toUpperCase().includes('DRIVER\'S LICENSE') || rawText.toUpperCase().includes('DRIVER LICENSE')) {
        idType = 'drivers_license';
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const upperLine = line.toUpperCase();

        if (idType === 'national_id') {
          if (upperLine.includes('APELIDO') || upperLine.includes('LAST NAME') || upperLine.match(/LAST NAME$/)) {
            // Extract last name from the same line if possible
            const lastNameMatch = line.match(/Apelyido\/Last Name\s*(.*)/i);
            if (lastNameMatch && lastNameMatch[1].trim().length > 0) {
              lastName = lastNameMatch[1].trim();
            } else {
              lastName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('APELIDO') && !lines[i + 1].toUpperCase().includes('LAST NAME')) ? lines[i + 1].trim() : '';
              i++;
            }
            isAddressSection = false;
          } else if (upperLine.includes('GIVEN NAMES') || upperLine.includes('GIVEN NAME') || upperLine.includes('MGAWANGALAN')) {
            givenNames = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('GIVEN NAMES') && !lines[i + 1].toUpperCase().includes('GIVEN NAME') && !lines[i + 1].toUpperCase().includes('MGAWANGALAN')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('MIDDLE NAME') || upperLine.includes('GITNANG APELYIDO') || upperLine.includes('MIDDLE')) {
            middleName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('MIDDLE NAME') && !lines[i + 1].toUpperCase().includes('GITNANG APELYIDO') && !lines[i + 1].toUpperCase().includes('MIDDLE')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('PCN') || upperLine.includes('ID NUMBER') || upperLine.includes('PHILIPPINE IDENTIFICATION NUMBER') || upperLine.includes('PIN') || upperLine.includes('ID NO')) {
            // Try to get the ID number from the next line if it doesn't contain label keywords
            if (lines[i + 1] && !lines[i + 1].toUpperCase().includes('PCN') && !lines[i + 1].toUpperCase().includes('ID NUMBER') && !lines[i + 1].toUpperCase().includes('PHILIPPINE IDENTIFICATION NUMBER') && !lines[i + 1].toUpperCase().includes('PIN') && !lines[i + 1].toUpperCase().includes('ID NO')) {
              idNumber = lines[i + 1].trim();
              i++;
            } else {
              // If next line is not valid, try to extract ID number from current line using regex
              const match = line.match(/PCN\s*([\d\-]+)/i);
              if (match) {
                idNumber = match[1].trim();
              } else {
                idNumber = line.trim();
              }
            }
            isAddressSection = false;
          } else if (line.match(/\d{4}-\d{4}-\d{4}-\d{4}/)) {
            // Direct match for Philippine ID format: XXXX-XXXX-XXXX-XXXX
            idNumber = line.trim();
            isAddressSection = false;
          } else if (upperLine.includes('DIGITAL ID NUMBER')) {
            // Handle digital ID number separately if needed
            const digitalId = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('DIGITAL ID NUMBER')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('PETSA NG KAPANGANAKAN') || upperLine.includes('DATE OF BIRTH')) {
            const dob = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('PETSA NG KAPANGANAKAN') && !lines[i + 1].toUpperCase().includes('DATE OF BIRTH')) ? lines[i + 1].trim() : '';
            if (dob) {
              formData.dateOfBirth = dob;
            }
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('TIRAHAN') || upperLine.includes('ADDRESS')) {
            const addrPart = line.split(/TIRAHAN|ADDRESS/i)[1]?.trim();
            if (addrPart) addressLines.push(addrPart);
            isAddressSection = true;
          } else if (isAddressSection) {
            if (line.length > 0 && !line.match(/^[A-Z\s\/]+$/)) {
              addressLines.push(line);
            } else {
              isAddressSection = false;
            }
          } else {
            isAddressSection = false;
          }
        } else if (idType === 'umid_id') {
          if (upperLine.includes('SURNAME')) {
            lastName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('SURNAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('GIVEN NAME')) {
            givenNames = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('GIVEN NAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('MIDDLE NAME')) {
            middleName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('MIDDLE NAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('CRN')) {
            idNumber = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('CRN')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('ADDRESS')) {
            const addrPart = line.split(/ADDRESS/i)[1]?.trim();
            if (addrPart) addressLines.push(addrPart);
            isAddressSection = true;
          } else if (isAddressSection) {
            if (line.length > 0 && !line.match(/^[A-Z\s\/]+$/)) {
              addressLines.push(line);
            } else {
              isAddressSection = false;
            }
          } else {
            isAddressSection = false;
          }
        } else if (idType === 'drivers_license') {
          if (upperLine.includes('LAST NAME')) {
            lastName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('LAST NAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('FIRST NAME')) {
            givenNames = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('FIRST NAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('MIDDLE NAME')) {
            middleName = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('MIDDLE NAME')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('LICENSE NO') || upperLine.includes('LICENSE NUMBER')) {
            idNumber = (lines[i + 1] && !lines[i + 1].toUpperCase().includes('LICENSE NO') && !lines[i + 1].toUpperCase().includes('LICENSE NUMBER')) ? lines[i + 1].trim() : '';
            i++;
            isAddressSection = false;
          } else if (upperLine.includes('ADDRESS')) {
            const addrPart = line.split(/ADDRESS/i)[1]?.trim();
            if (addrPart) addressLines.push(addrPart);
            isAddressSection = true;
          } else if (isAddressSection) {
            if (line.length > 0 && !line.match(/^[A-Z\s\/]+$/)) {
              addressLines.push(line);
            } else {
              isAddressSection = false;
            }
          } else if (upperLine.includes('DATE OF BIRTH') || upperLine.includes('BIRTHDATE') || upperLine.includes('BIRTH DATE') || upperLine.includes('DATE OF BIRTH')) {
            const dobPart = line.split(/DATE OF BIRTH|BIRTHDATE|BIRTH DATE/i)[1]?.trim();
            if (dobPart) {
              formData.dateOfBirth = dobPart;
            }
          } else if (upperLine.includes('SEX') || upperLine.includes('GENDER')) {
            const sexPart = line.split(/SEX|GENDER/i)[1]?.trim();
            if (sexPart) {
              formData.sex = sexPart;
            }
          } else if (upperLine.includes('NATIONALITY')) {
            const nationalityPart = line.split(/NATIONALITY/i)[1]?.trim();
            if (nationalityPart) {
              formData.nationality = nationalityPart;
            }
          } else if (upperLine.includes('BLOOD TYPE')) {
            const bloodTypePart = line.split(/BLOOD TYPE/i)[1]?.trim();
            if (bloodTypePart) {
              formData.bloodType = bloodTypePart;
            }
          } else if (upperLine.includes('WEIGHT')) {
            const weightPart = line.split(/WEIGHT/i)[1]?.trim();
            if (weightPart) {
              formData.weight = weightPart;
            }
          } else if (upperLine.includes('HEIGHT')) {
            const heightPart = line.split(/HEIGHT/i)[1]?.trim();
            if (heightPart) {
              formData.height = heightPart;
            }
          } else if (upperLine.includes('EYES COLOR') || upperLine.includes('EYE COLOR')) {
            const eyeColorPart = line.split(/EYES COLOR|EYE COLOR/i)[1]?.trim();
            if (eyeColorPart) {
              formData.eyeColor = eyeColorPart;
            }
          } else if (upperLine.includes('RESTRICTIONS')) {
            const restrictionsPart = line.split(/RESTRICTIONS/i)[1]?.trim();
            if (restrictionsPart) {
              formData.restrictions = restrictionsPart;
            }
          } else if (upperLine.includes('CONDITIONS')) {
            const conditionsPart = line.split(/CONDITIONS/i)[1]?.trim();
            if (conditionsPart) {
              formData.conditions = conditionsPart;
            }
          } else {
            isAddressSection = false;
          }
        } else {
          isAddressSection = false;
        }
      }

      const address = addressLines.join(' ').trim();

      const results = {
        rawText,
        lastName: lastName
          ? { value: lastName, confidence: 85, source: "OCR" }
          : null,
        givenName: givenNames
          ? { value: givenNames, confidence: 85, source: "OCR" }
          : null,
        middleName: middleName
          ? { value: middleName, confidence: 85, source: "OCR" }
          : null,
        idNumber: idNumber
          ? { value: idNumber, confidence: 80, source: "OCR" }
          : null,
        address: address
          ? { value: address, confidence: 75, source: "OCR" }
          : null,
        dateOfBirth: formData.dateOfBirth
          ? { value: formData.dateOfBirth, confidence: 80, source: "OCR" }
          : null,
        sex: formData.sex
          ? { value: formData.sex, confidence: 80, source: "OCR" }
          : null,
        nationality: formData.nationality
          ? { value: formData.nationality, confidence: 80, source: "OCR" }
          : null,
        bloodType: formData.bloodType
          ? { value: formData.bloodType, confidence: 70, source: "OCR" }
          : null,
        weight: formData.weight
          ? { value: formData.weight, confidence: 70, source: "OCR" }
          : null,
        height: formData.height
          ? { value: formData.height, confidence: 70, source: "OCR" }
          : null,
        eyeColor: formData.eyeColor
          ? { value: formData.eyeColor, confidence: 70, source: "OCR" }
          : null,
        restrictions: formData.restrictions
          ? { value: formData.restrictions, confidence: 70, source: "OCR" }
          : null,
        conditions: formData.conditions
          ? { value: formData.conditions, confidence: 70, source: "OCR" }
          : null,
      };

      setScanResult(results);
      setFormData({
        ...formData,
        lastName: results.lastName?.value || '',
        givenName: results.givenName?.value || '',
        middleName: results.middleName?.value || '',
        idNumber: results.idNumber?.value || '',
        address: results.address?.value || '',
        dateOfBirth: results.dateOfBirth?.value || '',
        sex: results.sex?.value || '',
        nationality: results.nationality?.value || '',
        bloodType: results.bloodType?.value || '',
        weight: results.weight?.value || '',
        height: results.height?.value || '',
        eyeColor: results.eyeColor?.value || '',
        restrictions: results.restrictions?.value || '',
        conditions: results.conditions?.value || '',
      });

      setScanning(false);
    } catch (err) {
      console.error('OCR processing failed:', err);
      setError("Failed to process image. Please try again.");
      setScanning(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const response = await fetch('https://villagelink.site/backend/api/save_visitorLogs.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          last_name: formData.lastName,
          first_name: formData.givenName,
          middle_name: formData.middleName,
          id_number: formData.idNumber,
          address: formData.address,
          purpose_of_visit: formData.purposeOfVisit,
        }),
      });
      const result = await response.json();
      console.log('API response:', result);  // Added debug log
      if (response.ok && result.success) {
        setShowSuccessModal(true);
      } else {
        console.error('API error:', result.error || 'Failed to save visitor log.');  // Added error log
        setError(result.error || 'Failed to save visitor log.');
      }
    } catch (err) {
      console.error('Network error:', err);  // Added error log
      setError('Network error: ' + err.message);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setOcrDetails(null);
    setImagePreview(null);
    setFormData({ lastName: '', givenName: '', middleName: '', idNumber: '', address: '', purposeOfVisit: '' });
    setProgress(0);
    setScanning(false);
    setError(null);
    setShowOptions(false);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen py-6 md:py-8 px-4">
      <div className="max-w-4xl mx-auto ">
         <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-2 px-4 rounded-3xl mb-4 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Enhanced ID Document Scanner</h2>
                      <p className="text-indigo-100 mt-1">Advanced OCR with Philippine ID recognition</p>
                    </div>
                  </div>
                </div>
      
                <div className="p-6 md:p-6">
                  {/* Hidden video element for camera access */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="hidden"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!scanResult && !scanning && !showCamera && (
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-30 hover:border-blue-500 hover:bg-amber-50/30 transition-all duration-300">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-blue-700" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload ID Document</h3>
                          <p className="text-slate-600 mb-2">Supports: UMID, SSS, GSIS, Driver's License, Passport, etc.</p>
                          <p className="text-sm text-slate-500 mb-6">Choose how you'd like to provide your ID photo</p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                            >
                              <Upload className="w-5 h-5 mr-2" />
                              Upload Photo
                            </label>

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showCamera && (
                    <div className="space-y-6">
                      <div className="border-2 border-slate-300 rounded-2xl p-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Capture ID Document</h3>
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                            />
                          </div>
                          <div className="flex gap-4 justify-center mt-6">
                            <button
                              onClick={capturePhoto}
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                            >
                              <Camera className="w-5 h-5 mr-2" />
                              Capture Photo
                            </button>
                            <button
                              onClick={closeCamera}
                              className="inline-flex items-center px-6 py-3 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
      
                  {scanning && (
                    <div className="text-center p-10">
                      <Loader2 className="w-16 h-16 text-amber-950 animate-spin mx-auto" />
                      <h3 className="text-xl font-semibold text-slate-900 mt-6">
                        Processing ID Document...
                      </h3>
                      <p className="text-slate-600 mt-2">
                        {progress > 0 ? `${progress}% complete` : 'Applying image enhancement and OCR...'}
                      </p>
                      <div className="mt-4 text-sm text-slate-500">
                        <p>This may take a few moments with enhanced preprocessing</p>
                      </div>
                    </div>
                  )}
      

      
                  {scanResult && !scanning && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">ID Preview</h3>
                          <div className="bg-slate-50 rounded-xl p-4">
                            {imagePreview && (
                              <img src={imagePreview} alt="Scanned ID" className="w-full rounded-lg shadow-sm" />
                            )}
                          </div>
                        </div>
      
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Visitor Details</h3>
                          <div className="space-y-4">
                            <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => handleFormChange('lastName', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                                scanResult.lastName?.confidence >= 70 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-slate-300'
                              }`}
                              placeholder="Enter last name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Given Name
                            </label>
                            <input
                              type="text"
                              value={formData.givenName}
                              onChange={(e) => handleFormChange('givenName', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                                scanResult.givenName?.confidence >= 70 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-slate-300'
                              }`}
                              placeholder="Enter given name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              value={formData.middleName}
                              onChange={(e) => handleFormChange('middleName', e.target.value)}
                              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                                scanResult.middleName?.confidence >= 70 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-slate-300'
                              }`}
                              placeholder="Enter middle name"
                            />
                          </div>
      
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                ID Number 
                              </label>
                              <input
                                type="text"
                                value={formData.idNumber}
                                onChange={(e) => handleFormChange('idNumber', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                                  scanResult.idNumber?.confidence >= 70 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-slate-300'
                                }`}
                                placeholder="Enter ID number"
                              />
                            </div>
      
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Address 
                              </label>
                              <textarea
                                value={formData.address}
                                onChange={(e) => handleFormChange('address', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                                  scanResult.address?.confidence >= 70 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-slate-300'
                                }`}
                                placeholder="Enter complete address"
                                rows={3}
                              />
                            </div>
      
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Purpose of Visit </label>
                              <select
                                value={formData.purposeOfVisit}
                                onChange={(e) => handleFormChange('purposeOfVisit', e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                              >
                                <option value="">Select purpose</option>
                                {purposeOptions.map((purpose) => (
                                  <option key={purpose} value={purpose}>{purpose}</option>
                                ))}
                              </select>
                            </div>
      
                            <div className="flex gap-4 pt-4">
                              <button
                                onClick={handleSubmit}
                              disabled={!formData.lastName || !formData.givenName || !formData.idNumber || !formData.address || !formData.purposeOfVisit}
                              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all"
                            >
                              Submit Details
                            </button>
                              <button
                                onClick={resetScan}
                                className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all flex items-center"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
      
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Modal */}
              {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
                    <p className="text-slate-600 mb-6">Visitor log has been saved successfully.</p>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        resetScan();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
    </div>
  );
};

export default IDScanPage;
