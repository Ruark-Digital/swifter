import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForge, Forger, Forge } from "@/lib/forge";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { postRequest, getRequest } from "@/lib/axiosInstance";
import { ApiList, ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import * as yup from "yup";
import { useUser } from "@/store/authSlice";

const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  middleName: yup.string(),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  role: yup.string().required("Role is required"),
  company: yup.string().when("role", {
    is: "Company Admin",
    then: (schema) =>
      schema.required("Company is required for Company Admin role"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

type CreateAdminData = yup.InferType<typeof schema>;

const CreateAdminDialog = () => {
  const [open, setOpen] = useState(false);

  const user = useUser()
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { control, watch, reset } = useForge<CreateAdminData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      role: "company_admin",
    },
  });

  const watchedRole = watch("role");

  // Fetch companies for the select dropdown
  const { data: companiesData } = useQuery<
    ApiResponse<ApiList<any>>,
    ApiResponseError
  >({
    queryKey: ["companies"],
    queryFn: async () => await getRequest({ url: "/companies/" }),
    enabled: watchedRole === "company_admin",
  });

  const companyOptions =
    companiesData?.data?.data?.data?.map((company) => ({
      label: company.name,
      value: company._id,
    })) || [];

  // Create admin mutation
  const { mutateAsync: createAdmin, isPending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    CreateAdminData
  >({
    mutationKey: ["createAdmin"],
    mutationFn: async (data) => {
      // Transform data to match API expectations
      const apiData = {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        companyId: data.company ?? user?.companyId,
      };
      return await postRequest({
        url: "/onboarding/add-user",
        payload: apiData,
      });
    },
    onSuccess: () => {
      toast.success("Success", "Admin created successfully");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      setOpen(false);
      reset();
    },
    onError: (error) => {
      const err = error as ApiResponseError;
      toast.error(
        "Error",
        err?.response?.data?.message ?? "Failed to create admin"
      );
    },
  });

  const handleSubmit = async (data: CreateAdminData) => {
    try {
      await createAdmin(data);
    } catch (error) {
      // Error is already handled in onError callback
    }
  };

  const roleOptions = [
    { label: "Company Admin", value: "company_admin" },
    { label: "Super Admin", value: "super_admin" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>
            Create a new admin account. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Forge
          // debug
          control={control}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Forger
              name="firstName"
              component={TextInput}
              label="First Name"
              placeholder="Enter Name"
            />
            <Forger
              name="middleName"
              component={TextInput}
              label="Middle Name"
              placeholder="Enter Name"
            />
          </div>
          <Forger
            name="lastName"
            component={TextInput}
            label="Last Name"
            placeholder="Enter Name"
          />
          <Forger
            name="email"
            component={TextInput}
            label="Email Address"
            placeholder="Enter Vendor Name"
            type="email"
          />
          <Forger
            name="role"
            component={TextSelect}
            label="Role"
            placeholder="roles"
            options={roleOptions}
          />
          {watchedRole === "company_admin" && (
            <Forger
              name="company"
              component={TextSelect}
              label="Company"
              placeholder="Select Company"
              options={companyOptions}
            />
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} isLoading={isPending}>
              Send Invite
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminDialog;
