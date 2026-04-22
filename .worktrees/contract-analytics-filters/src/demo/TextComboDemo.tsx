import { useState } from 'react';
import { TextCombo } from '@/components/layouts/FormInputs/TextCombo';

const sampleOptions = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
  { label: 'Honeydew', value: 'honeydew' },
];

export const TextComboDemo = () => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedValueWithError, setSelectedValueWithError] = useState<string>('');

  return (
    <div className="p-8 space-y-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        TextCombo Component Demo
      </h1>
      
      <div className="space-y-6">
        {/* Basic TextCombo */}
        <TextCombo
          name="basic-combo"
          label="Select a Fruit"
          placeholder="Choose your favorite fruit..."
          searchPlaceholder="Search fruits..."
          options={sampleOptions}
          value={selectedValue}
          onChange={(value) => setSelectedValue(value)}
        />
        
        {/* TextCombo with Error */}
        <TextCombo
          name="error-combo"
          label="Select with Error"
          placeholder="This has an error..."
          options={sampleOptions}
          value={selectedValueWithError}
          onChange={(value) => setSelectedValueWithError(value)}
          error="Please select a valid option"
        />
        
        {/* TextCombo with Custom Empty Message */}
        <TextCombo
          name="custom-empty-combo"
          label="Custom Empty Message"
          placeholder="Search for something..."
          searchPlaceholder="Type to search..."
          options={[]}
          value=""
          onChange={() => {}}
          emptyMessage="No fruits available at the moment."
        />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Selected Values:
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Basic: {selectedValue || 'None'}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          With Error: {selectedValueWithError || 'None'}
        </p>
      </div>
    </div>
  );
};