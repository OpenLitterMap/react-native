import React, {PureComponent} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {getTranslation} from 'react-native-translation';
import {Picker} from '@react-native-picker/picker';
import {connect, ConnectedProps} from 'react-redux';

import * as actions from '../../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Creating array of quantities [1 --- 100]
const QUANTITIES = [...Array(100).keys()].map(i => i + 1);

interface LitterPickerWheelsProps extends PropsFromRedux {
    item: any;
    lang: string;
    category: any;
}

class LitterPickerWheels extends PureComponent<LitterPickerWheelsProps> {
    render() {
        return (
            <View
                style={{
                    marginHorizontal: 20,
                    marginBottom: 10,
                    flexDirection: 'row',
                    backgroundColor: '#fafafa',
                    borderRadius: 8
                }}>
                <Picker
                    itemStyle={styles.itemStyle}
                    style={{width: SCREEN_WIDTH * 0.7 - 20}}
                    selectedValue={this.props.item}
                    onValueChange={item => this.props.changeItem(item)}>
                    {this.props.items.map((item: any, i: number) => {
                        const x = getTranslation(
                            `${this.props.lang}.litter.${this.props.category.title}.${item}`
                        );

                        return <Picker.Item label={x} value={item} key={i} />;
                    })}
                </Picker>
                <Picker
                    itemStyle={styles.itemStyle}
                    style={{width: SCREEN_WIDTH * 0.3 - 20}}
                    selectedValue={this.props.q}
                    onValueChange={q => this.props.changeQ(q)}>
                    {QUANTITIES.map((q, i) => (
                        <Picker.Item label={q.toString()} value={q} key={i} />
                    ))}
                </Picker>
            </View>
        );
    }

    getText(item: string) {
        return item;
    }
}

const styles = StyleSheet.create({
    itemStyle: {
        height: SCREEN_HEIGHT * 0.125,
        fontSize: 20,
        fontFamily: 'Poppins-Regular',
        letterSpacing: 0.5
    }
});

// We should be using type RootState here apparently
const mapStateToProps = (state: any) => {
    return {
        item: state.litter.item,
        items: state.litter.items,
        q: state.litter.q,
        quantityChanged: state.litter.quantityChanged
    };
};

const connector = connect(mapStateToProps, actions);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LitterPickerWheels);

// export default connect(mapStateToProps, actions)(LitterPickerWheels);
