import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    ToastAndroid,
    Platform,
    View
} from 'react-native';
import dayjs from '../../utils/dayjs';
import _ from 'lodash';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Caption, Colors, Header, SubTitle } from '../components';
import { isGeotagged } from '../../utils/isGeotagged';
import { checkCameraRollPermission } from '../../utils/permissions';
import AnimatedImage from './galleryComponents/AnimatedImage';
import { getPhotosFromCameraroll } from "../../reducers/gallery_reducer";
import { addImages } from "../../reducers/images_reducer";

/**
 * fn to check if arg date is "today", this "week", this "month"
 * if older than current month but less than a year old then month number
 * if older than current year then which year.
 * @param {number} date - epoch date
 *
 */
export const placeInTime = date => {
    let today = dayjs().startOf('day');
    let thisWeek = dayjs().startOf('week');
    let thisMonth = dayjs().startOf('month');
    let thisYear = dayjs().startOf('year');
    const dateOfFile = dayjs(date);

    if (dateOfFile.isSameOrAfter(today)) {
        return 'today';
    } else if (dateOfFile.isSameOrAfter(thisWeek)) {
        return 'week';
    } else if (dateOfFile.isSameOrAfter(thisMonth)) {
        return 'month';
    } else if (dateOfFile.isSameOrAfter(thisYear)) {
        return dateOfFile.month() + 1;
    } else {
        return dateOfFile.year();
    }
};

const showToast = (message) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    // iOS: no built-in toast — the visual indicator is enough
};

