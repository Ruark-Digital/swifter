# Migration Guide: Adding React Native Support to Forge

This guide helps you migrate your existing web-only Forge forms to support React Native while maintaining backward compatibility.

## Overview

The Forge library now supports both Web and React Native platforms with automatic platform detection and cross-platform component handling. Your existing web code will continue to work without any changes.

## What's New

### Platform Detection
- Automatic platform detection (`isWeb`, `isReactNative`, `isMobile`)
- Manual platform specification via `platform` prop
- Cross-platform utility functions

### React Native Components Support
- TextInput with `onChangeText` event handling
- Switch with `onValueChange` event handling
- Picker with `onValueChange` event handling
- Slider with `onValueChange` event handling
- CheckBox and RadioButton support
- File handling for React Native image picker

### Enhanced Validation
- Cross-platform validation that works on both Web and React Native
- React Native specific error display using `setNativeProps`
- Maintained web validation with `reportValidity`

## Migration Steps

### Step 1: Update Imports (Optional)

If you want to use new platform detection utilities:

```typescript
// Before
import { useForge, Forge, Forger } from '@your-org/forge';

// After (optional - for platform detection)
import { 
  useForge, 
  Forge, 
  Forger,
  isWeb,
  isReactNative,
  isMobile 
} from '@your-org/forge';
```

### Step 2: Existing Web Code (No Changes Required)

Your existing web forms will continue to work exactly as before:

```typescript
// This code remains unchanged and fully functional
const WebForm = () => {
  const { control } = useForge({
    defaultValues: { email: '', password: '' }
  });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Submit</button>
    </Forge>
  );
};
```

### Step 3: Adding React Native Support

#### Option A: Automatic Platform Detection

```typescript
// The same component works on both platforms
const CrossPlatformForm = () => {
  const { control } = useForge({
    defaultValues: { email: '', password: '' }
  });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      {/* Web: renders as input, React Native: renders as TextInput */}
      <TextInput name="email" placeholder="Email" />
      <TextInput name="password" placeholder="Password" secureTextEntry />
      <Button title="Submit" onPress={handleSubmit} />
    </Forge>
  );
};
```

#### Option B: Explicit Platform Specification

```typescript
const ExplicitPlatformForm = () => {
  const { control } = useForge({
    defaultValues: { email: '', password: '' }
  });

  return (
    <Forge 
      control={control} 
      onSubmit={handleSubmit}
      platform="react-native" // Explicitly set platform
    >
      <TextInput name="email" placeholder="Email" />
      <TextInput name="password" placeholder="Password" secureTextEntry />
    </Forge>
  );
};
```

### Step 4: Using Platform-Specific Props

You can provide different props for different platforms:

```typescript
const PlatformSpecificForm = () => {
  const { control } = useForge({
    defaultValues: { email: '' }
  });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      <Forger
        name="email"
        control={control}
        component={TextInput}
        // Web-specific props
        web={{
          type: 'email',
          className: 'email-input',
          autoComplete: 'email'
        }}
        // React Native-specific props
        reactNative={{
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoCorrect: false
        }}
      />
    </Forge>
  );
};
```

### Step 5: Handling Different Component Types

#### Switch/Toggle Components

```typescript
// Web and React Native compatible
const ToggleForm = () => {
  const { control } = useForge({
    defaultValues: { notifications: false }
  });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      {/* Automatically uses onChange for web, onValueChange for React Native */}
      <Switch name="notifications" />
    </Forge>
  );
};
```

#### Picker/Select Components

```typescript
// Cross-platform picker
const PickerForm = () => {
  const { control } = useForge({
    defaultValues: { country: '' }
  });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      <Picker name="country">
        <Picker.Item label="Select Country" value="" />
        <Picker.Item label="United States" value="us" />
        <Picker.Item label="Canada" value="ca" />
      </Picker>
    </Forge>
  );
};
```

## Common Migration Patterns

### Pattern 1: Conditional Rendering Based on Platform

```typescript
import { isWeb, isReactNative } from '@your-org/forge';

const AdaptiveForm = () => {
  const { control } = useForge({ defaultValues: { text: '' } });

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      {isWeb && (
        <input name="text" type="text" className="web-input" />
      )}
      {isReactNative && (
        <TextInput name="text" style={styles.nativeInput} />
      )}
    </Forge>
  );
};
```

