import React, { Component } from 'react';
import {
  Image,
  View,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Icon } from 'react-native-elements';
const SCREEN_HEIGHT = Dimensions.get('window').height;

import styles from './styles';

class MediaItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: {},
      selected: false,
      imageSize: 0,
      thumbnailPath: 'dummy'
    };

    this.generateThumbnail = this.generateThumbnail.bind(this);
  }

  componentDidMount() {
    let { width } = Dimensions.get('window');
    let { imageMargin, itemsPerRow, containerWidth } = this.props;

    if (typeof containerWidth !== 'undefined') {
      width = containerWidth;
    }
    this.setState({
      imageSize: (width - (itemsPerRow + 1) * imageMargin) / itemsPerRow
    });

    if (this.state.thumbnailPath === 'dummy') {
      this.generateThumbnail();
    }
  }

  generateThumbnail() {
    let thumbnailPath = this.props.item.image.uri;

    this.setState({
      thumbnailPath
    });
  }

  /**
   * @description Trigger when file is pressed
   * @param item
   */
  onFilePress(item) {
    this.props.onClick(item);
  }

  render() {
    let { item, selected, imageMargin } = this.props;

    return (
      <TouchableWithoutFeedback
        style={{ marginBottom: imageMargin, marginRight: imageMargin }}
        onPress={() => this.onFilePress(item)}>
        <View>
          <Image
            source={{ uri: this.state.thumbnailPath }}
            style={{
              height: this.state.imageSize,
              width: this.state.imageSize,
              backgroundColor: '#000000'
            }}
          />
          {selected && (
            <View style={styles.marker}>
              <Icon
                name="check-circle"
                size={SCREEN_HEIGHT * 0.03}
                color="#00aced"
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default MediaItem;
