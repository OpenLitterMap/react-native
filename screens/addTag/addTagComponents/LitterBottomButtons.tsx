import React, {PureComponent} from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import {Colors, SubTitle} from '../../components';
import {
    addTagToImage,
    changeQuantityStatus,
    togglePickedUp
} from '../../../actions';
import {connect} from 'react-redux';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LitterBottomButtonsProps {
    images: Array<{picked_up?: boolean; id?: string}>;
    swiperIndex: number;
    lang: string;
    category: {title: string};
    item: string;
    q: number;
    quantityChanged?: boolean;

    // functions
    addTagToImage: (payload: {
        tag: {category: string; title: string; quantity: number};
        currentIndex: number;
        quantityChanged?: boolean;
    }) => void;

    deleteButtonPressed: () => void;
}

class LitterBottomButtons extends PureComponent<LitterBottomButtonsProps> {
    render() {
        return (
            // @ts-ignore
            <View style={styles.pb5}>
                <ScrollView
                    bounces={false}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        onPress={() => this.togglePickedUp()}
                        style={styles.pickedUpButton}>
                        {this.props.images[this.props.swiperIndex]
                            ?.picked_up ? (
                            <SubTitle
                                color="white"
                                dictionary={`${this.props.lang}.tag.picked-thumb`}
                            />
                        ) : (
                            <SubTitle
                                color="white"
                                dictionary={`${this.props.lang}.tag.not-picked-thumb`}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => this.addTag()}
                        style={styles.buttonStyle}>
                        <SubTitle
                            color="white"
                            dictionary={`${this.props.lang}.tag.add-tag`}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={this.props.deleteButtonPressed}
                        style={styles.buttonStyle}>
                        <SubTitle
                            color="white"
                            dictionary={`${this.props.lang}.tag.delete-image`}
                        />
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    /**
     * Add tag on a specific image
     */
    addTag(): void {
        const tag = {
            category: this.props.category.title.toString(),
            title: this.props.item.toString(),
            quantity: this.props.q
        };

        // currentGlobalIndex
        const currentIndex = this.props.swiperIndex;

        this.props.addTagToImage({
            tag,
            currentIndex,
            quantityChanged: this.props.quantityChanged ?? false
        });

        /**
         * If quantityChanged is true -- then while clicking Add Tag button
         * the quantity value currently in PICKER is added to tag
         *
         * else if quantityChanged is false -- then while clicking Add Tag button
         * quantity currently on TAG + 1 is added on tag.
         *
         * here we are changing status to false once Add tag button is pressed
         */
        // @ts-ignore
        this.props.changeQuantityStatus(false);
    }

    /**
     * Toggle the picked-up status of 1 image in our array
     */
    togglePickedUp = (): void => {
        // @ts-ignore
        this.props.togglePickedUp(
            this.props.images[this.props.swiperIndex]?.id
        );
    };
}

const styles = StyleSheet.create({
    pickedUpButton: {
        height: SCREEN_HEIGHT * 0.05,
        backgroundColor: Colors.accent,
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        paddingLeft: 10,
        paddingRight: 10
    },
    buttonStyle: {
        height: SCREEN_HEIGHT * 0.05,
        backgroundColor: Colors.accent,
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        paddingLeft: 10,
        paddingRight: 10
    },
    pb5: {
        paddingBottom: 5
    }
});

const mapDispatchToProps = (dispatch: any) => ({
    addTagToImage: (payload: {
        tag: {category: string; title: string; quantity: number};
        currentIndex: number;
        quantityChanged?: boolean;
    }) => {
        dispatch(addTagToImage(payload));
    },

    changeQuantityStatus: (status: boolean) => {
        dispatch(changeQuantityStatus(status));
    },

    togglePickedUp: (id: number) => {
        dispatch(togglePickedUp(id));
    }
});

export default connect(null, mapDispatchToProps)(LitterBottomButtons);
