import moment from 'moment';

/**
   * @param selectedImages array
   * @param property string
   * @param value string
   */
export const existsInArray = (selectedImages, property, value) => {
  return selectedImages.map((image) => {
    return image[property];
  }).indexOf(value);
}


export const placeInTime = (timestamp) => {
  let today = moment().startOf('day');
  let thisWeek = moment().startOf('week');
  let thisMonth = moment().startOf('month');
  let thisYear = moment().startOf('year');

  const momentOfFile = moment(timestamp);

  if (momentOfFile.isSameOrAfter(today)) {
    return 'today';

  } else if (momentOfFile.isSameOrAfter(thisWeek)) {
    return 'week';

  } else if (momentOfFile.isSameOrAfter(thisMonth)) {
    return 'month';

  } else if (momentOfFile.isSameOrAfter(thisYear)) {
    return momentOfFile.month();

  } else {
    return momentOfFile.year();
  }

  return 'error';
}