const GalleryScreen = ({ navigation }) => {

    const dispatch = useDispatch();

    // For selecting images with swipe gesture
    const IMAGE_PER_ROW = 3;
    const { width } = Dimensions.get('window');
    const IMAGE_SIZE = (width / IMAGE_PER_ROW) - 2;
    const IMAGE_MARGIN = 1;
    const ROW_HEIGHT = IMAGE_SIZE + (IMAGE_MARGIN * 2);
    const lastGesturePosition = useRef({ x: 0, y: 0 });
    const flatListRef = useRef();
    const scrollOffset = useRef(0);

    const [selectedImages, setSelectedImages] = useState([]);
    const [sortedData, setSortedData] = useState([]);
    const [hasPermission, setHasPermission] = useState(false);

    const galleryImages = useSelector(state => state.gallery.galleryImages);
    const nonGeotaggedCount = useSelector(state => state.gallery.nonGeotaggedCount);
    const imagesLoading = useSelector(state => state.gallery.imagesLoading);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        checkGalleryPermission();
    }, []);

    useEffect(() => {
        if (galleryImages.length) {
            splitIntoRows(galleryImages);
        }
    }, [galleryImages]);

    const onGestureEvent = event => {
        const { x, y } = event.nativeEvent;

        selectItems(x, y);

        lastGesturePosition.current = { x, y };
    };

    const processedImages = useRef(new Set());

    const selectItems = (x, y) => {

        const adjustedY = y + scrollOffset.current;
        const column = Math.floor(x / (IMAGE_SIZE + IMAGE_MARGIN * 2));

        let accumulatedHeight = 0;

        for (let sectionIndex = 0; sectionIndex < sortedData.length; sectionIndex++) {
            const section = sortedData[sectionIndex];
            const rowsInSection = Math.ceil(section.data.length / IMAGE_PER_ROW);
            const sectionHeight = rowsInSection * ROW_HEIGHT;

            if (adjustedY >= accumulatedHeight && adjustedY < accumulatedHeight + sectionHeight) {
                const sectionRelativeY = adjustedY - accumulatedHeight;
                const row = Math.floor(sectionRelativeY / ROW_HEIGHT);
                const index = row * IMAGE_PER_ROW + column;

                if (index >= 0 && index < section.data.length) {
                    const image = section.data[index];
                    if (image && image.hasGps && !processedImages.current.has(image.uri)) {
                        processedImages.current.add(image.uri);
                        toggleSelection(image);
                    }
                }

                break;
            }

            accumulatedHeight += sectionHeight;
        }
    };

    const toggleSelection = (image) => {
        const isSelected = selectedImages.some(selected => selected.uri === image.uri);

        if (isSelected) {
            setSelectedImages(selectedImages => selectedImages.filter(selected => selected.uri !== image.uri));
        } else {
            setSelectedImages(selectedImages => [...selectedImages, image]);
        }
    };

    const onHandlerStateChange = ({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            processedImages.current.clear();
        }
    };

    const handleScroll = event => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
    };

    const checkGalleryPermission = async () => {

        const result = await checkCameraRollPermission();

        if (result === 'granted' || result === 'limited')
        {
            dispatch(getPhotosFromCameraroll());

            await splitIntoRows(galleryImages);

            setHasPermission(true);
        }
        else
        {
            navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION'
            });
        }
    };

    /**
     * Split images array based on date groups which they belong.
     * Date groups are determined by {@link placeInTime}
     * Groups are "today", this "week", this "month",
     * month name (if older than current month but belongs to current year), year
     * @param {Array} images
     */
    const splitIntoRows = async (images) => {

        let temp = {};

        const sortedImages = _.orderBy(images, ['date'], ['asc']);

        sortedImages.map(image => {
            const dateOfImage = image.date * 1000;
            const placeInTimeOfImage = placeInTime(dateOfImage);
            if (!temp[placeInTimeOfImage]) {
                temp[placeInTimeOfImage] = [];
            }
            temp[placeInTimeOfImage].unshift(image);
        });

        let final = [];
        let order = ['today', 'week', 'month'];
        let allTimeTags = Object.keys(temp).map(prop => Number.isInteger(parseInt(prop)) ? parseInt(prop) : prop);
        let allMonths = allTimeTags.filter(prop => Number.isInteger(prop) && prop >= 1 && prop <= 12).sort((a, b) => b - a);
        let allYears = allTimeTags.filter(prop => Number.isInteger(prop) && !allMonths.includes(prop)).sort((a, b) => b - a);

        order = [...order, ...allMonths, ...allYears];

        order.forEach(prop => {
            if (temp[prop]) {
                final.push({ title: prop, data: temp[prop] });
            }
        });

        setSortedData(final);
    };

    /**
     * fn that is called when "done" is pressed
     * sorts the array based on id
     * call action addImages to save selected images to state
     */
    const handleDoneClick = async () => {
        const sortedArray = selectedImages.sort((a, b) => a.id - b.id);

        dispatch(addImages({
            images: sortedArray,
            type: 'GALLERY',
            picked_up: user.picked_up
        }));

        navigation.navigate('HOME');
    };

    /**
     * fn to select and deselect image on tap
     *
     * @param  item - The image object
     */
    const selectImage = (item) => {
        if (!item.hasGps) {
            showToast('This photo has no location data');
            return;
        }

        const index = selectedImages.indexOf(item);

        if (index !== -1) {
            setSelectedImages(selectedImages.filter((_, i) => i !== index));
        } else {
            setSelectedImages(prev => [...prev, item]);
        }
    };

    /**
     * fn that returns the sections for flatlist to display
     */
    const renderSection = ({ item }) => {

        let headerTitle = item?.title;

        if (Number.isInteger(headerTitle) && headerTitle >= 1 && headerTitle <= 12) {
            headerTitle = dayjs(headerTitle.toString(), 'MM').format('MMMM');
        }

        const titleMap = {
            today: 'Today',
            week: 'This Week',
            month: 'This Month'
        };

        headerTitle = titleMap[headerTitle] || headerTitle;

        return (
            <View>
                <View style={styles.headerStyle}>
                    <Body style={{ color: '#aaaaaa' }}>
                        {headerTitle}
                    </Body>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {item.data.map(image => {
                        const selected = selectedImages.includes(image);
                        const imageHasGps = image.hasGps;

                        return (
                            <AnimatedImage
                                key={image.uri + ":"}
                                onPress={() => selectImage(image)}
                                image={image}
                                isImageGeotagged={imageHasGps}
                                selected={selected}
                            />
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <>
            <Header
                leftContent={
                    <Pressable
                        onPress={() => {
                            navigation.navigate('HOME');
                        }}>
                        <Body
                            color="white"
                            dictionary={'Cancel'}
                        />
                    </Pressable>
                }
                centerContent={
                    <SubTitle
                        color="white"
                        dictionary={'Geotagged'}
                    />
                }
                centerContainerStyle={{ flex: 2 }}
                rightContent={
                    <Pressable
                        onPress={handleDoneClick}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <Body color="white" dictionary={'Next'} />
                            {selectedImages?.length > 0 && (
                                <View style={styles.selectionBadge}>
                                    <Body color="white" style={{ fontWeight: '600' }}>
                                        {selectedImages.length}
                                    </Body>
                                </View>
                            )}
                        </View>
                    </Pressable>
                }
            />

            {hasPermission ? (
                <View style={{ flex: 1 }}>
                    {nonGeotaggedCount > 0 && (
                        <View style={styles.gpsBanner}>
                            <Icon
                                name="location-outline"
                                size={16}
                                color={Colors.warn}
                            />
                            <Caption style={{ color: Colors.warn, marginLeft: 4 }}>
                                {nonGeotaggedCount} {nonGeotaggedCount === 1 ? 'photo has' : 'photos have'} no GPS data and cannot be uploaded
                            </Caption>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', marginTop: 4, justifyContent: 'center' }}>
                        <Icon
                            name="information-circle-outline"
                            style={{color: Colors.muted}}
                            size={18}
                        />
                        <Caption>Only geotagged images can be selected</Caption>
                    </View>

                    <SafeAreaView style={{ flexDirection: 'row',  flex: 1 }}>
                        <PanGestureHandler
                            onGestureEvent={onGestureEvent}
                            onHandlerStateChange={onHandlerStateChange}
                            simultaneousHandlers={flatListRef}
                        >
                            <FlatList
                                ref={flatListRef}
                                contentContainerStyle={sortedData.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
                                style={{ flexDirection: 'column' }}
                                alwaysBounceVertical={false}
                                data={sortedData}
                                showsVerticalScrollIndicator={false}
                                renderItem={renderSection}
                                extraData={selectedImages}
                                keyExtractor={item => `${item.title}`}
                                onEndReached={() => dispatch(getPhotosFromCameraroll('LOAD'))}
                                onEndReachedThreshold={0.05}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                ListEmptyComponent={
                                    imagesLoading ? (
                                        <View style={styles.emptyState}>
                                            <ActivityIndicator color={Colors.accent} />
                                        </View>
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Icon
                                                name="images-outline"
                                                size={64}
                                                color={Colors.muted}
                                            />
                                            <Body style={styles.emptyStateTitle}>
                                                No geotagged photos found
                                            </Body>
                                            <Caption style={styles.emptyStateText}>
                                                Photos need GPS data to be uploaded. Make sure Location Services are enabled when taking photos.
                                            </Caption>
                                            {nonGeotaggedCount > 0 && (
                                                <Caption style={[styles.emptyStateText, { color: Colors.warn, marginTop: 12 }]}>
                                                    {nonGeotaggedCount} {nonGeotaggedCount === 1 ? 'photo' : 'photos'} found without GPS data
                                                </Caption>
                                            )}
                                        </View>
                                    )
                                }
                            />
                        </PanGestureHandler>
                    </SafeAreaView>
                </View>
            ) : (
                <View style={styles.container}>
                    <ActivityIndicator
                        color={Colors.accent}
                    />
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    headerStyle: {
        marginTop: 16,
        marginBottom: 5,
        paddingLeft: 5
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    gpsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff3cd',
        paddingVertical: 6,
        paddingHorizontal: 12
    },
    selectionBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        paddingHorizontal: 6
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60
    },
    emptyStateTitle: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center'
    },
    emptyStateText: {
        marginTop: 8,
        textAlign: 'center',
        color: '#888'
    }
});

export default GalleryScreen;
