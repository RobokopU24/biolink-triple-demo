import { z } from "zod";
import { mappings } from "./common";

export const enums = z.record(z.object({
  description: z.string().nullish(),
  in_subset: z.array(z.string()),
  permissible_values: z.record(z.object({
    is_a: z.string(),
    description: z.string(),
    notes: z.string(),
    aliases: z.array(z.string()),
    meaning: z.string(),
  }).merge(mappings).partial().nullish())
}).partial())