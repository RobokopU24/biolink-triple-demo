import { z } from "zod";
import { mappings } from "./common";

export const classes = z.record(
  z
    .object({
      is_a: z.string(),
      mixin: z.boolean(),
      mixins: z.array(z.string()),
      abstract: z.boolean(),
      tree_root: z.boolean(),
      deprecated: z.boolean(),
      description: z.string().nullish(),
      alt_descriptions: z.record(z.string()),
      notes: z.array(z.string()).or(z.string()),
      comments: z.array(z.string()),
      examples: z.unknown(),
      see_also: z.array(z.string()).or(z.string()),
      values_from: z.array(z.string()),
      aliases: z.array(z.string()),
      defining_slots: z.array(z.string()),
      id_prefixes: z.array(z.string()),
      in_subset: z.array(z.string()),
      union_of: z.array(z.string()),
      local_names: z.record(z.string()),
      slots: z.array(z.string()),
      slot_usage: z.record(
        z
          .object({
            description: z.string(),
            required: z.boolean(),
            multivalued: z.boolean(),
            domain: z.string(),
            range: z.string(),
            subproperty_of: z.string(),
            symmetric: z.boolean(),
            values_from: z.array(z.string()),
            role: z.string(),
            aliases: z.array(z.string()),
            examples: z.unknown(),
          })
          .merge(mappings)
          .passthrough()
          .partial()
          .nullable()
      ),
    })
    .merge(mappings)
    .partial()
);
