export type Route = {slug:string;tier:string;kd:number;volume:number;example:string;type:'CONDITIONAL_TOOL'|'CONDITIONAL_HUB'|'HOLD';priority:string};
export const titleFor = (slug:string) => slug === 'printable-protractor' ? 'Printable Protractor' : slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export function category(slug:string):string{
 if(/multiplication|division|addition|subtraction|fraction|integer|gcf|decimal|scientific|percentage|place-value|order-of-operations|number-recognition|number-line/.test(slug))return 'Arithmetic & Numbers';
 if(/equation|function|slope|inequal|domain|linear/.test(slug))return 'Algebra & Functions';
 if(/angle|area|volume|surface|triangle|pythagorean|coordinate|protractor|line|ray/.test(slug))return 'Geometry & Graphs';
 return 'Data & Statistics';
}
export const topicIntro=(slug:string)=>{
 const names:Record<string,string>={
  'two-step-equations-worksheets':'Practice solving equations that require undoing two operations. Each sheet includes a matching answer key and worked steps.',
  'one-step-equations-worksheets':'Create addition or multiplication equations with a single unknown and a unique solution.',
  'equivalent-fractions-worksheets':'Find a missing numerator or denominator in equivalent fractions using the same scale factor on top and bottom.',
  'percentages-worksheets':'Convert percentages and fractions, find an exact percentage of a number, or calculate percentage increase and decrease using the original amount as the base.',
  'adding-unlike-fractions-worksheets':'Build confidence with common denominators, fraction addition and reducing exact answers.',
  'mean-median-mode-range-worksheets':'Calculate mean, median, mode and range from realistic data sets: even or odd sample counts, one mode, two modes or no mode, with exact fractional means.',
  'mean-absolute-deviation-worksheets':'Measure variability from 5, 6 or 8 observations, including balanced and right-skewed samples. Mean and mean absolute deviation are calculated as exact simplified fractions.',
  'box-plots-worksheets':'Calculate quartiles and outliers or construct a modified box plot from data, with a separate completed answer diagram.',
  'printable-protractor':'Print a precise 180° protractor and use the included 50 mm calibration bar to verify physical scale.',
  'multiplication-tables-worksheets':'Generate new times-table facts for independent practice and quick classroom warmups.',
  'systems-equations-worksheets':'Solve two-variable linear systems by elimination, and classify parallel or coincident equations with no solution or infinitely many solutions.',
  'domain-range-worksheets':'Find the domain and range of relations, and decide whether repeated inputs with different outputs mean a relation is not a function.',
  'linear-equations-worksheets':'Evaluate linear functions or graph y = mx + b on a blank coordinate plane, then compare with a separately plotted answer key.',
  'function-tables-worksheets':'Complete printable two-row function tables by calculating a missing output or solving backward for a missing input. Separate answer tables reveal the correct cell.'
 };
 return names[slug] || `Create fresh ${titleFor(slug).toLowerCase()} with a reproducible question set, downloadable practice pages and separate answer keys.`;
};
export function howTo(slug:string):string[]{
 if(slug==='percentages-worksheets')return ['To convert a fraction to a percentage, multiply the fraction by 100%. To convert a percentage to a fraction, divide by 100 and reduce.', 'To find a percentage of a number, multiply the amount by the percentage divided by 100. Keep exact decimal places, not a premature rounded approximation.', 'For percentage increase or decrease, divide the change by the ORIGINAL value, then multiply by 100. The final answer is a percentage.'];
 if(slug==='mean-absolute-deviation-worksheets')return ['Add every observation and divide by the sample size to find the exact mean.', 'For each observation subtract the mean and take the absolute value; keep any fractional results exact.', 'Add all the absolute deviations and divide by the total number of observations. Do not round until after checking the exact fraction.'];
 if(slug==='mean-median-mode-range-worksheets')return ['Order the observations from smallest to largest; keep repeated values.', 'For mean, divide the exact sum by the count. For median, average the middle two values when the count is even.', 'For mode, compare frequencies: zero, one or two values can have the highest frequency. For range, subtract minimum from maximum.'];
 if(slug==='function-tables-worksheets')return ['Read the rule f(x) = mx + b and locate the blank cell in the table.', 'For a missing output, substitute x into the rule. For a missing input, set mx + b equal to the visible output and solve for x.', 'Write the result in the empty cell and check with the separate completed answer table.'];
 if(slug.includes('systems-equations'))return ['Compare the coefficients of both equations to decide whether they are proportional.', 'If they are not proportional, eliminate a variable to find the unique solution.', 'If they are proportional, compare the constant terms: identical lines have infinitely many solutions; distinct parallel lines have none.'];
 if(slug.includes('domain-range'))return ['Read each ordered pair as (input, output).', 'Domain is the set of unique x-values; range is the set of unique y-values.', 'For function identification, check whether any repeated input has two different outputs.'];
 if(slug.includes('box-plots'))return ['Order the observations and find the median.','Split into equal lower and upper halves, excluding the middle value for odd-sized samples.','Use the 1.5×IQR fences to identify outliers separately from the whisker endpoints.'];
 if(slug.includes('fraction'))return ['Read both numerators and denominators carefully.','Find a common denominator or simplify only when the operation requires it.','Compare your reduced fraction to the answer key.'];
 if(slug.includes('inequal'))return ['Identify the coefficient of the unknown and the comparison symbol.','Undo operations on both sides; flip < to > and ≤ to ≥ (or vice versa) when dividing by a negative.','Check a test value against the original inequality and mark open or closed endpoints as appropriate.'];
 if(slug.includes('equation') && !slug.includes('linear-equations') && !slug.includes('systems-equations'))return ['Identify the operations acting on the variable.','Apply inverse operations to isolate the variable on one side of the equals sign.','Substitute your answer into the original equation to check equality.'];
 if(slug.includes('area')||slug.includes('volume')||slug.includes('surface'))return ['Read the dimensions shown in the question.','Choose the appropriate area, volume or surface-area formula.','Record square or cubic units where appropriate.'];
 if(slug.includes('statistics')||slug.includes('mean')||slug.includes('box'))return ['Put the data values in order if needed.','Use the stated statistical convention to compute the result.','Check the answer and working steps.'];
 if(slug.includes('order-of-operations'))return ['Work inside parentheses first.','Evaluate multiplication and division before addition and subtraction, working left to right at each priority.','Check that the final value matches the original expression structure.'];
 if(slug.includes('slope'))return ['Label both points (x₁, y₁) and (x₂, y₂).','Compute rise over run: (y₂ − y₁) / (x₂ − x₁).','If the two x-coordinates match, the vertical line has undefined slope.'];
 if(slug.includes('linear-equations'))return ['For a graphing worksheet, plot the y-intercept (0, b), then use slope m to locate another point.','Draw the line through the two plotted points; the answer key shows the completed graph.','For evaluation worksheets, substitute the specified x-value and check that (x, y) lies on the line.'];
 if(slug.includes('scientific-notation'))return ['Move the decimal point until the leading number is at least 1 but less than 10.','Count the places moved to find the power of ten.','Use a negative exponent for numbers between zero and one.'];
 if(slug.includes('number-line'))return ['Find zero and the tick spacing.','Count left for negative values, right for positive values.','Mark the requested location, not its mirror image.'];
 if(slug.includes('coordinate-plane'))return ['Find the x- and y-axes and the origin.','Move right for positive x and up for positive y; move left or down for negative coordinates.','Check the quadrant against the two coordinate signs.'];
 if(slug.includes('scatter-plot'))return ['For plotting tasks, mark each ordered pair (x, y) on the correctly numbered axes.','For interpretation tasks, read the plotted points and look for an overall upward, downward or absent linear trend.','A curved pattern need not have a clear linear trend. Check all six observations, not just two points.'];
 if(slug.includes('mean-median-mode-range'))return ['Sort the observations before finding the median.','Divide their sum by the number of observations for the mean; count frequencies for mode.','Subtract minimum from maximum for the range.'];
 if(slug.includes('printable-protractor'))return ['Print using Actual size or 100%, with page fitting switched off.','Measure the printed 50 mm calibration line with a real ruler before using the scale.','Align the center and zero baseline to the angle before reading degrees.'];
 if(slug.includes('pythagorean'))return ['Identify the hypotenuse opposite the right angle: it is always the longest side.','For a missing hypotenuse use c² = a² + b²; for a missing leg use a² = c² − b².','Take the positive square root and check that each leg is shorter than the hypotenuse.'];
 if(slug.includes('long-division'))return ['Divide the leading digits by the divisor.','Multiply, subtract, then bring down the next digit.','Check dividend = divisor × quotient + remainder, with remainder less than divisor.'];
 if(slug.includes('number-recognition'))return ['Read whether this question shows dots or a number word.','Count each dot once, or identify the numeral represented by the word.','Write the numeral and check it against the separate answer key.'];
 return ['Choose a difficulty and number of practice questions.','Solve the questions on your printable worksheet.','Use the separate answer key to verify each answer.'];
}

