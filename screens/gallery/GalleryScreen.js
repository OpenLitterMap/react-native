import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    Pressable,
    FlatList,
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
            selectedImages: [],
            sortedData: []
        };
    }

    componentDidMount() {
        this.splitIntoRows(this.props.geotaggedImages);
    }

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

    /**
     * fn that is called when "done" is pressed
     * sorts the array based on id
     * call action addImage to save selected images to state
     *
     */
    async handleDoneClick() {
        const sortedArray = await this.state.selectedImages.sort(
            (a, b) => a.id - b.id
        );
        this.props.addImage(sortedArray, 'GALLERY');
    }

    /**
     * fn to select and deselect image on tap
     *
     * @param  item - The image object
     */

    selectImage(item) {
        const selectedArray = this.state.selectedImages;
        // check if item /image is already selected
        const index = selectedArray.indexOf(item);
        if (index !== -1) {
            this.setState({
                selectedImages: this.state.selectedImages.filter(
                    (_, i) => i !== index
                )
            });
        }

        if (index === -1) {
            this.setState(prevState => {
                return { selectedImages: [...prevState.selectedImages, item] };
            });
        }
    }

    /**
     * fn that returns the sections for flatlist to display
     *
     */

    renderSection({ item, index }) {
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

        return (
            <View>
                <View style={styles.headerStyle}>
                    <Body
                        style={{
                            color: '#aaaaaa'
                        }}>
                        {headerTitle}
                    </Body>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {item.data.map(image => {
                        const selected = this.state.selectedImages.includes(
                            image
                        );
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
                                            width: 24,
                                            height: 24,
                                            backgroundColor: '#0984e3',
                                            right: 10,
                                            bottom: 10,
                                            borderRadius: 100,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                        <Icon
                                            name="ios-checkmark-outline"
                                            size={20}
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
                    centerContainerStyle={{ flex: 2 }}
                    rightContent={
                        <Pressable
                            onPress={async () => {
                                await this.handleDoneClick();
                                this.props.navigation.navigate('HOME');
                            }}>
                            <Body color="white">
                                Done
                                {this.state.selectedImages?.length > 0 &&
                                    ` (${this.state.selectedImages?.length})`}
                            </Body>
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
                            this.renderSection(item, index)
                        }
                        extraData={this.state.selectedImages}
                        keyExtractor={item => `${item.title}`}
                    />
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

const styles = StyleSheet.create({
    headerStyle: {
        marginTop: 16,
        marginBottom: 5,
        paddingLeft: 5
    }
});
