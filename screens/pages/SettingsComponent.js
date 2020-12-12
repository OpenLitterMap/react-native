import React, { Component } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableHighlight,
  View
} from 'react-native';
import { Header, Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import * as actions from '../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

class SettingsComponent extends Component {

  constructor(props) {
    super(props);
    // console.log("Settings Component init");
    this._getTextInputValue();
  }

  render() {
    return (
      <>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#2189dc' }} />
      <SafeAreaView style={{ flex: 1 }}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.props.secondSettingsModalVisible}
          >
          <View style={styles.modalContainer}>
            { this.props.updateSettingsSuccess &&
              <View style={styles.innerModalSuccess}>
                <Text style={styles.innerModalHeader}>Success!</Text>
                <Text>Value updated.</Text>
                <TouchableHighlight
                  style={styles.successButton}
                  onPress={() => this._goBack()}>
                  <Text style={styles.buttonText}>Go back</Text>
                </TouchableHighlight>
              </View>
            }

            { this.props.updatingSettings &&
              <ActivityIndicator />
            }
            </View>
        </Modal>

        { /* outerContainerStyles={{ height: SCREEN_HEIGHT * 0.1 }} */ }
        <Header
          containerStyle={{ paddingTop: 0, height: SCREEN_HEIGHT * 0.1 }}
          leftComponent={{
            icon: 'close',
            color: '#fff',
            onPress: () => this._closeModal(),
            size: SCREEN_HEIGHT * 0.03
          }}
          centerComponent={{
            text: this._getHeaderName(),
            style: { color: '#fff', fontSize: SCREEN_HEIGHT * 0.02 }
          }}
          rightComponent={
            <TouchableHighlight onPress={() => this._saveSettings() }><Text style={{ color: '#fff', fontSize: SCREEN_HEIGHT * 0.02 }}>Save</Text></TouchableHighlight>
          }
        />

        <View style={styles.container}>
          <View style={styles.row}>
            <Text style={styles.title}>{this.props.dataToEdit}</Text>
            <TextInput
              onChangeText={(text) => this.props.updateSettingsProp({text})}
              style={styles.content}
              value={this.props.settingsEditProp}
            />
          </View>
        </View>
      </SafeAreaView>
      </>
    );
  }

  /**
   * Custom Functions
   */
  _closeModal() {
    this.props.toggleSettingsModal();
  }

  _getHeaderName() {
    return "Edit" + " " + this.props.dataToEdit;
  }

  _saveSettings() {
    this.props.saveSetting(this.props.dataToEdit, this.props.settingsEditProp, this.props.token);
  }

  _goBack() {
    this.props.closeSecondSettingModal();

    // Parent modal only closes with timeout
    setTimeout(() => {
      this.props.toggleSettingsModal();
    }, 500);
  }

  /**
   * Initialize Settings Value to edit / update
   */
  _getTextInputValue() {
    if (this.props.dataToEdit == "Name") {
      return this.props.initalizeSettingsValue(this.props.user.name);
    } else if (this.props.dataToEdit == "Username") {
      return this.props.initalizeSettingsValue(this.props.user.username);
    } else {
      return this.props.initalizeSettingsValue(this.props.user.email);
    }
  }

}

const styles = {
  buttonText: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    paddingTop: SCREEN_HEIGHT * 0.02,
    backgroundColor: "#ccc"
  },
  content: {
    paddingRight: 10,
    flex: 1,
    fontSize: SCREEN_HEIGHT * 0.02
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'white',
    height: SCREEN_HEIGHT * 0.06
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  innerModalSuccess: {
    height: SCREEN_HEIGHT * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    width: SCREEN_WIDTH * 0.8
  },
  innerModalHeader: {
    textAlign: 'center',
    fontSize: 16
  },
  successButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#2ecc71',
    height: SCREEN_HEIGHT * 0.05,
    marginTop: 10,
    width: '80%'
  },
  title: {
    paddingLeft: 10,
    fontSize: SCREEN_HEIGHT * 0.02,
    width: SCREEN_WIDTH * 0.25
  }
}

const mapStateToProps = state => {
  return {
    dataToEdit: state.settings.dataToEdit,
    secondSettingsModalVisible: state.settings.secondSettingsModalVisible,
    settingsEditProp: state.settings.settingsEditProp,
    token: state.auth.token,
    updatingSettings: state.settings.updatingSettings,
    updateSettingsSuccess: state.settings.updateSettingsSuccess,
    user: state.auth.user,
  };
}

export default connect(mapStateToProps, actions)(SettingsComponent);
