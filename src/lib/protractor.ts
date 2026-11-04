/** Calibrated physical dimensions for printable 180° protractors.
 * SVG uses millimetres in its viewBox; PDF uses points (1 in = 72 pt). */
export const PROTRACTOR_RADIUS_MM=72;
export const PROTRACTOR_CALIBRATION_MM=50;
export const POINTS_PER_MM=72/25.4;
export const PROTRACTOR_RADIUS_PT=PROTRACTOR_RADIUS_MM*POINTS_PER_MM;
export const PROTRACTOR_CALIBRATION_PT=PROTRACTOR_CALIBRATION_MM*POINTS_PER_MM;
