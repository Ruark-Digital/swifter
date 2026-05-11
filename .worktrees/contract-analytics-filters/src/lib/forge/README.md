# Forge - Cross-Platform Form Library

Forge is a powerful, cross-platform form library built on top of `react-hook-form` that provides seamless support for both Web and React Native applications.

## Features

- ✅ **Cross-Platform**: Works seamlessly on Web and React Native
- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Platform Detection**: Automatic platform detection with manual override options
- ✅ **React Native Components**: Built-in support for TextInput, Switch, Picker, Slider, CheckBox, and RadioButton
- ✅ **Validation**: Cross-platform validation with platform-specific error handling
- ✅ **Event Handling**: Automatic event handler mapping (onChange vs onChangeText)
- ✅ **Backward Compatible**: Existing web implementations continue to work without changes

## Installation

```bash
npm install react-hook-form
# The forge library is included in your project
```

## Basic Usage

### Web Usage (Existing)

```tsx
import { useForge, Forge } from './lib/forge';

function MyForm() {
  const { control } = useForge({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <input name="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Submit</button>
    </Forge>
  );
}
```

### React Native Usage

```tsx
import React from 'react';
import { View, Button } from 'react-native';
import { TextInput } from 'react-native';
import { useForge, Forge } from './lib/forge';

function MyReactNativeForm() {
  const { control } = useForge({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Forge 
      control={control} 
      onSubmit={onSubmit}
      platform="react-native" // Optional: auto-detected
    >
      <View>
        <TextInput 
          name="email" 
          placeholder="Email"
          style={{ borderWidth: 1, padding: 10, margin: 5 }}
        />
        <TextInput 
          name="password" 
          placeholder="Password"
          secureTextEntry
          style={{ borderWidth: 1, padding: 10, margin: 5 }}
        />
        <Button title="Submit" onPress={() => {}} />
      </View>
    </Forge>
  );
}
```

### Using Forger Component

```tsx
import { Forger } from './lib/forge';
import { TextInput } from 'react-native';

function CustomInput({ control }) {
  return (
    <Forger
      name="username"
      control={control}
      component={TextInput}
      placeholder="Enter username"
      rules={{ required: 'Username is required' }}
    />
  );
}
```

## Platform Detection

Forge automatically detects the platform and adjusts behavior accordingly:

```tsx
import { isWeb, isReactNative, isMobile } from './lib/forge';

// Platform detection utilities
console.log('Is Web:', isWeb);
console.log('Is React Native:', isReactNative);
console.log('Is Mobile:', isMobile);
```

## React Native Component Support

### TextInput
```tsx
<Forger
  name="description"
  control={control}
  component={TextInput}
  multiline
  numberOfLines={4}
/>
```

### Switch
```tsx
import { Switch } from 'react-native';

<Forger
  name="notifications"
  control={control}
  component={Switch}
  trackColor={{ false: '#767577', true: '#81b0ff' }}
/>
```

### Picker
```tsx
import { Picker } from '@react-native-picker/picker';

<Forger
  name="country"
  control={control}
  component={Picker}
>
  <Picker.Item label="USA" value="usa" />
  <Picker.Item label="Canada" value="canada" />
</Forger>
```

### Slider
```tsx
import { Slider } from '@react-native-community/slider';

<Forger
  name="volume"
  control={control}
  component={Slider}
  minimumValue={0}
  maximumValue={100}
  step={1}
/>
```

## Validation

Validation works across both platforms with platform-specific error handling:

```tsx
const { control } = useForge({
  defaultValues: { email: '' },
  resolver: yupResolver(schema) // Works on both platforms
});

<Forger
  name="email"
  control={control}
  component={TextInput}
  rules={{
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  }}
/>
```

## Platform-Specific Props

You can provide platform-specific props:

```tsx
<Forger
  name="input"
  control={control}
  component={TextInput}
  web={{
    type: 'email',
    className: 'web-input'
  }}
  reactNative={{
    keyboardType: 'email-address',
    autoCapitalize: 'none'
  }}
/>
```

## Event Handling

Forge automatically maps the correct event handlers:

- **Web**: `onChange`
- **React Native TextInput**: `onChangeText`
- **React Native Switch/Picker/Slider**: `onValueChange`

## File Handling

For React Native file handling (images, documents):

```tsx
import { handleReactNativeFile } from './lib/forge';

// Handle image picker result
const processFile = (file) => {
  const processedFile = handleReactNativeFile(file);
  // processedFile will have { uri, type, name, size }
};
```

## Migration Guide

### From Web-Only to Cross-Platform

1. **No changes required** for existing web implementations
2. **Add platform prop** if you want to force a specific platform
3. **Use React Native components** in your React Native app
4. **Import platform utilities** if you need platform-specific logic

### Example Migration

**Before (Web only):**
```tsx
<Forge control={control} onSubmit={onSubmit}>
  <input name="email" />
</Forge>
```

**After (Cross-platform):**
```tsx
<Forge control={control} onSubmit={onSubmit}>
  {isWeb ? (
    <input name="email" />
  ) : (
    <TextInput name="email" />
  )}
</Forge>
```

## API Reference

### Platform Detection
- `isWeb: boolean` - True if running in web environment
- `isReactNative: boolean` - True if running in React Native
- `isMobile: boolean` - True if mobile (React Native or mobile web)

### Component Detection
- `isTextInput(component): boolean`
- `isCheckBoxInput(component): boolean`
- `isRadioInput(component): boolean`
- `isPicker(component): boolean`
- `isSwitch(component): boolean`
- `isSlider(component): boolean`

### Utilities
- `getComponentType(component): string`
- `getEventHandlerName(componentType): string`
- `mergePlatformProps(baseProps, platformProps): object`
- `handleReactNativeFile(file): object`

## TypeScript Support

Full TypeScript support with platform-specific types:

```tsx
import { 
  ForgeProps, 
  CrossPlatformForgerProps, 
  ReactNativeInputProps 
} from './lib/forge';

interface MyFormData {
  email: string;
  age: number;
}

const MyForm: React.FC = () => {
  const { control } = useForge<MyFormData>({
    defaultValues: {
      email: '',
      age: 0
    }
  });
  
  // TypeScript will infer correct types
};
```

## Best Practices

1. **Use platform detection** for conditional rendering
2. **Leverage automatic event handling** instead of manual mapping
3. **Provide platform-specific props** when needed
4. **Test on both platforms** to ensure consistent behavior
5. **Use TypeScript** for better development experience

## Troubleshooting

### Common Issues

1. **Event handlers not working**: Ensure you're using the correct component types
2. **Validation not showing**: Check if your React Native components support error display
3. **Platform detection incorrect**: Use manual platform prop if auto-detection fails

### Debug Mode

```tsx
<Forge control={control} onSubmit={onSubmit} debug>
  {/* Your form components */}
</Forge>
```

This will show the React Hook Form DevTools (web only).

## Contributing

When contributing to the Forge library:

1. Ensure backward compatibility with existing web implementations
2. Test on both web and React Native platforms
3. Update TypeScript definitions
4. Add platform-specific tests
5. Update documentation

## License

This library is part of the Swifter project and follows the same licensing terms.