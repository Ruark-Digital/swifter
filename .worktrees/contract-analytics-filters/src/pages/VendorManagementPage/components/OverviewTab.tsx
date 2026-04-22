import React from "react";

// Vendor type definition
export type VendorDetail = {
  id: string;
  name: string;
  email: string;
  category: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended";
  businessType: string;
  address: string;
  registrationDate: string;
  phoneNumber: string;
  website: string;
  vendorContact: string;
};

interface OverviewTabProps {
  vendor: VendorDetail;
}

// Overview Tab Component
export const OverviewTab: React.FC<OverviewTabProps> = ({ vendor }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
      {/* Business Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Business Type</h4>
        <p className="text-sm text-gray-900 font-medium">{vendor.businessType}</p>
      </div>

      {/* Address */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Address</h4>
        <p className="text-sm text-gray-900 font-medium">{vendor.address}</p>
      </div>

      {/* Registration Date */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Registration Date</h4>
        <p className="text-sm text-gray-900 font-medium">{vendor.registrationDate}</p>
      </div>

      {/* Phone Number */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Phone Number</h4>
        <p className="text-sm text-gray-900 font-medium">{vendor.phoneNumber}</p>
      </div>

      {/* Website */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Website</h4>
        <a 
          href={`https://${vendor.website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
        >
          {vendor.website}
        </a>
      </div>

      {/* Vendor Contact */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Vendor Contact</h4>
        <a 
          href={`mailto:${vendor.vendorContact}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
        >
          {vendor.vendorContact}
        </a>
      </div>
    </div>
  );
};

export default OverviewTab;