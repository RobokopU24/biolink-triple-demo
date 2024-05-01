import { z } from "zod";

export const mappings = z.object({
  mappings: z.array(z.string()),
  broad_mappings: z.array(z.string()).nullish(),
  close_mappings: z.array(z.string()).nullish(),
  narrow_mappings: z.array(z.string()).nullish(),
  exact_mappings: z.array(z.string()).nullish(),
  related_mappings: z.array(z.string()).nullish(),
});