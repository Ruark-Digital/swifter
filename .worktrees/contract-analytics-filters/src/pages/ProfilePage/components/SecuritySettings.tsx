import React from 'react';
import { Forge, Forger, useForge } from '@/lib/forge';
import { TextInput } from '@/components/layouts/FormInputs/TextInput';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { putRequest } from '@/lib/axiosInstance';
import { ApiResponseError } from '@/types';
import { useToastHandler } from '@/hooks/useToaster';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const validationSchema = yup.object({
  currentPassword: yup
    .string()
    .min(6, 'Current password must be at least 6 characters')
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'New password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const SecuritySettings: React.FC = () => {
  const toast = useToastHandler();
  const { control } = useForge({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutateAsync, isPending } = useMutation<
    any,
    ApiResponseError,
    { oldPassword: string; newPassword: string }
  >({
    mutationKey: ['change-password'],
    mutationFn: async (data) =>
      await putRequest({ url: '/users/change-password', payload: data }),
  });

  const handleSubmit = async (data: ChangePasswordForm) => {
    try {
      const payload = {
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      };
      
      const response = await mutateAsync(payload);
      
      if (response?.data) {
        toast.success('Password Updated', 'Your password has been successfully updated.');
        // Reset form after successful update
        // You might want to reset the form here if needed
      }
    } catch (error) {
      console.log(error);
      const err = error as ApiResponseError;
      if (err.response?.status === 400) {
        toast.error('Invalid Password', 'Current password is incorrect.');
      } else if (err.response?.status === 422) {
        toast.error('Validation Error', 'Password validation failed.');
      } else {
        toast.error('Update Failed', err.response?.data?.message || 'Failed to update password.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Change password</h2>
        <p className="text-gray-600 dark:text-gray-400">Please enter your current password to change your password.</p>
      </div>

      <Forge {...{ control, onSubmit: handleSubmit }} className="space-y-6">
        {/* Current Password */}
        <Forger
          component={TextInput}
          name="currentPassword"
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          containerClass="space-y-2"
        />

        {/* New Password */}
        <Forger
          component={TextInput}
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter new password"
          containerClass="space-y-2"
        />

        {/* Confirm New Password */}
        <Forger
          component={TextInput}
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          containerClass="space-y-2"
        />

        {/* Password Requirements */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your new password must be more than 8 characters.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            size={'lg'} 
            className="px-6 w-full bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            type="button"
          >
            Back
          </Button>
          <Button 
            size={'lg'} 
            className="px-6 w-full bg-[#2A4467] dark:bg-[#2A4467]"
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Forge>
    </div>
  );
};

export default SecuritySettings;