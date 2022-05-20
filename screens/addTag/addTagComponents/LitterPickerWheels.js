import React, { PureComponent } from 'react';
import { Dimensions, Platform, View, StyleSheet } from 'react-native';
import { getTranslation } from 'react-native-translation';
import { Picker } from '@react-native-community/picker'; // removed from RN-core Apr 2020
import { connect } from 'react-redux';

import DeviceInfo from 'react-native-device-info';

import * as actions from '../../../actions';
import { Colors } from '../../components';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Creating array of quantities [1 --- 100]
const QUANTITIES = [...Array(100).keys()].map(i => i + 1);
class LitterPickerWheels extends PureComponent {
    render() {
        return (
            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 20,
                    flexDirection: 'row',
                    backgroundColor: '#fafafa',
                    borderRadius: 8
                }}>
                <Picker
                    itemStyle={styles.itemStyle}
                    style={{ width: SCREEN_WIDTH * 0.7 - 20 }}
                    selectedValue={this.props.item}
                    onValueChange={item => this.props.changeItem(item)}>
                    {this.props.items.map((item, i) => {
                        const x = getTranslation(
                            `${this.props.lang}.litter.${
                                this.props.category.title
                            }.${item}`
                        );

                        return <Picker.Item label={x} value={item} key={i} />;
                    })}
                </Picker>
                <Picker
                    itemStyle={styles.itemStyle}
                    style={{ width: SCREEN_WIDTH * 0.3 - 20 }}
                    selectedValue={this.props.q}
                    onValueChange={q => this.props.changeQ(q)}>
                    {QUANTITIES.map((q, i) => (
                        <Picker.Item label={q.toString()} value={q} key={i} />
                    ))}
                </Picker>
            </View>
        );
    }

    getText(item) {
        return item;
    }
}

const styles = StyleSheet.create({
    itemStyle: {
        height: 120,
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
        letterSpacing: 0.5
    }
});

const mapStateToProps = state => {
    return {
        item: state.litter.item,
        items: state.litter.items,
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged
    };
};

export default connect(
    mapStateToProps,
    actions
)(LitterPickerWheels);
