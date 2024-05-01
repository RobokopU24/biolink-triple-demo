import { useEffect } from "react"
import yaml from 'js-yaml';
import biolinkModel from "./data/biolink-model.yaml";
import { biolinkSchema } from "./validation/biolink/full";

function App() {
  useEffect(() => {
    (async () => {
      const yamlString = await fetch(biolinkModel).then((res) => res.text());
      const model = yaml.load(yamlString);
      const t0 = performance.now()
      const parsed = biolinkSchema.safeParse(model);
      if(parsed.success) {
        // parsed.data.slots["adas"]
      }
      console.log((performance.now() - t0).toFixed(2), parsed.success ? parsed.data : parsed.error.issues);
      
    })();
  }, []);
  
  return (
    <>
      Hello
    </>
  )
}

export default App;
