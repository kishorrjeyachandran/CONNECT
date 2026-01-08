// Multi-language support for CONNECT
export type Language = 'english' | 'tamil' | 'hindi';

export const translations = {
  english: {
    // Branding
    appName: 'CONNECT',
    tagline: 'Where Farmers & Consumers Meet',
    farmerMessage: 'CONNECT to your market',
    consumerMessage: 'CONNECT to fresh produce',
    
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    location: 'Location',
    role: 'I am a',
    farmer: 'Farmer',
    consumer: 'Consumer',
    loginTitle: 'Welcome back to CONNECT',
    signupTitle: 'Join CONNECT today',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    
    // Dashboard
    dashboard: 'Dashboard',
    listCrops: 'List Crops',
    browseCrops: 'Browse Crops',
    auctions: 'Auctions',
    payments: 'Payments',
    profile: 'Profile',
    logout: 'Logout',
    
    // Common
    submit: 'Submit',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  tamil: {
    // Branding
    appName: 'CONNECT',
    tagline: 'விவசாயிகள் மற்றும் நுகர்வோர் சந்திக்கும் இடம்',
    farmerMessage: 'உங்கள் சந்தையுடன் இணைக்கவும்',
    consumerMessage: 'புதிய உற்பத்திகளுடன் இணைக்கவும்',
    
    // Auth
    login: 'உள்நுழைய',
    signup: 'பதிவு செய்ய',
    email: 'மின்னஞ்சல்',
    password: 'கடவுச்சொல்',
    fullName: 'முழு பெயர்',
    phone: 'தொலைபேசி எண்',
    location: 'இடம்',
    role: 'நான்',
    farmer: 'விவசாயி',
    consumer: 'நுகர்வோர்',
    loginTitle: 'CONNECT இல் மீண்டும் வரவேற்கிறோம்',
    signupTitle: 'இன்று CONNECT இல் சேரவும்',
    alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    noAccount: 'கணக்கு இல்லையா?',
    
    // Dashboard
    dashboard: 'டாஷ்போர்டு',
    listCrops: 'பயிர்களை பட்டியலிடு',
    browseCrops: 'பயிர்களை உலாவு',
    auctions: 'ஏலங்கள்',
    payments: 'கொடுப்பனவுகள்',
    profile: 'சுயவிவரம்',
    logout: 'வெளியேறு',
    
    // Common
    submit: 'சமர்ப்பிக்கவும்',
    cancel: 'ரத்து செய்',
    loading: 'ஏற்றுகிறது...',
    error: 'பிழை',
    success: 'வெற்றி',
  },
  
  hindi: {
    // Branding
    appName: 'CONNECT',
    tagline: 'जहाँ किसान और उपभोक्ता मिलते हैं',
    farmerMessage: 'अपने बाज़ार से जुड़ें',
    consumerMessage: 'ताज़ी उपज से जुड़ें',
    
    // Auth
    login: 'लॉगिन',
    signup: 'साइन अप',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    phone: 'फोन नंबर',
    location: 'स्थान',
    role: 'मैं हूँ',
    farmer: 'किसान',
    consumer: 'उपभोक्ता',
    loginTitle: 'CONNECT में वापस स्वागत है',
    signupTitle: 'आज ही CONNECT में शामिल हों',
    alreadyHaveAccount: 'पहले से खाता है?',
    noAccount: 'कोई खाता नहीं है?',
    
    // Dashboard
    dashboard: 'डैशबोर्ड',
    listCrops: 'फसलों की सूची',
    browseCrops: 'फसलें देखें',
    auctions: 'नीलामी',
    payments: 'भुगतान',
    profile: 'प्रोफाइल',
    logout: 'लॉगआउट',
    
    // Common
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
  },
};

export type TranslationKey = keyof typeof translations.english;

export const getTranslation = (key: TranslationKey, language: Language): string => {
  return translations[language][key] || translations.english[key];
};