import { z } from "zod";
import { mappings } from "./common";

export const slots = z.record(z.object({
  is_a: z.string(),
  mixin: z.boolean(),
  mixins: z.array(z.string()),
  abstract: z.boolean(),
  inherited: z.boolean(),
  is_class_field: z.boolean(),
  inlined_as_list: z.boolean(),
  deprecated: z.boolean(),
  deprecated_element_has_exact_replacement: z.string(),
  identifier: z.boolean(),
  values_from: z.array(z.string()),
  inverse: z.string(),
  slot_uri: z.string(),
  aliases: z.array(z.string()),
  description: z.string(),
  notes: z.array(z.string()).or(z.string()),
  comments: z.array(z.string()).or(z.string()),
  see_also: z.array(z.string()).or(z.string()),
  id_prefixes: z.array(z.string()),
  designates_type: z.boolean(),
  domain: z.string(),
  range: z.string(),
  multivalued: z.boolean(),
  required: z.boolean(),
  in_subset: z.array(z.string()).or(z.string()),
  local_names: z.record(z.string()),
  ifabsent: z.string(),
  symmetric: z.boolean(),
  examples: z.array(z.unknown()),
  annotations: z.object({
    canonical_predicate: z.boolean(),
    denormalized: z.boolean(),
    opposite_of: z.string(),
    description: z.string(),
  }).partial(),
}).merge(mappings).partial())