import { useEffect, useState } from "react"
import yaml from 'js-yaml';
import biolinkModel from "./data/biolink-model.yaml";
import { full as biolinkSchema, type BiolinkSchema } from "./validation/biolink/full";

interface TreeNode {
  parent: TreeNode | null;
  children: TreeNode[];
}

interface ClassNode extends TreeNode {
  name: string
}

// interface Model {
//   namedThings: ClassNode;
// }

function App() {
  const [initializing, setInitializing] = useState(true);
  const [time, setTime] = useState<null | number>(null);

  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [predicate, setPredicate] = useState<string | undefined>(undefined);
  const [object, setObject] = useState<string | undefined>(undefined);

  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [predicateOptions, setPredicateOptions] = useState<string[]>([]);
  const [objectOptions, setObjectOptions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const yamlString = await fetch(biolinkModel).then((res) => res.text());
      const t0 = performance.now()
      const biolinkJson = yaml.load(yamlString);
      const flatModel: BiolinkSchema = biolinkSchema.parse(biolinkJson);

      const rootItems: ClassNode[] = [];
      const lookup = new Map<string, ClassNode>();
      for (const [name, cls] of Object.entries(flatModel.classes)) {
        if (!lookup.has(name)) {
          lookup.set(name, {
            name,
            parent: null,
            children: [],
          });
        }

        const thisNode = lookup.get(name)!;

        const parentName = cls.is_a ?? null;
        if(!parentName) {
          rootItems.push(thisNode);
        }
        else {
          if(!lookup.has(parentName)) {
            lookup.set(parentName, { name: parentName, children: [], parent: null })
          }
          
          const parentNode = lookup.get(parentName)!;
          parentNode.children.push(thisNode);
          thisNode.parent = parentNode;
        }
      }

      // console.log(rootItems);
      console.log(lookup)

      setTime(performance.now() - t0);
      setSubjectOptions([])
      setPredicateOptions([])
      setObjectOptions([])
      setInitializing(false);
    })();
  }, []);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column'}} >
      {
        time === null ? <p>Loading...</p> : <p>Finished in {time.toFixed(2)}ms</p>
      }
      
      <label>
        Subject:
        <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={initializing}>
          {subjectOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>

      <label>
        Predicate:
        <select value={predicate} onChange={(e) => setPredicate(e.target.value)} disabled={initializing}>
          {predicateOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>

      <label>
        Object:
        <select value={object} onChange={(e) => setObject(e.target.value)} disabled={initializing}>
          {objectOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>
    </div>
  )
}

export default App;
