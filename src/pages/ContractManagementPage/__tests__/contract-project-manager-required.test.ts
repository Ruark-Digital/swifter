import { schema } from "../components/CreateContractSheet";

describe("contract form schema — project manager", () => {
  it("rejects an empty or blank project manager", async () => {
    await expect(schema.validateAt("projectManager", { projectManager: "" })).rejects.toThrow(
      "Project Manager is required",
    );
    await expect(schema.validateAt("projectManager", { projectManager: "   " })).rejects.toThrow(
      "Project Manager is required",
    );
  });

  it("accepts a selected id or a typed email", async () => {
    await expect(
      schema.validateAt("projectManager", { projectManager: "64b0c0ffee0000000000abcd" }),
    ).resolves.toBeTruthy();
    await expect(
      schema.validateAt("projectManager", { projectManager: "pm@example.com" }),
    ).resolves.toBeTruthy();
  });
});
