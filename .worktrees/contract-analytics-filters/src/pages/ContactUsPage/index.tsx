import React from 'react';

const ContactUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Contact Us
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-lg mb-4">
                  For general questions, please visit{' '}
                  <a 
                    href="https://aigproinc.ca/contact-us/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    https://aigproinc.ca/contact-us/
                  </a>
                </p>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Need help?
                </h2>
                <p className="text-lg">
                  The AIG Pro Inc. Customer Support Team is here to help.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Email Support
                  </h3>
                  <a 
                    href="mailto:info@aigproinc.ca" 
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium underline"
                  >
                    info@aigproinc.ca
                  </a>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Phone Support
                  </h3>
                  <a 
                    href="tel:+16478352211" 
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium underline"
                  >
                    1-647-835-2211
                  </a>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Business Hours
                </h3>
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-medium">Monday to Friday</span> (excluding Public Holidays)
                  </p>
                  <p className="text-lg font-medium text-green-700">
                    7:00 a.m. to 8:00 p.m. EASTERN TIME
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  The AIG Pro Inc. Harmonized Sales Tax (HST) Registration Number{' '}
                  <span className="font-bold text-gray-900">724663018RT0001</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;