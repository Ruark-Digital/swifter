/**
 * React Native Example for the Forge Library
 * This example demonstrates how to use the Forge library with React Native components
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useForge, Forge, Forger } from '../index';

// Form data interface
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  country: string;
  isSubscribed: boolean;
  bio: string;
  rating: number;
}

// Validation schema
const validationRules = {
  firstName: {
    required: 'First name is required',
    minLength: {
      value: 2,
      message: 'First name must be at least 2 characters',
    },
  },
  lastName: {
    required: 'Last name is required',
    minLength: {
      value: 2,
      message: 'Last name must be at least 2 characters',
    },
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },
  phone: {
    required: 'Phone number is required',
    pattern: {
      value: /^[\+]?[1-9][\d]{0,2}[\s]?[\(]?[\d]{1,3}[\)]?[-\s\.]?[\d]{1,4}[-\s\.]?[\d]{1,9}$/,
      message: 'Invalid phone number',
    },
  },
  age: {
    required: 'Age is required',
    min: {
      value: 18,
      message: 'Must be at least 18 years old',
    },
    max: {
      value: 120,
      message: 'Age must be realistic',
    },
  },
  country: {
    required: 'Please select a country',
  },
  bio: {
    maxLength: {
      value: 500,
      message: 'Bio must be less than 500 characters',
    },
  },
  rating: {
    required: 'Please provide a rating',
    min: {
      value: 1,
      message: 'Rating must be at least 1',
    },
    max: {
      value: 10,
      message: 'Rating cannot exceed 10',
    },
  },
};

// Custom styled components
const StyledTextInput = ({ error, ...props }: any) => (
  <TextInput
    style={[
      styles.input,
      error && styles.inputError,
    ]}
    {...props}
  />
);

const StyledSwitch = ({ label, ...props }: any) => (
  <View style={styles.switchContainer}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch {...props} />
  </View>
);

const StyledPicker = ({ error, ...props }: any) => (
  <View style={[styles.pickerContainer, error && styles.inputError]}>
    <Picker {...props} />
  </View>
);

// Main component
const ReactNativeExample: React.FC = () => {
  // Initialize form with default values
  const { control, handleSubmit, formState: { errors, isValid } } = useForge<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: 0,
      country: '',
      isSubscribed: false,
      bio: '',
      rating: 5,
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Form submission handler
  const onSubmit = (data: FormData) => {
    Alert.alert(
      'Form Submitted',
      `Hello ${data.firstName} ${data.lastName}!\n\nYour form has been submitted successfully.`,
      [
        {
          text: 'OK',
          onPress: () => console.log('Form data:', data),
        },
      ]
    );
  };

  // Error handler
  const onError = (errors: any) => {
    const errorMessages = Object.values(errors)
      .map((error: any) => error.message)
      .join('\n');
    
    Alert.alert('Validation Errors', errorMessages);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>React Native Form Example</Text>
      <Text style={styles.subtitle}>Using Forge Library</Text>

      <Forge
        control={control}
        onSubmit={handleSubmit(onSubmit, onError)}
        platform="react-native"
      >
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>First Name *</Text>
              <Forger
                name="firstName"
                control={control}
                component={StyledTextInput}
                placeholder="Enter first name"
                rules={validationRules.firstName}
                reactNative={{
                  autoCapitalize: 'words',
                  autoCorrect: false,
                }}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName.message}</Text>
              )}
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Last Name *</Text>
              <Forger
                name="lastName"
                control={control}
                component={StyledTextInput}
                placeholder="Enter last name"
                rules={validationRules.lastName}
                reactNative={{
                  autoCapitalize: 'words',
                  autoCorrect: false,
                }}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName.message}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <Text style={styles.label}>Email Address *</Text>
          <Forger
            name="email"
            control={control}
            component={StyledTextInput}
            placeholder="Enter email address"
            rules={validationRules.email}
            reactNative={{
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
            }}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}

          <Text style={styles.label}>Phone Number *</Text>
          <Forger
            name="phone"
            control={control}
            component={StyledTextInput}
            placeholder="Enter phone number"
            rules={validationRules.phone}
            reactNative={{
              keyboardType: 'phone-pad',
            }}
          />
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone.message}</Text>
          )}
        </View>

        {/* Additional Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <Text style={styles.label}>Age *</Text>
          <Forger
            name="age"
            control={control}
            component={StyledTextInput}
            placeholder="Enter your age"
            rules={validationRules.age}
            reactNative={{
              keyboardType: 'numeric',
            }}
          />
          {errors.age && (
            <Text style={styles.errorText}>{errors.age.message}</Text>
          )}

          <Text style={styles.label}>Country *</Text>
          <Forger
            name="country"
            control={control}
            component={StyledPicker}
            rules={validationRules.country}
          >
            <Picker.Item label="Select a country" value="" />
            <Picker.Item label="United States" value="us" />
            <Picker.Item label="Canada" value="ca" />
            <Picker.Item label="United Kingdom" value="uk" />
            <Picker.Item label="Australia" value="au" />
            <Picker.Item label="Germany" value="de" />
            <Picker.Item label="France" value="fr" />
            <Picker.Item label="Japan" value="jp" />
            <Picker.Item label="Other" value="other" />
          </Forger>
          {errors.country && (
            <Text style={styles.errorText}>{errors.country.message}</Text>
          )}

          <Forger
            name="isSubscribed"
            control={control}
            component={StyledSwitch}
            label="Subscribe to newsletter"
          />

          <Text style={styles.label}>Bio</Text>
          <Forger
            name="bio"
            control={control}
            component={StyledTextInput}
            placeholder="Tell us about yourself (optional)"
            rules={validationRules.bio}
            reactNative={{
              multiline: true,
              numberOfLines: 4,
              textAlignVertical: 'top',
            }}
          />
          {errors.bio && (
            <Text style={styles.errorText}>{errors.bio.message}</Text>
          )}

          <Text style={styles.label}>Rating (1-10) *</Text>
          <Forger
            name="rating"
            control={control}
            component={StyledTextInput}
            placeholder="Rate our service"
            rules={validationRules.rating}
            reactNative={{
              keyboardType: 'numeric',
            }}
          />
          {errors.rating && (
            <Text style={styles.errorText}>{errors.rating.message}</Text>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Submit Form"
            onPress={handleSubmit(onSubmit, onError)}
            disabled={!isValid}
          />
        </View>
      </Forge>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: -5,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default ReactNativeExample;

// Usage instructions:
/*
1. Install required dependencies:
   npm install @react-native-picker/picker

2. Import and use the component:
   import ReactNativeExample from './path/to/ReactNativeExample';
   
3. Add to your app:
   <ReactNativeExample />

4. Customize as needed:
   - Modify validation rules
   - Add more form fields
   - Change styling
   - Add custom components
*/