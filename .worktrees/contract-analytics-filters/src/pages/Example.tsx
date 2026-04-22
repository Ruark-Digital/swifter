import { TextInput } from "@/components/layouts/FormInputs";
import { Button } from "@/components/ui/button";
import { Forge, useForge, useForgeValues } from "@/lib/forge";

function Example() {
  const { control } = useForge({
    fields: [
      {
        name: "name",
        type: "text",
        label: "Name",
        component: TextInput,
      },
    ],
  });

  const { setValue } = useForgeValues({ control });

  return (
    <div className="grid place-items-center h-screen">
      <Forge control={control} onSubmit={() => {}} />
      <Button onClick={() => setValue('name', 'John Doe')}>Update field</Button>
    </div>
  );
}

export default Example;
