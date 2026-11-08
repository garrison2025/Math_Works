/** R111 verified public reference pages. External standards are context, not approval.
 * They do not certify our grade alignment or validate printable PDF calibration.
 */
export type GeoReference={url:string;label:string;context:string};
export const GEO_REFERENCES:Readonly<Record<string,GeoReference>>={
 "two-step-equations-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/8/EE/",
  label:"Common Core: Grade 8 Expressions & Equations",
  context:"Reference for one-variable equation terminology, not certification of this worksheet."
 },
 "long-division-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/NS/",
  label:"Common Core: Grade 6 Number System",
  context:"Includes multi-digit division using the standard algorithm."
 },
 "adding-unlike-fractions-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/NF/",
  label:"Common Core: Grade 5 Fractions",
  context:"Describes using equivalent fractions to add unlike denominators."
 },
 "equivalent-fractions-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/NF/",
  label:"Common Core: Grade 5 Fractions",
  context:"Describes equivalent forms as a strategy for fraction operations."
 },
 "area-of-triangles-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/G/",
  label:"Common Core: Grade 6 Geometry",
  context:"Covers area of triangles by composing or decomposing shapes."
 },
 "volume-of-rectangular-prisms-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/MD/",
  label:"Common Core: Grade 5 Measurement & Data",
  context:"Describes rectangular-prism volume and cubic-unit reasoning."
 },
 "surface-area-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/G/",
  label:"Common Core: Grade 6 Geometry",
  context:"Discusses solid nets and surface-area calculations."
 },
 "mean-median-mode-range-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/SP/",
  label:"Common Core: Grade 6 Statistics & Probability",
  context:"Discusses data distributions, center and variability; it does not prescribe every summary statistic."
 },
 "box-plots-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/SP/",
  label:"Common Core: Grade 6 Statistics & Probability",
  context:"Discusses box plots; the standard does not specify our exclusive median-of-halves quartile rule."
 },
 "printable-protractor":{
  url:"https://www.thecorestandards.org/Math/Content/4/MD/",
  label:"Common Core: Grade 4 Measurement & Data",
  context:"Describes measuring angles with a protractor; physical printer calibration remains our separate safety instruction."
 }
 "multiplication-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/4/NBT/B/5/",
  label:"Common Core: Grade 4 Multi-Digit Multiplication",
  context:"This standard describes place-value strategies for multi-digit multiplication; it is reference context, not certification that every optional practice mode matches a grade."
 },
 "mixed-addition-subtraction-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/4/NBT/B/4/",
  label:"Common Core: Grade 4 Multi-Digit Addition & Subtraction",
  context:"This standard describes standard-algorithm addition and subtraction of multi-digit whole numbers; our decimal extension and negative-difference examples are not a grade certification."
 },
 "pythagorean-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/8/G/",
  label:"Common Core: Grade 8 Geometry",
  context:"The geometry domain includes applying the Pythagorean Theorem to unknown side lengths; this is a reference, not certification of the worksheet."
 },
 "multiplication-tables-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/3/OA/C/7/",
  label:"Common Core: Grade 3 Multiplication Fluency",
  context:"This standard addresses fluency with one-digit products; the 1–12 printable chart is a practice reference, not a grade-level certification."
 },
 "subtraction-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/4/NBT/B/4/",
  label:"Common Core: Grade 4 Multi-Digit Subtraction",
  context:"This standard describes fluency with multi-digit whole-number subtraction using the standard algorithm; it does not certify every generated item."
 },
 "one-step-equations-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/6/EE/",
  label:"Common Core: Expressions & Equations",
  context:"This domain includes reasoning about and solving one-variable equations; our integer generator and optional rational packs have narrower feature scopes than the full domain."
 },
 "decimal-multiplication-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/NBT/B/7/",
  label:"Common Core: Grade 5 Decimal Operations",
  context:"This standard includes multiplication of decimals to hundredths; our generator uses one- or two-decimal-place factors and does not certify grade alignment."
 },
 "fractions-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/NF/",
  label:"Common Core: Grade 5 Number & Operations—Fractions",
  context:"This domain covers equivalent fractions and fraction operations; our page implements the listed arithmetic modes, not every standard or word-problem requirement."
 },
 "two-digit-multiplication-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/4/NBT/B/5/",
  label:"Common Core: Grade 4 Two-Digit Multiplication",
  context:"This standard describes multiplying two two-digit whole numbers with place-value strategies; it is not a certification of the entire site or other factor ranges."
 },
 "order-of-operations-worksheets":{
  url:"https://www.thecorestandards.org/Math/Content/5/OA/",
  label:"Common Core: Grade 5 Operations & Algebraic Thinking",
  context:"This domain addresses numerical expressions with grouping symbols; our exercises cover selected parentheses, powers and arithmetic operations only."
 },
} as const;
