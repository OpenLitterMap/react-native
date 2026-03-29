import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import * as Sentry from '@sentry/react-native';
import {IS_PRODUCTION} from '../../utils/config';

/**
 * App-level error boundary.
 * Catches render errors, logs to Sentry in production, shows recovery UI.
 */
class ErrorBoundary extends React.Component {
    state = {hasError: false, error: null};

    static getDerivedStateFromError(error) {
        return {hasError: true, error};
    }

    componentDidCatch(error, errorInfo) {
        if (IS_PRODUCTION) {
            Sentry.captureException(error, {extra: errorInfo});
        } else {
            console.error('[ErrorBoundary]', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null});
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>:(</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        The app encountered an unexpected error. Tap below to try again.
                    </Text>
                    <Pressable style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 32
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
        color: '#333'
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    button: {
        backgroundColor: '#27ae4c',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default ErrorBoundary;
