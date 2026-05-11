import React from 'react';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Disclaimer
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <div className="space-y-4">
              <p className="leading-relaxed text-lg">
                The solicitation content is provided for information purposes only. Refer to the "Documents" for authoritative information.
              </p>
              
              <p className="leading-relaxed text-lg">
                AIG Pro Inc. asks you to direct all queries pertaining to the language, the content or any missing or inaccurate information within the solicitation abstract to its originator. The contact information of the purchasing agency in question is located in the 'Contact Information' section of the solicitation package.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;