import React from 'react';
import {StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Caption, Colors} from '../../components';

const DEFAULT_STEPS = [
    {label: 'Import image', number: 1},
    {label: 'Add tags', number: 2},
    {label: 'Upload your data', number: 3}
];

/**
 * 3-step progress indicator for onboarding with checkmark states.
 * Compact layout — dots + labels grouped tightly in the center.
 *
 * @param {string} [step1Label] — Override label for step 1 (e.g. 'Take photo' for camera path)
 */
const StepIndicator = ({currentStep, completedSteps = [], step1Label}) => {
    const {t} = useTranslation();
    const steps = step1Label
        ? [{label: step1Label, number: 1}, ...DEFAULT_STEPS.slice(1)]
        : DEFAULT_STEPS;
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {steps.map((step, i) => {
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
                                {t(step.label)}
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
        paddingTop: 24,
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
