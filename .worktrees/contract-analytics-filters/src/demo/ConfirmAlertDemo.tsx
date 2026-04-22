import    { useState } from 'react';
import { ConfirmAlert } from '@/components/layouts/ConfirmAlert';
import { Button } from '@/components/ui/button';

export const ConfirmAlertDemo = () => {
  const [toggleValue, setToggleValue] = useState(false);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Confirm Alert Demo</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Success Modal */}
        <ConfirmAlert
          type="success"
          title="Solicitation Created Successfully"
          text="Your solicitation has been published and vendors have been notified."
          primaryButtonText="View Details"
          secondaryButtonText="Close"
          showSecondaryButton={true}
          trigger={<Button>Success Modal</Button>}
        />

        {/* Error Modal */}
        <ConfirmAlert
          type="error"
          title="Error Creating Solicitation"
          text="Something went wrong while saving your solicitation. Please try again. If the problem persists, contact support."
          primaryButtonText="Try Again"
          secondaryButtonText="Cancel"
          showSecondaryButton={true}
          trigger={<Button variant="destructive">Error Modal</Button>}
        />

        {/* Draft Saved Modal */}
        <ConfirmAlert
          type="draft"
          title="Draft Saved Successfully"
          text="Your solicitation has been saved as a draft. You can return to complete or publish it later from your dashboard."
          primaryButtonText="Go Dashboard"
          showSecondaryButton={false}
          trigger={<Button variant="outline">Draft Saved Modal</Button>}
        />

        {/* Save as Draft Modal */}
        <ConfirmAlert
          type="draft"
          title="Save as Draft?"
          text="You're about to save your solicitation as a draft. You can continue editing it later from your dashboard."
          primaryButtonText="Save as Draft"
          secondaryButtonText="Cancel"
          showSecondaryButton={true}
          trigger={<Button variant="secondary">Save as Draft Modal</Button>}
        />

        {/* Award Vendor Modal */}
        <ConfirmAlert
          type="award"
          title="Confirm Award Vendor"
          text="Are you sure you want to award this solicitation to Zenith Solutions? This action will mark the solicitation as Awarded."
          primaryButtonText="Confirm Award"
          secondaryButtonText="Cancel"
          showSecondaryButton={true}
          showToggle={true}
          toggleLabel="Notify Vendor"
          toggleValue={toggleValue}
          onToggleChange={setToggleValue}
          trigger={<Button className="bg-blue-600 hover:bg-blue-700">Award Vendor Modal</Button>}
        />

        {/* Delete Modal (Original) */}
        <ConfirmAlert
          type="delete"
          title="Delete Item"
          text="Are you sure you want to delete this item? This action cannot be undone."
          trigger={<Button variant="destructive">Delete Modal</Button>}
        />
      </div>
    </div>
  );
};

export default ConfirmAlertDemo;