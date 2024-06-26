import { useEffect, useState } from "react";
import yaml from "js-yaml";
import biolinkModel from "./data/biolink-model.yaml";
import {
  full as biolinkSchema,
  type BiolinkSchema,
} from "./validation/biolink/full";

interface TreeNode<T extends TreeNode<T>> {
  uuid: string;
  parent: T | null;
  children: T[];
  mixinParents: T[];
  mixinChildren: T[];
}

interface ClassNode extends TreeNode<ClassNode> {
  name: string;
  abstract: boolean;
  mixin: boolean;

  slotUsage?: {
    subject?: ClassNode;
    predicate?: SlotNode;
    object?: ClassNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [qualifiers: string]: any;
  };
}

const newClassNode = (name: string): ClassNode => ({
  name,
  uuid: crypto.randomUUID(),
  parent: null,
  children: [],
  mixinParents: [],
  mixinChildren: [],
  abstract: false,
  mixin: false,
});

interface SlotNode extends TreeNode<SlotNode> {
  name: string;
  abstract: boolean;
  mixin: boolean;
}

const newSlotNode = (name: string): SlotNode => ({
  name,
  uuid: crypto.randomUUID(),
  parent: null,
  children: [],
  mixinParents: [],
  mixinChildren: [],
  abstract: false,
  mixin: false,
});

type Enums = BiolinkSchema["enums"];
type Enum = Enums[keyof Enums];

interface Model {
  classes: {
    treeRootNodes: ClassNode[];
    lookup: Map<string, ClassNode>;
  };
  slots: {
    treeRootNodes: SlotNode[];
    lookup: Map<string, SlotNode>;
  };
  associations: ClassNode;
  qualifiers: ClassNode;
  enums: Enums;
}

type Qualifier = {
  qualifier: SlotNode;
  range?: Enum | ClassNode;
  subpropertyOf?: SlotNode;
};

type Association = {
  association: ClassNode;
  inheritedRanges: {
    subject: ClassNode;
    predicate: SlotNode;
    object: ClassNode;
  };
  qualifiers: Qualifier[];
  level: number;
};

const buildJsxTree = (rootItems: ClassNode[]) =>
  rootItems.map(({ uuid, name, children }) => (
    <li key={uuid}>
      {name}
      {children.length > 0 ? (
        <ul style={{ backgroundColor: "white" }}>{buildJsxTree(children)}</ul>
      ) : null}
    </li>
  ));

const flattenTree = <T extends TreeNode<T>>(
  root: T,
  includeMixins = true
): TreeNode<T>[] => {
  const items: TreeNode<T>[] = [root];
  if (root.children) {
    for (const child of root.children) {
      items.push(...flattenTree(child, includeMixins));
    }
  }
  if (root.mixinChildren && includeMixins === true) {
    for (const mixinChild of root.mixinChildren) {
      items.push(...flattenTree(mixinChild, includeMixins));
    }
  }
  return items;
};

