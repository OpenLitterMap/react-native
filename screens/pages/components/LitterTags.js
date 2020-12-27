import React, { PureComponent } from 'react';
import {Dimensions, View} from 'react-native';
import {
    Text,
    TouchableHighlight
} from 'react-native';
import { Card } from 'react-native-elements';
import { connect } from 'react-redux';
import * as actions from '../../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').height;

class LitterTags extends PureComponent {

    /**
     * Remove a tag
     * @litter_actions
     */
    removeTag (category, item)
    {
        this.props.removeTag({ category, item });
    }

    /**
     * Loop over each category, and loop over each item in each category
     */
    render ()
    {
        return Object.keys(this.props.tags).map(category => {
            return Object.keys(this.props.tags[category]).map(item => {

                const value = this.props.tags[category][item];

                return (
                    <TouchableHighlight
                        key={item}
                        onPress={this.removeTag.bind(this, category, item)}
                        underlayColor='transparent'
                        onLayout={event => {
                            const layout = event.nativeEvent.layout;

                            // When layout is rendered, save its X-positions to this.props.positions
                            this.props.updateTagXPosition({ x: layout.x, item });
                        }}
                    >
                        <View style={styles.card}>
                            <Text style={styles.category}>{ category }</Text>
                            <Text style={styles.item}>{item}</Text>
                            <Text style={styles.val}>&nbsp; ({value})</Text>
                        </View>
                    </TouchableHighlight>
                );
            });
        });
    }
}

const styles = {
    card: {
        backgroundColor: "white",
        padding: SCREEN_WIDTH * 0.02,
        borderRadius: 6,
        alignItems: 'center',
        flexDirection: 'row',
        flex: 1,
        position: 'relative',
        paddingTop: SCREEN_HEIGHT * 0.025
    },
    category: {
        position: 'absolute',
        left: 5,
        top: 5,
        color: '#636360'
    },
    item: {
        fontSize: SCREEN_HEIGHT * 0.02,
    },
    val: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
}

export default connect(null, actions)(LitterTags);
