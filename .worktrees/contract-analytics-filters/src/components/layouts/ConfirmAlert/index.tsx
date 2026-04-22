import { Button } from "@/components/ui/button";
import { useToastHandler } from "@/hooks/useToaster";
import { deleteRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { FiTrash, FiCheck, FiX, FiFolder, FiAward, FiInfo } from "react-icons/fi";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";
import { useSetReset } from "@/store/authSlice";
import { cn } from "@/lib/utils";
import { Bell, LogOut } from "lucide-react";

type ModalType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "delete"
  | "draft"
  | "award"
  | "logout"
  | "alert";

type ConfirmAlertProps = {
  url?: string;
  title: string;
  text?: string;
  children?: ReactNode;
  trigger?: ReactNode;
  onClose?: (open: boolean) => void;
  open?: boolean
  logout?: boolean;
  type?: ModalType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  showSecondaryButton?: boolean;
  showToggle?: boolean;
  toggleLabel?: string;
  toggleValue?: boolean;
  hideDialog?: boolean;
  onToggleChange?: (value: boolean) => void;
  isLoading?: boolean;
  primaryButtonLoading?: boolean;
};
export const ConfirmAlert = (props: ConfirmAlertProps) => {
  const setReset = useSetReset();
  const toastHandlers = useToastHandler();

  const mutation = useMutation<ApiResponse<any>, ApiResponseError, undefined>({
    mutationFn: () => deleteRequest({ url: props.url ?? "" }),
  });

  const handleSubmit = async () => {
    const TOAST_TITLE = "Deletion";
    try {
      const result = await mutation.mutateAsync(undefined);

      if (result.status !== 200) {
        toastHandlers.error(TOAST_TITLE, "Failed to delete");
        return;
      }

      toastHandlers.success(
        TOAST_TITLE,
        result.data.message ?? "Successfully deleted"
      );
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error(TOAST_TITLE, err);
    }
  };

  const handleLogout = async () => {
    const TOAST_TITLE = "Log out";
    try {
      setReset();
    } catch (error) {
      const err = error as ApiResponseError;
      toastHandlers.error(TOAST_TITLE, err);
    }
  };

  const getIconConfig = () => {
    switch (props.type) {
      case "success":
        return {
          icon: FiCheck,
          bgColor: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "error":
        return {
          icon: FiX,
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "draft":
        return {
          icon: FiFolder,
          bgColor: "bg-gray-100 dark:bg-gray-800",
          iconColor: "text-gray-600 dark:text-gray-400",
        };
      case "award":
        return {
          icon: FiAward,
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      case "info":
        return {
          icon: FiInfo,
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "alert":
        return {
          icon: Bell,
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "logout":
        return {
          icon: LogOut,
          bgColor: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "delete":
      default:
        return {
          icon: FiTrash,
          bgColor: "bg-[#FFDFDF] dark:bg-red-900/30",
          iconColor: "text-primary dark:text-red-400",
        };
    }
  };

  const handlePrimaryAction = () => {
    if (props.onPrimaryAction) {
      props.onPrimaryAction();
    } else if (props.logout) {
      handleLogout();
    } else {
      handleSubmit();
    }
  };

  const isPrimaryButtonLoading = props.primaryButtonLoading || props.isLoading || mutation.isPending;

  const handleSecondaryAction = () => {
    if (props.onSecondaryAction) {
      props.onSecondaryAction();
    }
  };

  const iconConfig = getIconConfig();
  const IconComponent = iconConfig.icon;

  const primaryButtonText =
    props.primaryButtonText || (props.type === "delete" ? "Yes" : "Continue");
  const secondaryButtonText =
    props.secondaryButtonText || (props.type === "delete" ? "No" : "Cancel");
  const showSecondaryButton =
    props.showSecondaryButton !== false &&
    !["success", "error"].includes(props.type || "delete");

  const renderDialogContent = (
    <DialogContent className="px-0 pb-0 max-w-md">
      <div className="flex flex-col items-center text-center px-6 pt-6">
        <div
          className={cn(
            "rounded-full flex items-center justify-center h-16 w-16 mb-4",
            iconConfig.bgColor
          )}
        >
          <IconComponent className={cn("h-8 w-8", iconConfig.iconColor)} />
        </div>
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl text-center font-semibold text-gray-700 dark:text-gray-200">
            {props.title}
          </DialogTitle>
          {props.text && (
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed text-center">
              {props.text}
            </DialogDescription>
          )}
        </DialogHeader>
      </div>

      {props.showToggle && (
        <div className="flex items-center justify-between px-6 py-2">
          <span className="text-sm font-medium dark:text-gray-300">
            {props.toggleLabel}
          </span>
          <button
            onClick={() => props.onToggleChange?.(!props.toggleValue)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              props.toggleValue
                ? "bg-blue-600 dark:bg-blue-500"
                : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 transition-transform",
                props.toggleValue ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      )}

      <div
        className={cn(
          "px-6 pb-6 flex gap-3",
          showSecondaryButton ? "justify-between" : "justify-center"
        )}
      >
        {showSecondaryButton && (
          <DialogClose asChild>
            <Button
              variant="outline"
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              onClick={handleSecondaryAction}
            >
              {secondaryButtonText}
            </Button>
          </DialogClose>
        )}
        <Button
          onClick={handlePrimaryAction}
          isLoading={isPrimaryButtonLoading}
          disabled={isPrimaryButtonLoading}
          className={cn(
            "flex-1",
            props.type === "success" || props.type === "draft"
              ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              : ""
          )}
        >
          {primaryButtonText}
        </Button>
      </div>
    </DialogContent>
  );

  if (props.hideDialog) {
    return (
      <>
        {renderDialogContent}
      </>
    );
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        props?.onClose?.(open);
      }}
    >
      {props.children}
      {props.trigger ? <DialogTrigger asChild>{props.trigger}</DialogTrigger> : null}
      {renderDialogContent}
    </Dialog>
  );
};
