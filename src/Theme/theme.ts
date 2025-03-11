export interface Theme {
    colors: {
        color1: string,
        color2: string,
        color3: string,
        color4: string,
        color5: string,
        color6: string,
        error: string,
        text: string
    };
    fontSizes: {
        extraSmall: string,
        small: string,
        medium: string,
        big: string
    };
    fontWeights: {
        normal: string
        bols: string
    };
    fontFamily: string
}

export const lightTheme: Theme = {
    colors: {
        color1: "",
        color2: "",
        color3: "",
        color4: "",
        color5: "",
        color6: "",
        error: "",
        text: ""
    },
    fontSizes: {
        extraSmall: "",
        small: "",
        medium: "",
        big: ""
    },
    fontWeights: {
        normal: "",
        bols: ""
    },
    fontFamily: ""
}

export const darkTheme: Theme = {
    colors: {
        color1: "",
        color2: "",
        color3: "",
        color4: "",
        color5: "",
        color6: "",
        error: "",
        text: ""
    },
    fontSizes: {
        extraSmall: "",
        small: "",
        medium: "",
        big: ""
    },
    fontWeights: {
        normal: "",
        bols: ""
    },
    fontFamily: ""
}