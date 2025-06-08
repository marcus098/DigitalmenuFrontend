export interface Theme {
    colors: {
        color1: string,
        color2: string,
        color3: string,
        color4: string,
        color5: string,
        color6: string,
        error: string,
        text: string,
        text1: string,
        text2: string,
        inputBorder: string,
        inputFocus: string,
        buttonBg: string,
        buttonHover: string,
        buttonText: string,
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
        //color1: "#eff6ff",
        //color2: "red",
        color1: "lightgreen",
        color2: "red",
        color3: "lightgray",
        color4: "white",
        color5: "",
        color6: "",
        error: "",
        text: "black",
        text1: "green",
        text2: "white",
        inputBorder: '#d1d5db',
        inputFocus: '#60a5fa',
        buttonBg: '#3b82f6',
        buttonHover: '#2563eb',
        buttonText: '#ffffff',
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
        text: "",
        text1: "",
        text2: "",
        //inputBorder: '#d1d5db', // Colore del bordo dell'input (grigio chiaro)
        //inputFocus: '#60a5fa', // Colore del focus dell'input (blu)
        //buttonBg: '#3b82f6', // Colore di sfondo del bottone (blu)
        //buttonHover: '#2563eb', // Colore hover del bottone (blu più scuro)
        //buttonText: '#ffffff', // Colore del testo del bottone (bianco)
        inputBorder: 'red', // Colore del bordo dell'input (grigio chiaro)
        inputFocus: 'green', // Colore del focus dell'input (blu)
        buttonBg: 'yellow', // Colore di sfondo del bottone (blu)
        buttonHover: 'green', // Colore hover del bottone (blu più scuro)
        buttonText: 'white', // Colore del testo del bottone (bianco)
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