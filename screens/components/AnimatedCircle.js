import React, { Component } from 'react';
import { Text, View, Animated, StyleSheet } from 'react-native';
import { Svg, Circle, Path, G } from 'react-native-svg';
import PropTypes from 'prop-types';
import { Title, Body } from './typography';

const AnimatedArc = Animated.createAnimatedComponent(Circle);

export class AnimatedCircle extends Component {
    constructor(props) {
        super(props);
        this.circleRef = React.createRef();
    }

    render() {
        // svg
        const { size, strokeWidth, value, title } = this.props;
        const radius = (size - (strokeWidth + 20)) / 2;
        const circumference = radius * 2 * Math.PI;
        const halfCircle = radius + strokeWidth;
        return (
            <View
                style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 40
                }}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
                        <Circle
                            stroke="#cbd8ff"
                            strokeWidth={strokeWidth}
                            fill="none"
                            cx="50%"
                            cy="50%"
                            r={radius}
                        />
                        <AnimatedArc
                            ref={this.circleRef}
                            stroke="#1745ce"
                            strokeWidth={strokeWidth}
                            fill="none"
                            cx="50%"
                            cy="50%"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference / 3}
                            strokeLinecap="round"
                        />
                    </G>
                </Svg>
                <View
                    style={{
                        position: 'absolute',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Title
                        style={{
                            fontSize: 52
                        }}>
                        {value}
                    </Title>
                    <Body>{title}</Body>
                </View>
            </View>
        );
    }
}

AnimatedCircle.propTypes = {
    size: PropTypes.number.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    value: PropTypes.string,
    title: PropTypes.string
};

export default AnimatedCircle;
