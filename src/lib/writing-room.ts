/** R54: PDF-only writing-space preference. Does not modify worksheet identity,
 * problem generation, answers, or the grade-level optionsFingerprint.
 */
export type WritingRoom='standard'|'extra';
export function extraWritingRules(topicId:string,mode:string,diagramKind:string|undefined,preference:WritingRoom):number{
 if(preference!=='standard'&&preference!=='extra')
  throw Error('Invalid PDF writing space preference');
 if(preference!=='extra'||mode!=='questions')return 0;
 // Measurement instruments and already enlarged long-division work areas are
 // self-contained; adding a ruled strip would be misleading or redundant.
 if(topicId==='printable-protractor'||diagramKind==='protractor'||diagramKind==='long-division')return 0;
 // For a diagram problem, one full-width work line sits UNDER the diagram.
 // For compact text/fact drills, two additional blank pencil lines.
 return diagramKind?1:2;
}
