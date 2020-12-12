import React, { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

class Stats extends Component {

  render() {
    return (
      <View style={styles.topContainer}>
        <View style={styles.topRow}>
            <View style={styles.statCol}>
              <Text style={styles.largeInt}>Total Litter 123</Text>
              <Text>Total Photos 100</Text>
            </View>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.statCol}>
            <Text style={styles.largeInt}>
              {this.props.user ? this.props.user.total_images : '0'}
            </Text>
            <Text style={styles.smallText}>Uploads</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.largeInt}>
              {this.props.user ? this.props.user.total_litter : '0'}
            </Text>
            <Text style={styles.smallText}>Litter</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.largeInt}>
              {this.props.user ? this.props.user.level : '0'}
            </Text>
            <Text style={styles.smallText}>Level</Text>
          </View>
        </View>
        {/*
          <View style={styles.progress}>
            <Text style={styles.progressTop}>NEXT LEVEL:</Text>
            <Progress.Bar progress={0.3} width={200} />
          </View>
          <Text style={styles.progressBottom}>XP</Text>
        */}
      </View>
    );
  }
}

const styles = {
  largeInt: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  smallText: {
    fontSize: 10,
    color: 'grey'
  },
  statCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  topContainer: {
    alignItems: 'center',
    justifyContent: 'space-around',
    left: 0,
    right: 0,
    backgroundColor: 'white'
  },
};

export default Stats;
