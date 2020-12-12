import React from 'react';
import _ from 'lodash';
import {
  NativeModules,
  StyleSheet,
  Text,
  View,
  CameraRoll,
  FlatList,
  Dimensions,
  Button
} from 'react-native';
// import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
import ImageTile from './ImageTile';
const { width } = Dimensions.get('window');
import { connect } from 'react-redux';
import * as actions from '../../../actions';

class ImageBrowser extends React.Component {

  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      photos: [],
      selected: {},
      after: null,
      has_next_page: true
    }
  }

  componentDidMount() {
    this._isMounted = true;
    console.log("Image Browser mounted");
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderHeader()}
        {this.renderImages()}
      </View>
    );
  }

  renderHeader = () => {
    console.log("... render header ....");
    let selectedCount = Object.keys(this.state.selected).length;
    let headerText = selectedCount + ' Selected';
    if (selectedCount === this.state.max) headerText = headerText + ' (Max)';
    return (
      <View style={styles.header}>
        <Button
          title="Exit"
          // this.props.callback(Promise.resolve([]))
          onPress={() => {
            this.props.toggleImageBrowser();
          }}
        />
        <Text>{headerText}</Text>
        <Button
          title="Choose"
          onPress={() => {
            this.chooseImages()
          }}
          // onPress={() => this.prepareCallback()}
        />
      </View>
    );
  }

  /**
   * Select Selected Photos
   * @return this.props.gallery = [];
   */
  chooseImages = async() => {
    let { selected, photos } = this.state;
    let selectedPhotos = photos.filter((item, index)=> {
      // console.log(index);
      // console.log(item);
      return (selected[index]);
    });
    // console.log(selectedPhotos);
    try {
      // add photos to gallery_reducer.js
      this.props.photosFromGallery(selectedPhotos);
      // add first photo to litter.js photoselected
      this.props.selectPhoto(selectedPhotos[0]);
      this.props.toggleImageBrowser();
    } catch (e) {
      console.log(e);
    }
  }
  // end <Header />

  renderImages() {
    {this.getPhotos()}

    return (
      <FlatList
        data={this.state.photos}
        numColumns={4}
        renderItem={this.renderImageTile}
        keyExtractor={(_,index) => index}
        onEndReached={()=> {this.getPhotos()}}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text>Loading...</Text>}
        initialNumToRender={24}
        getItemLayout={this.getItemLayout}
      />
    );
  }

  getPhotos = () => {
    let params = {
      first: 50,
      mimeTypes: ['image/jpeg'],
      assetType: 'Photos',
      groupTypes: 'All',
      groupName: 'Recent'
    };
    if (this.state.after) params.after = this.state.after
    if (!this.state.has_next_page) return
    CameraRoll
      .getPhotos(params)
      .then(this.processPhotos)
  }

  processPhotos = (r) => {
  // console.log("-- available photos --");
  // console.log(r);

  // Filter Available Photos by geotag
  let photoData = [];
  var notGeotagged = 0;
  var geotagged = 0;

  r.edges.map(i => i.node).map(a => {
    // console.log(a);
    if (_.isEmpty(a["location"])) {
      notGeotagged++;
    } else {
      geotagged++;
      // console.log("Index", geotagged);
      // console.log("Image", a);
      let fn = a.image.uri.substring(5, 41) + ".png";
      console.log("Filename", fn);
      photoData.push({
        filename: fn, // was filename
        uri: a.image.uri,
        lat: a.location.latitude,
        lon: a.location.longitude,
        index: geotagged,
        timestamp: a.timestamp,
        type: 'gallery'
      });
    }
  });

  // console.log('Not geotagged: ' + notGeotagged);
  // console.log('Geotagged: ' + geotagged);

  if (this.state.after === r.page_info.end_cursor) return;
  // let uris = r.edges.map(i=> i.node).map(i=> i.image).map(i=>i.uri)
  // let uris = myPhotos.map(i=> i.image).map(i=>i.uri)

  if (this._isMounted) {
    this.setState({
      photos: [...this.state.photos, ...photoData],
      after: r.page_info.end_cursor,
      has_next_page: r.page_info.has_next_page
    }, function() {
      // console.log("--- state has been set ---");
      // console.log(this.state);
    });
  }
}

  selectImage = (index) => {
    let newSelected = {...this.state.selected};
    if (newSelected[index]) {
      delete newSelected[index];
    } else {
      newSelected[index] = true; // { 0: "true", 1: "true", ... }
    }
    if (Object.keys(newSelected).length > this.state.max) return;
    if (!newSelected) newSelected = {};
    this.setState({ selected: newSelected })
  }

  //
  getItemLayout = (data,index) => {
    let length = width/4;
    return { length, offset: length * index, index }
  }

  // Moved this to Redux this.chooseImages()
  // prepareCallback() {
  //   let { selected, photos } = this.state;
  //   let selectedPhotos = photos.filter((item, index) => {
  //     console.log("item callback");
  //     // console.log(index);
  //     // console.log(item);
  //     return(selected[index])
  //   });
  //   console.log("-- files --");
  //   let files = selectedPhotos
  //     .map(i => FileSystem.getInfoAsync(i, {md5: true}))
  //   let callbackResult = Promise
  //     .all(files)
  //     .then(imageData=> {
  //       return imageData.map((data, i) => {
  //         return {file: selectedPhotos[i], ...data}
  //       })
  //     })
  //   this.props.callback(callbackResult)
  // }

  //
  renderImageTile = ({item, index}) => {
    // console.log("-- render image tile --", index );
    let selected = this.state.selected[index] ? true : false
    return (
      <ImageTile
        item={item.uri}
        index={index}
        selected={selected}
        selectImage={this.selectImage}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 40,
    width: width,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20
  },
});

const mapStateToProps = state => {
  return {
    gallery: state.photos.gallery,
    selected: state.gallery.selected,
    after: state.gallery.after,
    has_next_page: state.gallery.has_next_page
  };
}

export default connect(mapStateToProps, actions)(ImageBrowser);
