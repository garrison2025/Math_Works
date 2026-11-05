/** Exact base-ten place-value formatting and rounding contracts.
 * The displayed decimal is generated from integer ten-thousandths; no
 * floating-point rounding or toFixed is involved in answer production.
 */
export const integerPlaces={ones:1,tens:10,hundreds:100,thousands:1000,millions:1000000,billions:1000000000} as const;
export type IntegerPlace=keyof typeof integerPlaces;
export const decimalPlaces={tenths:1,hundredths:2,thousandths:3} as const;
export type DecimalPlace=keyof typeof decimalPlaces;

export const commaNumber=(n:number):string=>{
 if(!Number.isSafeInteger(n)||n<0)throw Error('Place-value number must be a nonnegative safe integer');
 return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
};

/** Place value of a particular integer digit (0 for an empty/zero place). */
export function integerDigitValue(n:number,place:IntegerPlace):{digit:number;value:number}{
 if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid whole number');
 const magnitude=integerPlaces[place];
 const digit=Math.floor(n/magnitude)%10;
 return {digit,value:digit*magnitude};
}

/** The next decimal digit is always available, including for thousandths. */
export function fourPlaceDecimal(whole:number,fraction:number):string{
 if(!Number.isSafeInteger(whole)||whole<0||!Number.isInteger(fraction)||fraction<0||fraction>9999)throw Error('Invalid four-place decimal');
 return `${whole}.${String(fraction).padStart(4,'0')}`;
}

export function decimalDigitValue(fraction:number,place:DecimalPlace):{digit:number;value:string;nextDigit:number}{
 if(!Number.isInteger(fraction)||fraction<0||fraction>9999)throw Error('Invalid fractional digits');
 const digits=String(fraction).padStart(4,'0');
 const index=decimalPlaces[place]-1;
 const digit=Number(digits[index]);
 return {digit,value:digit?`0.${'0'.repeat(index)}${digit}`:'0',nextDigit:Number(digits[index+1])};
}

/** Round half-up to tenths, hundredths or thousandths, preserving place zeros.
 * Example: 9.9995 -> 10.000 when rounded to the nearest thousandth.
 */
export function roundFourPlaceDecimal(whole:number,fraction:number,place:DecimalPlace):string{
 fourPlaceDecimal(whole,fraction);
 const decimals=decimalPlaces[place];
 const unit=10**(4-decimals);
 const roundedUnits=Math.floor((whole*10000+fraction+unit/2)/unit);
 const scaled=roundedUnits*unit;
 const roundedWhole=Math.floor(scaled/10000);
 const fractional=String(scaled%10000).padStart(4,'0').slice(0,decimals);
 return `${roundedWhole}.${fractional}`;
}
