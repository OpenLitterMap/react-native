export const isGeotagged = img => {
    const result =
        img.lat !== undefined &&
        img.lat !== null &&
        typeof img.lat === 'number' &&
        img.lon !== undefined &&
        img.lon !== null &&
        typeof img.lon === 'number';

    return result;
};
