import { StyleSheet, Text, View } from 'react-native';
import React, { Component } from 'react';

export const placeInTime = date => {
    let today = moment().startOf('day');
    let thisWeek = moment().startOf('week');
    let thisMonth = moment().startOf('month');
    let thisYear = moment().startOf('year');
    const momentOfFile = moment(date);

    if (momentOfFile.isSameOrAfter(today)) {
        return 'today';
    } else if (momentOfFile.isSameOrAfter(thisWeek)) {
        return 'week';
    } else if (momentOfFile.isSameOrAfter(thisMonth)) {
        return 'month';
    } else if (momentOfFile.isSameOrAfter(thisYear)) {
        return momentOfFile.month() + 1;
    } else {
        return momentOfFile.year();
    }
};

class GalleryGrid extends Component {
    async splitIntoRows(images) {
        let temp = {};
        images.map(image => {
            const dateOfImage = image.date * 1000;
            const placeInTimeOfImage = placeInTime(dateOfImage);

            if (temp[placeInTimeOfImage] === undefined) {
                temp[placeInTimeOfImage] = [];
            }
            temp[placeInTimeOfImage].push(image);
        });

        let final = [];
        let order = ['today', 'week', 'month'];
        let allTimeTags = Object.keys(temp).map(prop => {
            if (Number.isInteger(parseInt(prop))) {
                return parseInt(prop);
            }

            return prop;
        });
        let allMonths = allTimeTags.filter(
            prop => Number.isInteger(prop) && prop < 12
        );
        allMonths = _.reverse(_.sortBy(allMonths));
        let allYears = allTimeTags.filter(
            prop => Number.isInteger(prop) && !allMonths.includes(prop)
        );
        allYears = _.reverse(_.sortBy(allYears));

        order = _.concat(order, allMonths, allYears);

        for (let prop of order) {
            if (temp[prop]) {
                let newObj = { title: prop, data: temp[prop] };
                final.push(newObj);
            }
        }
        this.setState({ sortedData: final });
    }

    render() {
        return (
            <View>
                <Text>GalleryGrid</Text>
            </View>
        );
    }
}

export default GalleryGrid;

const styles = StyleSheet.create({});
