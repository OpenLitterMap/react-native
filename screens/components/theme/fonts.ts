interface FontStyle {
    fontWeight?: string;
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

export const FontType: string[] = [
    'thin',
    'light',
    'regular',
    'medium',
    'semiBold'
];
