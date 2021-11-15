/**
 * function to check if image is geotagged
 *
 * WEB images dont have lat/long properties but they are geotagged because
 * web app only accepts geotagged images.
 *
 * @param img
 * @returns boolean
 */
export const isGeotagged = img => {
    const result =
        (img.lat !== undefined &&
            img.lat !== null &&
            typeof img.lat === 'number' &&
            img.lon !== undefined &&
            img.lon !== null &&
            typeof img.lon === 'number') ||
        img.type === 'WEB';

    return result;
};
