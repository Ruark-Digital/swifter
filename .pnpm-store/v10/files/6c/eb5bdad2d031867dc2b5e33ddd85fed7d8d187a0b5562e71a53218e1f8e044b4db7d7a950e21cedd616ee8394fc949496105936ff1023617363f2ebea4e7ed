import React from 'react';
import { VariantProps } from 'class-variance-authority';
import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';

declare const tagVariants: (props?: {
    variant?: "default" | "destructive" | "primary";
    size?: "sm" | "lg" | "md" | "xl";
    shape?: "default" | "rounded" | "square" | "pill";
    borderStyle?: "none" | "default" | "dashed" | "dotted" | "double";
    textCase?: "uppercase" | "lowercase" | "capitalize";
    interaction?: "clickable" | "nonClickable";
    animation?: "none" | "fadeIn" | "slideIn" | "bounce";
    textStyle?: "bold" | "normal" | "italic" | "underline" | "lineThrough";
} & class_variance_authority_dist_types.ClassProp) => string;

declare enum Delimiter {
    Comma = ",",
    Enter = "Enter"
}
type OmittedInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value'>;
type Tag = {
    id: string;
    text: string;
};
interface TagInputStyleClassesProps {
    inlineTagsContainer?: string;
    tagPopover?: {
        popoverTrigger?: string;
        popoverContent?: string;
    };
    tagList?: {
        container?: string;
        sortableList?: string;
    };
    autoComplete?: {
        command?: string;
        popoverTrigger?: string;
        popoverContent?: string;
        commandList?: string;
        commandGroup?: string;
        commandItem?: string;
    };
    tag?: {
        body?: string;
        closeButton?: string;
    };
    input?: string;
    clearAllButton?: string;
}
interface TagInputProps extends OmittedInputProps, VariantProps<typeof tagVariants> {
    placeholder?: string;
    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    enableAutocomplete?: boolean;
    autocompleteOptions?: Tag[];
    maxTags?: number;
    minTags?: number;
    readOnly?: boolean;
    disabled?: boolean;
    onTagAdd?: (tag: string) => void;
    onTagRemove?: (tag: string) => void;
    allowDuplicates?: boolean;
    validateTag?: (tag: string) => boolean;
    delimiter?: Delimiter;
    showCount?: boolean;
    placeholderWhenFull?: string;
    sortTags?: boolean;
    delimiterList?: string[];
    truncate?: number;
    minLength?: number;
    maxLength?: number;
    usePopoverForTags?: boolean;
    value?: string | number | readonly string[] | {
        id: string;
        text: string;
    }[];
    autocompleteFilter?: (option: string) => boolean;
    direction?: 'row' | 'column';
    onInputChange?: (value: string) => void;
    customTagRenderer?: (tag: Tag, isActiveTag: boolean) => React.ReactNode;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onTagClick?: (tag: Tag) => void;
    draggable?: boolean;
    inputFieldPosition?: 'bottom' | 'top';
    clearAll?: boolean;
    onClearAll?: () => void;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    restrictTagsToAutocompleteOptions?: boolean;
    inlineTags?: boolean;
    activeTagIndex: number | null;
    setActiveTagIndex: React.Dispatch<React.SetStateAction<number | null>>;
    styleClasses?: TagInputStyleClassesProps;
    usePortal?: boolean;
    addOnPaste?: boolean;
    addTagsOnBlur?: boolean;
    generateTagId?: () => string;
}
declare const TagInput: React.ForwardRefExoticComponent<TagInputProps & React.RefAttributes<HTMLInputElement>>;

export { Delimiter, Tag, TagInput, TagInputProps, TagInputStyleClassesProps };
