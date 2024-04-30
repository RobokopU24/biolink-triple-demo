import { z } from "zod";

const mappings = z.object({
  mappings: z.array(z.string()),
  broad_mappings: z.array(z.string()).nullish(),
  close_mappings: z.array(z.string()).nullish(),
  narrow_mappings: z.array(z.string()).nullish(),
  exact_mappings: z.array(z.string()).nullish(),
  related_mappings: z.array(z.string()).nullish(),
});

export const biolinkSchema = z.object({
  id: z.string().url(),
  name: z.string(),
  description: z.string(),
  license: z.string().url(),
  prefixes: z.record(z.string().url()),
  default_prefix: z.string(),
  default_range: z.string(),
  default_curi_maps: z.array(z.string()),
  emit_prefixes: z.array(z.string()),
  subsets: z.object({
    model_organism_database: z.object({
      description: z.string(),
    }).strict(),
    translator_minimal: z.object({
      description: z.string(),
    }).strict(),
    samples: z.object({
      description: z.string(),
    }).strict(),
    testing: z.object({
      description: z.string(),
    }).strict(),
  }).strict(),
  imports: z.array(z.string()),
  types: z.record(z.object({
    description: z.string(),
    typeof: z.string(),
    url: z.string(),
    base: z.string(),
    notes: z.array(z.string()),
    aliases: z.array(z.string()),
    id_prefixes: z.array(z.string()),
  }).merge(mappings).partial()),

  slots: z.record(z.object({
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
    in_subset: z.array(z.string()).or(z.string()), // only 'occurs together in literature with' isn't a string array
    local_names: z.object({
      ga4gh: z.string(),
      neo4j: z.string(),
      translator: z.string(),
      agr: z.string(),
    }).partial(),
    ifabsent: z.string(),
    symmetric: z.boolean(),
    examples: z.array(z.unknown()),
    annotations: z.object({
      canonical_predicate: z.boolean(),
      denormalized: z.boolean(),
      opposite_of: z.string(),
      description: z.string(),
    }).partial(),
  }).merge(mappings).partial()),

  classes: z.record(z.object({
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
    examples: z.array(z.object({
      value: z.string(),
      description: z.string(),
    }).partial()).or(z.unknown()),
    see_also: z.array(z.string()).or(z.string()),
    values_from: z.array(z.string()),
    aliases: z.array(z.string()),
    defining_slots: z.array(z.enum(["subject", "object", "predicate", "subject aspect qualifier", "subject context qualifier", "object aspect qualifier", "object context qualifier", "population context qualifier"])),
    id_prefixes: z.array(z.string()),
    in_subset: z.array(z.string()),
    union_of: z.array(z.string()),
    local_names: z.object({
      ga4gh: z.string(),
      neo4j: z.string(),
      translator: z.string(),
      agr: z.string(),
    }).partial(),
    slots: z.array(z.string()),
    slot_usage: z.record(z.object({
      description:  z.string(),
      required: z.boolean(),
      multivalued: z.boolean(),
      domain: z.string(),
      range: z.string(),
      examples: z.array(z.object({
        value: z.string(),
        description: z.string(),
      }).partial())
    }).merge(mappings).partial().nullable()),
  }).merge(mappings).partial().strict()),

  enums: z.record(z.object({
    description: z.string().nullish(),
    permissible_values: z.record(z.object({
      is_a: z.string(),
      description: z.string(),
      notes: z.string(),
      aliases: z.array(z.string()),
      meaning: z.string(),
    }).merge(mappings).partial().nullish())
  }))
}); // TODO: add strict