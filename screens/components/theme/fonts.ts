interface FontStyle {
    fontWeight?:
        | 'normal'
        | 'bold'
        | '100'
        | '200'
        | '300'
        | '400'
        | '500'
        | '600'
        | '700'
        | '800'
        | '900';
    fontFamily: string;
}

export const Fonts: {[key: string]: FontStyle} = {
    thin: {
        fontFamily: 'Poppins-Thin'
    },
    light: {
        fontWeight: '300',
        fontFamily: 'Poppins-Light'
    },
    regular: {
        fontWeight: '400',
        fontFamily: 'Poppins-Regular'
    },
    medium: {
        fontWeight: '500',
        fontFamily: 'Poppins-Medium'
    },
    semiBold: {
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold'
    }
};
