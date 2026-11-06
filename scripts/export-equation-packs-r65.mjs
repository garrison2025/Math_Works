/** R65 deterministic printable evidence for independent PyMuPDF + fractions.Fraction audit. */
import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createEquationPack} from '../src/lib/equation-packs.ts';
import {createEquationPackPdf} from '../src/lib/equation-pack-pdf.ts';
const out='qa-artifacts/r65-equation-packs';await mkdir(out,{recursive:true});
const manifest=[];
for(const topic of ['one-step-equations-worksheets','two-step-equations-worksheets']){
 for(const kind of ['decimal','fraction']){
  const options=topic.startsWith('one')?{operation:'mixed'}:{coefficient:'mixed'};
  const pack=createEquationPack(topic,kind,20261106,8,'standard',options);
  for(const paper of ['Letter','A4'])for(const mode of ['questions','answers','steps']){
   const name=topic+'-'+kind+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
   const pdf=await createEquationPackPdf(pack,mode,paper);
   await writeFile(join(out,name),pdf);
   manifest.push({name,topic,kind,paper,mode,seed:pack.seed,quantity:pack.quantity,
    expected:pack.questions.map(q=>({id:q.id,question:q.question,answer:q.answer,steps:q.steps}))});
  }
 }
}
await writeFile(join(out,'r65-exact-question-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('R65 exported 24 A4/Letter exact equation PDFs and matching 192 question/answer references');