function App() {
  const [initializing, setInitializing] = useState(true);
  const [time, setTime] = useState<null | number>(null);

  const [subject, setSubject] = useState<ClassNode | undefined>(undefined);
  const [predicate, setPredicate] = useState<SlotNode | undefined>(undefined);
  const [object, setObject] = useState<ClassNode | undefined>(undefined);

  const [subjectOptions, setSubjectOptions] = useState<ClassNode[]>([]);
  const [predicateOptions, setPredicateOptions] = useState<SlotNode[]>([]);
  const [objectOptions, setObjectOptions] = useState<ClassNode[]>([]);

  const [validAssociations, setValidAssociations] = useState<Association[]>([]);
  const [selectedAssociation, setSelectedAssociation] =
    useState<Association | null>(null);

  const [model, setModel] = useState<Model | null>(null);

  useEffect(() => {
    (async () => {
      const yamlString = await fetch(biolinkModel).then((res) => res.text());
      const t0 = performance.now();
      const biolinkJson = yaml.load(yamlString);
      const flatModel: BiolinkSchema = biolinkSchema.parse(biolinkJson);

      const slotRootItems: SlotNode[] = [];
      const slotLookup = new Map<string, SlotNode>();
      for (const [name, slot] of Object.entries(flatModel.slots)) {
        if (!slotLookup.has(name)) {
          slotLookup.set(name, newSlotNode(name));
        }

        const thisNode = slotLookup.get(name)!;

        const parentName = slot.is_a ?? null;
        if (!parentName) {
          slotRootItems.push(thisNode);
        } else {
          if (!slotLookup.has(parentName)) {
            slotLookup.set(parentName, newSlotNode(parentName));
          }

          const parentNode = slotLookup.get(parentName)!;
          parentNode.children.push(thisNode);
          thisNode.parent = parentNode;
        }

        thisNode.abstract = slot.abstract ?? false;
        thisNode.mixin = slot.mixin ?? false;

        // this node has mixins parents
        const mixinNames = slot.mixins ?? null;
        if (mixinNames) {
          for (const mixinName of mixinNames) {
            if (!slotLookup.has(mixinName)) {
              slotLookup.set(mixinName, newSlotNode(mixinName));
            }

            const mixinNode = slotLookup.get(mixinName)!;
            mixinNode.mixinChildren.push(thisNode);
            thisNode.mixinParents.push(mixinNode);
          }
        }
      }

      const rootItems: ClassNode[] = [];
      const lookup = new Map<string, ClassNode>();
      for (const [name, cls] of Object.entries(flatModel.classes)) {
        if (!lookup.has(name)) {
          lookup.set(name, newClassNode(name));
        }

        const thisNode = lookup.get(name)!;

        const parentName = cls.is_a ?? null;
        if (!parentName) {
          rootItems.push(thisNode);
        } else {
          if (!lookup.has(parentName)) {
            lookup.set(parentName, newClassNode(parentName));
          }

          const parentNode = lookup.get(parentName)!;
          parentNode.children.push(thisNode);
          thisNode.parent = parentNode;
        }

        thisNode.abstract = cls.abstract ?? false;
        thisNode.mixin = cls.mixin ?? false;

        if (cls.slot_usage) {
          thisNode.slotUsage = cls.slot_usage;

          thisNode.slotUsage.subject = cls.slot_usage.subject?.range
            ? lookup.get(cls.slot_usage.subject?.range)
            : undefined;

          thisNode.slotUsage.object = cls.slot_usage.object?.range
            ? lookup.get(cls.slot_usage.object?.range)
            : undefined;

          thisNode.slotUsage.predicate = cls.slot_usage.predicate
            ?.subproperty_of
            ? slotLookup.get(cls.slot_usage.predicate?.subproperty_of)
            : undefined;
        }

        // this node has mixins parents
        const mixinNames = cls.mixins ?? null;
        if (mixinNames) {
          for (const mixinName of mixinNames) {
            if (!lookup.has(mixinName)) {
              lookup.set(mixinName, newClassNode(mixinName));
            }

            const mixinNode = lookup.get(mixinName)!;
            mixinNode.mixinChildren.push(thisNode);
            thisNode.mixinParents.push(mixinNode);
          }
        }
      }

      setModel({
        classes: {
          treeRootNodes: rootItems,
          lookup,
        },
        slots: {
          treeRootNodes: slotRootItems,
          lookup: slotLookup,
        },
        associations: lookup.get("association")!,
        qualifiers: slotLookup.get("qualifier")!,
        enums: flatModel.enums,
      });

      // console.log("Classes", lookup);
      // console.log("Slots", slotLookup);
      // console.log("qualifier", slotLookup.get("qualifier")!);

      const namedThings: ClassNode[] = [];
      const traverse = (nodes: ClassNode[]) => {
        for (const node of nodes) {
          if (!node.abstract && !node.mixin) {
            namedThings.push(node);
          }
          traverse(node.children);
        }
      };
      traverse([lookup.get("named thing")!]);

      const relatedTo: SlotNode[] = [];
      const traverseSlots = (nodes: SlotNode[]) => {
        for (const node of nodes) {
          if (!node.abstract && !node.mixin) {
            relatedTo.push(node);
          }
          traverseSlots(node.children);
        }
      };
      traverseSlots([slotLookup.get("related to")!]);

      setSubjectOptions(namedThings);
      setSubject(lookup.get("chemical entity")!);

      setPredicateOptions(relatedTo);
      setPredicate(slotLookup.get("affects")!);

      setObjectOptions(namedThings);
      setObject(lookup.get("gene")!);

      setTime(performance.now() - t0);
      setInitializing(false);
    })();
  }, []);

  useEffect(() => {
    if (!subject || !predicate || !object || !model) return;

    const validAssociations: Association[] = [];

    const isInRange = <T extends TreeNode<T>>(
      n: TreeNode<T>,
      range: TreeNode<T>
    ): boolean => {
      const traverse = (nodes: TreeNode<T>[], search: TreeNode<T>): boolean => {
        for (const n of nodes) {
          if (n === search) return true;
          if (n.parent) {
            if (traverse([n.parent], search)) return true;
          }
          if (n.mixinParents) {
            if (traverse(n.mixinParents, search)) return true;
          }
        }
        return false;
      };
      return traverse([n], range);
    };

    /**
     * Get the inherited subject/predicate/object ranges for an association
     */
    const getInheritedSPORanges = (
      association: ClassNode
    ): { subject: ClassNode; predicate: SlotNode; object: ClassNode } => {
      const namedThing = model.classes.lookup.get("named thing")!;
      const relatedTo = model.slots.lookup.get("related to")!;

      const traverse = (
        nodes: ClassNode[],
        part: "subject" | "object" | "predicate"
      ): ClassNode | SlotNode | null => {
        for (const node of nodes) {
          if (node.slotUsage?.[part]) return node.slotUsage[part]!;
          if (node.parent) {
            const discoveredType = traverse([node.parent], part);
            if (discoveredType !== null) return discoveredType;
          }
          if (node.mixinParents) {
            const discoveredType = traverse(node.mixinParents, part);
            if (discoveredType !== null) return discoveredType;
          }
        }

        return null;
      };

      const subject = traverse([association], "subject") ?? namedThing;
      const predicate = traverse([association], "predicate") ?? relatedTo;
      const object = traverse([association], "object") ?? namedThing;

      return { subject, predicate, object };
    };

    // DFS over associations
    const traverse = (nodes: ClassNode[], level = 0) => {
      for (const association of nodes) {
        if (association.slotUsage && !association.abstract) {
          const inherited = getInheritedSPORanges(association);

          const validSubject = isInRange(subject, inherited.subject);
          const validObject = isInRange(object, inherited.object);
          const validPredicate = isInRange(predicate, inherited.predicate);

          const qualifiers: Qualifier[] = Object.entries(association.slotUsage)
            .map(([qualifierName, properties]) => {
              if (properties === null) return null;
              const qualifier = model.slots.lookup.get(qualifierName);
              if (!qualifier || !isInRange(qualifier, model.qualifiers))
                return null;

              let range: Enum | ClassNode | undefined = undefined;
              if (properties.range) {
                const potentialEnum: Enum | undefined =
                  model.enums[properties.range];
                const potentialClassNode: ClassNode | undefined =
                  model.classes.lookup.get(properties.range);

                if (potentialEnum) range = potentialEnum;
                if (potentialClassNode) range = potentialClassNode;
              }

              let subpropertyOf: SlotNode | undefined = undefined;
              if (
                properties.subproperty_of &&
                model.slots.lookup.has(properties.subproperty_of)
              ) {
                subpropertyOf = model.slots.lookup.get(
                  properties.subproperty_of
                );
              }

              return {
                qualifier,
                range,
                subpropertyOf,
              };
            })
            .filter(<T,>(q: T | null): q is T => q !== null);

          if (validSubject && validObject && validPredicate) {
            validAssociations.push({
              association,
              inheritedRanges: inherited,
              level,
              qualifiers,
            });
          }
        }
        traverse(association.children, level + 1);
      }
    };
    traverse([model.associations]);

    validAssociations.sort((a, b) => b.level - a.level);

    console.log(validAssociations);
    setValidAssociations(validAssociations);
    setSelectedAssociation(validAssociations[0] ?? null);
  }, [subject, predicate, object, model]);

  if (!model) return "Loading!";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {time === null ? (
        <p>Loading...</p>
      ) : (
        <p>Finished in {time.toFixed(2)}ms</p>
      )}

      <label>
        Subject:
        <select
          value={subject?.name}
          onChange={(e) =>
            setSubject(model.classes.lookup.get(e.target.value)!)
          }
          disabled={initializing}
        >
          {subjectOptions
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((opt) => (
              <option key={opt.uuid} value={opt.name}>
                {opt.name}
              </option>
            ))}
        </select>
      </label>

      <label>
        Predicate:
        <select
          value={predicate?.name}
          onChange={(e) =>
            setPredicate(model.slots.lookup.get(e.target.value)!)
          }
          disabled={initializing}
        >
          {predicateOptions
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((opt) => (
              <option key={opt.uuid} value={opt.name}>
                {opt.name}
              </option>
            ))}
        </select>
      </label>

      <label>
        Object:
        <select
          value={object?.name}
          onChange={(e) => setObject(model.classes.lookup.get(e.target.value)!)}
          disabled={initializing}
        >
          {objectOptions
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((opt) => (
              <option key={opt.uuid} value={opt.name}>
                {opt.name}
              </option>
            ))}
        </select>
      </label>

      <br />

      <label>
        Association:
        <select
          value={selectedAssociation?.association.name}
          onChange={(e) => {
            setSelectedAssociation(
              validAssociations.find(
                (a) => a.association.name === e.target.value
              ) ?? null
            );
          }}
        >
          {validAssociations.map(({ association }) => (
            <option key={association.uuid} value={association.name}>
              {association.name}
            </option>
          ))}
        </select>
      </label>

      <br />

      {selectedAssociation &&
        selectedAssociation.qualifiers.map(
          ({ qualifier, range, subpropertyOf }) => (
            <label key={qualifier.name}>
              {qualifier.name}
              {/* THIS needs to be fixed, fix types */}
              <select>
                {range &&
                  // @ts-expect-error idk
                  (range.permissible_values // Enum
                    ? // @ts-expect-error idk
                      Object.keys(range.permissible_values).map((name) => (
                        <option key={name}>{name}</option>
                      ))
                    : // ClassNode
                      // @ts-expect-error idk
                      flattenTree(range).map(({ name, uuid }) => (
                        <option key={uuid}>{name}</option>
                      )))}

                {subpropertyOf &&
                  // @ts-expect-error idk
                  flattenTree(subpropertyOf).map(({ name, uuid }) => (
                    <option key={uuid}>{name}</option>
                  ))}
              </select>
            </label>
          )
        )}
    </div>
  );
}

export default App;
