// QA #89 ("New user (View Only) is unable to complete their registration").
//
// OnboardingPage (the generic /onboarding/:encodedData → POST /onboarding/user-accept
// flow used by internal, view-only users) keeps the invite `token` in React state.
// It starts as "" and is only populated after the encrypted invite link is
// decrypted in a mount effect. `onSubmit` is wrapped in useCallback, and its other
// dependencies (mutateAsync, the zustand setters, toast, navigate) are all stable
// references — so if `token` is left OUT of the dependency array, the callback is
// created once on the first render (token still "") and never recreated. It then
// submits token:"" forever, and the backend rejects it with HTTP 400
// "Invalid or expired invite token" — exactly the "Registration failed … status
// code 400" toast QA reported.
//
// PmOnboardingPage / VendorOnboardingPage don't hit this because their onSubmit is a
// plain (non-memoized) function that reads `token` fresh on every render.
//
// This page can't be driven in jsdom (CryptoJS decryption + Radix timezone select),
// so — matching vendor-onboarding-no-premature-submit.test.ts — this guards the
// SOURCE invariant that actually prevents the regression: whatever `onSubmit`'s
// dependency array is, it must include `token`.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("OnboardingPage — invite token is not captured stale (QA #89)", () => {
  const source = readFileSync("src/pages/OnboardingPage/index.tsx", "utf8");

  it("submits the token via a useMutation call keyed on the decrypted invite token", () => {
    // The payload sent to /onboarding/user-accept must carry the token from state.
    expect(source).toContain('url: "/onboarding/user-accept"');
    expect(source).toMatch(/mutateAsync\(\{[\s\S]*?\btoken\b[\s\S]*?\}\)/);
  });

  it("includes `token` in the onSubmit useCallback dependency array", () => {
    expect(source).toContain("const onSubmit = useCallback(");

    // The useCallback dependency array (the `[mutateAsync, …]` literal) must list
    // `token`. Matching an array that starts with the known-stable `mutateAsync`
    // dependency and contains `token` avoids depending on the exact ordering of
    // the other deps.
    expect(source).toMatch(/\[\s*mutateAsync\b[^\]]*\btoken\b[^\]]*\]/);
  });
});