/** Contextual reminders: intentionally about the generator's actual task, not generic SEO filler. */
export function commonMistakes(slug:string):string[]{
 if(slug==='percentages-worksheets')return ['Dividing by the new value instead of the original value when computing a percentage change.', 'Forgetting the percent-to-decimal division by 100, or rounding before the final result is calculated.'];
 if(slug==='mean-absolute-deviation-worksheets')return ['Dividing the total absolute deviation by the number of distinct values instead of the full sample size.', 'Rounding a fractional mean early, which changes every absolute deviation.'];
 if(slug==='function-tables-worksheets')return ['Treating an output as an input when solving backward.', 'Forgetting to subtract the constant before dividing by the coefficient.'];
 if(slug.includes('systems-equations'))return ['Combining equations with different coefficient scales without multiplying first.', 'Forgetting to check the solution in both original equations.'];
 if(slug.includes('domain-range'))return ['Including a repeated x-value more than once in the domain.', 'Assuming every relation is a function when the same input appears with different outputs.'];
 if(slug.includes('inequal'))return ['Forgetting to reverse the comparison sign after multiplying or dividing both sides by a negative number.', 'Using a closed dot for < or > instead of an open dot.'];
 if(slug.includes('two-step-equations'))return ['Undoing multiplication before undoing the added or subtracted constant.', 'Missing the sign of a negative coefficient when dividing.'];
 if(slug.includes('one-step-equations'))return ['Applying an inverse operation on only one side of the equation.', 'Losing track of negative signs when dividing both sides by a negative coefficient.'];
 if(slug.includes('order-of-operations'))return ['Adding from left to right before completing multiplication.', 'Ignoring parentheses when the same numbers are regrouped.'];
 if(slug.includes('multiplying-fractions'))return ['Multiplying one numerator by a denominator instead of numerator × numerator and denominator × denominator.', 'Failing to reduce the final product to lowest terms.'];
 if(slug.includes('fraction'))return ['Adding denominators when adding fractions.', 'Forgetting to simplify the resulting numerator and denominator.'];
 if(slug.includes('box-plots'))return ['Including the middle observation in both halves when using exclusive median-of-halves.', 'Extending whiskers to outliers instead of the last non-outlier observation.'];
 if(slug.includes('scatter-plot'))return ['Confusing the x and y positions on a coordinate grid.', 'Treating a pattern as necessarily causal.'];
 if(slug.includes('mean-median-mode-range'))return ['Using the number of distinct values instead of the observation count for the mean.', 'Assuming a single mode always exists.'];
 if(slug.includes('decimal'))return ['Shifting the decimal point in the wrong direction.', 'Dropping zero placeholders that determine place value.'];
 if(slug.includes('protractor'))return ['Printing with Fit to page instead of Actual size (100%).', 'Reading the inner scale rather than the scale that starts at the chosen zero baseline.'];
 if(slug.includes('pythagorean'))return ['Treating one leg as the hypotenuse instead of the longest side.', 'Adding the squares when finding a missing leg; subtract from the hypotenuse squared instead.'];
 if(slug.includes('surface-area'))return ['Computing volume instead of total area of faces.', 'Using cubic rather than square units.'];
 if(slug.includes('area')||slug.includes('volume'))return ['Confusing slant length with perpendicular height.', 'Using the wrong square or cubic units.'];
 if(slug.includes('linear-equations'))return ['Plotting the y-intercept on the x-axis instead of the y-axis.', 'Reversing rise and run when applying the slope.'];
 if(slug.includes('slope'))return ['Subtracting x-values and y-values in different orders.', 'Dividing by zero when points lie on a vertical line.'];
 if(slug.includes('scientific-notation'))return ['Writing a leading coefficient outside the 1 to 10 range.', 'Choosing the wrong exponent sign for a value below one.'];
 if(slug.includes('number-line'))return ['Placing negative numbers to the right of zero.', 'Counting tick marks without checking their scale.'];
 if(slug.includes('coordinate-plane'))return ['Swapping x and y coordinates.', 'Mixing up quadrant II and IV.'];
 if(slug.includes('long-division'))return ['Forgetting a zero in the quotient.', 'Writing a remainder as large as the divisor.'];
 if(slug.includes('multiplication'))return ['Misaligning tens and ones in partial products.', 'Ignoring carried digits.'];
 if(slug.includes('division'))return ['Confusing dividend with divisor.', 'Skipping the multiplication check.'];
 return ['Not checking the requested unit or answer form.', 'Skipping the inverse or substitution check when one is available.'];
}
