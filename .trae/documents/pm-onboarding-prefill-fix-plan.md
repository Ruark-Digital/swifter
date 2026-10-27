### Summary
The necessary fields (Name and Email Address) are not prefilled on the PM Onboarding page because the decrypted token object likely uses different keys (e.g., `firstName`, `lastName`, and `email`) than what the frontend explicitly expects (`name` and `emailAddress` or `email`). As a result, the values extracted from the token evaluate to `undefined` and default to empty strings.

Additionally, the email address was observed inside the "Phone Number" field in the screenshot due to browser autofill behavior. Because the "Email Address" field is marked as `disabled`, browsers (like Chrome) ignore it for autofill and instead mistakenly target the next available text field ("Phone Number") located just before the "Password" field, assuming it's the username/email input.

### Current State Analysis
- **`PmOnboardingPage.tsx`**: The `useEffect` hook currently expects `decoded.name` and `decoded.email` to populate the form fields. However, the backend `/onboarding/add-user` endpoint uses `firstName`, `lastName`, and `email`, meaning the generated token likely lacks a `name` field, causing the prefill to fail.
- **`PmOnboardingForm.tsx`**: The form inputs lack explicit `autoComplete` attributes. The browser incorrectly assumes the `phone` field is the email/username field because it precedes the password field and the actual email field is disabled.

### Proposed Changes
1. **Update `src/pages/OnboardingPage/PmOnboardingPage.tsx`**
   - **What**: Enhance the data extraction logic inside the `useEffect` hook.
   - **Why**: To robustly handle alternative keys (like `firstName`/`lastName`) that the backend might encode in the token.
   - **How**: 
     - Create a composite name: `const decodedName = decoded.name || [decoded.firstName, decoded.lastName].filter(Boolean).join(" ") || "";`
     - Extract email robustly: `const decodedEmail = decoded.emailAddress || decoded.email || decoded.primaryEmail || "";`
     - Use these variables in `forge.setValue`.

2. **Update `src/pages/OnboardingPage/components/PmOnboardingForm.tsx`**
   - **What**: Add specific `autoComplete` attributes to the form fields.
   - **Why**: To guide the browser's autofill engine and prevent the email address from being injected into the phone number field.
   - **How**: Add `autoComplete="email"` to the email field, `autoComplete="tel"` to the phone field, and `autoComplete="new-password"` to the password fields.

3. **Update `src/pages/OnboardingPage/VendorOnboardingPage.tsx` and `src/pages/OnboardingPage/index.tsx`**
   - **What**: Apply the same robust data extraction logic for `name` and `email`.
   - **Why**: To ensure consistency and prevent the same bug from occurring in other onboarding flows if the backend payload changes.

### Assumptions & Decisions
- It is assumed that the token (`encodedData`) is being successfully decrypted and parsed into a JSON object (since no error toast was reported).
- It is assumed that the backend payload structure for PMs uses `firstName` and `lastName` (as seen in `CreateUserDialog.tsx`), which causes the current `decoded.name` logic to fail.

### Verification steps
- Check that the Name and Email Address fields correctly display the extracted values from the token upon loading the `/pm-onboarding/:encodedData` route.
- Ensure that the browser's autofill does not incorrectly populate the Phone Number field with an email address.