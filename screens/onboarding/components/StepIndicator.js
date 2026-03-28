import React from 'react';
import {StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Caption, Colors} from '../../components';

const STEPS = [
    {label: 'Import image', number: 1},
    {label: 'Add tags', number: 2},
    {label: 'Upload your data', number: 3}
];

/**
 * 3-step progress indicator for onboarding with checkmark states.
 * Compact layout — dots + labels grouped tightly in the center.
 */
const StepIndicator = ({currentStep, completedSteps = []}) => {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {STEPS.map((step, i) => {
                    const isComplete = completedSteps.includes(step.number);
                    const isActive = step.number === currentStep && !isComplete;
                    const isLocked = !isActive && !isComplete;

                    return (
                        <View key={step.number} style={styles.stepItem}>
                            {i > 0 && (
                                <View
                                    style={[
                                        styles.connector,
                                        (isActive || isComplete) && styles.connectorActive
                                    ]}
                                />
                            )}
                            <View
                                style={[
                                    styles.dot,
                                    isActive && styles.dotActive,
                                    isComplete && styles.dotComplete,
                                    isLocked && styles.dotLocked
                                ]}>
                                {isComplete ? (
                                    <Icon name="checkmark" size={12} color={Colors.white} />
                                ) : (
                                    <Caption
                                        color={isActive ? 'white' : 'muted'}
                                        family="semiBold"
                                        style={styles.dotText}>
                                        {String(step.number)}
                                    </Caption>
                                )}
                            </View>
                            <Caption
                                color={isComplete ? 'accent' : isActive ? 'text' : 'muted'}
                                family={isActive ? 'semiBold' : 'regular'}
                                style={styles.label}>
                                {step.label}
                            </Caption>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    connector: {
        width: 12,
        height: 1.5,
        backgroundColor: '#ddd',
        marginHorizontal: 3
    },
    connectorActive: {
        backgroundColor: Colors.accent
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dotActive: {
        backgroundColor: Colors.accent
    },
    dotComplete: {
        backgroundColor: Colors.accent
    },
    dotLocked: {
        backgroundColor: '#e0e0e0'
    },
    dotText: {
        fontSize: 10,
        lineHeight: 12
    },
    label: {
        fontSize: 10,
        marginLeft: 3
    }
});

export default StepIndicator;
