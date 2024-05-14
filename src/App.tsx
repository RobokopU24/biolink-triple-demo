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

interface Model {
  classes: {
    treeRootNodes: ClassNode[];
    lookup: Map<string, ClassNode>;
  };
}

const buildJsxTree = (rootItems: ClassNode[]) =>
  rootItems.map(({ uuid, name, children }) => (
    <li key={uuid}>
      {name}
      {children.length > 0 ? (
        <ul style={{ backgroundColor: "white" }}>{buildJsxTree(children)}</ul>
      ) : null}
    </li>
  ));

function App() {
  const [initializing, setInitializing] = useState(true);
  const [time, setTime] = useState<null | number>(null);

  const [subject, setSubject] = useState<ClassNode | undefined>(undefined);
  const [predicate, setPredicate] = useState<string | undefined>(undefined);
  const [object, setObject] = useState<ClassNode | undefined>(undefined);

  const [subjectOptions, setSubjectOptions] = useState<ClassNode[]>([]);
  const [predicateOptions, setPredicateOptions] = useState<string[]>([]);
  const [objectOptions, setObjectOptions] = useState<ClassNode[]>([]);

  const [model, setModel] = useState<Model | null>(null);

  useEffect(() => {
    (async () => {
      const yamlString = await fetch(biolinkModel).then((res) => res.text());
      const t0 = performance.now();
      const biolinkJson = yaml.load(yamlString);
      const flatModel: BiolinkSchema = biolinkSchema.parse(biolinkJson);

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
          thisNode.abstract = cls.abstract ?? false;
          thisNode.mixin = cls.mixin ?? false;
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
      });

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

      setTime(performance.now() - t0);
      setSubjectOptions(namedThings);
      setSubject(lookup.get("gene")!);
      setPredicateOptions([]);
      setObjectOptions(namedThings);
      setObject(lookup.get("chemical entity")!);
      setInitializing(false);
    })();
  }, []);

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
          value={predicate}
          onChange={(e) => setPredicate(e.target.value)}
          disabled={initializing}
        >
          {predicateOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
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
    </div>
  );
}

export default App;
