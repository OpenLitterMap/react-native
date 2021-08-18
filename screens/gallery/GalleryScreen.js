import React, { Component } from 'react';
import {
    Text,
    StyleSheet,
    View,
    Pressable,
    FlatList,
    SectionList,
    Dimensions,
    Image,
    SafeAreaView
} from 'react-native';
import moment from 'moment';
import _ from 'lodash';

import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../actions';
import { Header, SubTitle, Body } from '../components';

const { width } = Dimensions.get('window');

export const placeInTime = timestamp => {
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
    // unreachable code error -- FIXME: fix this eslint error
    // eslint-disable-next-line no-unreachable
    return 'error';
};

class GalleryScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: [],
            sortedData: []
        };
    }

    componentDidMount() {
        this.splitIntoRows(this.props.geotaggedImages);
    }
    async splitIntoRows(images) {
        let temp = {};
        images.map(image => {
            const timestampOfImage = image.timestamp * 1000;
            const placeInTimeOfImage = placeInTime(timestampOfImage);

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

        // console.log(order);
        for (let prop of order) {
            if (temp[prop]) {
                let newObj = { title: prop, data: temp[prop] };
                final.push(newObj);
            }
        }
        // console.log(final);
        /**
         * =======
         */
        // for (let prop in temp) {
        //     // console.log('====>');
        //     // console.log(prop);
        //     let newObj = { title: prop, data: temp[prop] };
        //     finalData.push(newObj);
        // }
        // console.log(finalData);
        this.setState({ sortedData: final });
    }

    async handleDoneClick() {
        const sortedArray = await this.state.selected.sort(
            (a, b) => a.id - b.id
        );
        this.props.photosFromGallery(sortedArray);

        AsyncStorage.setItem(
            'openlittermap-gallery',
            JSON.stringify(this.state.selected)
        ).then(_ => {
            return true;
        });
    }

    selectImage(item) {
        const selectedArray = this.state.selected;
        const index = selectedArray.indexOf(item);
        if (index !== -1) {
            this.setState({
                selected: this.state.selected.filter((_, i) => i !== index)
            });
        }

        if (index === -1) {
            this.setState(prevState => {
                return { selected: [...prevState.selected, item] };
            });
        }
    }

    renderImage({ item, index }) {
        let headerTitle = item?.title;
        if (Number.isInteger(headerTitle) && headerTitle < 12) {
            headerTitle = moment(headerTitle).format('MMMM');
        }

        if (headerTitle === 'today') {
            headerTitle = 'Today';
        }

        if (headerTitle === 'week') {
            headerTitle = 'This Week';
        }

        if (headerTitle === 'month') {
            headerTitle = 'This Month';
        }
        // if (parseInt(headerTitle) < 12) {
        //     headerTitle = moment(parseInt(headerTitle)).format('MMMM');
        // }
        return (
            <View>
                <View
                    style={{
                        marginTop: 10,
                        paddingLeft: 5
                    }}>
                    <Body
                        style={{
                            // textAlign: 'center',
                            marginVertical: 7,
                            color: '#aaaaaa'
                        }}>
                        {headerTitle}
                    </Body>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {item.data.map(image => {
                        const selected = this.state.selected.includes(image);
                        return (
                            <Pressable
                                key={image.uri}
                                onPress={() => this.selectImage(image)}>
                                <Image
                                    source={{ uri: image.uri }}
                                    style={{
                                        width: width / 3 - 2,
                                        height: width / 3 - 2,
                                        margin: 1
                                    }}
                                />
                                {selected && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: 30,
                                            height: 30,
                                            backgroundColor: '#0984e3',
                                            right: 10,
                                            bottom: 10,
                                            borderRadius: 100,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                        <Icon
                                            name="ios-checkmark-outline"
                                            size={24}
                                            color="white"
                                        />
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        );
    }
    render() {
        const { geotaggedImages } = this.props;
        return (
            <>
                <Header
                    leftContent={
                        <Pressable
                            onPress={() => {
                                this.props.navigation.navigate('HOME');
                                // this.props.setImageLoading;
                            }}>
                            <Body color="white">Cancel</Body>
                        </Pressable>
                    }
                    centerContent={<SubTitle color="white">Geotagged</SubTitle>}
                    rightContent={
                        <Pressable
                            onPress={async () => {
                                await this.handleDoneClick();
                                this.props.navigation.navigate('HOME');
                            }}>
                            <Body color="white">Done</Body>
                        </Pressable>
                    }
                />
                <SafeAreaView
                    style={{
                        flexDirection: 'row',
                        flex: 1
                    }}>
                    <FlatList
                        style={{ flexDirection: 'column' }}
                        alwaysBounceVertical={false}
                        showsVerticalScrollIndicator={false}
                        // numColumns={3}
                        data={this.state.sortedData}
                        renderItem={(item, index) =>
                            this.renderImage(item, index)
                        }
                        extraData={this.state.selected}
                        keyExtractor={item => `${item.title}`}
                    />
                    {/* <SectionList
                        style={{ flexDirection: 'column' }}
                        alwaysBounceVertical={false}
                        // numColumns={3}
                        sections={this.state.sortedData}
                        renderItem={(item, index) => {
                            console.log('===========>');
                            console.log(item);
                            return (
                                <View style={{ flexDirection: 'row' }}>
                                    {this.renderImage(item, index)}
                                </View>
                            );
                        }}
                        extraData={this.state.selected}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={{ backgroundColor: 'tomato' }}>
                                {title}
                            </Text>
                        )}
                    /> */}
                </SafeAreaView>
            </>
        );
    }
}

const mapStateToProps = state => {
    return {
        geotaggedImages: state.gallery.geotaggedImages
    };
};

export default connect(
    mapStateToProps,
    actions
)(GalleryScreen);

const styles = StyleSheet.create({});
