import { z } from "zod";
import { mappings } from "./common";
import { slots } from "./slots";
import { classes } from "./classes";
import { enums } from "./enums";

export const full = z.object({
  id: z.string().url(),
  name: z.string(),
  description: z.string(),
  license: z.string().url(),
  prefixes: z.record(z.string().url()),
  default_prefix: z.string(),
  default_range: z.string(),
  default_curi_maps: z.array(z.string()),
  emit_prefixes: z.array(z.string()),
  subsets: z.record(z.object({
    description: z.string(),
  }).partial()),
  imports: z.array(z.string()),
  types: z.record(z.object({
    description: z.string(),
    typeof: z.string(),
    url: z.string(),
    base: z.string(),
    notes: z.array(z.string()),
    aliases: z.array(z.string()),
    id_prefixes: z.array(z.string()),
    uri: z.string(),
  }).merge(mappings).partial()),

  slots,
  classes,
  enums,
});

export interface BiolinkSchema extends z.infer<typeof full> {}