### Pattern 2: Shared Component with Platform Props

```typescript
const SharedInput = ({ name, ...props }) => {
  return (
    <Forger
      name={name}
      control={control}
      component={isWeb ? 'input' : TextInput}
      web={{
        type: 'text',
        className: 'input'
      }}
      reactNative={{
        style: styles.input
      }}
      {...props}
    />
  );
};
```

### Pattern 3: File Upload Handling

```typescript
const FileUploadForm = () => {
  const { control } = useForge({
    defaultValues: { avatar: null }
  });

  const handleFileSelect = (file) => {
    // File is automatically processed for the current platform
    // Web: File object
    // React Native: { uri, type, name, size }
  };

  return (
    <Forge control={control} onSubmit={handleSubmit}>
      {isWeb && (
        <input name="avatar" type="file" accept="image/*" />
      )}
      {isReactNative && (
        <TouchableOpacity onPress={openImagePicker}>
          <Text>Select Image</Text>
        </TouchableOpacity>
      )}
    </Forge>
  );
};
```

## Validation Updates

### Before (Web Only)

```typescript
const rules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email'
    }
  }
};
```

### After (Cross-Platform)

```typescript
// Same validation rules work on both platforms
const rules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email'
    }
  }
};

// Validation errors are displayed appropriately:
// Web: using reportValidity() and setCustomValidity()
// React Native: using setNativeProps() with error styling
```

## Breaking Changes

**None!** This update is fully backward compatible. All existing web code will continue to work without any modifications.

## New TypeScript Types

```typescript
// New platform-specific prop types
interface ReactNativeInputProps {
  keyboardType?: string;
  autoCapitalize?: string;
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

interface PlatformSpecificProps {
  web?: Record<string, any>;
  reactNative?: ReactNativeInputProps;
}

// Enhanced ForgeProps with platform support
interface ForgeProps {
  platform?: 'web' | 'react-native' | 'auto';
  // ... existing props
}
```

## Testing Your Migration

### 1. Test Existing Web Forms

Ensure all your existing web forms still work:

```bash
# Run your existing tests
npm test

# Test in browser
npm start
```

### 2. Test React Native Forms

Create a simple React Native test:

```typescript
// __tests__/ReactNativeForm.test.tsx
import { render } from '@testing-library/react-native';
import { YourForm } from '../YourForm';

test('renders React Native form', () => {
  const { getByPlaceholderText } = render(<YourForm />);
  expect(getByPlaceholderText('Email')).toBeTruthy();
});
```

## Troubleshooting

### Issue: Form not detecting React Native environment

**Solution:** Explicitly set the platform:

```typescript
<Forge control={control} platform="react-native" onSubmit={handleSubmit}>
  {/* components */}
</Forge>
```

### Issue: Events not firing on React Native components

**Solution:** Ensure you're using the correct event handlers:

```typescript
// Correct - library handles this automatically
<TextInput name="text" />

// Manual handling if needed
<TextInput 
  name="text" 
  onChangeText={(value) => setValue('text', value)}
/>
```

### Issue: Validation not working on React Native

**Solution:** Check that your components support `setNativeProps`:

```typescript
// Custom component should forward ref and support setNativeProps
const CustomInput = React.forwardRef((props, ref) => {
  return <TextInput ref={ref} {...props} />;
});
```

## Best Practices

1. **Use automatic platform detection** when possible
2. **Test on both platforms** during development
3. **Provide platform-specific props** for optimal UX
4. **Keep validation rules consistent** across platforms
5. **Use TypeScript** for better type safety
6. **Follow React Native component patterns** for custom components

## Need Help?

If you encounter issues during migration:

1. Check the [examples](./examples/) directory
2. Review the [test files](./\_\_tests\_\_/) for usage patterns
3. Ensure your React Native components follow standard patterns
4. Verify that custom components support the required props and methods

## Summary

This migration adds powerful React Native support while maintaining 100% backward compatibility with existing web code. You can:

- ✅ Keep all existing web forms unchanged
- ✅ Gradually add React Native support
- ✅ Use the same validation rules across platforms
- ✅ Leverage automatic platform detection
- ✅ Provide platform-specific optimizations

Your existing investment in Forge is fully preserved while gaining cross-platform capabilities.