import React, {useEffect} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';

/**
 * Celebration screen — shown after the user submits their first tag.
 * Shows: photo, tag confirmation, XP award, and a "See it on the map" browser link.
 * No in-app map rendering — opens openlittermap.com in the default browser.
 * Sets onboarding_completed_at and navigates to HomeScreen.
 */
const CelebrationScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const imagesArray = useSelector(state => state.photos.imagesArray);
    const swiperIndex = useSelector(state => state.photos.swiperIndex);
    const user = useSelector(state => state.auth.user);
    const entriesByCloId = useSelector(state => state.tags.entriesByCloId);

    const photo = imagesArray[swiperIndex];
    const firstTag = photo?.tags?.[0];
    const tagName = firstTag && entriesByCloId?.[firstTag.cloId]
        ? entriesByCloId[firstTag.cloId].displayName || entriesByCloId[firstTag.cloId].key
        : 'litter';
    const tagCount = photo?.tags?.length || 0;
    const hasCoords = photo?.lat != null && photo?.lon != null;

    // Mark onboarding complete on mount (scoped to current user)
    useEffect(() => {
        (async () => {
            await setOnboardingComplete(user?.id);
            dispatch(markOnboardingComplete());
        })();
    }, [dispatch, user?.id]);

    const handleContinue = () => {
        // Reset navigation stack to the main app — prevents back-nav into onboarding
        navigation.getParent()?.reset({
            index: 0,
            routes: [{name: 'APP'}]
        });
    };

    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                <StepIndicator currentStep={3} completedSteps={[1, 2]} />

                <View style={styles.content}>
                    {/* Celebration header */}
                    <View style={styles.celebrationBadge}>
                        <Icon name="checkmark-circle" size={48} color={Colors.accent} />
                    </View>

                    <Title style={styles.heading}>
                        {'Your first contribution is ready!'}
                    </Title>

                    <Caption color="muted" style={styles.subheading}>
                        {'Your tagged photo will be uploaded and added to the global litter map when you reach the home screen.'}
                    </Caption>

                    {/* Photo + tag summary */}
                    {photo?.uri && (
                        <View style={styles.photoCard}>
                            <Image
                                source={{uri: photo.uri}}
                                style={styles.photoThumbnail}
                                resizeMode="cover"
                            />
                            <View style={styles.photoInfo}>
                                <Body family="semiBold" style={styles.tagLabel}>
                                    {tagCount === 1
                                        ? `Tagged: ${tagName}`
                                        : `${tagCount} tags applied`}
                                </Body>
                                {hasCoords && (
                                    <Caption color="muted" style={styles.gpsLabel}>
                                        {`\uD83D\uDCCD ${photo.lat.toFixed(4)}, ${photo.lon.toFixed(4)}`}
                                    </Caption>
                                )}
                            </View>
                        </View>
                    )}

                    {/* XP award */}
                    <View style={styles.xpBadge}>
                        <Caption color="accent" family="semiBold" style={styles.xpText}>
                            {'+10 XP'}
                        </Caption>
                    </View>

                    {/* Map link hidden — photo hasn't uploaded yet.
                        Upload happens on HomeScreen via the normal upload flow.
                        The user can view their upload on the map from My Uploads later. */}
                </View>

                {/* CTA */}
                <View style={styles.footer}>
                    <Pressable
                        onPress={handleContinue}
                        style={({pressed}) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed
                        ]}>
                        <Body family="semiBold" color="white" style={styles.primaryButtonText}>
                            {user?.active_team ? "See your team's progress" : 'Start mapping'}
                        </Body>
                    </Pressable>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    safe: {
        flex: 1
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24
    },
    celebrationBadge: {
        marginBottom: 16
    },
    heading: {
        textAlign: 'center',
        marginBottom: 8
    },
    subheading: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24
    },
    photoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 16
    },
    photoThumbnail: {
        width: 72,
        height: 72,
        borderRadius: 8
    },
    photoInfo: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 12
    },
    tagLabel: {
        fontSize: 15,
        marginBottom: 4
    },
    gpsLabel: {
        fontSize: 12
    },
    xpBadge: {
        backgroundColor: Colors.accentLight,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 16
    },
    xpText: {
        fontSize: 18
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32
    },
    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 100,
        height: 56,
        shadowColor: Colors.accent,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    primaryButtonPressed: {
        backgroundColor: '#229954',
        shadowOpacity: 0.15
    },
    primaryButtonText: {
        fontSize: 17,
        letterSpacing: 0.3
    }
});

export default CelebrationScreen;
