import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { Forger } from "@adexdsamson/forge";
import { Option } from "@/components/ui/multiselect";
import { TextMultiSelect } from "@/components/layouts/FormInputs/TextSelect";
import { RoleOption, filterOptionsByCombo } from "@/lib/roleCombos";

type RoleComboFieldProps = {
  // Forge control (ForgeControl). Typed as `any` to match how control is
  // passed elsewhere in the codebase (see TextSelectProps.control).
  control: any;
  options: RoleOption[];
  label?: string | JSX.Element;
  name?: string;
};

/**
 * Forge field for assigning 1–2 roles with live pair-enforcement (QA #177).
 * Watches the current selection and narrows the option list so only valid
 * combinations (approver+evaluator, contract_manager+procurement) can be built;
 * `maxCount={2}` caps the count. The field value is `Option[]`; callers map to
 * `roles: string[]` of ids on submit.
 */
export const RoleComboField = ({
  control,
  options,
  label = "Role(s) *",
  name = "roles",
}: RoleComboFieldProps) => {
  const selected = (useWatch({ control, name }) as Option[] | undefined) ?? [];
  const selectedKey = selected.map((o) => o.value).join(",");

  const visibleOptions = useMemo(
    () => filterOptionsByCombo(options, selectedKey ? selectedKey.split(",") : []),
    [options, selectedKey]
  );

  return (
    <Forger
      name={name}
      component={TextMultiSelect}
      label={label}
      placeholder="Select up to 2 roles"
      options={visibleOptions}
      maxCount={2}
      containerClass="space-y-1"
    />
  );
};

export default RoleComboField;
