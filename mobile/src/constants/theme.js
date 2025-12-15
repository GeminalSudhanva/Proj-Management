// Theme colors and styling constants
export const theme = {
    colors: {
        primary: '#667eea',
        primaryDark: '#5a67d8',
        secondary: '#764ba2',
        success: '#48bb78',
        danger: '#f56565',
        warning: '#ed8936',
        info: '#4299e1',
        background: '#f7fafc',
        backgroundDark: '#1a202c',
        card: '#ffffff',
        cardDark: '#2d3748',
        text: '#2d3748',
        textDark: '#f7fafc',
        textSecondary: '#718096',
        textSecondaryDark: '#a0aec0',
        border: '#e2e8f0',
        borderDark: '#4a5568',
        gradient: ['#667eea', '#764ba2'],

        // Additional gradient colors
        gradientPurple: ['#667eea', '#764ba2'],
        gradientBlue: ['#4299e1', '#667eea'],
        gradientGreen: ['#48bb78', '#38a169'],
        gradientOrange: ['#ed8936', '#dd6b20'],
        gradientPink: ['#ed64a6', '#d53f8c'],
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
    },
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: 'bold',
            lineHeight: 40,
        },
        h2: {
            fontSize: 24,
            fontWeight: 'bold',
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
        },
        h4: {
            fontSize: 18,
            fontWeight: '600',
            lineHeight: 24,
        },
        body: {
            fontSize: 16,
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            lineHeight: 16,
        },
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
        },
    },
};

export default theme;
