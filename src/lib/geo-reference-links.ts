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
} as const;
