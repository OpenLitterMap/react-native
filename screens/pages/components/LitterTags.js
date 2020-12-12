import React, { PureComponent } from 'react';
import { Dimensions } from 'react-native';
import {
    Text,
    TouchableHighlight,
    View
} from 'react-native';
import { Button, Card, Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import * as actions from '../../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
        return Object.keys(this.props.tags).map((category, i) => {
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
                        <Card
                            containerStyle={{ borderRadius: 6 }}
                            wrapperStyle={{ alignItems: 'center', flexDirection: 'row', flex: 1 }}
                        >
                            <Text style={styles.title}>{item}</Text>
                            <Text style={styles.val}>&nbsp; ({value})</Text>
                        </Card>
                    </TouchableHighlight>
                );
            });
        });
    }
}

const styles = {
    title: {
        fontSize: SCREEN_HEIGHT * 0.02
    },
    val: {
        fontSize: SCREEN_HEIGHT * 0.02
    }
}

export default connect(null, actions)(LitterTags);
